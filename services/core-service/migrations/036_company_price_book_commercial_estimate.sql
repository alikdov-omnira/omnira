ALTER TABLE commercial_estimate_revisions
 ADD COLUMN pricing_authority text NOT NULL DEFAULT 'regional_pricing_v1' CHECK(pricing_authority IN('regional_pricing_v1','company_price_book_v1')),
 ADD COLUMN company_price_book_id uuid,
 ADD COLUMN company_work_item_id uuid,
 ADD COLUMN company_price_book_revision_id uuid,
 ADD COLUMN company_price_book_revision_number integer CHECK(company_price_book_revision_number IS NULL OR company_price_book_revision_number>0),
 ADD COLUMN company_price_book_snapshot_id uuid,
 ADD COLUMN company_price_book_fingerprint char(64) CHECK(company_price_book_fingerprint IS NULL OR company_price_book_fingerprint~'^[0-9a-f]{64}$'),
 ADD CONSTRAINT commercial_estimate_price_book_fk FOREIGN KEY(tenant_id,company_price_book_id) REFERENCES company_price_books(tenant_id,id),
 ADD CONSTRAINT commercial_estimate_company_work_fk FOREIGN KEY(tenant_id,company_work_item_id) REFERENCES work_items(tenant_id,id),
 ADD CONSTRAINT commercial_estimate_price_book_revision_fk FOREIGN KEY(tenant_id,company_price_book_revision_id) REFERENCES company_price_book_revisions(tenant_id,id),
 ADD CONSTRAINT commercial_estimate_price_book_snapshot_fk FOREIGN KEY(tenant_id,company_price_book_snapshot_id) REFERENCES approved_company_price_book_snapshots(tenant_id,id),
 ADD CONSTRAINT commercial_estimate_pricing_authority_check CHECK(
  (pricing_authority='regional_pricing_v1' AND company_price_book_id IS NULL AND company_work_item_id IS NULL AND company_price_book_revision_id IS NULL AND company_price_book_revision_number IS NULL AND company_price_book_snapshot_id IS NULL AND company_price_book_fingerprint IS NULL)
  OR
  (pricing_authority='company_price_book_v1' AND company_price_book_id IS NOT NULL AND company_work_item_id IS NOT NULL AND company_price_book_revision_id IS NOT NULL AND company_price_book_revision_number IS NOT NULL AND company_price_book_snapshot_id IS NOT NULL AND company_price_book_fingerprint IS NOT NULL)
 );

ALTER TABLE commercial_estimate_lines
 ADD COLUMN pricing_provenance jsonb CHECK(pricing_provenance IS NULL OR jsonb_typeof(pricing_provenance)='object');

CREATE INDEX idx_commercial_estimate_company_price_book ON commercial_estimate_revisions(tenant_id,company_price_book_snapshot_id) WHERE company_price_book_snapshot_id IS NOT NULL;
