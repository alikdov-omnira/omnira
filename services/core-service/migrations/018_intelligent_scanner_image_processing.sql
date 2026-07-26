CREATE TABLE document_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
 document_id uuid NOT NULL,
 source_file_object_id uuid NOT NULL,
 processed_file_object_id uuid,
 page_number integer NOT NULL CHECK(page_number>0),
 rotation_degrees smallint NOT NULL DEFAULT 0 CHECK(rotation_degrees IN (0,90,180,270)),
 processing_status text NOT NULL DEFAULT 'pending' CHECK(processing_status IN ('pending','processing','completed','failed')),
 processing_error_code text,
 width integer CHECK(width IS NULL OR width>0),
 height integer CHECK(height IS NULL OR height>0),
 original_width integer CHECK(original_width IS NULL OR original_width>0),
 original_height integer CHECK(original_height IS NULL OR original_height>0),
 crop_metadata jsonb,
 perspective_metadata jsonb,
 enhancement_preset text NOT NULL DEFAULT 'original' CHECK(enhancement_preset IN ('original','document_color','document_grayscale','document_black_white','photo_enhance')),
 checksum char(64) NOT NULL CHECK(checksum ~ '^[0-9a-f]{64}$'),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),
 CONSTRAINT document_pages_document_page_number_unique UNIQUE(tenant_id,document_id,page_number) DEFERRABLE INITIALLY IMMEDIATE,
 CONSTRAINT document_pages_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT document_pages_source_file_fk FOREIGN KEY(tenant_id,source_file_object_id) REFERENCES file_objects(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT document_pages_processed_file_fk FOREIGN KEY(tenant_id,processed_file_object_id) REFERENCES file_objects(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT document_pages_created_by_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT document_pages_updated_by_fk FOREIGN KEY(tenant_id,updated_by) REFERENCES users(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT document_pages_dimensions_pair_check CHECK((width IS NULL)=(height IS NULL)),
 CONSTRAINT document_pages_original_dimensions_pair_check CHECK((original_width IS NULL)=(original_height IS NULL)),
 CONSTRAINT document_pages_crop_object_check CHECK(crop_metadata IS NULL OR jsonb_typeof(crop_metadata)='object'),
 CONSTRAINT document_pages_perspective_object_check CHECK(perspective_metadata IS NULL OR jsonb_typeof(perspective_metadata)='object'),
 CONSTRAINT document_pages_processing_state_check CHECK(
  (processing_status='failed' AND processing_error_code IS NOT NULL AND processed_file_object_id IS NULL)
  OR (processing_status='completed' AND processing_error_code IS NULL AND processed_file_object_id IS NOT NULL AND width IS NOT NULL)
  OR (processing_status IN ('pending','processing') AND processing_error_code IS NULL AND processed_file_object_id IS NULL)
 )
);

CREATE INDEX idx_document_pages_tenant_document ON document_pages(tenant_id,document_id,page_number);
CREATE INDEX idx_document_pages_tenant_status ON document_pages(tenant_id,processing_status);
CREATE INDEX idx_document_pages_source_file ON document_pages(tenant_id,source_file_object_id);
CREATE INDEX idx_document_pages_processed_file ON document_pages(tenant_id,processed_file_object_id) WHERE processed_file_object_id IS NOT NULL;
CREATE INDEX idx_document_pages_processing_queue ON document_pages(tenant_id,created_at,id) WHERE processing_status='pending';

ALTER TABLE document_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_pages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_pages ON document_pages
 USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

INSERT INTO permissions(code,description) VALUES
 ('documents.process','Process, reorder, and remove document pages')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE p.code='documents.process' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee')
ON CONFLICT DO NOTHING;
