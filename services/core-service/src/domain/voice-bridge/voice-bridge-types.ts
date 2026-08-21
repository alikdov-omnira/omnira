export const voiceModes=["conversation_translation","voice_command"]as const;
export type VoiceMode=typeof voiceModes[number];
export type VoiceTruth="REAL"|"PARTIAL"|"UNAVAILABLE";
export type VoiceState="active"|"ended";
export type VoiceActor={id:string;tenantId:string;permissions:readonly string[];correlationId:string};
export type VoiceParticipant={userId:string;speakingLanguage?:string;listeningLanguage:string};
export type VoiceSession={id:string;tenantId:string;ownerId:string;participants:VoiceParticipant[];mode:VoiceMode;state:VoiceState;createdAt:string;endedAt?:string;providerTruth:VoiceTruth;chunkCount:number};
export type VoiceFailureCode="MICROPHONE_DENIED"|"MICROPHONE_UNAVAILABLE"|"DEVICE_UNSUPPORTED"|"NETWORK_INTERRUPTED"|"RECOGNITION_UNAVAILABLE"|"TRANSLATION_UNAVAILABLE"|"SYNTHESIS_UNAVAILABLE"|"UNSUPPORTED_LANGUAGE"|"PROVIDER_RATE_LIMIT"|"PROVIDER_TIMEOUT"|"INVALID_CREDENTIALS"|"SESSION_EXPIRED"|"PERMISSION_DENIED"|"CROSS_TENANT_PARTICIPANT"|"CAPABILITY_DISABLED";
