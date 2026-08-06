ALTER TABLE room_scan_attachments ADD COLUMN display_name varchar(300);
ALTER TABLE room_scan_attachments ADD COLUMN sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order>=0);
CREATE INDEX idx_room_scan_attachments_gallery ON room_scan_attachments(tenant_id,scan_id,sort_order,associated_at)WHERE removed_at IS NULL;

CREATE TABLE room_scan_fact_reviews(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,scan_id uuid NOT NULL,
 entity_type text NOT NULL CHECK(entity_type IN('measurement','surface','opening','observation')),
 entity_id uuid NOT NULL,decision text NOT NULL CHECK(decision IN('confirmed','rejected','correction_required')),
 comment varchar(2000),reviewed_by uuid NOT NULL,reviewed_at timestamptz NOT NULL DEFAULT now(),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,scan_id)REFERENCES room_scan_sessions(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,reviewed_by)REFERENCES users(tenant_id,id)
);
CREATE INDEX idx_room_scan_fact_reviews_timeline ON room_scan_fact_reviews(tenant_id,scan_id,reviewed_at DESC);
ALTER TABLE room_scan_fact_reviews ENABLE ROW LEVEL SECURITY;ALTER TABLE room_scan_fact_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_room_scan_fact_reviews ON room_scan_fact_reviews USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
