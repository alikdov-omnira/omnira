export type DomainErrorCode =
  | "VALIDATION_ERROR" | "NOT_FOUND" | "FORBIDDEN" | "VERSION_CONFLICT"
  | "CROSS_TENANT_REFERENCE" | "ENTITY_ARCHIVED" | "INVALID_STATUS_TRANSITION"
  | "INVALID_RELATIONSHIP" | "DUPLICATE_RECORD" | "ASSIGNEE_NOT_ELIGIBLE"
  | "PERSPECTIVE_TRANSFORM_UNSUPPORTED" | "IMAGE_PROCESSING_FAILED"
  | "OCR_INPUT_NOT_AVAILABLE" | "OCR_UNSUPPORTED_MIME" | "OCR_LANGUAGE_NOT_SUPPORTED"
  | "OCR_PROVIDER_UNAVAILABLE" | "OCR_PROCESSING_FAILED" | "OCR_TIMEOUT" | "OCR_OUTPUT_INVALID"
  | "OCR_JOB_ALREADY_ACTIVE" | "OCR_JOB_NOT_FOUND" | "OCR_RESULT_NOT_FOUND" | "OCR_JOB_VERSION_CONFLICT"
  | "ANALYSIS_INPUT_NOT_AVAILABLE" | "ANALYSIS_PROCESSING_FAILED" | "ANALYSIS_TIMEOUT" | "ANALYSIS_OUTPUT_INVALID"
  | "ANALYSIS_JOB_ALREADY_ACTIVE" | "ANALYSIS_JOB_NOT_FOUND" | "ANALYSIS_RESULT_NOT_FOUND" | "ANALYSIS_JOB_VERSION_CONFLICT"
  | "REVIEW_NOT_FOUND" | "REVIEW_INPUT_NOT_AVAILABLE" | "REVIEW_ALREADY_ACTIVE" | "REVIEW_ALREADY_APPROVED" | "REVIEW_VERSION_CONFLICT"
  | "REVIEW_FIELD_INVALID" | "REVIEW_CLASSIFICATION_INVALID" | "REVIEW_VALIDATION_FAILED" | "REVIEW_LIMIT_EXCEEDED" | "REVIEW_REASON_INVALID"
  | "APPROVED_DATA_NOT_FOUND" | "SUGGESTION_NOT_FOUND" | "SUGGESTION_VERSION_CONFLICT" | "SUGGESTION_TIMEOUT" | "SUGGESTION_OUTPUT_INVALID"
  | "AI_REQUEST_NOT_FOUND"|"AI_REQUEST_VERSION_CONFLICT"|"AI_REQUEST_LIMIT_EXCEEDED"|"AI_REQUEST_STALE"|"AI_REQUEST_CANCELLED"|"AI_PROVIDER_TIMEOUT"|"AI_PROVIDER_RATE_LIMITED"|"AI_PROVIDER_UNAVAILABLE"|"AI_PROVIDER_AUTH_FAILED"|"AI_PROVIDER_INVALID_RESPONSE"|"AI_PROVIDER_SCHEMA_ERROR"|"AI_PROVIDER_REQUEST_REJECTED"
  | "TECHNICAL_ASSIGNMENT_NOT_FOUND"|"TECHNICAL_ASSIGNMENT_INVALID_TRANSITION"|"TECHNICAL_ASSIGNMENT_NOT_READY"|"TECHNICAL_ASSIGNMENT_ALREADY_APPROVED"|"TECHNICAL_ASSIGNMENT_CANCELLED"|"TECHNICAL_ASSIGNMENT_SUPERSEDED"|"TECHNICAL_ASSIGNMENT_BLOCKING_ITEM_UNRESOLVED"|"TECHNICAL_ASSIGNMENT_REJECTED_REQUIREMENT"|"TECHNICAL_ASSIGNMENT_INVALID_APPLICABILITY"|"TECHNICAL_ASSIGNMENT_INVALID_STATEMENT"|"TECHNICAL_ASSIGNMENT_SNAPSHOT_INVALID"
  | "DESIGN_PROJECT_NOT_FOUND"|"DESIGN_PROJECT_INVALID_TRANSITION"|"DESIGN_PROJECT_NOT_READY"|"DESIGN_PROJECT_ALREADY_APPROVED"|"DESIGN_PROJECT_CANCELLED"|"DESIGN_PROJECT_SUPERSEDED"|"DESIGN_PROJECT_BLOCKING_ITEM_UNRESOLVED"|"DESIGN_PROJECT_REJECTED_DECISION"|"DESIGN_PROJECT_AMBIGUOUS_SELECTION"|"DESIGN_PROJECT_INVALID_APPLICABILITY"|"DESIGN_PROJECT_INVALID_DECISION"|"DESIGN_PROJECT_SOURCE_SNAPSHOT_INVALID"|"DESIGN_PROJECT_SOURCE_FINGERPRINT_MISMATCH"|"DESIGN_PROJECT_TECHNICAL_ASSIGNMENT_CONFLICT"|"DESIGN_PROJECT_SNAPSHOT_INVALID"|"DESIGN_PROJECT_REFERENCE_INVALID"
  | "ROOM_SCAN_PROJECT_PROPERTY_MISMATCH"|"ROOM_SCAN_ATTACHMENT_INVALID"|"ROOM_SCAN_ENTITY_ASSOCIATION_INVALID"|"ROOM_SCAN_PROCESSING_STALE";

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, public readonly statusCode: number, message: string, public readonly details: Record<string, unknown> = {}) { super(message); }
}

export const domainErrors = {
  validation: (message: string, details: Record<string, unknown> = {}) => new DomainError("VALIDATION_ERROR", 400, message, details),
  notFound: () => new DomainError("NOT_FOUND", 404, "Record not found"),
  forbidden: () => new DomainError("FORBIDDEN", 403, "Permission denied"),
  conflict: () => new DomainError("VERSION_CONFLICT", 409, "Record was changed by another request"),
  crossTenant: () => new DomainError("CROSS_TENANT_REFERENCE", 422, "Referenced record is outside the current tenant"),
  archived: () => new DomainError("ENTITY_ARCHIVED", 409, "Archived records cannot be changed"),
  duplicate: (message = "Duplicate record") => new DomainError("DUPLICATE_RECORD", 409, message),
  transition: () => new DomainError("INVALID_STATUS_TRANSITION", 422, "Invalid status transition"),
  perspectiveUnsupported: () => new DomainError("PERSPECTIVE_TRANSFORM_UNSUPPORTED", 422, "Perspective transformation is not supported by the configured image processor"),
  imageProcessing: (message = "Image processing failed") => new DomainError("IMAGE_PROCESSING_FAILED", 422, message),
  ocr: (code:Extract<DomainErrorCode,`OCR_${string}`>,statusCode:number,message:string) => new DomainError(code,statusCode,message),
  analysis: (code:Extract<DomainErrorCode,`ANALYSIS_${string}`>,statusCode:number,message:string) => new DomainError(code,statusCode,message),
  review: (code:Extract<DomainErrorCode,`REVIEW_${string}`|`APPROVED_${string}`|`SUGGESTION_${string}`|`AI_${string}`>,statusCode:number,message:string) => new DomainError(code,statusCode,message),
  technicalAssignment:(code:Extract<DomainErrorCode,`TECHNICAL_ASSIGNMENT_${string}`>,statusCode:number,message:string,details:Record<string,unknown>={})=>new DomainError(code,statusCode,message,details),
  designProject:(code:Extract<DomainErrorCode,`DESIGN_PROJECT_${string}`>,statusCode:number,message:string,details:Record<string,unknown>={})=>new DomainError(code,statusCode,message,details)
};
