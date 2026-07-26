import type {OcrLanguage} from "../../domain/ocr/ocr-rules.js";
export type OcrProviderResult={rawText:string;confidence:number|null;detectedLanguage:string|null;providerVersion:string|null;metadata:Record<string,unknown>};
export interface OcrProvider{
 readonly name:string;
 recognize(input:{bytes:Buffer;languages:OcrLanguage[];timeoutMs:number;maxCharacters:number}):Promise<OcrProviderResult>;
 close():Promise<void>;
}
