export type Uuid = string;

export interface RequestContext {
  requestId: string;
  correlationId: string;
  tenantId?: Uuid;
  companyId?: Uuid;
  subjectId?: Uuid;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: { requestId: string; correlationId: string };
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  requestId: string;
}

import { z } from "zod";
export const ClientTypeSchema=z.enum(["individual","company"]);
export const ClientStatusSchema=z.enum(["active","inactive","archived"]);
export const ClientSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),clientType:ClientTypeSchema,name:z.string(),legalName:z.string().nullable(),taxId:z.string().nullable(),email:z.string().nullable(),phone:z.string().nullable(),status:ClientStatusSchema,notes:z.string().nullable(),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),archivedAt:z.union([z.string(),z.date()]).nullable()});
export const CreateClientRequestSchema=z.object({tenantId:z.never().optional(),clientType:ClientTypeSchema.default("company"),name:z.string().trim().min(1).max(300),legalName:z.string().trim().max(300).optional(),taxId:z.string().trim().max(128).optional(),email:z.string().trim().email().optional(),phone:z.string().trim().max(40).optional(),notes:z.string().max(5000).optional()}).strict();
export const UpdateClientRequestSchema=CreateClientRequestSchema.partial().extend({expectedVersion:z.number().int().positive(),status:ClientStatusSchema.optional()}).strict();
export const ClientListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),status:ClientStatusSchema.optional(),clientType:ClientTypeSchema.optional(),sortBy:z.enum(["name","status","clientType","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const ClientIdParamsSchema=z.object({id:z.string().uuid()});
export const ArchiveClientRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const PaginationSchema=z.object({page:z.number().int(),pageSize:z.number().int(),total:z.number().int(),totalPages:z.number().int()});
export const ClientDetailResponseSchema=z.object({data:ClientSchema});
export const ClientListResponseSchema=z.object({data:z.array(ClientSchema),pagination:PaginationSchema});
export const StructuredErrorSchema=z.object({error:z.object({code:z.string(),message:z.string(),details:z.record(z.unknown()),correlationId:z.string()})});
export type CreateClientRequest=z.input<typeof CreateClientRequestSchema>;
export type UpdateClientRequest=z.infer<typeof UpdateClientRequestSchema>;
export type ClientContract=z.infer<typeof ClientSchema>;

export const PropertyStatusSchema=z.enum(["active","under_maintenance","inactive","archived"]);
export const PropertyAddressSchema=z.object({line1:z.string(),city:z.string(),postalCode:z.string().nullable(),countryCode:z.string().length(2)});
export const PropertySchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),clientId:z.string().uuid(),addressId:z.string().uuid(),name:z.string(),propertyType:z.string(),status:PropertyStatusSchema,description:z.string().nullable(),address:PropertyAddressSchema,version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),archivedAt:z.union([z.string(),z.date()]).nullable()});
export const CreatePropertyRequestSchema=z.object({tenantId:z.never().optional(),clientId:z.string().uuid(),name:z.string().trim().min(1).max(300),propertyType:z.string().trim().min(1).max(100),status:z.enum(["active","under_maintenance","inactive"]).default("active"),description:z.string().max(10000).optional(),address:z.object({line1:z.string().trim().min(1).max(500),city:z.string().trim().min(1).max(200),postalCode:z.string().trim().max(40).optional(),countryCode:z.string().trim().length(2).transform(value=>value.toUpperCase())}).strict()}).strict();
export const UpdatePropertyRequestSchema=z.object({tenantId:z.never().optional(),expectedVersion:z.number().int().positive(),clientId:z.string().uuid().optional(),name:z.string().trim().min(1).max(300).optional(),propertyType:z.string().trim().min(1).max(100).optional(),status:z.enum(["active","under_maintenance","inactive"]).optional(),description:z.string().max(10000).nullable().optional(),address:z.object({line1:z.string().trim().min(1).max(500).optional(),city:z.string().trim().min(1).max(200).optional(),postalCode:z.string().trim().max(40).nullable().optional(),countryCode:z.string().trim().length(2).transform(value=>value.toUpperCase()).optional()}).strict().optional()}).strict();
export const PropertyListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),clientId:z.string().uuid().optional(),status:PropertyStatusSchema.optional(),propertyType:z.string().trim().max(100).optional(),sortBy:z.enum(["name","status","propertyType","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const PropertyIdParamsSchema=z.object({id:z.string().uuid()});
export const ArchivePropertyRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const PropertyDetailResponseSchema=z.object({data:PropertySchema});
export const PropertyListResponseSchema=z.object({data:z.array(PropertySchema),pagination:PaginationSchema});
export type CreatePropertyRequest=z.input<typeof CreatePropertyRequestSchema>;
export type UpdatePropertyRequest=z.infer<typeof UpdatePropertyRequestSchema>;
export type PropertyContract=z.infer<typeof PropertySchema>;

export const ProjectStatusSchema=z.enum(["draft","planned","active","paused","completed","cancelled","archived"]);
export const ProjectPaymentStatusSchema=z.enum(["not_required","not_invoiced","partially_invoiced","invoiced","partially_paid","paid","overdue"]);
const ProjectDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const ProjectMoneySchema=z.number().finite().nonnegative();
export const ProjectSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),clientId:z.string().uuid(),propertyId:z.string().uuid(),financialOwnerLegalEntityId:z.string().uuid(),projectManagerId:z.string().uuid().nullable(),projectNumber:z.string(),name:z.string(),description:z.string().nullable(),status:ProjectStatusSchema,startDate:ProjectDateSchema.nullable(),expectedCompletionDate:ProjectDateSchema.nullable(),actualCompletionDate:ProjectDateSchema.nullable(),currencyCode:z.string().length(3),estimatedBudget:z.string().nullable(),approvedBudget:z.string().nullable(),contractValue:z.string().nullable(),paymentStatus:ProjectPaymentStatusSchema,billingCustomerReference:z.string().nullable(),externalPaymentCustomerReference:z.string().nullable(),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),archivedAt:z.union([z.string(),z.date()]).nullable()});
export const CreateProjectRequestSchema=z.object({tenantId:z.never().optional(),clientId:z.string().uuid(),propertyId:z.string().uuid(),financialOwnerLegalEntityId:z.string().uuid(),projectManagerId:z.string().uuid().nullable().optional(),projectNumber:z.string().trim().min(1).max(100),name:z.string().trim().min(1).max(300),description:z.string().max(10000).optional(),startDate:ProjectDateSchema.optional(),expectedCompletionDate:ProjectDateSchema.optional(),currencyCode:z.string().trim().length(3).transform(value=>value.toUpperCase()),estimatedBudget:ProjectMoneySchema.optional(),approvedBudget:ProjectMoneySchema.optional(),contractValue:ProjectMoneySchema.optional(),paymentStatus:ProjectPaymentStatusSchema.default("not_required"),billingCustomerReference:z.string().trim().max(300).optional(),externalPaymentCustomerReference:z.string().trim().max(300).optional()}).strict();
export const UpdateProjectRequestSchema=z.object({tenantId:z.never().optional(),expectedVersion:z.number().int().positive(),clientId:z.string().uuid().optional(),propertyId:z.string().uuid().optional(),financialOwnerLegalEntityId:z.string().uuid().optional(),projectManagerId:z.string().uuid().nullable().optional(),projectNumber:z.string().trim().min(1).max(100).optional(),name:z.string().trim().min(1).max(300).optional(),description:z.string().max(10000).nullable().optional(),startDate:ProjectDateSchema.nullable().optional(),expectedCompletionDate:ProjectDateSchema.nullable().optional(),currencyCode:z.string().trim().length(3).transform(value=>value.toUpperCase()).optional(),estimatedBudget:ProjectMoneySchema.nullable().optional(),approvedBudget:ProjectMoneySchema.nullable().optional(),contractValue:ProjectMoneySchema.nullable().optional(),paymentStatus:ProjectPaymentStatusSchema.optional(),billingCustomerReference:z.string().trim().max(300).nullable().optional(),externalPaymentCustomerReference:z.string().trim().max(300).nullable().optional()}).strict();
export const ProjectListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),status:ProjectStatusSchema.optional(),propertyId:z.string().uuid().optional(),clientId:z.string().uuid().optional(),projectManagerId:z.string().uuid().optional(),sortBy:z.enum(["projectNumber","name","status","startDate","expectedCompletionDate","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const ProjectIdParamsSchema=z.object({id:z.string().uuid()});
export const ProjectVersionRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const ProjectDetailResponseSchema=z.object({data:ProjectSchema});
export const ProjectListResponseSchema=z.object({data:z.array(ProjectSchema),pagination:PaginationSchema});
export type CreateProjectRequest=z.input<typeof CreateProjectRequestSchema>;
export type UpdateProjectRequest=z.infer<typeof UpdateProjectRequestSchema>;
export type ProjectContract=z.infer<typeof ProjectSchema>;

export const TaskStatusSchema=z.enum(["todo","in_progress","blocked","completed","cancelled","archived"]);
export const TaskPrioritySchema=z.enum(["low","normal","high","urgent"]);
const TaskDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const TaskAssigneeSchema=z.object({userId:z.string().uuid(),displayName:z.string(),assignedAt:z.union([z.string(),z.date()])});
export const TaskSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),projectId:z.string().uuid(),title:z.string(),description:z.string().nullable(),status:TaskStatusSchema,priority:TaskPrioritySchema,dueDate:TaskDateSchema.nullable(),startedAt:z.union([z.string(),z.date()]).nullable(),completedAt:z.union([z.string(),z.date()]).nullable(),isOverdue:z.boolean(),assignees:z.array(TaskAssigneeSchema),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),archivedAt:z.union([z.string(),z.date()]).nullable()});
export const CreateTaskRequestSchema=z.object({tenantId:z.never().optional(),projectId:z.string().uuid(),title:z.string().trim().min(1).max(500),description:z.string().max(10000).optional(),priority:TaskPrioritySchema.default("normal"),dueDate:TaskDateSchema.optional()}).strict();
export const UpdateTaskRequestSchema=z.object({tenantId:z.never().optional(),expectedVersion:z.number().int().positive(),projectId:z.string().uuid().optional(),title:z.string().trim().min(1).max(500).optional(),description:z.string().max(10000).nullable().optional(),priority:TaskPrioritySchema.optional(),dueDate:TaskDateSchema.nullable().optional()}).strict();
const TaskBooleanQuerySchema=z.preprocess(value=>value==="true"?true:value==="false"?false:value,z.boolean());
export const TaskListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),status:TaskStatusSchema.optional(),priority:TaskPrioritySchema.optional(),projectId:z.string().uuid().optional(),propertyId:z.string().uuid().optional(),clientId:z.string().uuid().optional(),assigneeId:z.string().uuid().optional(),overdue:TaskBooleanQuerySchema.optional(),sortBy:z.enum(["title","status","priority","dueDate","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const TaskIdParamsSchema=z.object({id:z.string().uuid()});
export const TaskAssigneeParamsSchema=z.object({id:z.string().uuid(),userId:z.string().uuid()});
export const TaskVersionRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const AssignTaskRequestSchema=z.object({userId:z.string().uuid(),expectedVersion:z.number().int().positive()}).strict();
export const TaskDetailResponseSchema=z.object({data:TaskSchema});
export const TaskListResponseSchema=z.object({data:z.array(TaskSchema),pagination:PaginationSchema});
export type CreateTaskRequest=z.input<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest=z.infer<typeof UpdateTaskRequestSchema>;
export type TaskContract=z.infer<typeof TaskSchema>;

const FinanceDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const FinanceMoneySchema=z.string().regex(/^(0|[1-9]\d*)(\.\d{1,4})?$/);
export const SignedFinanceDecimalSchema=z.string().regex(/^-?(0|[1-9]\d*)(\.\d{1,4})?$/);
export const CurrencySchema=z.string().regex(/^[A-Z]{3}$/);
export const InvoiceStatusSchema=z.enum(["draft","issued","partially_paid","paid","cancelled","archived"]);
export const PaymentStatusSchema=z.enum(["received","reversed","archived"]);
export const ExpenseStatusSchema=z.enum(["draft","approved","rejected","archived"]);
const FinanceBaseSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),currencyCode:CurrencySchema,version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),archivedAt:z.union([z.string(),z.date()]).nullable()});
export const InvoiceSchema=FinanceBaseSchema.extend({clientId:z.string().uuid(),projectId:z.string().uuid().nullable(),invoiceNumber:z.string(),status:InvoiceStatusSchema,issueDate:FinanceDateSchema.nullable(),dueDate:FinanceDateSchema.nullable(),netAmount:FinanceMoneySchema,vatRate:FinanceMoneySchema,vatAmount:FinanceMoneySchema,grossAmount:FinanceMoneySchema,paidAmount:FinanceMoneySchema,outstandingAmount:FinanceMoneySchema,notes:z.string().nullable()});
export const CreateInvoiceRequestSchema=z.object({tenantId:z.never().optional(),clientId:z.string().uuid(),projectId:z.string().uuid().nullable().optional(),invoiceNumber:z.string().trim().min(1).max(100),currencyCode:CurrencySchema,issueDate:FinanceDateSchema.optional(),dueDate:FinanceDateSchema.optional(),netAmount:FinanceMoneySchema,vatRate:FinanceMoneySchema,notes:z.string().max(10000).optional()}).strict();
export const UpdateInvoiceRequestSchema=z.object({expectedVersion:z.number().int().positive(),clientId:z.string().uuid().optional(),projectId:z.string().uuid().nullable().optional(),invoiceNumber:z.string().trim().min(1).max(100).optional(),currencyCode:CurrencySchema.optional(),issueDate:FinanceDateSchema.nullable().optional(),dueDate:FinanceDateSchema.nullable().optional(),netAmount:FinanceMoneySchema.optional(),vatRate:FinanceMoneySchema.optional(),notes:z.string().max(10000).nullable().optional()}).strict();
export const InvoiceListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),status:InvoiceStatusSchema.optional(),clientId:z.string().uuid().optional(),projectId:z.string().uuid().optional(),currencyCode:CurrencySchema.optional(),overdue:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["invoiceNumber","status","issueDate","dueDate","grossAmount","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const PaymentSchema=FinanceBaseSchema.extend({clientId:z.string().uuid(),reference:z.string(),status:PaymentStatusSchema,amount:FinanceMoneySchema,allocatedAmount:FinanceMoneySchema,unallocatedAmount:FinanceMoneySchema,paymentDate:FinanceDateSchema});
export const CreatePaymentRequestSchema=z.object({tenantId:z.never().optional(),clientId:z.string().uuid(),reference:z.string().trim().min(1).max(200),currencyCode:CurrencySchema,amount:FinanceMoneySchema.refine(v=>v!=="0"),paymentDate:FinanceDateSchema}).strict();
export const PaymentListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),clientId:z.string().uuid().optional(),currencyCode:CurrencySchema.optional(),sortBy:z.enum(["reference","paymentDate","amount","createdAt"]).default("paymentDate"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const AllocatePaymentRequestSchema=z.object({invoiceId:z.string().uuid(),amount:FinanceMoneySchema.refine(v=>v!=="0"),expectedVersion:z.number().int().positive()}).strict();
export const ExpenseSchema=FinanceBaseSchema.extend({projectId:z.string().uuid().nullable(),supplier:z.string(),category:z.string(),expenseDate:FinanceDateSchema,status:ExpenseStatusSchema,netAmount:FinanceMoneySchema,vatRate:FinanceMoneySchema,vatAmount:FinanceMoneySchema,grossAmount:FinanceMoneySchema,notes:z.string().nullable()});
export const CreateExpenseRequestSchema=z.object({tenantId:z.never().optional(),projectId:z.string().uuid().nullable().optional(),supplier:z.string().trim().min(1).max(300),category:z.string().trim().min(1).max(100),expenseDate:FinanceDateSchema,currencyCode:CurrencySchema,netAmount:FinanceMoneySchema,vatRate:FinanceMoneySchema,notes:z.string().max(10000).optional()}).strict();
export const UpdateExpenseRequestSchema=CreateExpenseRequestSchema.omit({tenantId:true}).partial().extend({expectedVersion:z.number().int().positive()}).strict();
export const ExpenseListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),status:ExpenseStatusSchema.optional(),projectId:z.string().uuid().optional(),category:z.string().trim().max(100).optional(),currencyCode:CurrencySchema.optional(),sortBy:z.enum(["supplier","status","expenseDate","grossAmount","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")});
export const FinanceIdParamsSchema=z.object({id:z.string().uuid()});
export const FinanceVersionRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const ArchivePaymentRequestSchema=FinanceVersionRequestSchema;
export const ProjectFinancialSummarySchema=z.object({projectId:z.string().uuid(),currencyCode:CurrencySchema,budget:FinanceMoneySchema.nullable(),invoicedNet:FinanceMoneySchema,invoicedVat:FinanceMoneySchema,invoicedGross:FinanceMoneySchema,paid:FinanceMoneySchema,outstanding:FinanceMoneySchema,expenses:FinanceMoneySchema,grossMarginAmount:SignedFinanceDecimalSchema,grossMarginPercentage:SignedFinanceDecimalSchema.nullable(),overdueInvoiceCount:z.number().int().nonnegative(),overdueInvoiceAmount:FinanceMoneySchema});
export type InvoiceContract=z.infer<typeof InvoiceSchema>; export type PaymentContract=z.infer<typeof PaymentSchema>; export type ExpenseContract=z.infer<typeof ExpenseSchema>;
export type CreateInvoiceRequest=z.infer<typeof CreateInvoiceRequestSchema>; export type UpdateInvoiceRequest=z.infer<typeof UpdateInvoiceRequestSchema>;
export type CreatePaymentRequest=z.infer<typeof CreatePaymentRequestSchema>; export type CreateExpenseRequest=z.infer<typeof CreateExpenseRequestSchema>; export type UpdateExpenseRequest=z.infer<typeof UpdateExpenseRequestSchema>;
export type ProjectFinancialSummary=z.infer<typeof ProjectFinancialSummarySchema>;

export const DocumentCategorySchema=z.enum(["contract","offer","invoice","receipt","project_plan","photo","protocol","permit","correspondence","other"]);
export const DocumentTypeSchema=z.enum(["unknown","invoice","contract","estimate","acceptance_act","receipt","drawing","photo","other"]);
export const DocumentSourceTypeSchema=z.enum(["upload","scanner","import"]);
export const DocumentStatusSchema=z.enum(["active","archived"]);
export const DocumentProcessingStatusSchema=z.enum(["not_requested","pending","processing","completed","failed"]);
export const DocumentEntityTypeSchema=z.enum(["client","property","project","task","invoice","payment","expense"]);
export const DocumentLinkSchema=z.object({id:z.string().uuid(),entityType:DocumentEntityTypeSchema,entityId:z.string().uuid()});
export const DocumentVersionSchema=z.object({id:z.string().uuid(),versionNo:z.number().int().positive(),originalFilename:z.string(),mimeType:z.string(),extension:z.string(),fileSize:z.number().int().positive(),checksum:z.string().length(64),uploadedBy:z.string().uuid(),createdAt:z.union([z.string(),z.date()])});
export const DocumentSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),title:z.string(),documentType:DocumentTypeSchema,sourceType:DocumentSourceTypeSchema,status:DocumentStatusSchema,category:DocumentCategorySchema,description:z.string().nullable(),currentVersionNo:z.number().int().positive(),pageCount:z.number().int().positive().nullable(),ocrStatus:DocumentProcessingStatusSchema,aiProcessingStatus:DocumentProcessingStatusSchema,version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),createdBy:z.string().uuid(),updatedAt:z.union([z.string(),z.date()]),updatedBy:z.string().uuid(),archivedAt:z.union([z.string(),z.date()]).nullable(),currentVersion:DocumentVersionSchema,links:z.array(DocumentLinkSchema)});
export const DocumentUploadMetadataSchema=z.object({tenantId:z.never().optional(),actorId:z.never().optional(),storageKey:z.never().optional(),checksum:z.never().optional(),fileSize:z.never().optional(),uploadedBy:z.never().optional(),title:z.string().trim().min(1).max(300).optional(),documentType:DocumentTypeSchema.default("unknown"),sourceType:DocumentSourceTypeSchema.default("upload"),category:DocumentCategorySchema.optional(),description:z.string().trim().max(5000).optional(),entityType:DocumentEntityTypeSchema.optional(),entityId:z.string().uuid().optional()}).strict().refine(x=>(x.entityType===undefined)===(x.entityId===undefined),{message:"entityType and entityId must be provided together"});
export const UpdateDocumentRequestSchema=z.object({expectedVersion:z.number().int().positive(),title:z.string().trim().min(1).max(300).optional(),documentType:DocumentTypeSchema.optional(),category:DocumentCategorySchema.optional(),description:z.string().trim().max(5000).nullable().optional()}).strict();
export const DocumentVersionUploadMetadataSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const DocumentVersionRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const AddDocumentLinkRequestSchema=z.object({entityType:DocumentEntityTypeSchema,entityId:z.string().uuid(),expectedVersion:z.number().int().positive()}).strict();
export const DocumentLinkParamsSchema=z.object({id:z.string().uuid(),linkId:z.string().uuid()});
export const DocumentListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),documentType:DocumentTypeSchema.optional(),status:DocumentStatusSchema.optional(),ocrStatus:DocumentProcessingStatusSchema.optional(),aiProcessingStatus:DocumentProcessingStatusSchema.optional(),category:DocumentCategorySchema.optional(),mimeType:z.enum(["image/jpeg","image/png","image/webp","application/pdf"]).optional(),uploaderId:z.string().uuid().optional(),entityType:DocumentEntityTypeSchema.optional(),entityId:z.string().uuid().optional(),createdFrom:z.coerce.date().optional(),createdTo:z.coerce.date().optional(),archived:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["filename","title","documentType","category","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")}).refine(x=>!x.entityId||x.entityType,{message:"entityType is required with entityId"});
export const DocumentIdParamsSchema=z.object({id:z.string().uuid()});
export const DocumentVersionParamsSchema=z.object({id:z.string().uuid(),versionId:z.string().uuid()});
export const DocumentPageProcessingStatusSchema=z.enum(["pending","processing","completed","failed"]);
export const DocumentPageContentVariantSchema=z.enum(["source","processed"]);
export const DocumentPageEnhancementPresetSchema=z.enum(["original","document_color","document_grayscale","document_black_white","photo_enhance"]);
export const DocumentPageCropSchema=z.object({left:z.number().int().nonnegative(),top:z.number().int().nonnegative(),width:z.number().int().positive(),height:z.number().int().positive()}).strict();
export const DocumentPagePointSchema=z.object({x:z.number().nonnegative(),y:z.number().nonnegative()}).strict();
export const DocumentPagePerspectiveSchema=z.object({topLeft:DocumentPagePointSchema,topRight:DocumentPagePointSchema,bottomRight:DocumentPagePointSchema,bottomLeft:DocumentPagePointSchema}).strict();
export const DocumentPageResponseSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),documentId:z.string().uuid(),sourceFileObjectId:z.string().uuid(),processedFileObjectId:z.string().uuid().nullable(),pageNumber:z.number().int().positive(),processingStatus:DocumentPageProcessingStatusSchema,processingErrorCode:z.string().nullable(),sourceMimeType:z.enum(["image/jpeg","image/png","image/webp","application/pdf"]),widthPixels:z.number().int().positive().nullable(),heightPixels:z.number().int().positive().nullable(),originalWidthPixels:z.number().int().positive().nullable(),originalHeightPixels:z.number().int().positive().nullable(),rotationDegrees:z.union([z.literal(0),z.literal(90),z.literal(180),z.literal(270)]),enhancementPreset:DocumentPageEnhancementPresetSchema,crop:DocumentPageCropSchema.nullable(),perspective:DocumentPagePerspectiveSchema.nullable(),checksum:z.string().length(64),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),createdBy:z.string().uuid(),updatedAt:z.union([z.string(),z.date()]),updatedBy:z.string().uuid()});
export const AddDocumentPageMultipartSchema=z.object({expectedDocumentVersion:z.coerce.number().int().positive()}).strict();
export const ProcessDocumentPageRequestSchema=z.object({expectedVersion:z.number().int().positive(),rotationDegrees:z.union([z.literal(0),z.literal(90),z.literal(180),z.literal(270)]).default(0),enhancementPreset:DocumentPageEnhancementPresetSchema.default("original"),crop:DocumentPageCropSchema.optional(),perspective:DocumentPagePerspectiveSchema.optional()}).strict();
export const ReorderDocumentPagesRequestSchema=z.object({expectedDocumentVersion:z.number().int().positive(),pageIds:z.array(z.string().uuid()).min(1).max(1000)}).strict();
export const DeleteDocumentPageRequestSchema=z.object({expectedVersion:z.number().int().positive(),expectedDocumentVersion:z.number().int().positive()}).strict();
export const DocumentPageParamsSchema=z.object({documentId:z.string().uuid(),pageId:z.string().uuid()});
export type DocumentContract=z.infer<typeof DocumentSchema>;
export type DocumentPageContract=z.infer<typeof DocumentPageResponseSchema>;
export type DocumentCategory=z.infer<typeof DocumentCategorySchema>;
export type DocumentEntityType=z.infer<typeof DocumentEntityTypeSchema>;

export const NotificationEventTypeSchema=z.enum(["task.assigned","task.due_soon","task.overdue","task.completed","project.started","project.paused","project.completed","invoice.issued","invoice.due_soon","invoice.overdue","invoice.paid","payment.received","expense.approved","expense.rejected","document.uploaded","document.version_created","document.archived"]);
export const NotificationSeveritySchema=z.enum(["info","success","warning","critical"]);
export const NotificationStatusSchema=z.enum(["unread","read","archived"]);
export const NotificationSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),recipientUserId:z.string().uuid(),eventType:NotificationEventTypeSchema,title:z.string(),body:z.string(),severity:NotificationSeveritySchema,entityType:z.enum(["task","project","invoice","payment","expense","document"]),entityId:z.string().uuid(),actionUrl:z.string(),status:NotificationStatusSchema,readAt:z.union([z.string(),z.date()]).nullable(),expiresAt:z.union([z.string(),z.date()]).nullable(),deduplicationKey:z.string(),sourceEventId:z.string().uuid(),metadata:z.record(z.string(),z.unknown()),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()])});
export const NotificationListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),status:NotificationStatusSchema.optional(),severity:NotificationSeveritySchema.optional(),eventType:NotificationEventTypeSchema.optional(),entityType:z.enum(["task","project","invoice","payment","expense","document"]).optional(),createdFrom:z.string().datetime().optional(),createdTo:z.string().datetime().optional(),archived:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["createdAt","severity","status"]).default("createdAt"),sortOrder:z.enum(["asc","desc"]).default("desc")}).strict();
export const NotificationIdParamsSchema=z.object({id:z.string().uuid()});
export const NotificationVersionRequestSchema=z.object({tenantId:z.never().optional(),recipientUserId:z.never().optional(),sourceEventId:z.never().optional(),retry:z.never().optional(),delivery:z.never().optional(),metadata:z.never().optional(),expectedVersion:z.number().int().positive()}).strict();
export const NotificationPreferencesSchema=z.object({tenantId:z.string().uuid(),userId:z.string().uuid(),inAppEnabled:z.boolean(),taskEventsEnabled:z.boolean(),projectEventsEnabled:z.boolean(),financeEventsEnabled:z.boolean(),documentEventsEnabled:z.boolean(),dueSoonEnabled:z.boolean(),overdueEnabled:z.boolean(),selfNotificationsEnabled:z.boolean(),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()])});
export const UpdateNotificationPreferencesSchema=z.object({tenantId:z.never().optional(),userId:z.never().optional(),expectedVersion:z.number().int().positive(),inAppEnabled:z.boolean().optional(),taskEventsEnabled:z.boolean().optional(),projectEventsEnabled:z.boolean().optional(),financeEventsEnabled:z.boolean().optional(),documentEventsEnabled:z.boolean().optional(),dueSoonEnabled:z.boolean().optional(),overdueEnabled:z.boolean().optional(),selfNotificationsEnabled:z.boolean().optional()}).strict();
export const NotificationListResponseSchema=z.object({data:z.array(NotificationSchema),pagination:PaginationSchema});
export const NotificationUnreadCountSchema=z.object({data:z.object({count:z.number().int().nonnegative()})});
export type NotificationContract=z.infer<typeof NotificationSchema>;
export type NotificationPreferencesContract=z.infer<typeof NotificationPreferencesSchema>;

const AnalyticsDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const AnalyticsReportNameSchema=z.enum(["accounts-receivable","revenue","expenses","profitability","tasks","deadlines","workload","documents","activity"]);
export const AnalyticsQuerySchema=z.object({
 range:z.coerce.number().pipe(z.union([z.literal(7),z.literal(30),z.literal(90)])).optional(),
 start:AnalyticsDateSchema.optional(),end:AnalyticsDateSchema.optional(),
 page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),
 sortBy:z.enum(["invoiceNumber","clientName","projectName","issueDate","dueDate","outstanding","status","margin","marginPercentage","title","bucket","displayName","openCount","overdueCount","filename","category","createdAt","occurredAt","action","actorName"]).optional(),sortOrder:z.enum(["asc","desc"]).default("desc"),
 groupBy:z.enum(["month","client","project","category"]).optional(),projectId:z.string().uuid().optional(),clientId:z.string().uuid().optional(),
 userId:z.string().uuid().optional(),actorId:z.string().uuid().optional(),currencyCode:CurrencySchema.optional(),status:z.string().max(40).optional(),category:z.string().max(100).optional(),domain:z.string().trim().max(100).optional(),
 entityType:DocumentEntityTypeSchema.optional(),entityId:z.string().uuid().optional(),
 overdue:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),
 archived:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),
 tenantId:z.never().optional()
}).strict().refine(x=>(x.start&&x.end)||(!x.start&&!x.end),{message:"start and end must be supplied together"});
export const AnalyticsReportParamsSchema=z.object({report:AnalyticsReportNameSchema});
export const AnalyticsRangeSchema=z.object({start:AnalyticsDateSchema,endExclusive:AnalyticsDateSchema,timezone:z.literal("UTC")});
export const CurrencyMetricGroupSchema=z.object({currencyCode:CurrencySchema,invoicedGross:SignedFinanceDecimalSchema,paid:SignedFinanceDecimalSchema,outstanding:SignedFinanceDecimalSchema,overdueReceivables:SignedFinanceDecimalSchema,approvedExpenses:SignedFinanceDecimalSchema,grossMargin:SignedFinanceDecimalSchema,grossMarginPercentage:SignedFinanceDecimalSchema.nullable()});
export const ProjectHealthStateSchema=z.enum(["healthy","attention","at_risk","completed","paused"]);
export const ProjectHealthSchema=z.object({id:z.string().uuid(),projectNumber:z.string(),name:z.string(),status:z.string(),expectedCompletionDate:AnalyticsDateSchema.nullable(),currencyCode:CurrencySchema,overdueTasks:z.number().int().nonnegative(),blockedTasks:z.number().int().nonnegative(),endDatePassed:z.boolean(),overdueReceivables:SignedFinanceDecimalSchema,grossMargin:SignedFinanceDecimalSchema.nullable(),health:z.object({state:ProjectHealthStateSchema,score:z.number().int().min(0).max(100),reasons:z.array(z.string())})});
export const AnalyticsPaginationSchema=PaginationSchema;
export const CsvExportMetadataSchema=z.object({filename:z.string(),rowCount:z.number().int().nonnegative(),contentType:z.literal("text/csv; charset=utf-8"),maxRows:z.number().int().positive()});
export type AnalyticsQuery=z.infer<typeof AnalyticsQuerySchema>;
export type AnalyticsReportName=z.infer<typeof AnalyticsReportNameSchema>;

export const MeasurementDimensionSchema=z.enum(["length","area","volume","mass","time","count","packaging","custom"]);
export const MeasurementUnitSystemSchema=z.enum(["metric","imperial","universal","custom"]);
export const MeasurementUnitStatusSchema=z.enum(["active","inactive"]);
const MeasurementDecimalSchema=z.string().regex(/^(0|[1-9]\d{0,17})(\.\d{1,15})?$/);
const PositiveMeasurementDecimalSchema=MeasurementDecimalSchema.refine(value=>!/^0(?:\.0+)?$/.test(value),{message:"Must be greater than zero"});
export const MeasurementUnitSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),symbol:z.string(),displayName:z.string(),description:z.string().nullable(),dimension:MeasurementDimensionSchema,unitSystem:MeasurementUnitSystemSchema,status:MeasurementUnitStatusSchema,decimalPrecision:z.number().int().min(0).max(12),canonicalBaseCode:z.string().nullable(),baseMultiplier:z.string().nullable(),isSystem:z.boolean(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()});
export const CreateMeasurementUnitRequestSchema=z.object({tenantId:z.never().optional(),code:z.string().trim().min(1).max(40).transform(v=>v.toUpperCase()),symbol:z.string().trim().min(1).max(40),displayName:z.string().trim().min(1).max(200),description:z.string().trim().max(5000).optional(),dimension:MeasurementDimensionSchema,unitSystem:MeasurementUnitSystemSchema,decimalPrecision:z.number().int().min(0).max(12).default(4),canonicalBaseCode:z.string().trim().min(1).max(40).transform(v=>v.toUpperCase()).optional(),baseMultiplier:PositiveMeasurementDecimalSchema.optional()}).strict().refine(x=>(x.canonicalBaseCode===undefined)===(x.baseMultiplier===undefined),{message:"Conversion metadata must be supplied together"});
export const UpdateMeasurementUnitRequestSchema=z.object({expectedVersion:z.number().int().positive(),symbol:z.string().trim().min(1).max(40).optional(),displayName:z.string().trim().min(1).max(200).optional(),description:z.string().trim().max(5000).nullable().optional(),decimalPrecision:z.number().int().min(0).max(12).optional(),canonicalBaseCode:z.string().trim().min(1).max(40).transform(v=>v.toUpperCase()).nullable().optional(),baseMultiplier:PositiveMeasurementDecimalSchema.nullable().optional()}).strict();
export const MeasurementUnitListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),dimension:MeasurementDimensionSchema.optional(),unitSystem:MeasurementUnitSystemSchema.optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["code","symbol","displayName","dimension","unitSystem","status","createdAt","updatedAt"]).default("code"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const MeasurementUnitIdParamsSchema=z.object({id:z.string().uuid()});
export const MeasurementUnitStatusRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const ConvertMeasurementUnitRequestSchema=z.object({fromUnitId:z.string().uuid(),toUnitId:z.string().uuid(),quantity:PositiveMeasurementDecimalSchema,precision:z.number().int().min(0).max(12).optional()}).strict();
export const MeasurementConversionSchema=z.object({quantity:PositiveMeasurementDecimalSchema,fromUnitId:z.string().uuid(),toUnitId:z.string().uuid(),result:MeasurementDecimalSchema,precision:z.number().int().min(0).max(12)});
export type MeasurementUnitContract=z.infer<typeof MeasurementUnitSchema>;
export type CreateMeasurementUnitRequest=z.infer<typeof CreateMeasurementUnitRequestSchema>;
export type UpdateMeasurementUnitRequest=z.infer<typeof UpdateMeasurementUnitRequestSchema>;

export const CatalogStatusSchema=z.enum(["active","inactive"]);
const CatalogCodeSchema=z.string().trim().min(1).max(60).transform(v=>v.toUpperCase());
export const WorkCategorySchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),displayName:z.string(),description:z.string().nullable(),parentId:z.string().uuid().nullable(),hierarchyLevel:z.number().int().min(0).max(3),sortOrder:z.number().int().nonnegative(),status:CatalogStatusSchema,isSystem:z.boolean(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()});
export type WorkCategoryContract=z.infer<typeof WorkCategorySchema>;
export type WorkCategoryNodeContract=WorkCategoryContract&{children:WorkCategoryNodeContract[]};
export const CreateWorkCategoryRequestSchema=z.object({code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(200),description:z.string().trim().max(5000).optional(),parentId:z.string().uuid().nullable().optional(),sortOrder:z.number().int().min(0).max(1000000).default(0)}).strict();
export const UpdateWorkCategoryRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(200).optional(),description:z.string().trim().max(5000).nullable().optional(),sortOrder:z.number().int().min(0).max(1000000).optional()}).strict();
export const MoveWorkCategoryRequestSchema=z.object({expectedVersion:z.number().int().positive(),parentId:z.string().uuid().nullable(),sortOrder:z.number().int().min(0).max(1000000).optional()}).strict();
export const WorkCategoryListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),parentId:z.string().uuid().optional(),rootOnly:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),isSystem:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["code","displayName","sortOrder","status","createdAt","updatedAt"]).default("sortOrder"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const WorkCatalogIdParamsSchema=z.object({id:z.string().uuid()});
export const WorkCatalogStatusRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const WorkItemSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),displayName:z.string(),shortDescription:z.string().nullable(),detailedDescription:z.string().nullable(),categoryId:z.string().uuid(),categoryName:z.string(),measurementUnitId:z.string().uuid(),measurementUnitCode:z.string(),measurementDimension:z.string(),status:CatalogStatusSchema,isSystem:z.boolean(),quantityPrecision:z.number().int().min(0).max(12),internalNotes:z.string().nullable(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()});
export const CreateWorkItemRequestSchema=z.object({code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(200),shortDescription:z.string().trim().max(500).optional(),detailedDescription:z.string().trim().max(10000).optional(),categoryId:z.string().uuid(),measurementUnitId:z.string().uuid(),quantityPrecision:z.number().int().min(0).max(12).default(2),internalNotes:z.string().trim().max(5000).optional()}).strict();
export const UpdateWorkItemRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(200).optional(),shortDescription:z.string().trim().max(500).nullable().optional(),detailedDescription:z.string().trim().max(10000).nullable().optional(),categoryId:z.string().uuid().optional(),measurementUnitId:z.string().uuid().optional(),quantityPrecision:z.number().int().min(0).max(12).optional(),internalNotes:z.string().trim().max(5000).nullable().optional()}).strict();
export const WorkItemListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),categoryId:z.string().uuid().optional(),measurementUnitId:z.string().uuid().optional(),dimension:MeasurementDimensionSchema.optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),isSystem:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["code","displayName","category","measurementUnit","status","createdAt","updatedAt"]).default("code"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export type WorkItemContract=z.infer<typeof WorkItemSchema>;
export type CreateWorkCategoryRequest=z.infer<typeof CreateWorkCategoryRequestSchema>;
export type UpdateWorkCategoryRequest=z.infer<typeof UpdateWorkCategoryRequestSchema>;
export type CreateWorkItemRequest=z.infer<typeof CreateWorkItemRequestSchema>;
export type UpdateWorkItemRequest=z.infer<typeof UpdateWorkItemRequestSchema>;

const JsonObjectSchema=z.record(z.string(),z.unknown());
const MaterialAuditSchema={createdBy:z.string().uuid(),updatedBy:z.string().uuid(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()};
export const MaterialCategorySchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),displayName:z.string(),description:z.string().nullable(),parentId:z.string().uuid().nullable(),hierarchyLevel:z.number().int().min(0).max(3),sortOrder:z.number().int().nonnegative(),status:CatalogStatusSchema,isSystem:z.boolean(),...MaterialAuditSchema});
export type MaterialCategoryContract=z.infer<typeof MaterialCategorySchema>;
export type MaterialCategoryNodeContract=MaterialCategoryContract&{children:MaterialCategoryNodeContract[]};
export const CreateMaterialCategoryRequestSchema=z.object({code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(300),description:z.string().trim().max(5000).optional(),parentId:z.string().uuid().nullable().optional(),sortOrder:z.number().int().min(0).max(1000000).default(0)}).strict();
export const UpdateMaterialCategoryRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(300).optional(),description:z.string().trim().max(5000).nullable().optional(),sortOrder:z.number().int().min(0).max(1000000).optional()}).strict();
export const MoveMaterialCategoryRequestSchema=z.object({expectedVersion:z.number().int().positive(),parentId:z.string().uuid().nullable(),sortOrder:z.number().int().min(0).max(1000000).optional()}).strict();
export const MaterialCategoryListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),parentId:z.string().uuid().optional(),rootOnly:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),isSystem:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["code","displayName","sortOrder","status","createdAt","updatedAt"]).default("sortOrder"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const MaterialCatalogIdParamsSchema=z.object({id:z.string().uuid()});
export const MaterialCatalogStatusRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const MaterialSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),displayName:z.string(),shortDescription:z.string().nullable(),detailedDescription:z.string().nullable(),categoryId:z.string().uuid(),categoryName:z.string(),measurementUnitId:z.string().uuid(),measurementUnitCode:z.string(),measurementDimension:z.string(),manufacturerName:z.string().nullable(),brandName:z.string().nullable(),technicalData:JsonObjectSchema,aiMetadata:JsonObjectSchema,status:CatalogStatusSchema,isSystem:z.boolean(),...MaterialAuditSchema});
export const CreateMaterialRequestSchema=z.object({code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(300),shortDescription:z.string().trim().max(1000).optional(),detailedDescription:z.string().trim().max(10000).optional(),categoryId:z.string().uuid(),measurementUnitId:z.string().uuid(),manufacturerName:z.string().trim().max(300).optional(),brandName:z.string().trim().max(300).optional(),technicalData:JsonObjectSchema.optional(),aiMetadata:JsonObjectSchema.optional()}).strict();
export const UpdateMaterialRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(300).optional(),shortDescription:z.string().trim().max(1000).nullable().optional(),detailedDescription:z.string().trim().max(10000).nullable().optional(),categoryId:z.string().uuid().optional(),measurementUnitId:z.string().uuid().optional(),manufacturerName:z.string().trim().max(300).nullable().optional(),brandName:z.string().trim().max(300).nullable().optional(),technicalData:JsonObjectSchema.optional(),aiMetadata:JsonObjectSchema.optional()}).strict();
export const MaterialListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),categoryId:z.string().uuid().optional(),measurementUnitId:z.string().uuid().optional(),manufacturerName:z.string().trim().max(300).optional(),brandName:z.string().trim().max(300).optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),isSystem:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["code","displayName","category","measurementUnit","manufacturer","brand","status","createdAt","updatedAt"]).default("code"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export type MaterialContract=z.infer<typeof MaterialSchema>;
export type CreateMaterialCategoryRequest=z.infer<typeof CreateMaterialCategoryRequestSchema>;
export type UpdateMaterialCategoryRequest=z.infer<typeof UpdateMaterialCategoryRequestSchema>;
export type CreateMaterialRequest=z.infer<typeof CreateMaterialRequestSchema>;
export type UpdateMaterialRequest=z.infer<typeof UpdateMaterialRequestSchema>;

const PriceDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const PriceCurrencySchema=z.string().trim().regex(/^[A-Za-z]{3}$/).transform(v=>v.toUpperCase());
const CountrySchema=z.string().trim().regex(/^[A-Za-z]{2}$/).transform(v=>v.toUpperCase());
const PriceDecimalSchema=z.string().regex(/^\d+(\.\d{1,4})?$/);
const PriceAuditSchema={createdBy:z.string().uuid(),updatedBy:z.string().uuid(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()};
export const PriceListSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),displayName:z.string(),description:z.string().nullable(),currency:z.string(),country:z.string(),region:z.string().nullable(),validFrom:z.union([z.string(),z.date()]),validTo:z.union([z.string(),z.date()]).nullable(),status:CatalogStatusSchema,isSystem:z.boolean(),...PriceAuditSchema});
export const PriceListItemSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),priceListId:z.string().uuid(),priceListCode:z.string(),materialId:z.string().uuid(),materialCode:z.string(),materialName:z.string(),unitPrice:z.string(),vatRate:z.string(),discountPercent:z.string(),currency:z.string(),validFrom:z.union([z.string(),z.date()]),validTo:z.union([z.string(),z.date()]).nullable(),status:CatalogStatusSchema,...PriceAuditSchema});
export const CreatePriceListRequestSchema=z.object({code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(300),description:z.string().trim().max(5000).optional(),currency:PriceCurrencySchema,country:CountrySchema,region:z.string().trim().max(200).optional(),validFrom:PriceDateSchema,validTo:PriceDateSchema.nullable().optional()}).strict();
export const UpdatePriceListRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(300).optional(),description:z.string().trim().max(5000).nullable().optional(),currency:PriceCurrencySchema.optional(),country:CountrySchema.optional(),region:z.string().trim().max(200).nullable().optional(),validFrom:PriceDateSchema.optional(),validTo:PriceDateSchema.nullable().optional()}).strict();
export const CreatePriceListItemRequestSchema=z.object({priceListId:z.string().uuid(),materialId:z.string().uuid(),unitPrice:PriceDecimalSchema,vatRate:PriceDecimalSchema,discountPercent:PriceDecimalSchema,currency:PriceCurrencySchema,validFrom:PriceDateSchema,validTo:PriceDateSchema.nullable().optional()}).strict();
export const UpdatePriceListItemRequestSchema=z.object({expectedVersion:z.number().int().positive(),unitPrice:PriceDecimalSchema.optional(),vatRate:PriceDecimalSchema.optional(),discountPercent:PriceDecimalSchema.optional(),currency:PriceCurrencySchema.optional(),validFrom:PriceDateSchema.optional(),validTo:PriceDateSchema.nullable().optional()}).strict();
export const PriceListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(300).optional(),currency:PriceCurrencySchema.optional(),country:CountrySchema.optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),validOn:PriceDateSchema.optional(),sortBy:z.enum(["code","displayName","currency","country","validFrom","status","updatedAt"]).default("code"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const PriceListItemQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(300).optional(),priceListId:z.string().uuid().optional(),materialId:z.string().uuid().optional(),currency:PriceCurrencySchema.optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),validOn:PriceDateSchema.optional(),sortBy:z.enum(["material","unitPrice","currency","validFrom","status","updatedAt"]).default("material"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const PriceListIdParamsSchema=z.object({id:z.string().uuid()});
export const PriceListStatusRequestSchema=z.object({expectedVersion:z.number().int().positive(),status:CatalogStatusSchema}).strict();
export type PriceListContract=z.infer<typeof PriceListSchema>;
export type PriceListItemContract=z.infer<typeof PriceListItemSchema>;

const NormDecimalSchema=z.string().regex(/^\d+(\.\d{1,6})?$/);
const NormAuditSchema={createdBy:z.string().uuid(),updatedBy:z.string().uuid(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()};
export const ConstructionNormSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),code:z.string(),displayName:z.string(),workId:z.string().uuid(),workCode:z.string(),workName:z.string(),description:z.string().nullable(),status:CatalogStatusSchema,isSystem:z.boolean(),...NormAuditSchema});
export const ConstructionNormItemSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),normId:z.string().uuid(),normCode:z.string(),materialId:z.string().uuid(),materialCode:z.string(),materialName:z.string(),quantity:z.string(),wastePercent:z.string(),measurementUnitId:z.string().uuid(),measurementUnitCode:z.string(),...NormAuditSchema});
export const CreateConstructionNormRequestSchema=z.object({code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(300),workId:z.string().uuid(),description:z.string().trim().max(5000).optional()}).strict();
export const UpdateConstructionNormRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(300).optional(),workId:z.string().uuid().optional(),description:z.string().trim().max(5000).nullable().optional()}).strict();
export const CreateConstructionNormItemRequestSchema=z.object({normId:z.string().uuid(),materialId:z.string().uuid(),quantity:NormDecimalSchema,wastePercent:NormDecimalSchema,measurementUnitId:z.string().uuid()}).strict();
export const UpdateConstructionNormItemRequestSchema=z.object({expectedVersion:z.number().int().positive(),quantity:NormDecimalSchema.optional(),wastePercent:NormDecimalSchema.optional(),measurementUnitId:z.string().uuid().optional()}).strict();
export const ConstructionNormQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(300).optional(),workId:z.string().uuid().optional(),active:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),isSystem:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["code","displayName","work","status","createdAt","updatedAt"]).default("code"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const ConstructionNormItemQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(300).optional(),normId:z.string().uuid().optional(),materialId:z.string().uuid().optional(),measurementUnitId:z.string().uuid().optional(),sortBy:z.enum(["material","quantity","wastePercent","measurementUnit","updatedAt"]).default("material"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const NormCatalogIdParamsSchema=z.object({id:z.string().uuid()});
export const NormCatalogStatusRequestSchema=z.object({expectedVersion:z.number().int().positive(),status:CatalogStatusSchema}).strict();
export const NormCatalogVersionRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export type ConstructionNormContract=z.infer<typeof ConstructionNormSchema>;
export type ConstructionNormItemContract=z.infer<typeof ConstructionNormItemSchema>;

const EstimateDecimalSchema=z.string().regex(/^\d+(\.\d{1,6})?$/);
const EstimateAuditSchema={createdBy:z.string().uuid(),updatedBy:z.string().uuid(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),version:z.number().int().positive()};
export const EstimateStatusSchema=z.enum(["draft","approved","archived"]);
export const EstimateSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),projectId:z.string().uuid(),projectName:z.string(),code:z.string(),displayName:z.string(),currency:z.string(),status:EstimateStatusSchema,totalLabor:z.string(),totalMaterials:z.string(),totalCost:z.string(),notes:z.string().nullable(),...EstimateAuditSchema});
export const EstimateItemSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),estimateId:z.string().uuid(),workId:z.string().uuid(),workCode:z.string(),workName:z.string(),quantity:z.string(),measurementUnitId:z.string().uuid(),measurementUnitCode:z.string(),normId:z.string().uuid(),normCode:z.string(),laborCost:z.string(),materialCost:z.string(),totalCost:z.string(),...EstimateAuditSchema});
export const EstimateMaterialSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),estimateItemId:z.string().uuid(),materialId:z.string().uuid(),materialCode:z.string(),materialName:z.string(),quantity:z.string(),unitPrice:z.string(),totalPrice:z.string(),priceListId:z.string().uuid(),priceListCode:z.string(),...EstimateAuditSchema});
export const CreateEstimateRequestSchema=z.object({projectId:z.string().uuid(),code:CatalogCodeSchema,displayName:z.string().trim().min(1).max(300),currency:z.string().trim().regex(/^[A-Za-z]{3}$/).transform(v=>v.toUpperCase()),notes:z.string().trim().max(10000).optional()}).strict();
export const UpdateEstimateRequestSchema=z.object({expectedVersion:z.number().int().positive(),displayName:z.string().trim().min(1).max(300).optional(),notes:z.string().trim().max(10000).nullable().optional()}).strict();
export const CreateEstimateItemRequestSchema=z.object({estimateId:z.string().uuid(),workId:z.string().uuid(),quantity:EstimateDecimalSchema,measurementUnitId:z.string().uuid(),priceListId:z.string().uuid(),laborCost:EstimateDecimalSchema}).strict();
export const UpdateEstimateItemRequestSchema=z.object({expectedVersion:z.number().int().positive(),quantity:EstimateDecimalSchema.optional(),priceListId:z.string().uuid(),laborCost:EstimateDecimalSchema.optional()}).strict();
export const UpdateEstimateMaterialRequestSchema=z.object({expectedVersion:z.number().int().positive(),quantity:EstimateDecimalSchema.optional(),unitPrice:EstimateDecimalSchema.optional()}).strict();
export const EstimateQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(300).optional(),projectId:z.string().uuid().optional(),status:EstimateStatusSchema.optional(),sortBy:z.enum(["code","displayName","status","totalCost","createdAt","updatedAt"]).default("code"),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const EstimateChildQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),estimateId:z.string().uuid().optional(),estimateItemId:z.string().uuid().optional(),search:z.string().trim().max(300).optional(),sortOrder:z.enum(["asc","desc"]).default("asc")}).strict();
export const EstimateIdParamsSchema=z.object({id:z.string().uuid()});
export const EstimateStatusRequestSchema=z.object({expectedVersion:z.number().int().positive(),status:EstimateStatusSchema}).strict();
export type EstimateContract=z.infer<typeof EstimateSchema>;
export type EstimateItemContract=z.infer<typeof EstimateItemSchema>;
export type EstimateMaterialContract=z.infer<typeof EstimateMaterialSchema>;

const LaborRateDateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const LaborRateCountrySchema=z.string().trim().regex(/^[A-Za-z]{2}$/).transform(value=>value.toUpperCase());
const LaborRateCurrencySchema=z.string().trim().regex(/^[A-Za-z]{3}$/).transform(value=>value.toUpperCase());
const LaborRateDecimalSchema=z.string().regex(/^\d{1,15}(\.\d{1,4})?$/);
const LaborRateRegionSchema=z.string().trim().max(200);
const LaborRateNotesSchema=z.string().trim().max(10000);
const LaborRateCodeSchema=z.string().trim().min(1).max(60).regex(/^[A-Z0-9][A-Z0-9_-]*$/);
export const LaborRateSourceTypeSchema=z.enum(["tenant","system_default"]);
export const LaborRateSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),sourceType:LaborRateSourceTypeSchema,workId:z.string().uuid(),workCode:z.string().optional(),countryCode:z.string(),region:z.string().nullable(),currency:z.string(),unitId:z.string().uuid(),unitCode:z.string().optional(),rateAmount:z.string(),effectiveFrom:z.string(),effectiveTo:z.string().nullable(),isActive:z.boolean(),notes:z.string().nullable(),version:z.number().int().positive(),createdAt:z.string(),createdBy:z.string().uuid(),updatedAt:z.string(),updatedBy:z.string().uuid()});
export const CreateLaborRateRequestSchema=z.object({workId:z.string().uuid(),countryCode:LaborRateCountrySchema,region:LaborRateRegionSchema.nullable().optional(),currency:LaborRateCurrencySchema,unitId:z.string().uuid(),rateAmount:LaborRateDecimalSchema,effectiveFrom:LaborRateDateSchema,effectiveTo:LaborRateDateSchema.nullable().optional(),notes:LaborRateNotesSchema.nullable().optional()}).strict();
export const CreateSystemLaborRateRequestSchema=z.object({workCode:LaborRateCodeSchema,countryCode:LaborRateCountrySchema,region:LaborRateRegionSchema.nullable().optional(),currency:LaborRateCurrencySchema,unitCode:LaborRateCodeSchema.max(40),rateAmount:LaborRateDecimalSchema,effectiveFrom:LaborRateDateSchema,effectiveTo:LaborRateDateSchema.nullable().optional(),notes:LaborRateNotesSchema.nullable().optional()}).strict();
export const UpdateLaborRateRequestSchema=z.object({expectedVersion:z.number().int().positive(),workId:z.string().uuid().optional(),countryCode:LaborRateCountrySchema.optional(),region:LaborRateRegionSchema.nullable().optional(),currency:LaborRateCurrencySchema.optional(),unitId:z.string().uuid().optional(),rateAmount:LaborRateDecimalSchema.optional(),effectiveFrom:LaborRateDateSchema.optional(),effectiveTo:LaborRateDateSchema.nullable().optional(),notes:LaborRateNotesSchema.nullable().optional()}).strict();
export const UpdateSystemLaborRateRequestSchema=z.object({expectedVersion:z.number().int().positive(),countryCode:LaborRateCountrySchema.optional(),region:LaborRateRegionSchema.nullable().optional(),currency:LaborRateCurrencySchema.optional(),rateAmount:LaborRateDecimalSchema.optional(),effectiveFrom:LaborRateDateSchema.optional(),effectiveTo:LaborRateDateSchema.nullable().optional(),notes:LaborRateNotesSchema.nullable().optional()}).strict();
export const LaborRateLifecycleRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const ResolveLaborRateRequestSchema=z.object({workId:z.string().uuid(),countryCode:LaborRateCountrySchema,region:LaborRateRegionSchema.nullable().optional(),currency:LaborRateCurrencySchema,unitId:z.string().uuid(),onDate:LaborRateDateSchema}).strict();
export const LaborRateListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),workId:z.string().uuid().optional(),countryCode:LaborRateCountrySchema.optional(),region:LaborRateRegionSchema.nullable().optional(),currency:LaborRateCurrencySchema.optional(),unitId:z.string().uuid().optional(),sourceType:LaborRateSourceTypeSchema.optional(),isActive:z.preprocess(value=>value==="true"?true:value==="false"?false:value,z.boolean()).optional(),effectiveOn:LaborRateDateSchema.optional(),sortBy:z.enum(["effectiveFrom","rateAmount","countryCode","currency","updatedAt"]).default("effectiveFrom"),sortOrder:z.enum(["asc","desc"]).default("desc")}).strict();
export const LaborRateIdParamsSchema=z.object({id:z.string().uuid()}).strict();
export const ResolveLaborRateResponseSchema=z.object({laborRate:LaborRateSchema,selectedSourceType:LaborRateSourceTypeSchema,matchedRegion:z.string().nullable(),rateAmount:z.string(),currency:z.string(),unitId:z.string().uuid(),effectiveFrom:z.string(),effectiveTo:z.string().nullable()});
export type LaborRateContract=z.infer<typeof LaborRateSchema>;
