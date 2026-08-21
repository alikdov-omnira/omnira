import type{VoiceTruth}from"../../domain/voice-bridge/voice-bridge-types.js";
export type RecognitionResult={text:string;detectedLanguage:string;providerReference:string};
export type TranslationResult={text:string;sourceLanguage:string;targetLanguage:string;providerReference:string;machineTranslation:true};
export type SynthesisResult={audio:Buffer;contentType:string;providerReference:string};
export interface SpeechRecognitionProvider{readonly id:string;readonly truth:VoiceTruth;readonly reason:string;recognize(input:{audio:Buffer;contentType:string;language?:string}):Promise<RecognitionResult>}
export interface TranslationProvider{readonly id:string;readonly truth:VoiceTruth;readonly reason:string;translate(input:{text:string;sourceLanguage:string;targetLanguage:string}):Promise<TranslationResult>}
export interface SpeechSynthesisProvider{readonly id:string;readonly truth:VoiceTruth;readonly reason:string;synthesize(input:{text:string;language:string}):Promise<SynthesisResult>}
export type VoiceProviders={recognition:SpeechRecognitionProvider;translation:TranslationProvider;synthesis:SpeechSynthesisProvider};
export class VoiceProviderRegistry{constructor(private providers:VoiceProviders){}get(){return this.providers}status(){return Object.entries(this.providers).map(([capability,p])=>({capability,id:p.id,truth:p.truth,reason:p.reason}))}}
class UnavailableProvider{readonly id="unavailable";readonly truth="UNAVAILABLE"as const;readonly reason="Official voice provider credentials are not configured.";async recognize():Promise<never>{throw new Error("RECOGNITION_UNAVAILABLE")}async translate():Promise<never>{throw new Error("TRANSLATION_UNAVAILABLE")}async synthesize():Promise<never>{throw new Error("SYNTHESIS_UNAVAILABLE")}}
export function unavailableVoiceRegistry(){const p=new UnavailableProvider();return new VoiceProviderRegistry({recognition:p,translation:p,synthesis:p})}
