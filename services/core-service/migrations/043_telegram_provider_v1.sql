CREATE TABLE communication_provider_identities(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,provider text NOT NULL CHECK(provider='telegram'),
 external_user_id varchar(100) NOT NULL,external_chat_id varchar(100) NOT NULL,actor_id uuid,client_id uuid,project_id uuid,
 verification_state text NOT NULL DEFAULT'pending'CHECK(verification_state IN('pending','verified','revoked')),provenance jsonb NOT NULL DEFAULT'{}',
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,provider,external_user_id,external_chat_id),
 FOREIGN KEY(tenant_id,actor_id)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,CHECK(actor_id IS NOT NULL OR client_id IS NOT NULL)
);
CREATE INDEX idx_communication_provider_identity_resolution ON communication_provider_identities(provider,external_user_id,external_chat_id,verification_state);
CREATE INDEX idx_communication_provider_identity_scope ON communication_provider_identities(tenant_id,client_id,project_id,verification_state);
ALTER TABLE communication_provider_identities ENABLE ROW LEVEL SECURITY;ALTER TABLE communication_provider_identities FORCE ROW LEVEL SECURITY;
CREATE POLICY communication_provider_identity_tenant ON communication_provider_identities USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
