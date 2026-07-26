ALTER TABLE ocr_results ADD CONSTRAINT ocr_results_document_scope_unique UNIQUE(tenant_id,id,document_id);
CREATE TABLE document_analysis_jobs(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES tenants(id),document_id uuid NOT NULL,ocr_result_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','completed','failed','cancelled')),classifier varchar(80) NOT NULL,classifier_version varchar(40) NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),max_attempts integer NOT NULL CHECK(max_attempts BETWEEN 1 AND 20),requested_at timestamptz NOT NULL DEFAULT now(),started_at timestamptz,completed_at timestamptz,failed_at timestamptz,next_attempt_at timestamptz,error_code text,error_message_safe varchar(500),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,id,document_id),
 CONSTRAINT analysis_job_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT analysis_job_ocr_fk FOREIGN KEY(tenant_id,ocr_result_id,document_id) REFERENCES ocr_results(tenant_id,id,document_id) ON DELETE RESTRICT,
 CONSTRAINT analysis_job_user_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 CONSTRAINT analysis_job_lifecycle CHECK((status='pending' AND completed_at IS NULL) OR(status='processing' AND started_at IS NOT NULL AND completed_at IS NULL)OR(status='completed' AND completed_at IS NOT NULL AND error_code IS NULL)OR(status='failed' AND failed_at IS NOT NULL AND error_code IS NOT NULL)OR status='cancelled')
);
CREATE UNIQUE INDEX uq_analysis_active_document ON document_analysis_jobs(tenant_id,document_id) WHERE status IN('pending','processing');
CREATE INDEX idx_analysis_jobs_claim ON document_analysis_jobs(tenant_id,status,next_attempt_at,requested_at) WHERE status IN('pending','failed','processing');
CREATE INDEX idx_analysis_jobs_document ON document_analysis_jobs(tenant_id,document_id,requested_at DESC);

CREATE TABLE document_classifications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES tenants(id),document_id uuid NOT NULL,analysis_job_id uuid NOT NULL,
 document_type text NOT NULL CHECK(document_type IN('invoice','receipt','contract','estimate','work_acceptance_act','delivery_note','bank_document','identity_document','letter','other','unknown')),
 confidence numeric(5,4) NOT NULL CHECK(confidence BETWEEN 0 AND 1),matched_signals jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(matched_signals)='array' AND pg_column_size(matched_signals)<=32768),
 classifier varchar(80) NOT NULL,classifier_version varchar(40) NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,analysis_job_id),UNIQUE(tenant_id,id,document_id),
 CONSTRAINT classification_job_fk FOREIGN KEY(tenant_id,analysis_job_id,document_id) REFERENCES document_analysis_jobs(tenant_id,id,document_id) ON DELETE CASCADE,
 CONSTRAINT classification_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT classification_user_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE INDEX idx_classification_document ON document_classifications(tenant_id,document_id,created_at DESC);
CREATE INDEX idx_classification_type ON document_classifications(tenant_id,document_type,created_at DESC);

CREATE TABLE document_extraction_results(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES tenants(id),document_id uuid NOT NULL,classification_id uuid NOT NULL,
 schema_version varchar(40) NOT NULL,fields jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(fields)='array' AND pg_column_size(fields)<=1048576),
 validation_summary jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(validation_summary)='object' AND pg_column_size(validation_summary)<=32768),
 created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,classification_id),
 CONSTRAINT extraction_classification_fk FOREIGN KEY(tenant_id,classification_id,document_id) REFERENCES document_classifications(tenant_id,id,document_id) ON DELETE CASCADE,
 CONSTRAINT extraction_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT extraction_user_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id)
);
CREATE INDEX idx_extraction_document ON document_extraction_results(tenant_id,document_id,created_at DESC);
ALTER TABLE document_analysis_jobs ENABLE ROW LEVEL SECURITY;ALTER TABLE document_analysis_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_analysis_jobs ON document_analysis_jobs USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid) WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
ALTER TABLE document_classifications ENABLE ROW LEVEL SECURITY;ALTER TABLE document_classifications FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_classifications ON document_classifications USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid) WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
ALTER TABLE document_extraction_results ENABLE ROW LEVEL SECURITY;ALTER TABLE document_extraction_results FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_extractions ON document_extraction_results USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid) WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
INSERT INTO permissions(code,description) VALUES('documents.analysis.request','Request document analysis'),('documents.analysis.read','Read document analysis'),('documents.analysis.retry','Retry document analysis'),('documents.analysis.cancel','Cancel document analysis') ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE(p.code='documents.analysis.read' AND r.code IN('tenant_admin','project_manager','finance_manager','employee','read_only'))OR(p.code='documents.analysis.request' AND r.code IN('tenant_admin','project_manager','finance_manager','employee'))OR(p.code IN('documents.analysis.retry','documents.analysis.cancel') AND r.code IN('tenant_admin','project_manager','finance_manager')) ON CONFLICT DO NOTHING;
