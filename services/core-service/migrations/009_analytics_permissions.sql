INSERT INTO permissions(code,description) VALUES
 ('dashboard.read','View authorized dashboard metrics'),
 ('reports.read','View authorized operational reports'),
 ('reports.export','Export authorized reports'),
 ('operational_metrics.read','View operational delivery metrics')
ON CONFLICT(code) DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE
 (r.code='tenant_admin' AND p.code IN ('dashboard.read','reports.read','reports.export','operational_metrics.read'))
 OR (r.code IN ('finance_manager','project_manager','read_only') AND p.code IN ('dashboard.read','reports.read','reports.export'))
 OR (r.code='employee' AND p.code IN ('dashboard.read','reports.read'))
ON CONFLICT DO NOTHING;
