CREATE TABLE omniro_ai_commands(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,requested_by uuid NOT NULL,project_id uuid,
 input_mode text NOT NULL CHECK(input_mode IN('text','voice')),request_text varchar(5000) NOT NULL CHECK(length(trim(request_text))>0),
 intent text NOT NULL,agent_id text NOT NULL,truth_state text NOT NULL CHECK(truth_state IN('REAL','DERIVED','PARTIAL','UNAVAILABLE')),
 status text NOT NULL CHECK(status IN('completed','insufficient_data','awaiting_human_review','unavailable','denied')),
 response_summary varchar(5000) NOT NULL,result jsonb NOT NULL DEFAULT'{}',source_references jsonb NOT NULL DEFAULT'[]',
 permission_context jsonb NOT NULL DEFAULT'[]',version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,requested_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT
);
CREATE TABLE omniro_ai_action_drafts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,command_id uuid NOT NULL,project_id uuid NOT NULL,
 action_type text NOT NULL CHECK(action_type IN('contract_draft','message_draft','document_draft')),
 status text NOT NULL DEFAULT'awaiting_human_review'CHECK(status IN('awaiting_human_review','approved','rejected','cancelled')),
 payload jsonb NOT NULL,source_references jsonb NOT NULL DEFAULT'[]',requires_human_approval boolean NOT NULL DEFAULT true,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,command_id)REFERENCES omniro_ai_commands(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT
);
CREATE INDEX idx_omniro_ai_commands_actor ON omniro_ai_commands(tenant_id,requested_by,created_at DESC);
CREATE INDEX idx_omniro_ai_commands_project ON omniro_ai_commands(tenant_id,project_id,created_at DESC)WHERE project_id IS NOT NULL;
CREATE INDEX idx_omniro_ai_commands_agent ON omniro_ai_commands(tenant_id,agent_id,status,created_at DESC);
CREATE INDEX idx_omniro_ai_action_drafts_command ON omniro_ai_action_drafts(tenant_id,command_id);
CREATE INDEX idx_omniro_ai_action_drafts_review ON omniro_ai_action_drafts(tenant_id,project_id,status,created_at DESC);
ALTER TABLE omniro_ai_commands ENABLE ROW LEVEL SECURITY;ALTER TABLE omniro_ai_commands FORCE ROW LEVEL SECURITY;
ALTER TABLE omniro_ai_action_drafts ENABLE ROW LEVEL SECURITY;ALTER TABLE omniro_ai_action_drafts FORCE ROW LEVEL SECURITY;
CREATE POLICY omniro_ai_command_scope ON omniro_ai_commands USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND requested_by=NULLIF(current_setting('app.user_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND requested_by=NULLIF(current_setting('app.user_id',true),'')::uuid);
CREATE POLICY omniro_ai_draft_scope ON omniro_ai_action_drafts USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND created_by=NULLIF(current_setting('app.user_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND created_by=NULLIF(current_setting('app.user_id',true),'')::uuid);
INSERT INTO permissions(code,description)VALUES('ai_secretary.use','Use the permission-bound OMNIRO AI Secretary'),('ai_audit.read','Read own OMNIRO AI action history')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('tenant_admin','project_manager','employee','read_only','finance_manager','client')AND p.code IN('ai_secretary.use','ai_audit.read')ON CONFLICT DO NOTHING;
