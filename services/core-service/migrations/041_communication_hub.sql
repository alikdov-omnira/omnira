CREATE TABLE communication_conversations(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,project_id uuid,client_id uuid,
 subject varchar(300) NOT NULL CHECK(length(trim(subject))>0),status text NOT NULL DEFAULT'open'CHECK(status IN('open','resolved','archived')),
 related_entity_type varchar(80),related_entity_id uuid,version bigint NOT NULL DEFAULT 1 CHECK(version>=1),
 created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 CHECK((related_entity_type IS NULL)=(related_entity_id IS NULL))
);
CREATE TABLE communication_participants(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,conversation_id uuid NOT NULL,
 participant_type text NOT NULL CHECK(participant_type IN('user','client','external')),user_id uuid,client_id uuid,
 display_name varchar(300) NOT NULL,channel text CHECK(channel IN('internal','telegram','email','whatsapp','sms')),
 address varchar(500),resolution_status text NOT NULL DEFAULT'resolved'CHECK(resolution_status IN('resolved','ambiguous','unresolved')),
 version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,conversation_id)REFERENCES communication_conversations(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,user_id)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 CHECK((participant_type='user'AND user_id IS NOT NULL AND client_id IS NULL)OR(participant_type='client'AND client_id IS NOT NULL AND user_id IS NULL)OR(participant_type='external'AND user_id IS NULL AND client_id IS NULL))
);
CREATE TABLE communication_messages(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,conversation_id uuid NOT NULL,sender_actor_id uuid,
 external_sender varchar(500),recipient_resolution jsonb NOT NULL DEFAULT'[]',project_id uuid,client_id uuid,
 related_entity_type varchar(80),related_entity_id uuid,channel text NOT NULL CHECK(channel IN('internal','telegram','email','whatsapp','sms')),
 direction text NOT NULL CHECK(direction IN('inbound','outbound')),subject varchar(500),body text NOT NULL CHECK(length(trim(body))>0),
 original_language varchar(20),translated_body text,translated_language varchar(20),status text NOT NULL CHECK(status IN('DRAFT','READY_FOR_REVIEW','APPROVED_TO_SEND','SENT','DELIVERED','FAILED')),
 provider text,provider_message_id varchar(500),provider_idempotency_key varchar(500),delivered_at timestamptz,read_at timestamptz,error_code varchar(100),error_message varchar(2000),
 provenance jsonb NOT NULL DEFAULT'{}',version bigint NOT NULL DEFAULT 1 CHECK(version>=1),created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid NOT NULL,
 UNIQUE(tenant_id,id),UNIQUE(tenant_id,provider,provider_message_id),UNIQUE(tenant_id,provider,provider_idempotency_key),
 FOREIGN KEY(tenant_id,conversation_id)REFERENCES communication_conversations(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,sender_actor_id)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,project_id)REFERENCES projects(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,client_id)REFERENCES clients(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,updated_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT,CHECK((related_entity_type IS NULL)=(related_entity_id IS NULL)),
 CHECK(translated_body IS NULL OR translated_language IS NOT NULL),CHECK(provider_message_id IS NULL OR provider IS NOT NULL),CHECK(direction='inbound'OR sender_actor_id IS NOT NULL)
);
CREATE TABLE communication_message_attachments(
 tenant_id uuid NOT NULL,message_id uuid NOT NULL,document_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),created_by uuid NOT NULL,
 PRIMARY KEY(tenant_id,message_id,document_id),FOREIGN KEY(tenant_id,message_id)REFERENCES communication_messages(tenant_id,id)ON DELETE CASCADE,
 FOREIGN KEY(tenant_id,document_id)REFERENCES documents(tenant_id,id)ON DELETE RESTRICT,FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT
);
CREATE TABLE communication_provider_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL,provider text NOT NULL,provider_event_id varchar(500) NOT NULL,event_type varchar(100) NOT NULL,
 message_id uuid,received_at timestamptz NOT NULL DEFAULT now(),payload_fingerprint varchar(64) NOT NULL,resolution_status text NOT NULL CHECK(resolution_status IN('resolved','ambiguous','unresolved','duplicate')),
 created_by uuid NOT NULL,UNIQUE(tenant_id,provider,provider_event_id),FOREIGN KEY(tenant_id,message_id)REFERENCES communication_messages(tenant_id,id)ON DELETE RESTRICT,
 FOREIGN KEY(tenant_id,created_by)REFERENCES users(tenant_id,id)ON DELETE RESTRICT
);
CREATE INDEX idx_communication_conversations_scope ON communication_conversations(tenant_id,project_id,client_id,status,updated_at DESC);
CREATE INDEX idx_communication_participants_resolution ON communication_participants(tenant_id,channel,address,resolution_status);
CREATE INDEX idx_communication_messages_thread ON communication_messages(tenant_id,conversation_id,created_at,id);
CREATE INDEX idx_communication_messages_project ON communication_messages(tenant_id,project_id,status,created_at DESC)WHERE project_id IS NOT NULL;
CREATE INDEX idx_communication_messages_delivery ON communication_messages(tenant_id,channel,status,updated_at)WHERE direction='outbound';
CREATE INDEX idx_communication_provider_events_lookup ON communication_provider_events(tenant_id,provider,provider_event_id);
ALTER TABLE communication_conversations ENABLE ROW LEVEL SECURITY;ALTER TABLE communication_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE communication_participants ENABLE ROW LEVEL SECURITY;ALTER TABLE communication_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;ALTER TABLE communication_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE communication_message_attachments ENABLE ROW LEVEL SECURITY;ALTER TABLE communication_message_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE communication_provider_events ENABLE ROW LEVEL SECURITY;ALTER TABLE communication_provider_events FORCE ROW LEVEL SECURITY;
CREATE POLICY communication_conversation_tenant ON communication_conversations USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY communication_participant_tenant ON communication_participants USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY communication_message_tenant ON communication_messages USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY communication_attachment_tenant ON communication_message_attachments USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
CREATE POLICY communication_event_tenant ON communication_provider_events USING(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid)WITH CHECK(tenant_id=NULLIF(current_setting('app.tenant_id',true),'')::uuid);
INSERT INTO permissions(code,description)VALUES
 ('communications.read','Read permitted human communication threads'),('communications.create','Create communication threads and drafts'),
 ('communications.review','Submit and approve outbound communication drafts'),('communications.send','Send human-approved messages through connected providers'),
 ('communications.inbound.manage','Resolve inbound communication context')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('tenant_admin','project_manager','finance_manager')AND p.code IN('communications.read','communications.create','communications.review','communications.send','communications.inbound.manage')ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.code IN('employee','client')AND p.code IN('communications.read','communications.create')ON CONFLICT DO NOTHING;
