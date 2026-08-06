CREATE TABLE engineering_value_lineages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid NOT NULL,output_module varchar(80) NOT NULL,output_object_type varchar(120) NOT NULL,output_object_id uuid NOT NULL,output_snapshot_id uuid NOT NULL,value_path varchar(300) NOT NULL,value jsonb NOT NULL,unit_code varchar(40),currency char(3),formula jsonb NOT NULL CHECK(jsonb_typeof(formula)='object'),dependencies jsonb NOT NULL CHECK(jsonb_typeof(dependencies)='array'AND jsonb_array_length(dependencies)>0),lineage jsonb NOT NULL CHECK(jsonb_typeof(lineage)='array'AND jsonb_array_length(lineage)>0),confidence numeric(5,4) NOT NULL CHECK(confidence BETWEEN 0 AND 1),revision_number integer NOT NULL CHECK(revision_number>0),content_fingerprint char(64) NOT NULL CHECK(content_fingerprint~'^[0-9a-f]{64}$'),recorded_at timestamptz NOT NULL DEFAULT now(),recorded_by uuid NOT NULL,
 UNIQUE(tenant_id,output_snapshot_id,output_object_id,value_path),UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,output_snapshot_id)REFERENCES approved_commercial_estimate_snapshots(tenant_id,id),FOREIGN KEY(tenant_id,recorded_by)REFERENCES users(tenant_id,id)
);

CREATE TABLE engineering_change_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid,source_module varchar(80) NOT NULL,source_object_id uuid NOT NULL,old_snapshot_id uuid NOT NULL,new_snapshot_id uuid NOT NULL,old_value jsonb NOT NULL,new_value jsonb NOT NULL,reason varchar(2000) NOT NULL,detected_at timestamptz NOT NULL DEFAULT now(),operator_id uuid NOT NULL,
 UNIQUE(tenant_id,source_module,new_snapshot_id),UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,operator_id)REFERENCES users(tenant_id,id)
);

CREATE TABLE engineering_impact_reports(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,change_event_id uuid NOT NULL,project_id uuid,old_value jsonb NOT NULL,new_value jsonb NOT NULL,reason varchar(2000) NOT NULL,affected_modules jsonb NOT NULL CHECK(jsonb_typeof(affected_modules)='array'),affected_estimates jsonb NOT NULL CHECK(jsonb_typeof(affected_estimates)='array'),affected_materials jsonb NOT NULL CHECK(jsonb_typeof(affected_materials)='array'),affected_schedule jsonb NOT NULL CHECK(jsonb_typeof(affected_schedule)='array'),affected_risks jsonb NOT NULL CHECK(jsonb_typeof(affected_risks)='array'),approval_requirement jsonb NOT NULL CHECK(jsonb_typeof(approval_requirement)='object'),status text NOT NULL DEFAULT'recalculation_required'CHECK(status IN('recalculation_required','review_required','resolved')),generated_at timestamptz NOT NULL DEFAULT now(),generated_by uuid NOT NULL,
 UNIQUE(tenant_id,change_event_id),UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,change_event_id)REFERENCES engineering_change_events(tenant_id,id),FOREIGN KEY(tenant_id,generated_by)REFERENCES users(tenant_id,id)
);

CREATE FUNCTION protect_engineering_causality()RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION'ENGINEERING_CAUSALITY_IMMUTABLE';
END$$;

CREATE TRIGGER immutable_engineering_value_lineages BEFORE UPDATE OR DELETE ON engineering_value_lineages FOR EACH ROW EXECUTE FUNCTION protect_engineering_causality();

CREATE TRIGGER immutable_engineering_change_events BEFORE UPDATE OR DELETE ON engineering_change_events FOR EACH ROW EXECUTE FUNCTION protect_engineering_causality();

CREATE TRIGGER immutable_engineering_impact_reports BEFORE UPDATE OR DELETE ON engineering_impact_reports FOR EACH ROW EXECUTE FUNCTION protect_engineering_causality();

DO $$DECLARE t text;
BEGIN FOREACH t IN ARRAY ARRAY['engineering_value_lineages','engineering_change_events','engineering_impact_reports']LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
EXECUTE format('CREATE POLICY tenant_%I ON %I USING(tenant_id=NULLIF(current_setting(''app.tenant_id'',true),'''')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting(''app.tenant_id'',true),'''')::uuid)',t,t);
END LOOP;
END$$;

CREATE INDEX idx_ecc_value_output ON engineering_value_lineages(tenant_id,output_object_type,output_object_id,value_path);

CREATE INDEX idx_ecc_value_project ON engineering_value_lineages(tenant_id,project_id,recorded_at DESC);

CREATE INDEX idx_ecc_lineage_gin ON engineering_value_lineages USING gin(lineage jsonb_path_ops);

CREATE INDEX idx_ecc_changes_project ON engineering_change_events(tenant_id,project_id,detected_at DESC);

CREATE FUNCTION register_authoritative_engineering_change()RETURNS trigger LANGUAGE plpgsql AS $$DECLARE prior jsonb;
event_id uuid;
owner_value text;
project_value uuid;
affected jsonb;
BEGIN owner_value:=to_jsonb(NEW)->>TG_ARGV[1];
EXECUTE format('SELECT to_jsonb(x)FROM %I x WHERE tenant_id=$1 AND %I::text=$2 AND id<>$3 ORDER BY approved_at DESC,id DESC LIMIT 1',TG_TABLE_NAME,TG_ARGV[1])INTO prior USING NEW.tenant_id,owner_value,NEW.id;
IF prior IS NULL THEN RETURN NEW;
END IF;
project_value:=COALESCE((to_jsonb(NEW)->>'project_id')::uuid,NULLIF(to_jsonb(NEW)->'content'->>'projectId','')::uuid);
IF project_value IS NULL AND TG_ARGV[0]='scanner'THEN SELECT project_id INTO project_value FROM room_scan_sessions WHERE tenant_id=NEW.tenant_id AND id=NEW.scan_id;END IF;
INSERT INTO engineering_change_events(tenant_id,project_id,source_module,source_object_id,old_snapshot_id,new_snapshot_id,old_value,new_value,reason,operator_id)VALUES(NEW.tenant_id,project_value,TG_ARGV[0],owner_value::uuid,(prior->>'id')::uuid,NEW.id,prior->'content',to_jsonb(NEW)->'content','Authoritative approved revision changed;
 every dependent value requires impact review.',NEW.approved_by)RETURNING id INTO event_id;
SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object('estimateId',output_object_id,'valuePath',value_path)),'[]'::jsonb)INTO affected FROM engineering_value_lineages WHERE tenant_id=NEW.tenant_id AND lineage@>jsonb_build_array(jsonb_build_object('snapshotId',prior->>'id'));
INSERT INTO engineering_impact_reports(tenant_id,change_event_id,project_id,old_value,new_value,reason,affected_modules,affected_estimates,affected_materials,affected_schedule,affected_risks,approval_requirement,generated_by)VALUES(NEW.tenant_id,event_id,project_value,prior->'content',to_jsonb(NEW)->'content','Authoritative input changed.',to_jsonb(string_to_array(TG_ARGV[2],',')),affected,COALESCE(jsonb_path_query_array(to_jsonb(NEW)->'content','$.lines[*].materialId'),'[]'::jsonb),jsonb_build_array(jsonb_build_object('status','recalculation_required')),jsonb_build_array(jsonb_build_object('status','reassessment_required')),jsonb_build_object('required',true,'reason','Downstream approved values cannot be silently changed.'),NEW.approved_by);
RETURN NEW;
END$$;

CREATE TRIGGER ecc_spatial_change AFTER INSERT ON approved_spatial_room_snapshots FOR EACH ROW EXECUTE FUNCTION register_authoritative_engineering_change('scanner','scan_id','work_scope,material_consumption,estimate,schedule,risk');

CREATE TRIGGER ecc_work_scope_change AFTER INSERT ON approved_work_scope_snapshots FOR EACH ROW EXECUTE FUNCTION register_authoritative_engineering_change('work_scope','scope_id','material_consumption,estimate,schedule,risk');

CREATE TRIGGER ecc_norm_change AFTER INSERT ON approved_engineering_norm_snapshots FOR EACH ROW EXECUTE FUNCTION register_authoritative_engineering_change('engineering_norm','norm_id','material_consumption,estimate,schedule,risk');

CREATE TRIGGER ecc_consumption_change AFTER INSERT ON approved_material_consumption_snapshots FOR EACH ROW EXECUTE FUNCTION register_authoritative_engineering_change('material_consumption','run_id','estimate,procurement,schedule,risk');

CREATE TRIGGER ecc_pricing_change AFTER INSERT ON approved_regional_pricing_snapshots FOR EACH ROW EXECUTE FUNCTION register_authoritative_engineering_change('regional_pricing','profile_id','estimate,profitability');

CREATE TRIGGER ecc_estimate_change AFTER INSERT ON approved_commercial_estimate_snapshots FOR EACH ROW EXECUTE FUNCTION register_authoritative_engineering_change('commercial_estimate','estimate_id','contract,procurement,purchasing,invoicing,profitability');

INSERT INTO permissions(code,description)VALUES('engineering_causality.read','Explain engineering values'),('engineering_causality.impact.read','Read engineering change impact reports')ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code LIKE'engineering_causality.%'AND r.code IN('tenant_admin','project_manager','finance_manager','employee','read_only')ON CONFLICT DO NOTHING;
