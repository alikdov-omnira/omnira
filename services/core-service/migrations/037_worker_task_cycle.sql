ALTER TABLE tasks ADD CONSTRAINT tasks_tenant_id_id_worker_unique UNIQUE(tenant_id,id);
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK(status IN('todo','in_progress','blocked','submitted_for_review','accepted','returned','completed','cancelled','archived'));
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_completion_state_check CHECK(
 (status IN('completed','accepted') AND completed_at IS NOT NULL)
 OR (status NOT IN('completed','accepted') AND completed_at IS NULL)
);

CREATE TABLE task_review_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,task_id uuid NOT NULL,
 action text NOT NULL CHECK(action IN('submitted_for_review','accepted','returned')),comment varchar(2000),
 task_version bigint NOT NULL CHECK(task_version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,task_id)REFERENCES tasks(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 CHECK(action<>'returned' OR length(trim(comment))>0)
);
CREATE INDEX idx_task_review_events_task ON task_review_events(tenant_id,task_id,created_at DESC);

CREATE TABLE task_field_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid NOT NULL,task_id uuid NOT NULL,
 category text NOT NULL CHECK(category IN('missing_material','blocker','defect','damage','unsafe_condition','needs_foreman_answer','other')),
 description varchar(4000) NOT NULL CHECK(length(trim(description))>0),location varchar(500),status text NOT NULL DEFAULT'open'CHECK(status IN('open','acknowledged','resolved')),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,task_id)REFERENCES tasks(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT
);
CREATE INDEX idx_task_field_reports_task ON task_field_reports(tenant_id,task_id,status,created_at DESC);
CREATE INDEX idx_task_field_reports_project ON task_field_reports(tenant_id,project_id,status,created_at DESC);

CREATE FUNCTION validate_task_field_report_scope()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN
 IF NOT EXISTS(SELECT 1 FROM tasks t WHERE t.tenant_id=NEW.tenant_id AND t.id=NEW.task_id AND t.project_id=NEW.project_id AND t.deleted_at IS NULL)
 THEN RAISE EXCEPTION 'TASK_FIELD_REPORT_SCOPE_INVALID';END IF;RETURN NEW;
END$$;
CREATE TRIGGER validate_task_field_report_scope BEFORE INSERT OR UPDATE OF tenant_id,project_id,task_id ON task_field_reports FOR EACH ROW EXECUTE FUNCTION validate_task_field_report_scope();

ALTER TABLE task_review_events ENABLE ROW LEVEL SECURITY;ALTER TABLE task_review_events FORCE ROW LEVEL SECURITY;
ALTER TABLE task_field_reports ENABLE ROW LEVEL SECURITY;ALTER TABLE task_field_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_task_review_events ON task_review_events USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_task_field_reports ON task_field_reports USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

DO $$DECLARE definition text;BEGIN
 SELECT pg_get_constraintdef(oid)INTO definition FROM pg_constraint WHERE conrelid='notifications'::regclass AND conname='notifications_event_type_check';
 IF definition IS NULL THEN RAISE EXCEPTION 'NOTIFICATION_EVENT_CONSTRAINT_MISSING';END IF;
 EXECUTE 'ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check';
 definition=left(definition,length(definition)-1)||' OR event_type IN (''task.started'',''task.blocked'',''task.resumed'',''task.submitted_for_review'',''task.accepted'',''task.returned'',''task.cancelled'',''task.problem_reported'',''task.problem_acknowledged'',''task.problem_resolved''))';
 EXECUTE 'ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check '||definition;
END$$;

INSERT INTO permissions(id,code,description)VALUES
 (gen_random_uuid(),'tasks.self_update','Transition an assigned task through the worker lifecycle'),
 (gen_random_uuid(),'tasks.review','Accept or return submitted field work'),
 (gen_random_uuid(),'task_problems.read','Read field problems in authorized task scope'),
 (gen_random_uuid(),'task_problems.create','Report a problem for an assigned task'),
 (gen_random_uuid(),'task_problems.update','Acknowledge or resolve field problems')
ON CONFLICT(code)DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE
 (r.code='employee' AND p.code IN('tasks.read','tasks.self_update','task_problems.read','task_problems.create')) OR
 (r.code IN('tenant_admin','project_manager') AND p.code IN('tasks.review','task_problems.read','task_problems.create','task_problems.update'))
ON CONFLICT DO NOTHING;
