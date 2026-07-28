import type{AnalysisDocumentType,ExtractedField}from"../../domain/document-analysis/analysis-types.js";import type{DocumentSuggestion}from"../../domain/document-review/document-review-types.js";
export type SuggestionEvidence={pageNumber:number;startOffset:number;endOffset:number;excerptHash?:string};
export type ProviderSuggestion=DocumentSuggestion&{reasonCode?:string;evidence?:SuggestionEvidence[]};
export type SuggestionInput={documentId?:string;documentType:AnalysisDocumentType;fields:ExtractedField[];pages?:Array<{pageNumber:number;text:string;textHash:string}>;maxItems:number;timeoutMs:number;signal?:AbortSignal};
export type SuggestionResult={suggestions:ProviderSuggestion[];usage?:{inputTokens:number;outputTokens:number;totalTokens:number}};
export interface DocumentAnalysisSuggestionProvider{readonly name:string;readonly version:string;suggest(input:SuggestionInput):Promise<SuggestionResult>;}
