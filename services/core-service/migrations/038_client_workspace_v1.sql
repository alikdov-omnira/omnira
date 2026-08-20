ALTER TABLE clients ADD CONSTRAINT clients_tenant_id_id_client_workspace_unique UNIQUE(tenant_id,id);
CREATE TABLE client_project_memberships(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,client_id uuid NOT NULL,project_id uuid NOT NULL,user_id uuid NOT NULL,
 status text NOT NULL DEFAULT'active'CHECK(status IN('active','revoked')),can_view_site_contact boolean NOT NULL DEFAULT false,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,project_id,user_id),
 FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,user_id)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE client_project_documents(
 tenant_id uuid NOT NULL,project_id uuid NOT NULL,document_id uuid NOT NULL,published_at timestamptz NOT NULL DEFAULT now(),published_by uuid NOT NULL,
 PRIMARY KEY(tenant_id,project_id,document_id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,document_id)REFERENCES documents(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,published_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE client_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,client_id uuid NOT NULL,project_id uuid NOT NULL,author_id uuid NOT NULL,responsible_user_id uuid,
 request_type text NOT NULL CHECK(request_type IN('question','issue','change','meeting','document','clarification')),subject varchar(300)NOT NULL,description varchar(5000)NOT NULL,
 status text NOT NULL DEFAULT'submitted'CHECK(status IN('submitted','in_review','clarification_required','responded','approved','rejected','closed')),
 response varchar(5000),version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,author_id)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,responsible_user_id)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE client_approval_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,client_id uuid NOT NULL,project_id uuid NOT NULL,client_request_id uuid,
 entity_type text NOT NULL CHECK(entity_type IN('commercial_estimate_snapshot','document','client_request')),entity_id uuid NOT NULL,title varchar(300)NOT NULL,summary varchar(3000),
 status text NOT NULL DEFAULT'pending'CHECK(status IN('pending','approved','rejected','clarification_requested')),decision_comment varchar(3000),decided_at timestamptz,decided_by uuid,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,client_request_id)REFERENCES client_requests(tenant_id,id),FOREIGN KEY(tenant_id,decided_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK((status='pending'AND decided_at IS NULL AND decided_by IS NULL)OR(status<>'pending'AND decided_at IS NOT NULL AND decided_by IS NOT NULL))
);
CREATE INDEX idx_client_membership_user_project ON client_project_memberships(tenant_id,user_id,project_id)WHERE status='active';
CREATE INDEX idx_client_documents_project ON client_project_documents(tenant_id,project_id,published_at DESC);
CREATE INDEX idx_client_requests_project_status ON client_requests(tenant_id,project_id,status,created_at DESC);
CREATE INDEX idx_client_requests_responsible ON client_requests(tenant_id,responsible_user_id,status)WHERE status NOT IN('closed','rejected');
CREATE INDEX idx_client_approvals_project_status ON client_approval_requests(tenant_id,project_id,status,created_at DESC);
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['client_project_memberships','client_project_documents','client_requests','client_approval_requests']LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);END LOOP;END$$;
CREATE POLICY client_membership_scope ON client_project_memberships USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND(user_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR created_by=NULLIF(current_setting('app.user_id',true),'')::uuid))WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY client_document_scope ON client_project_documents USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND(EXISTS(SELECT 1 FROM client_project_memberships m WHERE m.tenant_id=client_project_documents.tenant_id AND m.project_id=client_project_documents.project_id AND m.user_id=NULLIF(current_setting('app.user_id',true),'')::uuid AND m.status='active')OR published_by=NULLIF(current_setting('app.user_id',true),'')::uuid))WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY client_request_scope ON client_requests USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND(author_id=NULLIF(current_setting('app.user_id',true),'')::uuid OR responsible_user_id=NULLIF(current_setting('app.user_id',true),'')::uuid))WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY client_approval_scope ON client_approval_requests USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid AND(EXISTS(SELECT 1 FROM client_project_memberships m WHERE m.tenant_id=client_approval_requests.tenant_id AND m.project_id=client_approval_requests.project_id AND m.user_id=NULLIF(current_setting('app.user_id',true),'')::uuid AND m.status='active')OR created_by=NULLIF(current_setting('app.user_id',true),'')::uuid))WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
INSERT INTO permissions(code,description)VALUES
 ('client_workspace.read','Read assigned client projects'),
 ('client_requests.create','Create project-scoped client requests'),
 ('client_requests.manage','Respond to project-scoped client requests'),
 ('client_documents.publish','Publish project documents to assigned clients'),
 ('client_approvals.manage','Create project-scoped client approval requests'),
 ('client_approvals.decide','Decide assigned client approvals')
ON CONFLICT DO NOTHING;
