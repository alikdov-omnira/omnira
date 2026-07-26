export const documentTypes=["invoice","receipt","contract","estimate","work_acceptance_act","delivery_note","bank_document","identity_document","letter","other","unknown"] as const;
export type AnalysisDocumentType=typeof documentTypes[number];
export type ExtractedField={name:string;value:string;normalizedValue:string|null;confidence:number;source:"ocr_text"|"metadata"|"manual";pageId:string|null;startOffset:number|null;endOffset:number|null;extractionRule:string;validationStatus:"valid"|"invalid"|"unverified"};
export type TextPage={pageId:string;text:string;startOffset:number;endOffset:number};
export type ClassificationResult={documentType:AnalysisDocumentType;confidence:number;matchedSignals:string[];classifier:string;version:string};
