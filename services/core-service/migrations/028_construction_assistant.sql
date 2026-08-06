CREATE TABLE construction_weather_forecasts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid NOT NULL,
 source text NOT NULL,source_reference text NOT NULL,location_label text NOT NULL,forecast_at timestamptz NOT NULL,
 temperature_c numeric(6,2),humidity_percent numeric(5,2) CHECK(humidity_percent BETWEEN 0 AND 100),
 precipitation_probability numeric(5,2) CHECK(precipitation_probability BETWEEN 0 AND 1),
 precipitation_mm numeric(8,2) CHECK(precipitation_mm>=0),wind_speed_mps numeric(8,2) CHECK(wind_speed_mps>=0),
 condition text,verified_at timestamptz NOT NULL,ingested_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(tenant_id,project_id,source,source_reference,forecast_at),
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,ingested_by)REFERENCES users(tenant_id,id)
);
CREATE TABLE room_scan_photo_condition_tags(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,attachment_id uuid NOT NULL,
 condition text NOT NULL CHECK(condition IN('wet_wall','crack','dry','painted','prepared','damaged','completed')),
 note varchar(2000),marked_by uuid NOT NULL,marked_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,attachment_id)REFERENCES room_scan_attachments(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,marked_by)REFERENCES users(tenant_id,id),UNIQUE(tenant_id,attachment_id,condition)
);
ALTER TABLE room_scan_attachments ADD CONSTRAINT uq_room_scan_attachment_scan UNIQUE(tenant_id,scan_id,id);
ALTER TABLE room_scan_photo_condition_tags ADD CONSTRAINT fk_photo_condition_scan_attachment FOREIGN KEY(tenant_id,scan_id,attachment_id)REFERENCES room_scan_attachments(tenant_id,scan_id,id)ON DELETE CASCADE;
CREATE TABLE construction_assistant_recommendations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid NOT NULL,
 recommendation_key text NOT NULL,risk_type text NOT NULL,severity text NOT NULL CHECK(severity IN('info','warning','high','critical')),
 probability numeric(5,2) NOT NULL CHECK(probability BETWEEN 0 AND 1),impact text NOT NULL,
 happened text NOT NULL,reason text NOT NULL,evidence jsonb NOT NULL,recommendation text NOT NULL,next_step text NOT NULL,
 confidence numeric(5,2) NOT NULL CHECK(confidence BETWEEN 0 AND 1),data_sources jsonb NOT NULL,
 status text NOT NULL DEFAULT 'open' CHECK(status IN('open','accepted','dismissed','deferred')),
 analysed_at timestamptz NOT NULL DEFAULT now(),analysed_by uuid NOT NULL,
 decided_at timestamptz,decided_by uuid,decision_comment varchar(2000),
 FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id),FOREIGN KEY(tenant_id,analysed_by)REFERENCES users(tenant_id,id),
 FOREIGN KEY(tenant_id,decided_by)REFERENCES users(tenant_id,id)
);
CREATE INDEX idx_assistant_project ON construction_assistant_recommendations(tenant_id,project_id,analysed_at DESC);
CREATE INDEX idx_weather_project ON construction_weather_forecasts(tenant_id,project_id,forecast_at);
CREATE INDEX idx_photo_condition_scan ON room_scan_photo_condition_tags(tenant_id,scan_id,marked_at DESC);
ALTER TABLE notifications DROP CONSTRAINT notifications_event_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_event_type_check CHECK(event_type IN('task.assigned','task.due_soon','task.overdue','task.completed','project.started','project.paused','project.completed','invoice.issued','invoice.due_soon','invoice.overdue','invoice.paid','payment.received','expense.approved','expense.rejected','document.uploaded','document.version_created','document.archived','construction_assistant.risk_detected'));
CREATE OR REPLACE FUNCTION notify_important_construction_risk()RETURNS trigger LANGUAGE plpgsql AS $$BEGIN
 IF NEW.severity IN('high','critical')THEN INSERT INTO notifications(tenant_id,recipient_user_id,event_type,title,body,severity,entity_type,entity_id,action_url,deduplication_key,source_event_id,metadata)VALUES(NEW.tenant_id,NEW.analysed_by,'construction_assistant.risk_detected','Construction risk: '||replace(NEW.risk_type,'_',' '),NEW.reason,CASE WHEN NEW.severity='critical'THEN'critical'ELSE'warning'END,'project',NEW.project_id,'/construction/projects/'||NEW.project_id||'?assistant=1','assistant-risk:'||NEW.id,NEW.id,jsonb_build_object('recommendationId',NEW.id,'probability',NEW.probability,'confidence',NEW.confidence));END IF;RETURN NEW;END$$;
CREATE TRIGGER notify_important_construction_risk AFTER INSERT ON construction_assistant_recommendations FOR EACH ROW EXECUTE FUNCTION notify_important_construction_risk();
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['construction_weather_forecasts','room_scan_photo_condition_tags','construction_assistant_recommendations']LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);EXECUTE format('CREATE POLICY tenant_%I ON %I USING(tenant_id=NULLIF(current_setting(''app.tenant_id'',true),'''')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting(''app.tenant_id'',true),'''')::uuid)',t,t);END LOOP;END$$;
INSERT INTO permissions(code,description)VALUES('construction_assistant.read','Read construction assistant analysis'),('construction_assistant.analyze','Run verified construction analysis'),('construction_assistant.decide','Record a human recommendation decision'),('construction_assistant.weather.manage','Ingest verified weather forecasts')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code='construction_assistant.read'AND r.code IN('tenant_admin','project_manager','employee','read_only')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE p.code IN('construction_assistant.analyze','construction_assistant.decide','construction_assistant.weather.manage')AND r.code IN('tenant_admin','project_manager')ON CONFLICT DO NOTHING;
