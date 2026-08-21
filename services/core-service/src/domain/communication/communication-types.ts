export const communicationChannels=["internal","telegram","email","whatsapp","sms"]as const;export type CommunicationChannel=typeof communicationChannels[number];
export const messageStatuses=["DRAFT","READY_FOR_REVIEW","APPROVED_TO_SEND","SENT","DELIVERED","FAILED"]as const;export type MessageStatus=typeof messageStatuses[number];
export type ProviderTruth="REAL"|"PARTIAL"|"UNAVAILABLE";
export type CommunicationActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
