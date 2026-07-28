ALTER TABLE properties ADD CONSTRAINT properties_tenant_id_id_room_scan_unique UNIQUE(tenant_id,id);
ALTER TABLE projects ADD CONSTRAINT projects_tenant_id_id_room_scan_unique UNIQUE(tenant_id,id);

CREATE TABLE room_scan_sessions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,property_id uuid NOT NULL,project_id uuid,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','capturing','processing','review_required','ready_for_approval','approved','rejected','cancelled')),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>=1),ingestion_key varchar(120),notes varchar(5000),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,id,property_id),UNIQUE(tenant_id,ingestion_key),
 FOREIGN KEY(tenant_id,property_id)REFERENCES properties(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_rooms(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,name varchar(300) NOT NULL,room_type varchar(80) NOT NULL DEFAULT 'other',
 floor_number integer,version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_surfaces(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,room_id uuid NOT NULL,
 surface_type text NOT NULL CHECK(surface_type IN('wall','floor','ceiling','slope','column_face','niche_face','opening_reveal','other')),
 label varchar(120) NOT NULL,polygon jsonb NOT NULL CHECK(jsonb_typeof(polygon)='array'AND jsonb_array_length(polygon)>=3 AND pg_column_size(polygon)<=65536),
 orientation numeric(12,8),confidence numeric(5,4) CHECK(confidence BETWEEN 0 AND 1),review_status text NOT NULL DEFAULT 'unverified' CHECK(review_status IN('unverified','requires_review','verified','rejected')),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,scan_id,room_id)REFERENCES room_scan_rooms(tenant_id,scan_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_measurements(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,room_id uuid,surface_id uuid,
 measurement_type text NOT NULL CHECK(measurement_type IN('length','width','height','area','volume','perimeter','angle','deviation','level_difference','thickness','radius','diameter','count')),
 source text NOT NULL CHECK(source IN('lidar','arkit','camera_estimation','manual_measurement','laser_measurement','level_rule','imported_plan','design_project','technical_specification','human_correction')),
 original_value numeric(20,8) NOT NULL CHECK(original_value>=0),original_unit varchar(20) NOT NULL,si_value numeric(20,8) NOT NULL CHECK(si_value>=0),si_unit varchar(20) NOT NULL,
 confidence numeric(5,4) CHECK(confidence BETWEEN 0 AND 1),verification_status text NOT NULL DEFAULT 'unverified' CHECK(verification_status IN('unverified','requires_review','verified','rejected')),
 captured_at timestamptz NOT NULL,captured_by uuid NOT NULL,attachment_file_id uuid,device_metadata jsonb NOT NULL DEFAULT '{}' CHECK(pg_column_size(device_metadata)<=8192),provenance varchar(500),
 idempotency_key varchar(120),version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,scan_id,idempotency_key),FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,scan_id,room_id)REFERENCES room_scan_rooms(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id),
 FOREIGN KEY(tenant_id,captured_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,attachment_file_id)REFERENCES file_objects(tenant_id,id)
);
CREATE TABLE room_scan_openings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,room_id uuid NOT NULL,surface_id uuid NOT NULL,
 opening_type text NOT NULL CHECK(opening_type IN('door','window','passage','service_opening','other')),
 width_m numeric(20,8) NOT NULL CHECK(width_m>0),height_m numeric(20,8) NOT NULL CHECK(height_m>0),sill_height_m numeric(20,8) CHECK(sill_height_m>=0),reveal_depth_m numeric(20,8) CHECK(reveal_depth_m>=0),
 position jsonb NOT NULL DEFAULT '{}' CHECK(pg_column_size(position)<=8192),source text NOT NULL CHECK(source IN('lidar','arkit','camera_estimation','manual_measurement','laser_measurement','level_rule','imported_plan','design_project','technical_specification','human_correction')),verification_status text NOT NULL DEFAULT 'unverified' CHECK(verification_status IN('unverified','requires_review','verified','rejected')),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,scan_id,room_id)REFERENCES room_scan_rooms(tenant_id,scan_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_observations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,room_id uuid,surface_id uuid,
 observation_kind text NOT NULL CHECK(observation_kind IN('surface','defect','flatness','corner')),
 observation_type text NOT NULL CHECK(observation_type IN('crack','chip','hole','moisture','delamination','contamination','corrosion','missing_material','deformation','other','internal_corner','external_corner','opening_corner','level_rule','lidar_plane_analysis','laser','manual')),
 measured_value numeric(20,8),unit varchar(20),details jsonb NOT NULL DEFAULT '{}' CHECK(pg_column_size(details)<=32768),source varchar(80) NOT NULL CHECK(source IN('lidar','arkit','camera_estimation','manual_measurement','laser_measurement','level_rule','imported_plan','design_project','technical_specification','human_correction')),
 confidence numeric(5,4) CHECK(confidence BETWEEN 0 AND 1),review_status text NOT NULL DEFAULT 'requires_review' CHECK(review_status IN('detected','requires_review','confirmed','rejected')),
 attachment_file_id uuid,version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,scan_id,room_id)REFERENCES room_scan_rooms(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id),
 FOREIGN KEY(tenant_id,attachment_file_id)REFERENCES file_objects(tenant_id,id),FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_quantities(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,room_id uuid,surface_id uuid,
 quantity_type text NOT NULL CHECK(quantity_type IN('wall_gross_area','wall_net_area','floor_area','ceiling_area','room_perimeter','room_volume','opening_area','opening_reveal_area','internal_corner_length','external_corner_length','opening_corner_length','skirting_length','demolition_wall_area','demolition_floor_area','demolition_ceiling_area','defect_count')),
 value numeric(20,8) NOT NULL CHECK(value>=0),unit varchar(20) NOT NULL CHECK(unit IN('m','m2','m3','count')),formula_id varchar(120) NOT NULL,input_references jsonb NOT NULL CHECK(jsonb_typeof(input_references)='array'),source_versions jsonb NOT NULL CHECK(jsonb_typeof(source_versions)='array'),calculation_version varchar(40) NOT NULL,calculated_at timestamptz NOT NULL DEFAULT now(),
 validity_status text NOT NULL DEFAULT 'valid' CHECK(validity_status IN('valid','invalidated','superseded')),invalidated_at timestamptz,invalidated_by uuid,invalidation_reason varchar(120),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,invalidated_by)REFERENCES users(tenant_id,id),
 CHECK((validity_status='valid'AND invalidated_at IS NULL AND invalidated_by IS NULL AND invalidation_reason IS NULL)OR(validity_status<>'valid'AND invalidated_at IS NOT NULL AND invalidated_by IS NOT NULL AND invalidation_reason IS NOT NULL))
);
CREATE TABLE room_scan_quantity_history(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,quantity_id uuid NOT NULL,room_id uuid,quantity_type text NOT NULL,value numeric(20,8) NOT NULL,unit varchar(20) NOT NULL,formula_id varchar(120) NOT NULL,input_references jsonb NOT NULL,source_versions jsonb NOT NULL,calculation_version varchar(40) NOT NULL,
 terminal_status text NOT NULL CHECK(terminal_status IN('invalidated','superseded')),terminal_reason varchar(120) NOT NULL,terminal_at timestamptz NOT NULL,terminal_by uuid NOT NULL,original_version bigint NOT NULL CHECK(original_version>=1),
 UNIQUE(tenant_id,quantity_id,original_version,terminal_status),FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,terminal_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_quantity_dependencies(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,quantity_id uuid NOT NULL,source_order integer NOT NULL CHECK(source_order>=0),
 source_type text NOT NULL CHECK(source_type IN('measurement','opening')),source_id uuid NOT NULL,source_version bigint NOT NULL CHECK(source_version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,
 UNIQUE(tenant_id,quantity_id,source_order),UNIQUE(tenant_id,quantity_id,source_type,source_id),
 FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,quantity_id)REFERENCES room_scan_quantities(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)
);
CREATE FUNCTION validate_room_scan_quantity_dependencies()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$DECLARE dependency jsonb;BEGIN
 IF jsonb_array_length(NEW.source_versions)=0 THEN SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'entityType','measurement','version',version)ORDER BY id),'[]'::jsonb)INTO NEW.source_versions FROM room_scan_measurements WHERE tenant_id=NEW.tenant_id AND scan_id=NEW.scan_id AND room_id=NEW.room_id AND measurement_type IN('width','length','height')AND verification_status<>'rejected';END IF;
 IF jsonb_array_length(NEW.source_versions)=0 THEN RAISE EXCEPTION 'QUANTITY_PROVENANCE_INCOMPLETE';END IF;
 FOR dependency IN SELECT value FROM jsonb_array_elements(NEW.source_versions)WITH ORDINALITY d(value,ordinality)ORDER BY value->>'id' LOOP
  IF dependency->>'entityType'NOT IN('measurement','opening')OR(dependency->>'version')IS NULL THEN RAISE EXCEPTION 'QUANTITY_PROVENANCE_INCOMPLETE';END IF;
  IF dependency->>'entityType'='measurement'AND NOT EXISTS(SELECT 1 FROM room_scan_measurements WHERE tenant_id=NEW.tenant_id AND scan_id=NEW.scan_id AND id=(dependency->>'id')::uuid AND version=(dependency->>'version')::bigint)THEN RAISE EXCEPTION 'QUANTITY_SOURCE_VERSION_MISMATCH';END IF;
  IF dependency->>'entityType'='opening'AND NOT EXISTS(SELECT 1 FROM room_scan_openings WHERE tenant_id=NEW.tenant_id AND scan_id=NEW.scan_id AND id=(dependency->>'id')::uuid AND version=(dependency->>'version')::bigint)THEN RAISE EXCEPTION 'QUANTITY_SOURCE_VERSION_MISMATCH';END IF;
 END LOOP;
 NEW.input_references=NEW.source_versions;RETURN NEW;END$$;
CREATE TRIGGER validate_quantity_dependencies BEFORE INSERT ON room_scan_quantities FOR EACH ROW EXECUTE FUNCTION validate_room_scan_quantity_dependencies();
CREATE FUNCTION persist_room_scan_quantity_dependencies()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$DECLARE dependency jsonb;dependency_order integer:=0;BEGIN
 FOR dependency IN SELECT value FROM jsonb_array_elements(NEW.source_versions)WITH ORDINALITY d(value,ordinality)ORDER BY value->>'id' LOOP
  INSERT INTO room_scan_quantity_dependencies(tenant_id,scan_id,quantity_id,source_order,source_type,source_id,source_version,created_by)VALUES(NEW.tenant_id,NEW.scan_id,NEW.id,dependency_order,dependency->>'entityType',(dependency->>'id')::uuid,(dependency->>'version')::bigint,NEW.created_by);
  dependency_order:=dependency_order+1;
 END LOOP;RETURN NULL;END$$;
CREATE TRIGGER persist_quantity_dependencies AFTER INSERT ON room_scan_quantities FOR EACH ROW EXECUTE FUNCTION persist_room_scan_quantity_dependencies();
CREATE FUNCTION archive_terminal_room_scan_quantity()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN
 IF OLD.validity_status='valid'AND NEW.validity_status<>'valid'THEN
  INSERT INTO room_scan_quantity_history(tenant_id,scan_id,quantity_id,room_id,quantity_type,value,unit,formula_id,input_references,source_versions,calculation_version,terminal_status,terminal_reason,terminal_at,terminal_by,original_version)
  VALUES(OLD.tenant_id,OLD.scan_id,OLD.id,OLD.room_id,OLD.quantity_type,OLD.value,OLD.unit,OLD.formula_id,OLD.input_references,OLD.source_versions,OLD.calculation_version,NEW.validity_status,NEW.invalidation_reason,NEW.invalidated_at,NEW.invalidated_by,OLD.version);
  DELETE FROM room_scan_quantities WHERE tenant_id=OLD.tenant_id AND id=OLD.id;
 END IF;RETURN NULL;END$$;
CREATE TRIGGER archive_room_scan_quantity AFTER UPDATE OF validity_status ON room_scan_quantities FOR EACH ROW WHEN(OLD.validity_status='valid'AND NEW.validity_status<>'valid')EXECUTE FUNCTION archive_terminal_room_scan_quantity();
CREATE TABLE room_scan_flatness_observations(
 observation_id uuid PRIMARY KEY,tenant_id uuid NOT NULL,scan_id uuid NOT NULL,surface_id uuid NOT NULL,
 reference_method text NOT NULL CHECK(reference_method IN('reference_plane','level_rule','laser_plane','lidar_plane')),direction text NOT NULL CHECK(direction IN('horizontal','vertical','diagonal','custom')),
 span_m numeric(20,8) NOT NULL CHECK(span_m>0),max_positive_deviation_m numeric(20,8) NOT NULL CHECK(max_positive_deviation_m>=0),max_negative_deviation_m numeric(20,8) NOT NULL CHECK(max_negative_deviation_m<=0),total_range_m numeric(20,8) NOT NULL CHECK(total_range_m=max_positive_deviation_m-max_negative_deviation_m),
 interpretation_version varchar(40) NOT NULL,UNIQUE(tenant_id,observation_id),FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,observation_id)REFERENCES room_scan_observations(tenant_id,id)ON DELETE CASCADE
);
CREATE TABLE room_scan_flatness_samples(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,observation_id uuid NOT NULL,sample_order integer NOT NULL CHECK(sample_order>=0),position_m numeric(20,8) NOT NULL CHECK(position_m>=0),deviation_m numeric(20,8) NOT NULL,
 UNIQUE(tenant_id,observation_id,sample_order),UNIQUE(tenant_id,observation_id,position_m),FOREIGN KEY(tenant_id,observation_id)REFERENCES room_scan_flatness_observations(tenant_id,observation_id)ON DELETE CASCADE
);
CREATE TABLE room_scan_defect_observations(
 observation_id uuid PRIMARY KEY,tenant_id uuid NOT NULL,scan_id uuid NOT NULL,surface_id uuid NOT NULL,
 defect_type text NOT NULL CHECK(defect_type IN('crack','chip','hole','delamination','moisture','contamination','corrosion','missing_material','deformation','other')),
 severity text NOT NULL CHECK(severity IN('minor','moderate','major','critical')),position_x_m numeric(20,8) NOT NULL CHECK(position_x_m>=0),position_y_m numeric(20,8) NOT NULL CHECK(position_y_m>=0),
 length_m numeric(20,8) CHECK(length_m>=0),width_m numeric(20,8) CHECK(width_m>=0),depth_m numeric(20,8) CHECK(depth_m>=0),affected_area_m2 numeric(20,8) CHECK(affected_area_m2>=0),
 CHECK(COALESCE(length_m,width_m,depth_m,affected_area_m2)IS NOT NULL),UNIQUE(tenant_id,observation_id),FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,observation_id)REFERENCES room_scan_observations(tenant_id,id)ON DELETE CASCADE
);
CREATE TABLE room_scan_corner_observations(
 observation_id uuid PRIMARY KEY,tenant_id uuid NOT NULL,scan_id uuid NOT NULL,surface_id uuid NOT NULL,intersecting_surface_id uuid NOT NULL,
 position_m numeric(20,8) NOT NULL CHECK(position_m>=0),expected_angle_deg numeric(8,4) NOT NULL CHECK(expected_angle_deg>0 AND expected_angle_deg<360),measured_angle_deg numeric(8,4) NOT NULL CHECK(measured_angle_deg>0 AND measured_angle_deg<360),deviation_deg numeric(8,4) NOT NULL CHECK(deviation_deg=measured_angle_deg-expected_angle_deg),
 UNIQUE(tenant_id,observation_id),FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,scan_id,intersecting_surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id),FOREIGN KEY(tenant_id,observation_id)REFERENCES room_scan_observations(tenant_id,id)ON DELETE CASCADE
);
CREATE TABLE approved_room_scan_snapshots(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,property_id uuid NOT NULL,project_id uuid,scan_version bigint NOT NULL,
 content jsonb NOT NULL CHECK(pg_column_size(content)<=1048576),content_fingerprint char(64) NOT NULL,calculation_version varchar(40) NOT NULL,approved_at timestamptz NOT NULL DEFAULT now(),approved_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,scan_id,scan_version),FOREIGN KEY(tenant_id,scan_id,property_id)REFERENCES room_scan_sessions(tenant_id,id,property_id),
 FOREIGN KEY(tenant_id,approved_by)REFERENCES users(tenant_id,id)
);
CREATE FUNCTION prevent_room_scan_snapshot_mutation()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$BEGIN RAISE EXCEPTION 'approved room scan snapshots are immutable';END$$;
CREATE TRIGGER immutable_room_scan_snapshot BEFORE UPDATE OR DELETE ON approved_room_scan_snapshots FOR EACH ROW EXECUTE FUNCTION prevent_room_scan_snapshot_mutation();
CREATE FUNCTION validate_room_scan_snapshot_insert()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$DECLARE scan_status text;invalid_count bigint;BEGIN
 SELECT status INTO scan_status FROM room_scan_sessions WHERE tenant_id=NEW.tenant_id AND id=NEW.scan_id FOR UPDATE;
 IF scan_status<>'ready_for_approval'THEN RAISE EXCEPTION 'room scan snapshot requires ready_for_approval state';END IF;
 SELECT count(*)INTO invalid_count FROM room_scan_quantities WHERE tenant_id=NEW.tenant_id AND scan_id=NEW.scan_id AND validity_status='valid';
 IF invalid_count=0 OR invalid_count<>jsonb_array_length(COALESCE(NEW.content->'quantities','[]'::jsonb))THEN RAISE EXCEPTION 'room scan snapshot contains invalid quantities';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.content->'quantities')q WHERE NOT EXISTS(SELECT 1 FROM room_scan_quantities rq WHERE rq.tenant_id=NEW.tenant_id AND rq.scan_id=NEW.scan_id AND rq.id=(q->>'id')::uuid AND rq.validity_status='valid'))THEN RAISE EXCEPTION 'room scan snapshot contains stale quantity content';END IF;
 IF EXISTS(SELECT 1 FROM room_scan_quantity_dependencies d LEFT JOIN room_scan_measurements m ON d.source_type='measurement'AND m.tenant_id=d.tenant_id AND m.scan_id=d.scan_id AND m.id=d.source_id AND m.version=d.source_version AND m.verification_status='verified' LEFT JOIN room_scan_openings o ON d.source_type='opening'AND o.tenant_id=d.tenant_id AND o.scan_id=d.scan_id AND o.id=d.source_id AND o.version=d.source_version AND o.verification_status='verified' WHERE d.tenant_id=NEW.tenant_id AND d.scan_id=NEW.scan_id AND((d.source_type='measurement'AND m.id IS NULL)OR(d.source_type='opening'AND o.id IS NULL)))THEN RAISE EXCEPTION 'SNAPSHOT_DEPENDENCY_INVALID';END IF;
 IF EXISTS(SELECT 1 FROM room_scan_quantities q WHERE q.tenant_id=NEW.tenant_id AND q.scan_id=NEW.scan_id AND NOT EXISTS(SELECT 1 FROM room_scan_quantity_dependencies d WHERE d.tenant_id=q.tenant_id AND d.quantity_id=q.id))THEN RAISE EXCEPTION 'QUANTITY_PROVENANCE_INCOMPLETE';END IF;
 RETURN NEW;END$$;
CREATE TRIGGER validate_room_scan_snapshot BEFORE INSERT ON approved_room_scan_snapshots FOR EACH ROW EXECUTE FUNCTION validate_room_scan_snapshot_insert();

CREATE INDEX idx_room_scans_tenant_status ON room_scan_sessions(tenant_id,status,updated_at DESC);
CREATE INDEX idx_room_scans_property ON room_scan_sessions(tenant_id,property_id,created_at DESC);
CREATE INDEX idx_room_scans_project ON room_scan_sessions(tenant_id,project_id,created_at DESC);
CREATE INDEX idx_room_scans_review ON room_scan_sessions(tenant_id,updated_at)WHERE status IN('review_required','ready_for_approval');
CREATE INDEX idx_room_scan_rooms ON room_scan_rooms(tenant_id,scan_id);
CREATE INDEX idx_room_scan_surfaces ON room_scan_surfaces(tenant_id,scan_id,room_id,surface_type);
CREATE INDEX idx_room_scan_measurements ON room_scan_measurements(tenant_id,scan_id,room_id,surface_id,measurement_type);
CREATE INDEX idx_room_scan_openings ON room_scan_openings(tenant_id,scan_id,surface_id);
CREATE INDEX idx_room_scan_observations_review ON room_scan_observations(tenant_id,scan_id,review_status);
CREATE INDEX idx_room_scan_quantities ON room_scan_quantities(tenant_id,scan_id,room_id,quantity_type);
CREATE INDEX idx_room_scan_quantities_validity ON room_scan_quantities(tenant_id,scan_id,validity_status);
CREATE INDEX idx_room_scan_quantity_history ON room_scan_quantity_history(tenant_id,scan_id,quantity_id,terminal_at DESC);
CREATE INDEX idx_room_scan_quantity_dependencies ON room_scan_quantity_dependencies(tenant_id,scan_id,quantity_id,source_order);
CREATE INDEX idx_room_scan_quantity_dependency_source ON room_scan_quantity_dependencies(tenant_id,scan_id,source_type,source_id);
CREATE INDEX idx_room_scan_flatness ON room_scan_flatness_observations(tenant_id,scan_id,surface_id);
CREATE INDEX idx_room_scan_defects ON room_scan_defect_observations(tenant_id,scan_id,surface_id,severity);
CREATE INDEX idx_room_scan_corners ON room_scan_corner_observations(tenant_id,scan_id,surface_id);
CREATE INDEX idx_room_scan_snapshots ON approved_room_scan_snapshots(tenant_id,property_id,approved_at DESC);

ALTER TABLE room_scan_sessions ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_rooms ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_surfaces ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_surfaces FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_measurements ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_measurements FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_openings ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_openings FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_observations ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_observations FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_quantities ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_quantities FORCE ROW LEVEL SECURITY;
ALTER TABLE approved_room_scan_snapshots ENABLE ROW LEVEL SECURITY;ALTER TABLE approved_room_scan_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_flatness_observations ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_flatness_observations FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_flatness_samples ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_flatness_samples FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_defect_observations ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_defect_observations FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_corner_observations ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_corner_observations FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_quantity_history ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_quantity_history FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_quantity_dependencies ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_quantity_dependencies FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_room_scan_sessions ON room_scan_sessions USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_rooms ON room_scan_rooms USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_surfaces ON room_scan_surfaces USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_measurements ON room_scan_measurements USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_openings ON room_scan_openings USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_observations ON room_scan_observations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_quantities ON room_scan_quantities USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_snapshots ON approved_room_scan_snapshots USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_flatness ON room_scan_flatness_observations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_flatness_samples ON room_scan_flatness_samples USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_defects ON room_scan_defect_observations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_corners ON room_scan_corner_observations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_quantity_history ON room_scan_quantity_history USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_quantity_dependencies ON room_scan_quantity_dependencies USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check CHECK(event_type IN(
'task.assigned','task.due_soon','task.overdue','task.completed','project.started','project.paused','project.completed','invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid','payment.received','expense.approved','expense.rejected',
'document.uploaded','document.version_created','document.archived','document.page_ocr_requested','document.page_ocr_started','document.page_ocr_completed','document.page_ocr_failed','document.page_ocr_retried','document.page_ocr_cancelled',
'document.analysis_requested','document.analysis_started','document.classified','document.extraction_completed','document.analysis_failed','document.analysis_retried','document.analysis_cancelled',
'document.review_started','document.review_assigned','document.review_field_changed','document.review_classification_changed','document.review_submitted','document.review_changes_requested','document.review_approved','document.review_rejected',
'document.suggestions_requested','document.suggestion_created','document.suggestion_accepted','document.suggestion_rejected','document.suggestion_request_created','document.suggestion_request_started','document.suggestion_request_completed','document.suggestion_request_failed','document.suggestion_request_cancelled','document.suggestion_request_stale',
'room_scan.review_required','room_scan.approved','room_scan.rejected','room_scan.quantities_ready'));
ALTER TABLE notifications DROP CONSTRAINT notifications_entity_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_entity_type_check CHECK(entity_type IN('task','project','invoice','payment','expense','document','room_scan'));

INSERT INTO permissions(code,description)VALUES
('room_scans.create','Create room scans'),('room_scans.read','Read room scans'),('room_scans.capture','Capture room scans'),('room_scans.edit','Edit room scans'),
('room_scans.review','Review room scans'),('room_scans.approve','Approve room scans'),('room_scans.cancel','Cancel room scans'),('room_scans.quantities.read','Read approved scan quantities')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE
(r.code='tenant_admin'AND p.code LIKE 'room_scans.%')OR
(r.code='project_manager'AND p.code LIKE 'room_scans.%')OR
(r.code='employee'AND p.code IN('room_scans.create','room_scans.read','room_scans.capture','room_scans.edit','room_scans.quantities.read'))OR
(r.code='read_only'AND p.code IN('room_scans.read','room_scans.quantities.read'))ON CONFLICT DO NOTHING;
