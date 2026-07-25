INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code='finance_manager' AND p.code IN ('notifications.read','notifications.update')
ON CONFLICT DO NOTHING;
