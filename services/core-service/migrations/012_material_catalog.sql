CREATE TABLE material_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), code varchar(60) NOT NULL, display_name varchar(300) NOT NULL, description text, parent_id uuid,
 hierarchy_level smallint NOT NULL CHECK(hierarchy_level BETWEEN 0 AND 3), sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order BETWEEN 0 AND 1000000),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), is_system boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,code), UNIQUE(tenant_id,id), CONSTRAINT material_categories_parent_fk FOREIGN KEY(tenant_id,parent_id) REFERENCES material_categories(tenant_id,id) ON DELETE RESTRICT,
 CHECK(parent_id IS NOT NULL OR hierarchy_level=0)
);
CREATE INDEX idx_material_categories_tenant_parent_order ON material_categories(tenant_id,parent_id,sort_order,code,id);

CREATE TABLE materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), code varchar(60) NOT NULL, display_name varchar(300) NOT NULL,
 short_description varchar(1000), detailed_description text, category_id uuid NOT NULL, measurement_unit_id uuid NOT NULL, manufacturer_name varchar(300), brand_name varchar(300),
 technical_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(technical_data)='object'), ai_metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(ai_metadata)='object'),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), is_system boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id), version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,code), UNIQUE(tenant_id,id),
 CONSTRAINT materials_category_fk FOREIGN KEY(tenant_id,category_id) REFERENCES material_categories(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT materials_unit_fk FOREIGN KEY(tenant_id,measurement_unit_id) REFERENCES measurement_units(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_materials_tenant_category_status ON materials(tenant_id,category_id,status,code,id);
CREATE INDEX idx_materials_tenant_unit ON materials(tenant_id,measurement_unit_id);
CREATE INDEX idx_materials_tenant_manufacturer ON materials(tenant_id,manufacturer_name);
CREATE INDEX idx_materials_tenant_brand ON materials(tenant_id,brand_name);
CREATE INDEX idx_materials_technical_data ON materials USING gin(technical_data);

ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_material_categories ON material_categories USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_materials ON materials USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);

INSERT INTO permissions(code,description) VALUES
 ('material_catalog.read','View material categories and materials'),
 ('material_catalog.create','Create material categories and materials'),
 ('material_catalog.update','Update and activate or deactivate material categories and materials')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='material_catalog.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('material_catalog.create','material_catalog.update') AND r.code IN ('tenant_admin','project_manager'))
ON CONFLICT DO NOTHING;
