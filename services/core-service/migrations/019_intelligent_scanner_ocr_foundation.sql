ALTER TABLE document_pages
 ADD COLUMN ocr_status text NOT NULL DEFAULT 'not_requested'
 CHECK(ocr_status IN ('not_requested','pending','processing','completed','failed'));

CREATE TABLE ocr_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
 document_id uuid NOT NULL,
 document_page_id uuid NOT NULL,
 requested_languages text[] NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','completed','failed','cancelled')),
 provider text NOT NULL CHECK(length(provider) BETWEEN 1 AND 80),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 max_attempts integer NOT NULL CHECK(max_attempts BETWEEN 1 AND 20),
 requested_at timestamptz NOT NULL DEFAULT now(),
 started_at timestamptz,
 completed_at timestamptz,
 failed_at timestamptz,
 next_attempt_at timestamptz,
 error_code text,
 error_message_safe varchar(500),
 created_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),
 UNIQUE(tenant_id,id,document_id,document_page_id),
 CONSTRAINT ocr_jobs_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT ocr_jobs_page_fk FOREIGN KEY(tenant_id,document_page_id) REFERENCES document_pages(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT ocr_jobs_created_by_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT ocr_jobs_languages_check CHECK(cardinality(requested_languages) BETWEEN 1 AND 4 AND requested_languages <@ ARRAY['eng','pol','rus','ukr']::text[]),
 CONSTRAINT ocr_jobs_timestamps_check CHECK(
  (status='pending' AND completed_at IS NULL)
  OR (status='processing' AND started_at IS NOT NULL AND completed_at IS NULL)
  OR (status='completed' AND completed_at IS NOT NULL AND error_code IS NULL)
  OR (status='failed' AND failed_at IS NOT NULL AND error_code IS NOT NULL)
  OR status='cancelled'
 )
);
CREATE UNIQUE INDEX uq_ocr_jobs_active_page ON ocr_jobs(tenant_id,document_page_id) WHERE status IN ('pending','processing');

CREATE TABLE ocr_results (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
 ocr_job_id uuid NOT NULL,
 document_id uuid NOT NULL,
 document_page_id uuid NOT NULL,
 raw_text text NOT NULL,
 normalized_text text NOT NULL,
 confidence numeric(5,2) CHECK(confidence IS NULL OR confidence BETWEEN 0 AND 100),
 detected_language text CHECK(detected_language IS NULL OR detected_language IN ('eng','pol','rus','ukr')),
 word_count integer NOT NULL CHECK(word_count>=0),
 character_count integer NOT NULL CHECK(character_count>=0),
 provider text NOT NULL CHECK(length(provider) BETWEEN 1 AND 80),
 provider_version varchar(80),
 processing_duration_ms integer NOT NULL CHECK(processing_duration_ms>=0),
 result_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(result_metadata)='object' AND pg_column_size(result_metadata)<=65536),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),
 UNIQUE(tenant_id,ocr_job_id),
 CONSTRAINT ocr_results_job_scope_fk FOREIGN KEY(tenant_id,ocr_job_id,document_id,document_page_id) REFERENCES ocr_jobs(tenant_id,id,document_id,document_page_id) ON DELETE CASCADE,
 CONSTRAINT ocr_results_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT ocr_results_page_fk FOREIGN KEY(tenant_id,document_page_id) REFERENCES document_pages(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT ocr_results_created_by_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id) ON DELETE RESTRICT
);

CREATE INDEX idx_ocr_jobs_tenant_page ON ocr_jobs(tenant_id,document_page_id,requested_at DESC);
CREATE INDEX idx_ocr_jobs_tenant_document ON ocr_jobs(tenant_id,document_id,requested_at DESC);
CREATE INDEX idx_ocr_jobs_claim ON ocr_jobs(tenant_id,status,next_attempt_at,requested_at) WHERE status IN ('pending','failed','processing');
CREATE INDEX idx_ocr_results_tenant_page ON ocr_results(tenant_id,document_page_id,created_at DESC);
CREATE INDEX idx_ocr_results_search ON ocr_results USING gin(to_tsvector('simple',normalized_text));

ALTER TABLE ocr_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_ocr_jobs ON ocr_jobs
 USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
ALTER TABLE ocr_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_results FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_ocr_results ON ocr_results
 USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

INSERT INTO permissions(code,description) VALUES
 ('documents.ocr.request','Request OCR for document pages'),
 ('documents.ocr.read','Read OCR jobs and recognized text'),
 ('documents.ocr.retry','Retry failed OCR jobs'),
 ('documents.ocr.cancel','Cancel pending OCR jobs')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='documents.ocr.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code='documents.ocr.request' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee'))
   OR (p.code IN ('documents.ocr.retry','documents.ocr.cancel') AND r.code IN ('tenant_admin','project_manager','finance_manager'))
ON CONFLICT DO NOTHING;
