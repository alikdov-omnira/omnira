CREATE TABLE document_suggestion_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,document_id uuid NOT NULL,review_session_id uuid NOT NULL,
 provider varchar(40) NOT NULL,model varchar(120) NOT NULL,prompt_version varchar(40) NOT NULL,snapshot_fingerprint char(64) NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','completed','failed','cancelled','stale')),
 requested_by uuid NOT NULL,requested_at timestamptz NOT NULL DEFAULT now(),processing_started_at timestamptz,completed_at timestamptz,failed_at timestamptz,cancelled_at timestamptz,
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),next_attempt_at timestamptz,safe_error_code varchar(80),
 input_page_count integer NOT NULL CHECK(input_page_count>=0),input_char_count integer NOT NULL CHECK(input_char_count>=0),output_suggestion_count integer NOT NULL DEFAULT 0 CHECK(output_suggestion_count>=0),
 input_tokens integer,output_tokens integer,total_tokens integer,duration_ms integer,review_version bigint NOT NULL CHECK(review_version>=1),version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,id,review_session_id),UNIQUE(tenant_id,review_session_id,snapshot_fingerprint,provider,prompt_version),
 CONSTRAINT suggestion_request_review_fk FOREIGN KEY(tenant_id,review_session_id,document_id) REFERENCES document_review_sessions(tenant_id,id,document_id) ON DELETE CASCADE,
 CONSTRAINT suggestion_request_user_fk FOREIGN KEY(tenant_id,requested_by) REFERENCES users(tenant_id,id),
 CONSTRAINT suggestion_request_lifecycle CHECK(
  (status='pending'AND processing_started_at IS NULL AND completed_at IS NULL AND failed_at IS NULL AND cancelled_at IS NULL)OR
  (status='processing'AND processing_started_at IS NOT NULL AND completed_at IS NULL AND failed_at IS NULL AND cancelled_at IS NULL)OR
  (status='completed'AND processing_started_at IS NOT NULL AND completed_at IS NOT NULL AND failed_at IS NULL AND cancelled_at IS NULL)OR
  (status='failed'AND failed_at IS NOT NULL AND completed_at IS NULL AND cancelled_at IS NULL)OR
  (status='cancelled'AND cancelled_at IS NOT NULL AND completed_at IS NULL)OR
  (status='stale'AND completed_at IS NULL AND cancelled_at IS NULL))
);
ALTER TABLE document_analysis_suggestions ADD COLUMN request_id uuid;
ALTER TABLE document_analysis_suggestions ADD COLUMN evidence jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(evidence)='array'AND pg_column_size(evidence)<=32768);
ALTER TABLE document_analysis_suggestions ADD COLUMN reason_code varchar(80);
ALTER TABLE document_analysis_suggestions ADD CONSTRAINT suggestion_request_fk FOREIGN KEY(tenant_id,request_id,review_session_id) REFERENCES document_suggestion_requests(tenant_id,id,review_session_id) ON DELETE CASCADE;
CREATE INDEX idx_suggestion_requests_claim ON document_suggestion_requests(tenant_id,status,next_attempt_at,requested_at)WHERE status IN('pending','failed','processing');
CREATE INDEX idx_suggestion_requests_review ON document_suggestion_requests(tenant_id,review_session_id,requested_at DESC);
CREATE INDEX idx_suggestion_requests_document ON document_suggestion_requests(tenant_id,document_id,requested_at DESC);
CREATE INDEX idx_suggestion_requests_provider ON document_suggestion_requests(tenant_id,provider,status,requested_at DESC);
CREATE INDEX idx_suggestion_requests_snapshot ON document_suggestion_requests(tenant_id,snapshot_fingerprint);
CREATE INDEX idx_suggestion_requests_stuck ON document_suggestion_requests(status,processing_started_at)WHERE status='processing';
CREATE INDEX idx_document_suggestions_request ON document_analysis_suggestions(tenant_id,request_id,status);
ALTER TABLE document_suggestion_requests ENABLE ROW LEVEL SECURITY;ALTER TABLE document_suggestion_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_suggestion_requests ON document_suggestion_requests USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check CHECK(event_type IN(
'task.assigned','task.due_soon','task.overdue','task.completed','project.started','project.paused','project.completed','invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid','payment.received','expense.approved','expense.rejected',
'document.uploaded','document.version_created','document.archived','document.page_ocr_requested','document.page_ocr_started','document.page_ocr_completed','document.page_ocr_failed','document.page_ocr_retried','document.page_ocr_cancelled',
'document.analysis_requested','document.analysis_started','document.classified','document.extraction_completed','document.analysis_failed','document.analysis_retried','document.analysis_cancelled',
'document.review_started','document.review_assigned','document.review_field_changed','document.review_classification_changed','document.review_submitted','document.review_changes_requested','document.review_approved','document.review_rejected',
'document.suggestions_requested','document.suggestion_created','document.suggestion_accepted','document.suggestion_rejected',
'document.suggestion_request_created','document.suggestion_request_started','document.suggestion_request_completed','document.suggestion_request_failed','document.suggestion_request_cancelled','document.suggestion_request_stale'));
INSERT INTO permissions(code,description)VALUES('documents.suggestions.retry','Retry document suggestions'),('documents.suggestions.cancel','Cancel document suggestions')ON CONFLICT(code)DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('tenant_admin','project_manager','finance_manager')AND p.code IN('documents.suggestions.retry','documents.suggestions.cancel')ON CONFLICT DO NOTHING;
