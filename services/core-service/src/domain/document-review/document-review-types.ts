import type{AnalysisDocumentType,ExtractedField}from"../document-analysis/analysis-types.js";
export const reviewStatuses=["not_started","in_review","changes_requested","approved","rejected"]as const;export type DocumentReviewStatus=typeof reviewStatuses[number];
export const fieldOperations=["set","remove"]as const;export type FieldOperation=typeof fieldOperations[number];
export type ReviewFieldChange={id:string;fieldName:string;operation:FieldOperation;previousValue:string|null;proposedValue:string|null;normalizedValue:string|null;source:"manual";pageId:string|null;startOffset:number|null;endOffset:number|null;validationStatus:"valid"|"invalid"|"unverified";createdAt:Date|string};
export type ReviewClassificationChange={id:string;previousDocumentType:AnalysisDocumentType;proposedDocumentType:AnalysisDocumentType;createdAt:Date|string};
export type EffectiveReviewResult={documentType:AnalysisDocumentType;fields:ExtractedField[]};
export type SuggestionType="field_correction"|"classification_correction"|"missing_field";
export type DocumentSuggestion={type:SuggestionType;fieldName?:string;suggestedValue?:string;suggestedDocumentType?:AnalysisDocumentType;confidence:number};
