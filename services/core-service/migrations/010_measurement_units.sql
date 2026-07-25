CREATE TABLE measurement_units (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id),
 code varchar(40) NOT NULL,
 symbol varchar(40) NOT NULL,
 display_name varchar(200) NOT NULL,
 description text,
 dimension text NOT NULL CHECK(dimension IN ('length','area','volume','mass','time','count','packaging','custom')),
 unit_system text NOT NULL CHECK(unit_system IN ('metric','imperial','universal','custom')),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 decimal_precision smallint NOT NULL DEFAULT 4 CHECK(decimal_precision BETWEEN 0 AND 12),
 canonical_base_code varchar(40),
 base_multiplier numeric(30,15) CHECK(base_multiplier IS NULL OR base_multiplier>0),
 is_system boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id),
 updated_by uuid NOT NULL REFERENCES users(id),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0),
 UNIQUE(tenant_id,code),
 CHECK((base_multiplier IS NULL AND canonical_base_code IS NULL) OR (base_multiplier IS NOT NULL AND canonical_base_code IS NOT NULL))
);
CREATE INDEX idx_measurement_units_tenant_dimension_system ON measurement_units(tenant_id,dimension,unit_system,status);
ALTER TABLE measurement_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_units FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_measurement_units ON measurement_units
 USING(tenant_id=current_setting('app.tenant_id',true)::uuid)
 WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);

INSERT INTO permissions(code,description) VALUES
 ('measurement_units.read','View and convert measurement units'),
 ('measurement_units.create','Create tenant measurement units'),
 ('measurement_units.update','Update and activate or deactivate measurement units')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='measurement_units.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('measurement_units.create','measurement_units.update') AND r.code IN ('tenant_admin','project_manager'))
ON CONFLICT DO NOTHING;
