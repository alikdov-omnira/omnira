ALTER TABLE projects ADD CONSTRAINT projects_tenant_id_id_unique UNIQUE(tenant_id,id);

CREATE TABLE estimates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), project_id uuid NOT NULL, code varchar(60) NOT NULL,
 display_name varchar(300) NOT NULL, currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','archived')),
 total_labor numeric(19,4) NOT NULL DEFAULT 0 CHECK(total_labor>=0), total_materials numeric(19,4) NOT NULL DEFAULT 0 CHECK(total_materials>=0),
 total_cost numeric(19,4) NOT NULL DEFAULT 0 CHECK(total_cost=total_labor+total_materials), notes text,
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,code), UNIQUE(tenant_id,id),
 CONSTRAINT estimates_project_fk FOREIGN KEY(tenant_id,project_id) REFERENCES projects(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_estimates_tenant_project_status ON estimates(tenant_id,project_id,status,code,id);

CREATE TABLE estimate_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), estimate_id uuid NOT NULL, work_id uuid NOT NULL,
 quantity numeric(19,6) NOT NULL CHECK(quantity>0), measurement_unit_id uuid NOT NULL, norm_id uuid NOT NULL,
 labor_cost numeric(19,4) NOT NULL DEFAULT 0 CHECK(labor_cost>=0), material_cost numeric(19,4) NOT NULL DEFAULT 0 CHECK(material_cost>=0),
 total_cost numeric(19,4) NOT NULL DEFAULT 0 CHECK(total_cost=labor_cost+material_cost),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,estimate_id,work_id,norm_id),
 CONSTRAINT estimate_items_estimate_fk FOREIGN KEY(tenant_id,estimate_id) REFERENCES estimates(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT estimate_items_work_fk FOREIGN KEY(tenant_id,work_id) REFERENCES work_items(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT estimate_items_unit_fk FOREIGN KEY(tenant_id,measurement_unit_id) REFERENCES measurement_units(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT estimate_items_norm_fk FOREIGN KEY(tenant_id,norm_id) REFERENCES construction_norms(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_estimate_items_tenant_estimate ON estimate_items(tenant_id,estimate_id,work_id,id);

CREATE TABLE estimate_materials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), estimate_item_id uuid NOT NULL, material_id uuid NOT NULL,
 quantity numeric(19,6) NOT NULL CHECK(quantity>0), unit_price numeric(19,4) NOT NULL CHECK(unit_price>=0),
 total_price numeric(19,4) NOT NULL CHECK(total_price>=0), price_list_id uuid NOT NULL,
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,estimate_item_id,material_id),
 CONSTRAINT estimate_materials_item_fk FOREIGN KEY(tenant_id,estimate_item_id) REFERENCES estimate_items(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT estimate_materials_material_fk FOREIGN KEY(tenant_id,material_id) REFERENCES materials(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT estimate_materials_price_list_fk FOREIGN KEY(tenant_id,price_list_id) REFERENCES price_lists(tenant_id,id) ON DELETE RESTRICT
);
CREATE INDEX idx_estimate_materials_tenant_item ON estimate_materials(tenant_id,estimate_item_id,material_id,id);
CREATE INDEX idx_estimate_materials_tenant_price_list ON estimate_materials(tenant_id,price_list_id);

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY; ALTER TABLE estimates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_estimates ON estimates USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY; ALTER TABLE estimate_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_estimate_items ON estimate_items USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
ALTER TABLE estimate_materials ENABLE ROW LEVEL SECURITY; ALTER TABLE estimate_materials FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_estimate_materials ON estimate_materials USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);

INSERT INTO permissions(code,description) VALUES
 ('estimate.read','View estimates and calculation breakdowns'),('estimate.create','Create estimates and estimate items'),('estimate.update','Update, recalculate, and transition estimates')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='estimate.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('estimate.create','estimate.update') AND r.code IN ('tenant_admin','project_manager'))
ON CONFLICT DO NOTHING;
