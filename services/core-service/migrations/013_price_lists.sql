CREATE TABLE price_lists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), code varchar(60) NOT NULL, display_name varchar(300) NOT NULL, description text,
 currency char(3) NOT NULL, country char(2) NOT NULL, region varchar(200), valid_from date NOT NULL, valid_to date,
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')), is_system boolean NOT NULL DEFAULT false,
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,code), UNIQUE(tenant_id,id), CHECK(valid_to IS NULL OR valid_to>=valid_from),
 CHECK(currency ~ '^[A-Z]{3}$'), CHECK(country ~ '^[A-Z]{2}$')
);
CREATE INDEX idx_price_lists_tenant_status_validity ON price_lists(tenant_id,status,valid_from,valid_to);
CREATE INDEX idx_price_lists_tenant_country_currency ON price_lists(tenant_id,country,currency);

CREATE TABLE price_list_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), price_list_id uuid NOT NULL, material_id uuid NOT NULL,
 unit_price numeric(19,4) NOT NULL CHECK(unit_price>=0), vat_rate numeric(7,4) NOT NULL DEFAULT 0 CHECK(vat_rate BETWEEN 0 AND 100),
 discount_percent numeric(7,4) NOT NULL DEFAULT 0 CHECK(discount_percent BETWEEN 0 AND 100), currency char(3) NOT NULL,
 valid_from date NOT NULL, valid_to date, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
 version bigint NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL REFERENCES users(id), updated_by uuid NOT NULL REFERENCES users(id),
 UNIQUE(tenant_id,id), UNIQUE(tenant_id,price_list_id,material_id,valid_from),
 CONSTRAINT price_list_items_list_fk FOREIGN KEY(tenant_id,price_list_id) REFERENCES price_lists(tenant_id,id) ON DELETE RESTRICT,
 CONSTRAINT price_list_items_material_fk FOREIGN KEY(tenant_id,material_id) REFERENCES materials(tenant_id,id) ON DELETE RESTRICT,
 CHECK(valid_to IS NULL OR valid_to>=valid_from), CHECK(currency ~ '^[A-Z]{3}$')
);
CREATE INDEX idx_price_list_items_tenant_list_status ON price_list_items(tenant_id,price_list_id,status,valid_from,valid_to);
CREATE INDEX idx_price_list_items_tenant_material ON price_list_items(tenant_id,material_id,status);

ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_price_lists ON price_lists USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);
ALTER TABLE price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_price_list_items ON price_list_items USING(tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK(tenant_id=current_setting('app.tenant_id',true)::uuid);

INSERT INTO permissions(code,description) VALUES
 ('price_list.read','View price lists and price list items'),
 ('price_list.create','Create price lists and price list items'),
 ('price_list.update','Update and activate or deactivate price lists and price list items')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (p.code='price_list.read' AND r.code IN ('tenant_admin','project_manager','finance_manager','employee','read_only'))
   OR (p.code IN ('price_list.create','price_list.update') AND r.code IN ('tenant_admin','project_manager','finance_manager'))
ON CONFLICT DO NOTHING;
