export interface TranslationRepresentation{originalText:string;originalLanguage?:string;translatedText:string;translatedLanguage:string;providerReference:string;provenance:Record<string,unknown>}
export interface CommunicationTranslationPort{translate(text:string,from:string|undefined,to:string):Promise<TranslationRepresentation>}
