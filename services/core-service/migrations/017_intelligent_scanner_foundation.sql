ALTER TABLE users ADD CONSTRAINT users_tenant_id_id_scanner_unique UNIQUE(tenant_id,id);
ALTER TABLE documents ADD CONSTRAINT documents_tenant_id_id_scanner_unique UNIQUE(tenant_id,id);

CREATE TABLE file_objects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
 storage_provider text NOT NULL CHECK(storage_provider IN ('local','s3')),
 storage_bucket text NOT NULL CHECK(length(storage_bucket) BETWEEN 1 AND 255),
 storage_key text NOT NULL CHECK(length(storage_key) BETWEEN 1 AND 1024),
 original_filename text NOT NULL CHECK(length(original_filename) BETWEEN 1 AND 240),
 mime_type text NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp','application/pdf')),
 size_bytes bigint NOT NULL CHECK(size_bytes>0),
 checksum_sha256 char(64) NOT NULL CHECK(checksum_sha256 ~ '^[0-9a-f]{64}$'),
 status text NOT NULL DEFAULT 'available' CHECK(status IN ('pending','available','deleted','failed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL,
 deleted_at timestamptz,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),
 UNIQUE(tenant_id,storage_provider,storage_bucket,storage_key),
 CONSTRAINT file_objects_created_by_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT file_objects_deleted_state_check CHECK((status='deleted')=(deleted_at IS NOT NULL))
);

ALTER TABLE documents
 ADD COLUMN title text,
 ADD COLUMN document_type text,
 ADD COLUMN source_type text,
 ADD COLUMN status text,
 ADD COLUMN current_version_id uuid,
 ADD COLUMN ocr_status text,
 ADD COLUMN ai_processing_status text,
 ADD COLUMN page_count integer;

ALTER TABLE document_versions
 ADD COLUMN file_object_id uuid,
 ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO file_objects(
 id,tenant_id,storage_provider,storage_bucket,storage_key,original_filename,mime_type,
 size_bytes,checksum_sha256,status,created_at,created_by
)
SELECT id,tenant_id,'local','documents',storage_key,original_filename,mime_type,
 file_size,checksum,'available',created_at,uploaded_by
FROM document_versions;

UPDATE document_versions SET file_object_id=id;
UPDATE documents d SET
 title=COALESCE(NULLIF(v.original_filename,''),'Untitled document'),
 document_type=CASE d.category
  WHEN 'contract' THEN 'contract' WHEN 'invoice' THEN 'invoice' WHEN 'receipt' THEN 'receipt'
  WHEN 'photo' THEN 'photo' WHEN 'project_plan' THEN 'drawing' ELSE 'other' END,
 source_type='upload',
 status=CASE WHEN d.deleted_at IS NULL THEN 'active' ELSE 'archived' END,
 current_version_id=v.id,
 ocr_status='not_requested',
 ai_processing_status='not_requested'
FROM document_versions v
WHERE v.tenant_id=d.tenant_id AND v.document_id=d.id AND v.version_no=d.current_version_no;

ALTER TABLE documents
 ALTER COLUMN title SET NOT NULL,
 ALTER COLUMN document_type SET NOT NULL,
 ALTER COLUMN source_type SET NOT NULL,
 ALTER COLUMN status SET NOT NULL,
 ALTER COLUMN ocr_status SET NOT NULL,
 ALTER COLUMN ai_processing_status SET NOT NULL,
 ADD CONSTRAINT documents_title_check CHECK(length(title) BETWEEN 1 AND 300),
 ADD CONSTRAINT documents_document_type_check CHECK(document_type IN ('unknown','invoice','contract','estimate','acceptance_act','receipt','drawing','photo','other')),
 ADD CONSTRAINT documents_source_type_check CHECK(source_type IN ('upload','scanner','import')),
 ADD CONSTRAINT documents_status_check CHECK(status IN ('active','archived')),
 ADD CONSTRAINT documents_ocr_status_check CHECK(ocr_status IN ('not_requested','pending','processing','completed','failed')),
 ADD CONSTRAINT documents_ai_processing_status_check CHECK(ai_processing_status IN ('not_requested','pending','processing','completed','failed')),
 ADD CONSTRAINT documents_page_count_check CHECK(page_count IS NULL OR page_count>0);

ALTER TABLE document_versions
 ALTER COLUMN file_object_id SET NOT NULL,
 ADD CONSTRAINT document_versions_file_object_fk FOREIGN KEY(tenant_id,file_object_id) REFERENCES file_objects(tenant_id,id) ON DELETE RESTRICT,
 ADD CONSTRAINT document_versions_metadata_object_check CHECK(jsonb_typeof(metadata)='object'),
 ADD CONSTRAINT document_versions_tenant_id_id_unique UNIQUE(tenant_id,id);

ALTER TABLE documents
 ADD CONSTRAINT documents_current_version_fk FOREIGN KEY(tenant_id,current_version_id) REFERENCES document_versions(tenant_id,id) ON DELETE RESTRICT;

CREATE INDEX idx_file_objects_tenant_created ON file_objects(tenant_id,created_at DESC);
CREATE INDEX idx_file_objects_tenant_checksum ON file_objects(tenant_id,checksum_sha256);
CREATE INDEX idx_file_objects_tenant_status ON file_objects(tenant_id,status);
CREATE INDEX idx_documents_scanner_list ON documents(tenant_id,status,document_type,updated_at DESC);
CREATE INDEX idx_documents_scanner_processing ON documents(tenant_id,ocr_status,ai_processing_status);
CREATE INDEX idx_document_versions_file_object ON document_versions(tenant_id,file_object_id);

ALTER TABLE file_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_objects FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_file_objects ON file_objects
 USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

INSERT INTO permissions(code,description) VALUES
 ('documents.upload','Upload documents and document versions'),
 ('documents.download','Download document content')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='documents.download' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code='documents.upload' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee'))
ON CONFLICT DO NOTHING;
