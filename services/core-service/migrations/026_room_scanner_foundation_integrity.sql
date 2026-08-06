-- Phase 0 assumes existing scan/project pairs already reflect projects.property_id.
ALTER TABLE projects ADD CONSTRAINT projects_tenant_id_id_property_room_scan_unique UNIQUE(tenant_id,id,property_id);
ALTER TABLE room_scan_sessions ADD CONSTRAINT room_scan_project_property_fk
 FOREIGN KEY(tenant_id,project_id,property_id)REFERENCES projects(tenant_id,id,property_id)NOT VALID;
ALTER TABLE room_scan_sessions VALIDATE CONSTRAINT room_scan_project_property_fk;

ALTER TABLE room_scan_surfaces ADD CONSTRAINT room_scan_surfaces_tenant_scan_room_id_unique UNIQUE(tenant_id,scan_id,room_id,id);
ALTER TABLE room_scan_quantities ADD CONSTRAINT room_scan_quantities_room_fk
 FOREIGN KEY(tenant_id,scan_id,room_id)REFERENCES room_scan_rooms(tenant_id,scan_id,id)NOT VALID;
ALTER TABLE room_scan_quantities ADD CONSTRAINT room_scan_quantities_surface_fk
 FOREIGN KEY(tenant_id,scan_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,id)NOT VALID;
ALTER TABLE room_scan_quantities VALIDATE CONSTRAINT room_scan_quantities_room_fk;
ALTER TABLE room_scan_quantities VALIDATE CONSTRAINT room_scan_quantities_surface_fk;
ALTER TABLE room_scan_openings ADD CONSTRAINT room_scan_openings_room_surface_fk
 FOREIGN KEY(tenant_id,scan_id,room_id,surface_id)REFERENCES room_scan_surfaces(tenant_id,scan_id,room_id,id)NOT VALID;
ALTER TABLE room_scan_openings VALIDATE CONSTRAINT room_scan_openings_room_surface_fk;

CREATE FUNCTION validate_room_scan_entity_ownership()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.surface_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM room_scan_surfaces s WHERE s.tenant_id=NEW.tenant_id AND s.scan_id=NEW.scan_id AND s.id=NEW.surface_id AND(NEW.room_id IS NULL OR s.room_id=NEW.room_id)
 )THEN RAISE EXCEPTION 'ROOM_SCAN_ENTITY_ASSOCIATION_INVALID';END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER validate_room_scan_measurement_ownership BEFORE INSERT OR UPDATE OF tenant_id,scan_id,room_id,surface_id ON room_scan_measurements FOR EACH ROW EXECUTE FUNCTION validate_room_scan_entity_ownership();
CREATE TRIGGER validate_room_scan_observation_ownership BEFORE INSERT OR UPDATE OF tenant_id,scan_id,room_id,surface_id ON room_scan_observations FOR EACH ROW EXECUTE FUNCTION validate_room_scan_entity_ownership();
CREATE TRIGGER validate_room_scan_quantity_ownership BEFORE INSERT OR UPDATE OF tenant_id,scan_id,room_id,surface_id ON room_scan_quantities FOR EACH ROW EXECUTE FUNCTION validate_room_scan_entity_ownership();

CREATE TABLE room_scan_attachments(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,room_id uuid,file_object_id uuid NOT NULL,
 purpose text NOT NULL CHECK(purpose IN('capture','measurement','observation','plan','technical_specification')),
 associated_at timestamptz NOT NULL DEFAULT now(),associated_by uuid NOT NULL,removed_at timestamptz,removed_by uuid,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),UNIQUE(tenant_id,id),UNIQUE(tenant_id,scan_id,file_object_id),
 FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,scan_id,room_id)REFERENCES room_scan_rooms(tenant_id,scan_id,id),
 FOREIGN KEY(tenant_id,file_object_id)REFERENCES file_objects(tenant_id,id),
 FOREIGN KEY(tenant_id,associated_by)REFERENCES users(tenant_id,id),FOREIGN KEY(tenant_id,removed_by)REFERENCES users(tenant_id,id),
 CHECK((removed_at IS NULL AND removed_by IS NULL)OR(removed_at IS NOT NULL AND removed_by IS NOT NULL))
);
CREATE UNIQUE INDEX uq_room_scan_attachment_active_file ON room_scan_attachments(tenant_id,file_object_id)WHERE removed_at IS NULL;
CREATE INDEX idx_room_scan_attachments_owner ON room_scan_attachments(tenant_id,scan_id,room_id)WHERE removed_at IS NULL;

CREATE FUNCTION validate_room_scan_attachment_reference()RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.attachment_file_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM room_scan_attachments a WHERE a.tenant_id=NEW.tenant_id AND a.scan_id=NEW.scan_id AND a.file_object_id=NEW.attachment_file_id AND a.removed_at IS NULL AND(a.room_id IS NULL OR NEW.room_id=a.room_id)
 )THEN RAISE EXCEPTION 'ROOM_SCAN_ATTACHMENT_ASSOCIATION_INVALID';END IF;
 RETURN NEW;
END$$;
CREATE TRIGGER validate_room_scan_measurement_attachment BEFORE INSERT OR UPDATE OF tenant_id,scan_id,room_id,attachment_file_id ON room_scan_measurements FOR EACH ROW EXECUTE FUNCTION validate_room_scan_attachment_reference();
CREATE TRIGGER validate_room_scan_observation_attachment BEFORE INSERT OR UPDATE OF tenant_id,scan_id,room_id,attachment_file_id ON room_scan_observations FOR EACH ROW EXECUTE FUNCTION validate_room_scan_attachment_reference();

CREATE TABLE room_scan_processing_requests(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,scan_version bigint NOT NULL CHECK(scan_version>=1),
 idempotency_key varchar(120) NOT NULL,status text NOT NULL DEFAULT'queued'CHECK(status IN('queued','processing','completed','failed')),
 requested_by uuid NOT NULL,requested_at timestamptz NOT NULL DEFAULT now(),started_at timestamptz,completed_at timestamptz,failed_at timestamptz,
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),failure_code varchar(120),result jsonb,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),UNIQUE(tenant_id,id),UNIQUE(tenant_id,scan_id,idempotency_key),
 FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,FOREIGN KEY(tenant_id,requested_by)REFERENCES users(tenant_id,id),
 CHECK(jsonb_typeof(COALESCE(result,'{}'::jsonb))='object'),
 CHECK((status='queued'AND started_at IS NULL AND completed_at IS NULL AND failed_at IS NULL AND failure_code IS NULL)OR
       (status='processing'AND started_at IS NOT NULL AND completed_at IS NULL AND failed_at IS NULL AND failure_code IS NULL)OR
       (status='completed'AND started_at IS NOT NULL AND completed_at IS NOT NULL AND failed_at IS NULL AND failure_code IS NULL)OR
       (status='failed'AND started_at IS NOT NULL AND completed_at IS NULL AND failed_at IS NOT NULL AND failure_code IS NOT NULL))
);
CREATE INDEX idx_room_scan_processing_queue ON room_scan_processing_requests(tenant_id,status,requested_at);
CREATE INDEX idx_room_scan_processing_scan ON room_scan_processing_requests(tenant_id,scan_id,scan_version);

ALTER TABLE room_scan_attachments ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE room_scan_processing_requests ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_processing_requests FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_room_scan_attachments ON room_scan_attachments USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY tenant_room_scan_processing ON room_scan_processing_requests USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
