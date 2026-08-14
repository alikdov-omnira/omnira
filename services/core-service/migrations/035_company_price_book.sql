CREATE TABLE company_price_books(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES tenants(id),
 code varchar(80) NOT NULL,
 title varchar(300) NOT NULL,
 purpose varchar(500),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),
 UNIQUE(tenant_id,code),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 FOREIGN KEY(tenant_id,updated_by) REFERENCES users(tenant_id,id)
);

CREATE TABLE company_price_book_revisions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL,
 price_book_id uuid NOT NULL,
 revision_number integer NOT NULL CHECK(revision_number>0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','review_required','ready_for_approval','approved','superseded','cancelled')),
 is_current boolean NOT NULL DEFAULT true,
 currency char(3) NOT NULL CHECK(currency~'^[A-Z]{3}$'),
 effective_from date NOT NULL,
 effective_to date,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 approved_at timestamptz,
 approved_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),
 UNIQUE(tenant_id,price_book_id,revision_number),
 FOREIGN KEY(tenant_id,price_book_id) REFERENCES company_price_books(tenant_id,id),
 FOREIGN KEY(tenant_id,approved_by) REFERENCES users(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 FOREIGN KEY(tenant_id,updated_by) REFERENCES users(tenant_id,id),
 CHECK(effective_to IS NULL OR effective_to>=effective_from),
 CHECK((status='approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR status<>'approved')
);
CREATE UNIQUE INDEX uq_company_price_book_current ON company_price_book_revisions(tenant_id,price_book_id) WHERE is_current;

CREATE TABLE company_price_book_entries(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL,
 revision_id uuid NOT NULL,
 entry_kind text NOT NULL CHECK(entry_kind IN('labor','material')),
 work_item_id uuid,
 material_id uuid,
 measurement_unit_id uuid NOT NULL,
 internal_cost numeric(20,4) NOT NULL CHECK(internal_cost>=0),
 selling_price numeric(20,4) NOT NULL CHECK(selling_price>=0),
 currency char(3) NOT NULL CHECK(currency~'^[A-Z]{3}$'),
 effective_from date NOT NULL,
 effective_to date,
 source_reference varchar(500) NOT NULL,
 notes text,
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),
 created_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),
 FOREIGN KEY(tenant_id,revision_id) REFERENCES company_price_book_revisions(tenant_id,id),
 FOREIGN KEY(tenant_id,work_item_id) REFERENCES work_items(tenant_id,id),
 FOREIGN KEY(tenant_id,material_id) REFERENCES materials(tenant_id,id),
 FOREIGN KEY(tenant_id,measurement_unit_id) REFERENCES measurement_units(tenant_id,id),
 FOREIGN KEY(tenant_id,created_by) REFERENCES users(tenant_id,id),
 FOREIGN KEY(tenant_id,updated_by) REFERENCES users(tenant_id,id),
 CHECK((entry_kind='labor' AND work_item_id IS NOT NULL AND material_id IS NULL) OR (entry_kind='material' AND material_id IS NOT NULL AND work_item_id IS NULL)),
 CHECK(effective_to IS NULL OR effective_to>=effective_from)
);
CREATE UNIQUE INDEX uq_company_price_book_labor_entry ON company_price_book_entries(tenant_id,revision_id,work_item_id,measurement_unit_id) WHERE entry_kind='labor';
CREATE UNIQUE INDEX uq_company_price_book_material_entry ON company_price_book_entries(tenant_id,revision_id,material_id,measurement_unit_id) WHERE entry_kind='material';

CREATE TABLE approved_company_price_book_snapshots(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL,
 price_book_id uuid NOT NULL,
 revision_id uuid NOT NULL,
 revision_number integer NOT NULL,
 content jsonb NOT NULL CHECK(jsonb_typeof(content)='object' AND pg_column_size(content)<=4194304),
 content_fingerprint char(64) NOT NULL,
 schema_version varchar(40) NOT NULL DEFAULT 'company-price-book-v1',
 approved_at timestamptz NOT NULL DEFAULT now(),
 approved_by uuid NOT NULL,
 UNIQUE(tenant_id,id),
 UNIQUE(tenant_id,revision_id),
 FOREIGN KEY(tenant_id,price_book_id) REFERENCES company_price_books(tenant_id,id),
 FOREIGN KEY(tenant_id,revision_id) REFERENCES company_price_book_revisions(tenant_id,id),
 FOREIGN KEY(tenant_id,approved_by) REFERENCES users(tenant_id,id)
);

CREATE FUNCTION protect_approved_company_price_book_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'APPROVED_COMPANY_PRICE_BOOK_SNAPSHOT_IMMUTABLE';END$$;
CREATE TRIGGER immutable_approved_company_price_book_snapshot BEFORE UPDATE OR DELETE ON approved_company_price_book_snapshots FOR EACH ROW EXECUTE FUNCTION protect_approved_company_price_book_snapshot();
CREATE FUNCTION protect_approved_company_price_book_revision() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN
 IF TG_OP='DELETE' AND OLD.status IN('approved','superseded') THEN RAISE EXCEPTION 'APPROVED_COMPANY_PRICE_BOOK_REVISION_IMMUTABLE';END IF;
 IF TG_OP='UPDATE' AND OLD.status IN('approved','superseded') THEN
  IF OLD.status='approved' AND NEW.status='superseded' AND OLD.is_current AND NOT NEW.is_current
   AND NEW.tenant_id=OLD.tenant_id AND NEW.price_book_id=OLD.price_book_id AND NEW.revision_number=OLD.revision_number
   AND NEW.currency=OLD.currency AND NEW.effective_from=OLD.effective_from AND NEW.effective_to IS NOT DISTINCT FROM OLD.effective_to
   AND NEW.version=OLD.version AND NEW.approved_at=OLD.approved_at AND NEW.approved_by=OLD.approved_by
   AND NEW.created_at=OLD.created_at AND NEW.created_by=OLD.created_by
  THEN RETURN NEW;END IF;
  RAISE EXCEPTION 'APPROVED_COMPANY_PRICE_BOOK_REVISION_IMMUTABLE';
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END$$;
CREATE TRIGGER immutable_approved_company_price_book_revision BEFORE UPDATE OR DELETE ON company_price_book_revisions FOR EACH ROW EXECUTE FUNCTION protect_approved_company_price_book_revision();
CREATE FUNCTION protect_approved_company_price_book_content() RETURNS trigger LANGUAGE plpgsql AS $$DECLARE state text;BEGIN SELECT status INTO state FROM company_price_book_revisions WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.revision_id ELSE NEW.revision_id END;IF state IN('approved','superseded') THEN RAISE EXCEPTION 'APPROVED_COMPANY_PRICE_BOOK_IMMUTABLE';END IF;RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;END$$;
CREATE TRIGGER immutable_company_price_book_entries BEFORE INSERT OR UPDATE OR DELETE ON company_price_book_entries FOR EACH ROW EXECUTE FUNCTION protect_approved_company_price_book_content();

DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['company_price_books','company_price_book_revisions','company_price_book_entries','approved_company_price_book_snapshots'] LOOP EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);EXECUTE format('CREATE POLICY tenant_%I ON %I USING(tenant_id=NULLIF(current_setting(''app.tenant_id'',true),'''')::uuid) WITH CHECK(tenant_id=NULLIF(current_setting(''app.tenant_id'',true),'''')::uuid)',t,t);END LOOP;END$$;

CREATE INDEX idx_company_price_books_tenant ON company_price_books(tenant_id,updated_at DESC);
CREATE INDEX idx_company_price_book_revisions_current ON company_price_book_revisions(tenant_id,price_book_id,is_current,status);
CREATE INDEX idx_company_price_book_revisions_effective ON company_price_book_revisions(tenant_id,currency,effective_from,effective_to);
CREATE INDEX idx_company_price_book_entries_resolve ON company_price_book_entries(tenant_id,revision_id,entry_kind,measurement_unit_id,effective_from,effective_to);
CREATE INDEX idx_company_price_book_entries_work ON company_price_book_entries(tenant_id,work_item_id) WHERE entry_kind='labor';
CREATE INDEX idx_company_price_book_entries_material ON company_price_book_entries(tenant_id,material_id) WHERE entry_kind='material';

INSERT INTO permissions(code,description) VALUES
 ('company_price_books.create','Create Company Price Books and revisions'),
 ('company_price_books.read','Read Company Price Books'),
 ('company_price_books.edit','Edit draft Company Price Book revisions'),
 ('company_price_books.review','Review Company Price Book revisions'),
 ('company_price_books.approve','Approve Company Price Book revisions'),
 ('company_price_books.snapshots.read','Read approved Company Price Book snapshots')
ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code IN('tenant_admin','project_manager','finance_manager') AND p.code LIKE 'company_price_books.%')
   OR (r.code='employee' AND p.code='company_price_books.read')
   OR (r.code='read_only' AND p.code IN('company_price_books.read','company_price_books.snapshots.read'))
ON CONFLICT DO NOTHING;
