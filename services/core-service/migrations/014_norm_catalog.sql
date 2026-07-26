CREATE TABLE construction_norms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), code varchar(60) NOT NULL, display_name varchar(300) NOT NULL,
 work_id uuid NOT NULL, description text, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), is_system boolean NOT NULL DEFAULT false,
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,code), UNIQUE(tenant_id,id),
 CONSTRAINT construction_norms_work_fk FOREIGN KEY(tenant_id,work_id) REFERENCES work_items(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_construction_norms_tenant_work_status ON construction_norms(tenant_id,work_id,status,code,id);

CREATE TABLE construction_norm_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), norm_id uuid NOT NULL, material_id uuid NOT NULL,
 quantity numeric(19,6) NOT NULL CHECK(quantity>0), waste_percent numeric(7,4) NOT NULL DEFAULT 0 CHECK(waste_percent BETWEEN 0 AND 100),
 measurement_unit_id uuid NOT NULL, version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,norm_id,material_id),
 CONSTRAINT construction_norm_items_norm_fk FOREIGN KEY(tenant_id,norm_id) REFERENCES construction_norms(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT construction_norm_items_material_fk FOREIGN KEY(tenant_id,material_id) REFERENCES materials(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT construction_norm_items_unit_fk FOREIGN KEY(tenant_id,measurement_unit_id) REFERENCES measurement_units(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_construction_norm_items_tenant_norm ON construction_norm_items(tenant_id,norm_id,material_id,id);
CREATE INDEX idx_construction_norm_items_tenant_material ON construction_norm_items(tenant_id,material_id);
CREATE INDEX idx_construction_norm_items_tenant_unit ON construction_norm_items(tenant_id,measurement_unit_id);

ALTER TABLE construction_norms ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_norms FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_construction_norms ON construction_norms USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
ALTER TABLE construction_norm_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_norm_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_construction_norm_items ON construction_norm_items USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);

INSERT INTO permissions(code,description) VALUES
 ('norm_catalog.read','View construction norms and consumption items'),
 ('norm_catalog.create','Create construction norms and consumption items'),
 ('norm_catalog.update','Update construction norms, lifecycle, and consumption items')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='norm_catalog.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('norm_catalog.create','norm_catalog.update') AND r.code IN ('tenant_admin','project_manager'))
ON CONFLICT DO NOTHING;
