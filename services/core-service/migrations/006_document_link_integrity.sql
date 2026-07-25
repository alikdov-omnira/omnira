CREATE FUNCTION enforce_document_version_tenant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM documents d WHERE d.id=NEW.document_id AND d.tenant_id=NEW.tenant_id) THEN RAISE EXCEPTION 'document version tenant mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER document_version_tenant_guard BEFORE INSERT OR UPDATE ON document_versions FOR EACH ROW EXECUTE FUNCTION enforce_document_version_tenant();
CREATE FUNCTION enforce_document_link_tenant() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_ok boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM documents d WHERE d.id=NEW.document_id AND d.tenant_id=NEW.tenant_id) THEN RAISE EXCEPTION 'document link tenant mismatch' USING ERRCODE='23514'; END IF;
 CASE NEW.entity_type
  WHEN 'client' THEN SELECT EXISTS(SELECT 1 FROM clients WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  WHEN 'property' THEN SELECT EXISTS(SELECT 1 FROM properties WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  WHEN 'project' THEN SELECT EXISTS(SELECT 1 FROM projects WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  WHEN 'task' THEN SELECT EXISTS(SELECT 1 FROM tasks WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  WHEN 'invoice' THEN SELECT EXISTS(SELECT 1 FROM invoices WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  WHEN 'payment' THEN SELECT EXISTS(SELECT 1 FROM payments WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  WHEN 'expense' THEN SELECT EXISTS(SELECT 1 FROM expenses WHERE id=NEW.entity_id AND tenant_id=NEW.tenant_id) INTO target_ok;
  ELSE target_ok := false;
 END CASE;
 IF NOT target_ok THEN RAISE EXCEPTION 'document target tenant mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER document_link_tenant_guard BEFORE INSERT OR UPDATE ON document_links FOR EACH ROW EXECUTE FUNCTION enforce_document_link_tenant();
