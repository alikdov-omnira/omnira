CREATE TABLE documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 category text NOT NULL CHECK(category IN ('contract','offer','invoice','receipt','project_plan','photo','protocol','permit','correspondence','other')),
 description text, current_version_no integer NOT NULL DEFAULT 1 CHECK(current_version_no>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 deleted_at timestamptz, deleted_by uuid REFERENCES users(id), version bigint NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE document_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 document_id uuid NOT NULL REFERENCES documents(id), version_no integer NOT NULL CHECK(version_no>0),
 original_filename text NOT NULL, storage_key text NOT NULL, mime_type text NOT NULL,
 extension text NOT NULL, file_size bigint NOT NULL CHECK(file_size>0), checksum char(64) NOT NULL,
 uploaded_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,document_id,version_no), UNIQUE(tenant_id,storage_key)
);
CREATE TABLE document_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
 document_id uuid NOT NULL REFERENCES documents(id), entity_type text NOT NULL CHECK(entity_type IN ('client','property','project','task','invoice','payment','expense')),
 entity_id uuid NOT NULL, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,document_id,entity_type,entity_id)
);
CREATE INDEX idx_documents_tenant_updated ON documents(tenant_id,updated_at DESC);
CREATE INDEX idx_document_versions_document ON document_versions(tenant_id,document_id,version_no DESC);
CREATE INDEX idx_document_links_target ON document_links(tenant_id,entity_type,entity_id);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY; ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY; ALTER TABLE document_links FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_documents ON documents USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_document_versions ON document_versions USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_document_links ON document_links USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
