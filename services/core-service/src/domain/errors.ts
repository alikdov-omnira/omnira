export type DomainErrorCode =
  | "VALIDATION_ERROR" | "NOT_FOUND" | "FORBIDDEN" | "VERSION_CONFLICT"
  | "CROSS_TENANT_REFERENCE" | "ENTITY_ARCHIVED" | "INVALID_STATUS_TRANSITION"
  | "INVALID_RELATIONSHIP" | "DUPLICATE_RECORD" | "ASSIGNEE_NOT_ELIGIBLE"
  | "PERSPECTIVE_TRANSFORM_UNSUPPORTED" | "IMAGE_PROCESSING_FAILED";

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
  imageProcessing: (message = "Image processing failed") => new DomainError("IMAGE_PROCESSING_FAILED", 422, message)
};
