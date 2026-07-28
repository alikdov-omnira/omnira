CREATE TABLE technical_assignments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid NOT NULL,property_id uuid,
 code varchar(60) NOT NULL,display_name varchar(300) NOT NULL,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,code),
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,property_id)REFERENCES properties(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);

CREATE TABLE technical_assignment_revisions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_number integer NOT NULL CHECK(revision_number>=1),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','collecting_information','review_required','changes_requested','ready_for_approval','approved','cancelled','superseded')),
 is_current boolean NOT NULL DEFAULT true,summary varchar(5000),approved_at timestamptz,approved_by uuid,superseded_at timestamptz,superseded_by_revision_id uuid,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,assignment_id,revision_number),
 FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,approved_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK((status='approved'AND approved_at IS NOT NULL AND approved_by IS NOT NULL)OR(status<>'approved')),
 CHECK((status='superseded'AND superseded_at IS NOT NULL AND is_current=false)OR status<>'superseded')
);
ALTER TABLE technical_assignment_revisions ADD CONSTRAINT technical_assignment_revision_successor_fk FOREIGN KEY(tenant_id,superseded_by_revision_id)REFERENCES technical_assignment_revisions(tenant_id,id);
CREATE UNIQUE INDEX uq_technical_assignment_current_revision ON technical_assignment_revisions(tenant_id,assignment_id)WHERE is_current;

CREATE TABLE technical_assignment_statements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_id uuid NOT NULL,
 statement_type text NOT NULL CHECK(statement_type IN('project_intent','requested_work','preservation','element_action','preference','quality_expectation','constraint','exclusion','note')),
 category text NOT NULL,description varchar(5000) NOT NULL,
 intent_kind text CHECK(intent_kind IN('renovation','reconstruction','finishing','shell_and_core_completion','partial_repair','maintenance','installation','dismantling','other')),
 work_category text CHECK(work_category IN('demolition','partition_work','plastering','leveling','waterproofing','tiling','flooring','painting','wallpapering','ceilings','electrical','plumbing','heating','ventilation','doors','windows','built_in_furniture','equipment_installation','cleanup','other')),
 element_action text CHECK(element_action IN('remove','replace','relocate','repair','restore','retain','inspect_before_decision')),
 preservation_kind text CHECK(preservation_kind IN('floor','windows','doors','wiring','plumbing_points','furniture','surface','building_element','other')),
 constraint_kind text CHECK(constraint_kind IN('access_restriction','work_hours','occupied_premises','noise_restriction','dust_restriction','elevator_restriction','waste_removal','utility_shutdown','building_administration','customer_presence','preservation','safety_compliance','sequencing_dependency','other')),
 exclusion_kind text CHECK(exclusion_kind IN('work','room','zone','material','responsibility','assumption','other')),
 quality_level text CHECK(quality_level IN('basic','standard','enhanced','premium','custom')),
 preference_kind text CHECK(preference_kind IN('finish_type','material_family','brand','model','color','texture','quality_tier','customer_supplied','substitution')),
 preference_value varchar(1000),substitution_allowed boolean,
 source_type text NOT NULL CHECK(source_type IN('customer','company_employee','project_manager','foreman','designer','engineer','imported_document','ai_suggestion_accepted','other')),
 source_reference varchar(300),certainty numeric(5,4) CHECK(certainty BETWEEN 0 AND 1),review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN('pending','accepted','rejected','changes_requested','superseded')),
 blocking boolean NOT NULL DEFAULT false,supersedes_statement_id uuid,reviewed_by uuid,reviewed_at timestamptz,review_note varchar(2000),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,revision_id,id),
 FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,supersedes_statement_id)REFERENCES technical_assignment_statements(tenant_id,id),
 FOREIGN KEY(tenant_id,reviewed_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK((statement_type='project_intent'AND intent_kind IS NOT NULL)OR statement_type<>'project_intent'),
 CHECK((statement_type='requested_work'AND work_category IS NOT NULL)OR statement_type<>'requested_work'),
 CHECK((statement_type='element_action'AND element_action IS NOT NULL)OR statement_type<>'element_action'),
 CHECK((statement_type='preservation'AND preservation_kind IS NOT NULL)OR statement_type<>'preservation'),
 CHECK((statement_type='constraint'AND constraint_kind IS NOT NULL)OR statement_type<>'constraint'),
 CHECK((statement_type='exclusion'AND exclusion_kind IS NOT NULL)OR statement_type<>'exclusion'),
 CHECK((statement_type='quality_expectation'AND quality_level IS NOT NULL)OR statement_type<>'quality_expectation'),
 CHECK((statement_type='preference'AND preference_kind IS NOT NULL AND preference_value IS NOT NULL)OR statement_type<>'preference'),
 CHECK((review_status='pending'AND reviewed_by IS NULL AND reviewed_at IS NULL)OR(review_status<>'pending'AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE technical_assignment_statement_history(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_id uuid NOT NULL,statement_id uuid NOT NULL,
 original_version bigint NOT NULL CHECK(original_version>=1),change_kind text NOT NULL CHECK(change_kind IN('content_updated','review_changed','superseded')),
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'AND pg_column_size(content)<=65536),changed_at timestamptz NOT NULL DEFAULT now(),changed_by uuid NOT NULL,
 UNIQUE(tenant_id,statement_id,original_version),
 FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,changed_by)REFERENCES users(tenant_id,id)
);
CREATE FUNCTION archive_technical_assignment_statement()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN
 INSERT INTO technical_assignment_statement_history(tenant_id,assignment_id,revision_id,statement_id,original_version,change_kind,content,changed_by)
 VALUES(OLD.tenant_id,OLD.assignment_id,OLD.revision_id,OLD.id,OLD.version,CASE WHEN NEW.review_status='superseded'THEN'superseded'WHEN NEW.review_status IS DISTINCT FROM OLD.review_status THEN'review_changed'ELSE'content_updated'END,to_jsonb(OLD),NEW.updated_by);
 RETURN NEW;END$$;
CREATE TRIGGER archive_technical_assignment_statement_before_update BEFORE UPDATE ON technical_assignment_statements FOR EACH ROW EXECUTE FUNCTION archive_technical_assignment_statement();

CREATE TABLE technical_assignment_applicability(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_id uuid NOT NULL,statement_id uuid NOT NULL,
 target_type text NOT NULL CHECK(target_type IN('entire_object','room','zone','building_element','future_scope_reference')),target_reference varchar(300),included boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,
 UNIQUE(tenant_id,statement_id,target_type,target_reference),
 FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,revision_id,statement_id)REFERENCES technical_assignment_statements(tenant_id,revision_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),
 CHECK((target_type='entire_object'AND target_reference IS NULL)OR(target_type<>'entire_object'AND target_reference IS NOT NULL))
);

CREATE TABLE technical_assignment_open_items(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_id uuid NOT NULL,
 item_type text NOT NULL CHECK(item_type IN('clarification_required','customer_decision_required','engineer_decision_required','designer_decision_required','site_verification_required','document_required')),
 description varchar(5000) NOT NULL,blocking boolean NOT NULL DEFAULT true,status text NOT NULL DEFAULT 'open' CHECK(status IN('open','resolved','waived')),
 resolution varchar(5000),resolved_by uuid,resolved_at timestamptz,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,resolved_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK((status='open'AND resolution IS NULL AND resolved_by IS NULL AND resolved_at IS NULL)OR(status<>'open'AND resolution IS NOT NULL AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL))
);

CREATE TABLE technical_assignment_customer_supplied_items(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_id uuid NOT NULL,
 description varchar(1000) NOT NULL,category varchar(120) NOT NULL,declared_quantity numeric(20,6) CHECK(declared_quantity>0),measurement_unit_id uuid,
 availability_status text NOT NULL CHECK(availability_status IN('available','ordered','planned','unknown')),expected_delivery_date date,storage_responsibility text CHECK(storage_responsibility IN('customer','company','supplier','unassigned')),
 installation_expected boolean NOT NULL DEFAULT false,note varchar(3000),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,measurement_unit_id)REFERENCES measurement_units(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK((declared_quantity IS NULL AND measurement_unit_id IS NULL)OR(declared_quantity IS NOT NULL AND measurement_unit_id IS NOT NULL))
);

CREATE TABLE technical_assignment_schedule_expectations(
 revision_id uuid PRIMARY KEY,tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,desired_start_date date,desired_completion_date date,
 deadline_type text CHECK(deadline_type IN('fixed','flexible')),milestone_expectation varchar(3000),blackout_dates daterange[],access_windows varchar(3000),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,revision_id),FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK(desired_completion_date IS NULL OR desired_start_date IS NULL OR desired_completion_date>=desired_start_date)
);

CREATE TABLE technical_assignment_budget_expectations(
 revision_id uuid PRIMARY KEY,tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,budget_type text NOT NULL CHECK(budget_type IN('target','maximum','range')),
 minimum_amount numeric(20,2) CHECK(minimum_amount>=0),maximum_amount numeric(20,2) CHECK(maximum_amount>=0),currency char(3) NOT NULL CHECK(currency~'^[A-Z]{3}$'),tax_included boolean,source_type text NOT NULL CHECK(source_type IN('customer','company_employee','imported_document','other')),certainty numeric(5,4) CHECK(certainty BETWEEN 0 AND 1),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,revision_id),FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),
 CHECK((budget_type='range'AND minimum_amount IS NOT NULL AND maximum_amount IS NOT NULL AND maximum_amount>=minimum_amount)OR(budget_type='target'AND minimum_amount IS NOT NULL AND maximum_amount IS NULL)OR(budget_type='maximum'AND maximum_amount IS NOT NULL AND minimum_amount IS NULL))
);

CREATE TABLE approved_technical_assignment_snapshots(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,assignment_id uuid NOT NULL,revision_id uuid NOT NULL,revision_number integer NOT NULL,
 project_id uuid NOT NULL,property_id uuid,content jsonb NOT NULL CHECK(jsonb_typeof(content)='object'AND pg_column_size(content)<=2097152),
 content_fingerprint char(64) NOT NULL CHECK(content_fingerprint~'^[a-f0-9]{64}$'),schema_version varchar(40) NOT NULL,approved_at timestamptz NOT NULL DEFAULT now(),approved_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,revision_id),UNIQUE(tenant_id,assignment_id,revision_number),
 FOREIGN KEY(tenant_id,assignment_id)REFERENCES technical_assignments(tenant_id,id),FOREIGN KEY(tenant_id,revision_id)REFERENCES technical_assignment_revisions(tenant_id,id),
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,property_id)REFERENCES properties(tenant_id,id),FOREIGN KEY(tenant_id,approved_by)REFERENCES users(tenant_id,id)
);
CREATE FUNCTION prevent_technical_assignment_snapshot_mutation()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN RAISE EXCEPTION 'approved technical assignment snapshots are immutable';END$$;
CREATE TRIGGER immutable_technical_assignment_snapshot BEFORE UPDATE OR DELETE ON approved_technical_assignment_snapshots FOR EACH ROW EXECUTE FUNCTION prevent_technical_assignment_snapshot_mutation();
CREATE FUNCTION protect_approved_technical_assignment_revision()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN
 IF TG_OP='DELETE'AND OLD.status IN('approved','superseded')THEN RAISE EXCEPTION 'approved technical assignment revision is immutable';END IF;
 IF TG_OP='UPDATE'AND OLD.status IN('approved','superseded')AND NOT(
  (OLD.status='approved'AND NEW.status='superseded'AND NEW.is_current=false AND NEW.revision_number=OLD.revision_number AND NEW.assignment_id=OLD.assignment_id AND NEW.approved_at=OLD.approved_at AND NEW.approved_by=OLD.approved_by)
  OR(OLD.status='superseded'AND NEW.status='superseded'AND OLD.superseded_by_revision_id IS NULL AND NEW.superseded_by_revision_id IS NOT NULL AND NEW.is_current=false AND NEW.revision_number=OLD.revision_number AND NEW.assignment_id=OLD.assignment_id AND NEW.approved_at=OLD.approved_at AND NEW.approved_by=OLD.approved_by)
 )THEN RAISE EXCEPTION 'approved technical assignment revision is immutable';END IF;
 IF TG_OP='DELETE'THEN RETURN OLD;END IF;RETURN NEW;END$$;
CREATE TRIGGER immutable_approved_technical_assignment_revision BEFORE UPDATE OR DELETE ON technical_assignment_revisions FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_revision();
CREATE FUNCTION protect_approved_technical_assignment_content()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$DECLARE rid uuid;tid uuid;state text;BEGIN
 IF TG_OP='DELETE'THEN rid=OLD.revision_id;tid=OLD.tenant_id;ELSE rid=NEW.revision_id;tid=NEW.tenant_id;END IF;SELECT status INTO state FROM technical_assignment_revisions WHERE tenant_id=tid AND id=rid;
 IF state IN('approved','superseded')THEN RAISE EXCEPTION 'approved technical assignment content is immutable';END IF;IF TG_OP='DELETE'THEN RETURN OLD;END IF;RETURN NEW;END$$;
CREATE TRIGGER immutable_approved_technical_assignment_statements BEFORE INSERT OR UPDATE OR DELETE ON technical_assignment_statements FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_content();
CREATE TRIGGER immutable_approved_technical_assignment_applicability BEFORE INSERT OR UPDATE OR DELETE ON technical_assignment_applicability FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_content();
CREATE TRIGGER immutable_approved_technical_assignment_open_items BEFORE INSERT OR UPDATE OR DELETE ON technical_assignment_open_items FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_content();
CREATE TRIGGER immutable_approved_technical_assignment_customer_items BEFORE INSERT OR UPDATE OR DELETE ON technical_assignment_customer_supplied_items FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_content();
CREATE TRIGGER immutable_approved_technical_assignment_schedule BEFORE INSERT OR UPDATE OR DELETE ON technical_assignment_schedule_expectations FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_content();
CREATE TRIGGER immutable_approved_technical_assignment_budget BEFORE INSERT OR UPDATE OR DELETE ON technical_assignment_budget_expectations FOR EACH ROW EXECUTE FUNCTION protect_approved_technical_assignment_content();

CREATE INDEX idx_technical_assignments_project ON technical_assignments(tenant_id,project_id,updated_at DESC);
CREATE INDEX idx_technical_assignments_property ON technical_assignments(tenant_id,property_id,updated_at DESC);
CREATE INDEX idx_technical_assignment_revisions_status ON technical_assignment_revisions(tenant_id,status,updated_at DESC);
CREATE INDEX idx_technical_assignment_statements_active ON technical_assignment_statements(tenant_id,revision_id,statement_type,review_status,id);
CREATE INDEX idx_technical_assignment_statements_supersession ON technical_assignment_statements(tenant_id,supersedes_statement_id);
CREATE INDEX idx_technical_assignment_statement_history ON technical_assignment_statement_history(tenant_id,revision_id,statement_id,original_version);
CREATE INDEX idx_technical_assignment_applicability_target ON technical_assignment_applicability(tenant_id,target_type,target_reference);
CREATE INDEX idx_technical_assignment_open_items_readiness ON technical_assignment_open_items(tenant_id,revision_id,blocking,status);
CREATE INDEX idx_technical_assignment_customer_items ON technical_assignment_customer_supplied_items(tenant_id,revision_id,category);
CREATE INDEX idx_technical_assignment_snapshots ON approved_technical_assignment_snapshots(tenant_id,assignment_id,revision_number DESC);

ALTER TABLE technical_assignments ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignments FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_revisions ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_revisions FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_statements ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_statements FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_statement_history ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_statement_history FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_applicability ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_applicability FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_open_items ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_open_items FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_customer_supplied_items ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_customer_supplied_items FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_schedule_expectations ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_schedule_expectations FORCE ROW LEVEL SECURITY;
ALTER TABLE technical_assignment_budget_expectations ENABLE ROW LEVEL SECURITY;ALTER TABLE technical_assignment_budget_expectations FORCE ROW LEVEL SECURITY;
ALTER TABLE approved_technical_assignment_snapshots ENABLE ROW LEVEL SECURITY;ALTER TABLE approved_technical_assignment_snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_technical_assignments ON technical_assignments USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_revisions ON technical_assignment_revisions USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_statements ON technical_assignment_statements USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_statement_history ON technical_assignment_statement_history USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_applicability ON technical_assignment_applicability USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_open_items ON technical_assignment_open_items USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_customer_items ON technical_assignment_customer_supplied_items USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_schedule ON technical_assignment_schedule_expectations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_budget ON technical_assignment_budget_expectations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_technical_assignment_snapshots ON approved_technical_assignment_snapshots USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check CHECK(event_type IN(
'task.assigned','task.due_soon','task.overdue','task.completed','project.started','project.paused','project.completed','invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid','payment.received','expense.approved','expense.rejected',
'document.uploaded','document.version_created','document.archived','document.page_ocr_requested','document.page_ocr_started','document.page_ocr_completed','document.page_ocr_failed','document.page_ocr_retried','document.page_ocr_cancelled',
'document.analysis_requested','document.analysis_started','document.classified','document.extraction_completed','document.analysis_failed','document.analysis_retried','document.analysis_cancelled',
'document.review_started','document.review_assigned','document.review_field_changed','document.review_classification_changed','document.review_submitted','document.review_changes_requested','document.review_approved','document.review_rejected',
'document.suggestions_requested','document.suggestion_created','document.suggestion_accepted','document.suggestion_rejected','document.suggestion_request_created','document.suggestion_request_started','document.suggestion_request_completed','document.suggestion_request_failed','document.suggestion_request_cancelled','document.suggestion_request_stale',
'room_scan.review_required','room_scan.approved','room_scan.rejected','room_scan.quantities_ready',
'technical_assignment.created','technical_assignment.lifecycle_changed','technical_assignment.statement_changed','technical_assignment.statement_reviewed','technical_assignment.open_item_changed','technical_assignment.readiness_requested','technical_assignment.approved','technical_assignment.cancelled','technical_assignment.revision_created'));
ALTER TABLE notifications DROP CONSTRAINT notifications_entity_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_entity_type_check CHECK(entity_type IN('task','project','invoice','payment','expense','document','room_scan','technical_assignment'));

INSERT INTO permissions(code,description)VALUES
('technical_assignments.create','Create technical assignments'),('technical_assignments.read','Read technical assignments'),('technical_assignments.edit','Edit technical assignments'),
('technical_assignments.review','Review technical assignment statements'),('technical_assignments.approve','Approve technical assignments'),('technical_assignments.cancel','Cancel technical assignments'),
('technical_assignments.snapshots.read','Read approved technical assignment snapshots')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE
(r.code='tenant_admin'AND p.code LIKE 'technical_assignments.%')OR
(r.code='project_manager'AND p.code LIKE 'technical_assignments.%')OR
(r.code='employee'AND p.code IN('technical_assignments.create','technical_assignments.read','technical_assignments.edit'))OR
(r.code='read_only'AND p.code IN('technical_assignments.read','technical_assignments.snapshots.read'))ON CONFLICT DO NOTHING;
