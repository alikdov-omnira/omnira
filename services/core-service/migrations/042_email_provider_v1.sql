ALTER TABLE communication_messages
 ADD COLUMN provider_thread_id varchar(500);

ALTER TABLE communication_message_attachments
 ADD COLUMN document_version_id uuid;

UPDATE communication_message_attachments a
SET document_version_id=d.current_version_id
FROM documents d
WHERE d.tenant_id=a.tenant_id AND d.id=a.document_id;

ALTER TABLE communication_message_attachments
 ALTER COLUMN document_version_id SET NOT NULL,
 ADD CONSTRAINT communication_attachment_document_version_fk
 FOREIGN KEY(tenant_id,document_version_id)REFERENCES document_versions(tenant_id,id)ON DELETE RESTRICT;

CREATE INDEX idx_communication_messages_provider_thread
 ON communication_messages(tenant_id,provider,provider_thread_id)
 WHERE provider_thread_id IS NOT NULL;

CREATE INDEX idx_communication_attachments_version
 ON communication_message_attachments(tenant_id,document_id,document_version_id);
