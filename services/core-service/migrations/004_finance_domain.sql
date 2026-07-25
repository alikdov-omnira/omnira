CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','partially_paid','paid','cancelled','archived')),
  currency_code char(3) NOT NULL,
  issue_date date,
  due_date date,
  net_amount numeric(19,4) NOT NULL CHECK(net_amount >= 0),
  vat_rate numeric(7,4) NOT NULL CHECK(vat_rate >= 0 AND vat_rate <= 100),
  vat_amount numeric(19,4) NOT NULL CHECK(vat_amount >= 0),
  gross_amount numeric(19,4) NOT NULL CHECK(gross_amount >= 0),
  paid_amount numeric(19,4) NOT NULL DEFAULT 0 CHECK(paid_amount >= 0 AND paid_amount <= gross_amount),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE RESTRICT, updated_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  deleted_at timestamptz, deleted_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  version bigint NOT NULL DEFAULT 1 CHECK(version > 0),
  UNIQUE(tenant_id,invoice_number),
  CHECK(due_date IS NULL OR issue_date IS NULL OR due_date >= issue_date),
  CHECK(gross_amount = net_amount + vat_amount)
);
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  reference text NOT NULL, currency_code char(3) NOT NULL,
  amount numeric(19,4) NOT NULL CHECK(amount > 0), payment_date date NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','reversed','archived')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE RESTRICT, updated_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  deleted_at timestamptz, deleted_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  version bigint NOT NULL DEFAULT 1 CHECK(version > 0)
);
CREATE TABLE payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount numeric(19,4) NOT NULL CHECK(amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(), created_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(payment_id,invoice_id)
);
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  project_id uuid REFERENCES projects(id) ON DELETE RESTRICT,
  supplier text NOT NULL, category text NOT NULL, expense_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','rejected','archived')),
  currency_code char(3) NOT NULL,
  net_amount numeric(19,4) NOT NULL CHECK(net_amount >= 0),
  vat_rate numeric(7,4) NOT NULL CHECK(vat_rate >= 0 AND vat_rate <= 100),
  vat_amount numeric(19,4) NOT NULL CHECK(vat_amount >= 0),
  gross_amount numeric(19,4) NOT NULL CHECK(gross_amount >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE RESTRICT, updated_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  deleted_at timestamptz, deleted_by uuid REFERENCES users(id) ON DELETE RESTRICT,
  version bigint NOT NULL DEFAULT 1 CHECK(version > 0),
  CHECK(gross_amount = net_amount + vat_amount)
);
CREATE INDEX idx_invoices_tenant_status_due ON invoices(tenant_id,status,due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_tenant_client_project ON invoices(tenant_id,client_id,project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id,payment_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_allocations_tenant_invoice ON payment_allocations(tenant_id,invoice_id);
CREATE INDEX idx_expenses_tenant_project_date ON expenses(tenant_id,project_id,expense_date DESC) WHERE deleted_at IS NULL;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY; ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY; ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY; ALTER TABLE payment_allocations FORCE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY; ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_invoices ON invoices USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_payments ON payments USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_payment_allocations ON payment_allocations USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
CREATE POLICY tenant_expenses ON expenses USING (tenant_id=current_setting('app.tenant_id',true)::uuid) WITH CHECK (tenant_id=current_setting('app.tenant_id',true)::uuid);
