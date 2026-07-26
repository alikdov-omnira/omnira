ALTER TABLE document_extraction_results ADD CONSTRAINT document_extraction_scope_unique UNIQUE(tenant_id,id,classification_id);
CREATE TABLE document_review_sessions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES tenants(id),document_id uuid NOT NULL,classification_id uuid NOT NULL,extraction_result_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'not_started' CHECK(status IN('not_started','in_review','changes_requested','approved','rejected')),assigned_to uuid,started_at timestamptz,submitted_at timestamptz,approved_at timestamptz,rejected_at timestamptz,decision_reason varchar(1000),
 created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,id,document_id),UNIQUE(tenant_id,id,classification_id),UNIQUE(tenant_id,id,extraction_result_id),
 CONSTRAINT review_document_fk FOREIGN KEY(tenant_id,document_id) REFERENCES documents(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT review_classification_fk FOREIGN KEY(tenant_id,classification_id,document_id) REFERENCES document_classifications(tenant_id,id,document_id) ON DELETE RESTRICT,
 CONSTRAINT review_extraction_fk FOREIGN KEY(tenant_id,extraction_result_id,classification_id) REFERENCES document_extraction_results(tenant_id,id,classification_id) ON DELETE RESTRICT,
 CONSTRAINT review_creator_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),CONSTRAINT review_assignee_fk FOREIGN KEY(tenant_id,assigned_to) REFERENCES users(tenant_id,id),
 CONSTRAINT review_lifecycle CHECK((status='not_started' AND started_at IS NULL AND approved_at IS NULL AND rejected_at IS NULL)OR(status IN('in_review','changes_requested')AND started_at IS NOT NULL AND approved_at IS NULL AND rejected_at IS NULL)OR(status='approved' AND started_at IS NOT NULL AND submitted_at IS NOT NULL AND approved_at IS NOT NULL AND rejected_at IS NULL)OR(status='rejected' AND started_at IS NOT NULL AND rejected_at IS NOT NULL AND approved_at IS NULL))
);
CREATE UNIQUE INDEX uq_document_review_extraction ON document_review_sessions(tenant_id,extraction_result_id);
CREATE INDEX idx_document_reviews_document_status ON document_review_sessions(tenant_id,document_id,status,created_at DESC);
CREATE INDEX idx_document_reviews_assignee_status ON document_review_sessions(tenant_id,assigned_to,status,updated_at DESC);

CREATE TABLE document_review_field_changes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,review_session_id uuid NOT NULL,field_name varchar(100) NOT NULL,operation text NOT NULL CHECK(operation IN('set','remove')),
 previous_value varchar(10000),proposed_value varchar(10000),normalized_value varchar(10000),source text NOT NULL DEFAULT 'manual' CHECK(source='manual'),page_id uuid,start_offset integer,end_offset integer,
 validation_status text NOT NULL CHECK(validation_status IN('valid','invalid','unverified')),change_reason varchar(1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),version bigint NOT NULL DEFAULT 1 CHECK(version=1),
 UNIQUE(tenant_id,id),CONSTRAINT review_field_session_fk FOREIGN KEY(tenant_id,review_session_id) REFERENCES document_review_sessions(tenant_id,id) ON DELETE CASCADE,
 CONSTRAINT review_field_page_fk FOREIGN KEY(tenant_id,page_id) REFERENCES document_pages(tenant_id,id) ON DELETE RESTRICT,CONSTRAINT review_field_user_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 CONSTRAINT review_field_operation CHECK((operation='set' AND proposed_value IS NOT NULL)OR(operation='remove' AND proposed_value IS NULL AND normalized_value IS NULL)),
 CONSTRAINT review_field_offsets CHECK((page_id IS NULL AND start_offset IS NULL AND end_offset IS NULL)OR(page_id IS NOT NULL AND start_offset IS NOT NULL AND end_offset IS NOT NULL AND start_offset>=0 AND end_offset>=start_offset))
);
CREATE INDEX idx_review_field_changes_session ON document_review_field_changes(tenant_id,review_session_id,created_at,id);

CREATE TABLE document_review_classification_changes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,review_session_id uuid NOT NULL,previous_document_type text NOT NULL,proposed_document_type text NOT NULL,
 change_reason varchar(1000),created_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),version bigint NOT NULL DEFAULT 1 CHECK(version=1),UNIQUE(tenant_id,id),
 CONSTRAINT review_class_session_fk FOREIGN KEY(tenant_id,review_session_id) REFERENCES document_review_sessions(tenant_id,id) ON DELETE CASCADE,CONSTRAINT review_class_user_fk FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 CONSTRAINT review_previous_type CHECK(previous_document_type IN('invoice','receipt','contract','estimate','work_acceptance_act','delivery_note','bank_document','identity_document','letter','other','unknown')),
 CONSTRAINT review_proposed_type CHECK(proposed_document_type IN('invoice','receipt','contract','estimate','work_acceptance_act','delivery_note','bank_document','identity_document','letter','other','unknown'))
);
CREATE INDEX idx_review_class_changes_session ON document_review_classification_changes(tenant_id,review_session_id,created_at,id);

CREATE TABLE document_approved_data(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,document_id uuid NOT NULL,review_session_id uuid NOT NULL,classification_id uuid NOT NULL,document_type text NOT NULL,
 fields jsonb NOT NULL CHECK(jsonb_typeof(fields)='array' AND pg_column_size(fields)<=1048576),approved_by uuid NOT NULL,approved_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),version bigint NOT NULL DEFAULT 1 CHECK(version=1),
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,review_session_id),UNIQUE(tenant_id,document_id),
 CONSTRAINT approved_review_fk FOREIGN KEY(tenant_id,review_session_id,document_id) REFERENCES document_review_sessions(tenant_id,id,document_id) ON DELETE RESTRICT,
 CONSTRAINT approved_classification_fk FOREIGN KEY(tenant_id,classification_id,document_id) REFERENCES document_classifications(tenant_id,id,document_id) ON DELETE RESTRICT,
 CONSTRAINT approved_user_fk FOREIGN KEY(tenant_id,approved_by) REFERENCES users(tenant_id,id),
 CONSTRAINT approved_document_type CHECK(document_type IN('invoice','receipt','contract','estimate','work_acceptance_act','delivery_note','bank_document','identity_document','letter','other','unknown'))
);
CREATE INDEX idx_approved_data_date ON document_approved_data(tenant_id,approved_at DESC);
CREATE INDEX idx_approved_data_type ON document_approved_data(tenant_id,document_type,approved_at DESC);

CREATE TABLE document_analysis_suggestions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,document_id uuid NOT NULL,review_session_id uuid NOT NULL,suggestion_type text NOT NULL CHECK(suggestion_type IN('field_correction','classification_correction','missing_field')),
 field_name varchar(100),suggested_value varchar(10000),suggested_document_type text,confidence numeric(5,4) NOT NULL CHECK(confidence BETWEEN 0 AND 1),provider varchar(80) NOT NULL,provider_version varchar(40) NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','accepted','rejected','expired')),created_at timestamptz NOT NULL DEFAULT now(),accepted_at timestamptz,rejected_at timestamptz,accepted_by uuid,version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 UNIQUE(tenant_id,id),CONSTRAINT suggestion_review_fk FOREIGN KEY(tenant_id,review_session_id,document_id) REFERENCES document_review_sessions(tenant_id,id,document_id) ON DELETE CASCADE,
 CONSTRAINT suggestion_user_fk FOREIGN KEY(tenant_id,accepted_by) REFERENCES users(tenant_id,id),
 CONSTRAINT suggestion_type_payload CHECK((suggestion_type IN('field_correction','missing_field')AND field_name IS NOT NULL AND suggested_value IS NOT NULL AND suggested_document_type IS NULL)OR(suggestion_type='classification_correction'AND field_name IS NULL AND suggested_value IS NULL AND suggested_document_type IN('invoice','receipt','contract','estimate','work_acceptance_act','delivery_note','bank_document','identity_document','letter','other','unknown'))),
 CONSTRAINT suggestion_lifecycle CHECK((status='pending'AND accepted_at IS NULL AND rejected_at IS NULL AND accepted_by IS NULL)OR(status='accepted'AND accepted_at IS NOT NULL AND accepted_by IS NOT NULL AND rejected_at IS NULL)OR(status='rejected'AND rejected_at IS NOT NULL AND accepted_at IS NULL AND accepted_by IS NULL)OR(status='expired'AND accepted_at IS NULL AND rejected_at IS NULL AND accepted_by IS NULL))
);
CREATE INDEX idx_document_suggestions_session ON document_analysis_suggestions(tenant_id,review_session_id,status,created_at,id);

CREATE FUNCTION prevent_document_review_history_mutation()RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'document review history is immutable' USING ERRCODE='55000';END$$;
CREATE TRIGGER immutable_review_field_changes BEFORE UPDATE OR DELETE ON document_review_field_changes FOR EACH ROW EXECUTE FUNCTION prevent_document_review_history_mutation();
CREATE TRIGGER immutable_review_class_changes BEFORE UPDATE OR DELETE ON document_review_classification_changes FOR EACH ROW EXECUTE FUNCTION prevent_document_review_history_mutation();
CREATE TRIGGER immutable_document_approved_data BEFORE UPDATE OR DELETE ON document_approved_data FOR EACH ROW EXECUTE FUNCTION prevent_document_review_history_mutation();
CREATE FUNCTION enforce_document_review_approval_pair()RETURNS trigger LANGUAGE plpgsql AS $$BEGIN
 IF TG_TABLE_NAME='document_approved_data' THEN
  IF NOT EXISTS(SELECT 1 FROM document_review_sessions r WHERE r.tenant_id=NEW.tenant_id AND r.id=NEW.review_session_id AND r.status='approved' AND r.document_id=NEW.document_id AND r.classification_id=NEW.classification_id)THEN RAISE EXCEPTION 'approved data requires an approved matching review' USING ERRCODE='23514';END IF;
 ELSIF NEW.status='approved' AND NOT EXISTS(SELECT 1 FROM document_approved_data a WHERE a.tenant_id=NEW.tenant_id AND a.review_session_id=NEW.id AND a.document_id=NEW.document_id AND a.classification_id=NEW.classification_id)THEN RAISE EXCEPTION 'approved review requires immutable approved data' USING ERRCODE='23514';END IF;
 RETURN NEW;
END$$;
CREATE CONSTRAINT TRIGGER approved_data_review_pair AFTER INSERT ON document_approved_data DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_document_review_approval_pair();
CREATE CONSTRAINT TRIGGER approved_review_data_pair AFTER INSERT OR UPDATE OF status ON document_review_sessions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION enforce_document_review_approval_pair();

ALTER TABLE document_review_sessions ENABLE ROW LEVEL SECURITY;ALTER TABLE document_review_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE document_review_field_changes ENABLE ROW LEVEL SECURITY;ALTER TABLE document_review_field_changes FORCE ROW LEVEL SECURITY;
ALTER TABLE document_review_classification_changes ENABLE ROW LEVEL SECURITY;ALTER TABLE document_review_classification_changes FORCE ROW LEVEL SECURITY;
ALTER TABLE document_approved_data ENABLE ROW LEVEL SECURITY;ALTER TABLE document_approved_data FORCE ROW LEVEL SECURITY;
ALTER TABLE document_analysis_suggestions ENABLE ROW LEVEL SECURITY;ALTER TABLE document_analysis_suggestions FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_document_reviews ON document_review_sessions USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_review_field_changes ON document_review_field_changes USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_review_class_changes ON document_review_classification_changes USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_document_approved_data ON document_approved_data USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_document_suggestions ON document_analysis_suggestions USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check CHECK(event_type IN(
'task.assigned','task.due_soon','task.overdue','task.completed','project.started','project.paused','project.completed','invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid','payment.received','expense.approved','expense.rejected',
'document.uploaded','document.version_created','document.archived','document.page_ocr_requested','document.page_ocr_started','document.page_ocr_completed','document.page_ocr_failed','document.page_ocr_retried','document.page_ocr_cancelled',
'document.analysis_requested','document.analysis_started','document.classified','document.extraction_completed','document.analysis_failed','document.analysis_retried','document.analysis_cancelled',
'document.review_started','document.review_assigned','document.review_field_changed','document.review_classification_changed','document.review_submitted','document.review_changes_requested','document.review_approved','document.review_rejected',
'document.suggestions_requested','document.suggestion_created','document.suggestion_accepted','document.suggestion_rejected'));

INSERT INTO permissions(code,description)VALUES
('documents.review.start','Start document review'),('documents.review.read','Read document review'),('documents.review.edit','Edit document review'),('documents.review.assign','Assign document review'),('documents.review.submit','Submit document review'),('documents.review.approve','Approve document review'),('documents.review.reject','Reject document review'),
('documents.suggestions.request','Request document suggestions'),('documents.suggestions.read','Read document suggestions'),('documents.suggestions.decide','Decide document suggestions')ON CONFLICT(code)DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE
(p.code IN('documents.review.read','documents.suggestions.read')AND r.code IN('tenant_admin','project_manager','finance_manager','employee','read_only'))OR
(p.code IN('documents.review.start','documents.review.edit','documents.review.submit','documents.suggestions.request','documents.suggestions.decide')AND r.code IN('tenant_admin','project_manager','finance_manager','employee'))OR
(p.code IN('documents.review.assign','documents.review.approve','documents.review.reject')AND r.code IN('tenant_admin','project_manager','finance_manager'))ON CONFLICT DO NOTHING;
