CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK(event_type IN (
    'task.assigned','task.due_soon','task.overdue','task.completed',
    'project.started','project.paused','project.completed',
    'invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid',
    'payment.received','expense.approved','expense.rejected',
    'document.uploaded','document.version_created','document.archived'
  )),
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK(severity IN ('info','success','warning','critical')),
  entity_type text NOT NULL CHECK(entity_type IN ('task','project','invoice','payment','expense','document')),
  entity_id uuid NOT NULL,
  action_url text NOT NULL,
  status text NOT NULL DEFAULT 'unread' CHECK(status IN ('unread','read','archived')),
  read_at timestamptz,
  expires_at timestamptz,
  deduplication_key text NOT NULL,
  source_event_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  version bigint NOT NULL DEFAULT 1 CHECK(version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((status='read' AND read_at IS NOT NULL) OR (status<>'read')),
  UNIQUE(tenant_id,recipient_user_id,deduplication_key)
);

CREATE TABLE notification_preferences (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  in_app_enabled boolean NOT NULL DEFAULT true,
  task_events_enabled boolean NOT NULL DEFAULT true,
  project_events_enabled boolean NOT NULL DEFAULT true,
  finance_events_enabled boolean NOT NULL DEFAULT true,
  document_events_enabled boolean NOT NULL DEFAULT true,
  due_soon_enabled boolean NOT NULL DEFAULT true,
  overdue_enabled boolean NOT NULL DEFAULT true,
  self_notifications_enabled boolean NOT NULL DEFAULT false,
  version bigint NOT NULL DEFAULT 1 CHECK(version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(tenant_id,user_id)
);

CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
  payload jsonb NOT NULL DEFAULT '{}',
  correlation_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','processing','completed','failed','dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE TABLE notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE RESTRICT,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  channel text NOT NULL DEFAULT 'in_app' CHECK(channel='in_app'),
  status text NOT NULL DEFAULT 'delivered' CHECK(status IN ('delivered','failed')),
  attempt_count integer NOT NULL DEFAULT 1 CHECK(attempt_count > 0),
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,notification_id,channel)
);

CREATE TABLE reminder_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  reminder_type text NOT NULL CHECK(reminder_type IN ('task.due_soon','task.overdue','invoice.due_soon','invoice.overdue')),
  entity_type text NOT NULL CHECK(entity_type IN ('task','invoice')),
  entity_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date date NOT NULL,
  window_key text NOT NULL,
  source_event_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,reminder_type,entity_id,recipient_user_id,window_key)
);

CREATE INDEX idx_notifications_recipient ON notifications(tenant_id,recipient_user_id,created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(tenant_id,recipient_user_id,created_at DESC) WHERE status='unread';
CREATE INDEX idx_outbox_claim ON outbox_events(state,next_attempt_at,created_at) WHERE state IN ('pending','failed','processing');
CREATE INDEX idx_deliveries_notification ON notification_deliveries(tenant_id,notification_id);
CREATE INDEX idx_reminders_entity ON reminder_executions(tenant_id,entity_type,entity_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY; ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY; ALTER TABLE notification_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY; ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY; ALTER TABLE notification_deliveries FORCE ROW LEVEL SECURITY;
ALTER TABLE reminder_executions ENABLE ROW LEVEL SECURITY; ALTER TABLE reminder_executions FORCE ROW LEVEL SECURITY;

CREATE POLICY notification_recipient_policy ON notifications
  USING (
    tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    AND (recipient_user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR current_setting('app.worker',true)='true')
  )
  WITH CHECK (
    tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    AND (recipient_user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR current_setting('app.worker',true)='true')
  );
CREATE POLICY notification_preferences_owner_policy ON notification_preferences
  USING (
    tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    AND (user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR current_setting('app.worker',true)='true')
  )
  WITH CHECK (
    tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    AND (user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR current_setting('app.worker',true)='true')
  );
CREATE POLICY outbox_worker_policy ON outbox_events
  USING (tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND current_setting('app.worker',true)='true')
  WITH CHECK (tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND current_setting('app.worker',true)='true');
CREATE POLICY delivery_recipient_policy ON notification_deliveries
  USING (
    tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    AND (recipient_user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR current_setting('app.worker',true)='true')
  )
  WITH CHECK (
    tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid
    AND (recipient_user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR current_setting('app.worker',true)='true')
  );
CREATE POLICY reminder_worker_policy ON reminder_executions
  USING (tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND current_setting('app.worker',true)='true')
  WITH CHECK (tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND current_setting('app.worker',true)='true');

INSERT INTO permissions(code,description) VALUES
  ('notifications.read','Read own notifications'),
  ('notifications.update','Update own notification state and preferences'),
  ('notifications.manage','Inspect notification operational failures')
ON CONFLICT(code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE p.code IN ('notifications.read','notifications.update')
  AND r.code IN ('tenant_admin','project_manager','employee','read_only')
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE p.code='notifications.manage' AND r.code='tenant_admin'
ON CONFLICT DO NOTHING;
