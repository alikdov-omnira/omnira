import{domainErrors}from"../errors.js";import type{VoiceActor,VoiceMode,VoiceParticipant}from"./voice-bridge-types.js";
const language=/^[a-z]{2,3}(?:-[A-Z]{2})?$/;
export function requireVoice(a:VoiceActor,permission:"voice.use"|"voice.translate"|"voice.command"){if(!a.permissions.includes(permission))throw domainErrors.forbidden()}
export function validateVoiceSession(mode:VoiceMode,participants:VoiceParticipant[]){if(!participants.length||participants.length>8)throw domainErrors.validation("Voice session requires between one and eight participants");for(const p of participants){if(!language.test(p.listeningLanguage)||p.speakingLanguage&&!language.test(p.speakingLanguage))throw domainErrors.validation("Unsupported language code")}}
export function assertAudioChunk(bytes:Buffer,maxBytes:number){if(!bytes.length||bytes.length>maxBytes)throw domainErrors.validation("Voice chunk size is invalid");}
export function languageBase(value:string){return value.split("-")[0].toLowerCase()}
