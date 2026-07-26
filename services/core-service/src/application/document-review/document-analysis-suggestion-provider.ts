import type{AnalysisDocumentType,ExtractedField}from"../../domain/document-analysis/analysis-types.js";import type{DocumentSuggestion}from"../../domain/document-review/document-review-types.js";
export type SuggestionInput={documentId:string;documentType:AnalysisDocumentType;fields:ExtractedField[];maxItems:number;timeoutMs:number};
export type SuggestionResult={suggestions:DocumentSuggestion[]};
export interface DocumentAnalysisSuggestionProvider{readonly name:string;readonly version:string;suggest(input:SuggestionInput):Promise<SuggestionResult>;}
