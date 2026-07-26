ALTER TABLE measurement_units ADD CONSTRAINT measurement_units_tenant_id_id_key UNIQUE(tenant_id,id);

CREATE TABLE work_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id),
 code varchar(60) NOT NULL,
 display_name varchar(200) NOT NULL,
 description text,
 parent_id uuid,
 hierarchy_level smallint NOT NULL CHECK(hierarchy_level BETWEEN 0 AND 3),
 sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order BETWEEN 0 AND 1000000),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 is_system boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id),
 updated_by uuid NOT NULL REFERENCES users(id),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,code),
 UNIQUE(tenant_id,id),
 CONSTRAINT work_categories_parent_fk FOREIGN KEY(tenant_id,parent_id) REFERENCES work_categories(tenant_id,id) ON DELETE RESTRICT,
 CHECK(parent_id IS NOT NULL OR hierarchy_level=0)
);
CREATE INDEX idx_work_categories_tenant_parent_order ON work_categories(tenant_id,parent_id,sort_order,code,id);

CREATE TABLE work_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id),
 code varchar(60) NOT NULL,
 display_name varchar(200) NOT NULL,
 short_description varchar(500),
 detailed_description text,
 category_id uuid NOT NULL,
 measurement_unit_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 is_system boolean NOT NULL DEFAULT false,
 quantity_precision smallint NOT NULL DEFAULT 2 CHECK(quantity_precision BETWEEN 0 AND 12),
 internal_notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id),
 updated_by uuid NOT NULL REFERENCES users(id),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,code),
 UNIQUE(tenant_id,id),
 CONSTRAINT work_items_category_fk FOREIGN KEY(tenant_id,category_id) REFERENCES work_categories(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT work_items_unit_fk FOREIGN KEY(tenant_id,measurement_unit_id) REFERENCES measurement_units(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_work_items_tenant_category_status ON work_items(tenant_id,category_id,status,code,id);
CREATE INDEX idx_work_items_tenant_unit ON work_items(tenant_id,measurement_unit_id);

ALTER TABLE work_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_work_categories ON work_categories USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_work_items ON work_items USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);

INSERT INTO permissions(code,description) VALUES
 ('work_catalog.read','View construction work categories and items'),
 ('work_catalog.create','Create construction work categories and items'),
 ('work_catalog.update','Update and activate or deactivate construction work categories and items')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='work_catalog.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('work_catalog.create','work_catalog.update') AND r.code IN ('tenant_admin','project_manager'))
ON CONFLICT DO NOTHING;
