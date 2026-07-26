CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE labor_rates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id),
 work_id uuid NOT NULL,
 country_code char(2) NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'),
 region varchar(200),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 unit_id uuid NOT NULL,
 rate_amount numeric(19,4) NOT NULL CHECK(rate_amount>0),
 effective_from date NOT NULL,
 effective_to date,
 source_type text NOT NULL DEFAULT 'tenant' CHECK(source_type='tenant'),
 is_active boolean NOT NULL DEFAULT true,
 notes text,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,id),
 CONSTRAINT labor_rates_work_fk FOREIGN KEY(tenant_id,work_id) REFERENCES work_items(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT labor_rates_unit_fk FOREIGN KEY(tenant_id,unit_id) REFERENCES measurement_units(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT labor_rates_effective_period_check CHECK(effective_to IS NULL OR effective_to>=effective_from),
 CONSTRAINT labor_rates_active_period_exclusion EXCLUDE USING gist (
  tenant_id WITH =,
  work_id WITH =,
  country_code WITH =,
  (COALESCE(region,'')) WITH =,
  currency WITH =,
  unit_id WITH =,
  (daterange(effective_from,COALESCE(effective_to,'infinity'::date),'[]')) WITH &&
 ) WHERE(is_active)
);

CREATE TABLE labor_rate_system_defaults (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 work_code varchar(60) NOT NULL,
 country_code char(2) NOT NULL CHECK(country_code ~ '^[A-Z]{2}$'),
 region varchar(200),
 currency char(3) NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),
 unit_code varchar(40) NOT NULL,
 rate_amount numeric(19,4) NOT NULL CHECK(rate_amount>0),
 effective_from date NOT NULL,
 effective_to date,
 source_type text NOT NULL DEFAULT 'system_default' CHECK(source_type='system_default'),
 is_active boolean NOT NULL DEFAULT true,
 notes text,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL REFERENCES users(id),
 CONSTRAINT labor_rate_system_defaults_effective_period_check CHECK(effective_to IS NULL OR effective_to>=effective_from),
 CONSTRAINT labor_rate_system_defaults_active_period_exclusion EXCLUDE USING gist (
  work_code WITH =,
  country_code WITH =,
  (COALESCE(region,'')) WITH =,
  currency WITH =,
  unit_code WITH =,
  (daterange(effective_from,COALESCE(effective_to,'infinity'::date),'[]')) WITH &&
 ) WHERE(is_active)
);

CREATE TABLE labor_rate_system_actors (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_labor_rates_tenant_work ON labor_rates(tenant_id,work_id);
CREATE INDEX idx_labor_rates_tenant_country ON labor_rates(tenant_id,country_code);
CREATE INDEX idx_labor_rates_tenant_region ON labor_rates(tenant_id,region);
CREATE INDEX idx_labor_rates_tenant_currency ON labor_rates(tenant_id,currency);
CREATE INDEX idx_labor_rates_tenant_unit ON labor_rates(tenant_id,unit_id);
CREATE INDEX idx_labor_rates_tenant_active ON labor_rates(tenant_id,is_active);
CREATE INDEX idx_labor_rates_tenant_effective_dates ON labor_rates(tenant_id,effective_from,effective_to);
CREATE INDEX idx_labor_rates_matching_rate ON labor_rates(
 tenant_id,work_id,country_code,(COALESCE(region,'')),currency,unit_id,effective_from DESC,effective_to
) WHERE(is_active);
CREATE INDEX idx_labor_rate_system_defaults_matching ON labor_rate_system_defaults(
 work_code,country_code,(COALESCE(region,'')),currency,unit_code,effective_from DESC,effective_to
) WHERE(is_active);
CREATE INDEX idx_labor_rate_system_defaults_active_dates ON labor_rate_system_defaults(is_active,effective_from,effective_to);

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='omnira_labor_rate_system') THEN
  CREATE ROLE omnira_labor_rate_system NOLOGIN;
 END IF;
END $$;
GRANT omnira_labor_rate_system TO CURRENT_USER;

ALTER TABLE labor_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rates FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_labor_rates ON labor_rates
 USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)
 WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);

ALTER TABLE labor_rate_system_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rate_system_defaults FORCE ROW LEVEL SECURITY;
CREATE POLICY labor_rate_system_defaults_read ON labor_rate_system_defaults
 FOR SELECT USING(
  NULLIF(current_setting('app.tenant_id',true),'') IS NOT NULL
  OR (
   pg_has_role(current_user,'omnira_labor_rate_system','member')
   AND current_setting('app.system_context',true)='true'
  )
 );
CREATE POLICY labor_rate_system_defaults_system_insert ON labor_rate_system_defaults
 FOR INSERT WITH CHECK(
  pg_has_role(current_user,'omnira_labor_rate_system','member')
  AND current_setting('app.system_context',true)='true'
 );
CREATE POLICY labor_rate_system_defaults_system_update ON labor_rate_system_defaults
 FOR UPDATE
 USING(
  pg_has_role(current_user,'omnira_labor_rate_system','member')
  AND current_setting('app.system_context',true)='true'
 )
 WITH CHECK(
  pg_has_role(current_user,'omnira_labor_rate_system','member')
  AND current_setting('app.system_context',true)='true'
 );
CREATE POLICY labor_rate_system_defaults_system_delete ON labor_rate_system_defaults
 FOR DELETE USING(
  pg_has_role(current_user,'omnira_labor_rate_system','member')
  AND current_setting('app.system_context',true)='true'
 );

ALTER TABLE labor_rate_system_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_rate_system_actors FORCE ROW LEVEL SECURITY;
CREATE POLICY labor_rate_system_actors_system_read ON labor_rate_system_actors
 FOR SELECT USING(pg_has_role(current_user,'omnira_labor_rate_system','member'));

INSERT INTO permissions(code,description) VALUES
 ('labor_rates.read','View tenant labor rates and global system defaults'),
 ('labor_rates.create','Create tenant labor rates'),
 ('labor_rates.update','Update tenant labor rates'),
 ('labor_rates.activate','Activate tenant labor rates'),
 ('labor_rates.deactivate','Deactivate tenant labor rates'),
 ('labor_rates.system_defaults.read','View global labor rate defaults'),
 ('labor_rates.system_defaults.manage','Manage global labor rate defaults')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code IN ('labor_rates.read','labor_rates.system_defaults.read') AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('labor_rates.create','labor_rates.update','labor_rates.activate','labor_rates.deactivate') AND r.code IN ('tenant_admin','project_manager'))
ON CONFLICT DO NOTHING;
