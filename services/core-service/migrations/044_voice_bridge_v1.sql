INSERT INTO permissions(code,description)VALUES
 ('voice.use','Use the ephemeral OMNIRO Voice Bridge'),
 ('voice.translate','Translate live speech through the Voice Bridge'),
 ('voice.command','Send recognized text to the permission-bound AI Secretary')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN('tenant_admin','project_manager','employee','finance_manager','client')
AND p.code IN('voice.use','voice.translate','voice.command')
ON CONFLICT DO NOTHING;

-- Voice Bridge is intentionally stateless. No audio, transcript, waveform,
-- synthesized audio, or conversation archive table may be introduced here.
