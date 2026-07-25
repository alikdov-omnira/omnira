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
export const DocumentEntityTypeSchema=z.enum(["client","property","project","task","invoice","payment","expense"]);
export const DocumentLinkSchema=z.object({id:z.string().uuid(),entityType:DocumentEntityTypeSchema,entityId:z.string().uuid()});
export const DocumentVersionSchema=z.object({id:z.string().uuid(),versionNo:z.number().int().positive(),originalFilename:z.string(),mimeType:z.string(),extension:z.string(),fileSize:z.number().int().positive(),checksum:z.string().length(64),uploadedBy:z.string().uuid(),createdAt:z.union([z.string(),z.date()])});
export const DocumentSchema=z.object({id:z.string().uuid(),tenantId:z.string().uuid(),category:DocumentCategorySchema,description:z.string().nullable(),currentVersionNo:z.number().int().positive(),version:z.number().int().positive(),createdAt:z.union([z.string(),z.date()]),updatedAt:z.union([z.string(),z.date()]),archivedAt:z.union([z.string(),z.date()]).nullable(),currentVersion:DocumentVersionSchema,links:z.array(DocumentLinkSchema)});
export const DocumentUploadMetadataSchema=z.object({tenantId:z.never().optional(),storageKey:z.never().optional(),checksum:z.never().optional(),fileSize:z.never().optional(),uploadedBy:z.never().optional(),category:DocumentCategorySchema,description:z.string().trim().max(5000).optional(),entityType:DocumentEntityTypeSchema,entityId:z.string().uuid()}).strict();
export const UpdateDocumentRequestSchema=z.object({expectedVersion:z.number().int().positive(),category:DocumentCategorySchema.optional(),description:z.string().trim().max(5000).nullable().optional()}).strict();
export const DocumentVersionUploadMetadataSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const DocumentVersionRequestSchema=z.object({expectedVersion:z.number().int().positive()}).strict();
export const AddDocumentLinkRequestSchema=z.object({entityType:DocumentEntityTypeSchema,entityId:z.string().uuid(),expectedVersion:z.number().int().positive()}).strict();
export const DocumentLinkParamsSchema=z.object({id:z.string().uuid(),linkId:z.string().uuid()});
export const DocumentListQuerySchema=z.object({page:z.coerce.number().int().positive().default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),search:z.string().trim().max(200).optional(),category:DocumentCategorySchema.optional(),mimeType:z.string().max(200).optional(),uploaderId:z.string().uuid().optional(),entityType:DocumentEntityTypeSchema.optional(),entityId:z.string().uuid().optional(),createdFrom:z.coerce.date().optional(),createdTo:z.coerce.date().optional(),archived:z.preprocess(v=>v==="true"?true:v==="false"?false:v,z.boolean()).optional(),sortBy:z.enum(["filename","category","createdAt","updatedAt"]).default("updatedAt"),sortOrder:z.enum(["asc","desc"]).default("desc")}).refine(x=>!x.entityId||x.entityType,{message:"entityType is required with entityId"});
export const DocumentIdParamsSchema=z.object({id:z.string().uuid()});
export const DocumentVersionParamsSchema=z.object({id:z.string().uuid(),versionId:z.string().uuid()});
export type DocumentContract=z.infer<typeof DocumentSchema>;
export type DocumentCategory=z.infer<typeof DocumentCategorySchema>;
export type DocumentEntityType=z.infer<typeof DocumentEntityTypeSchema>;
