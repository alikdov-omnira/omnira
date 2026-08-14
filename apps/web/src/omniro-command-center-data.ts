import type{DocumentContract,ExpenseContract,InvoiceContract,NotificationContract,PaymentContract,ProjectContract,ProjectFinancialSummary,TaskContract}from"@odls/contracts";
import{api,type CommercialEstimateDto,type CommercialEstimateListDto,type CompanyPriceBookDto,type CompanyPriceBookListDto,type DesignProjectDto,type EngineeringNormDto,type MaterialConsumptionDto,type MaterialConsumptionListDto,type RegionalPricingDto,type RegionalPricingListDto,type RoomScanDto,type Session,type TechnicalAssignmentDto,type TechnologyDto,type WorkScopeDto}from"./api.js";
import{hasPermission}from"./construction-ui.js";
import type{BuildingSources}from"./omniro-building-adapters.js";
import type{DirectorSourceKey,DirectorSources}from"./omniro-director-workspace-model.js";

export type OmniroLoadedData={projects:ProjectContract[];byProject:Map<string,BuildingSources>;director:DirectorSources;partial:string[]};
export async function loadOmniroData(session:Session):Promise<OmniroLoadedData>{
 const projects=(await api.projectsPage("page=1&pageSize=100&sortBy=name&sortOrder=asc")).data,partial:string[]=[];
 const safe=async<T>(name:string,promise:Promise<T>,fallback:T)=>promise.catch(()=>{partial.push(name);return fallback});
 const canScope=hasPermission(session,"work_scopes.read"),canNorm=hasPermission(session,"engineering_norms.read"),canConsumption=hasPermission(session,"material_consumption.read"),canPricing=hasPermission(session,"regional_pricing.read"),canPriceBook=hasPermission(session,"company_price_books.read"),canEstimate=hasPermission(session,"commercial_estimates.read");
 const canTasks=hasPermission(session,"tasks.read"),canDocuments=hasPermission(session,"documents.read"),canNotifications=hasPermission(session,"notifications.read"),canUsers=hasPermission(session,"users.read"),canFinance=hasPermission(session,"finance.read");
 const[scanPage,assignments,designs,technologies,scopeList,normList,consumptionList,pricingList,priceBookList,estimateList,tasks,documents,notifications,users,invoices,payments,expenses]=await Promise.all([
  safe("room-scanner",hasPermission(session,"room_scans.read")?api.roomScans():Promise.resolve({data:[],pagination:{page:1,pageSize:25,total:0,totalPages:0}}),{data:[]as RoomScanDto[],pagination:{page:1,pageSize:25,total:0,totalPages:0}}),
  safe("technical-assignment",hasPermission(session,"technical_assignments.read")?api.technicalAssignments():Promise.resolve([]),[]as TechnicalAssignmentDto[]),
  safe("design-project",hasPermission(session,"design_projects.read")?api.designProjects():Promise.resolve([]),[]as DesignProjectDto[]),
  safe("technology",canScope?api.technologies():Promise.resolve([]),[]as TechnologyDto[]),
  safe("work-scope",canScope?api.workScopes():Promise.resolve([]),[]as WorkScopeDto[]),
  safe("engineering-norms",canNorm?api.engineeringNorms():Promise.resolve([]),[]as EngineeringNormDto[]),
  safe("material-consumption",canConsumption?api.materialConsumptions():Promise.resolve([]),[]as MaterialConsumptionListDto[]),
  safe("regional-pricing",canPricing?api.regionalPricings():Promise.resolve([]),[]as RegionalPricingListDto[]),
  safe("company-price-book",canPriceBook?api.companyPriceBooks():Promise.resolve([]),[]as CompanyPriceBookListDto[]),
  safe("commercial-estimate",canEstimate?api.commercialEstimates():Promise.resolve([]),[]as CommercialEstimateListDto[]),
  safe("director:tasks",canTasks?api.list("tasks"):Promise.resolve([]),[]as TaskContract[]),
  safe("director:documents",canDocuments?api.documents():Promise.resolve([]),[]as DocumentContract[]),
  safe("director:notifications",canNotifications?api.notifications():Promise.resolve([]),[]as NotificationContract[]),
  safe("director:users",canUsers?api.users():Promise.resolve([]),[]),
  safe("director:finance",canFinance?api.invoices():Promise.resolve([]),[]as InvoiceContract[]),
  safe("director:finance",canFinance?api.payments():Promise.resolve([]),[]as PaymentContract[]),
  safe("director:finance",canFinance?api.expenses():Promise.resolve([]),[]as ExpenseContract[])
 ]);
 const workScopes=await safe("work-scope",Promise.all(scopeList.map(x=>api.workScope(x.id))),scopeList);
 const engineeringNorms=await safe("engineering-norms",Promise.all(normList.map(x=>api.engineeringNorm(x.id))),normList);
 const materialConsumptions=await safe("material-consumption",Promise.all(consumptionList.map(async x=>{const detail=await api.materialConsumption(x.id);if(detail.status!=="approved"||!hasPermission(session,"material_consumption.snapshots.read"))return detail;return{...detail,approvedSnapshot:await api.materialConsumptionSnapshot(x.id)}})),consumptionList as MaterialConsumptionDto[]);
 const regionalPricings=await safe("regional-pricing",Promise.all(pricingList.map(async x=>{const detail=await api.regionalPricing(x.id);if(detail.status!=="approved"||!hasPermission(session,"regional_pricing.snapshots.read"))return detail;return{...detail,approvedSnapshot:await api.regionalPricingSnapshot(x.id)}})),pricingList as RegionalPricingDto[]);
 const companyPriceBooks=await safe("company-price-book",Promise.all(priceBookList.map(async x=>{const detail=await api.companyPriceBook(x.id);if(!hasPermission(session,"company_price_books.snapshots.read"))return detail;const approvedSnapshot=await api.companyPriceBookSnapshot(x.id).catch(()=>undefined);return{...detail,approvedSnapshot}})),priceBookList as CompanyPriceBookDto[]);
 const commercialEstimates=await safe("commercial-estimate",Promise.all(estimateList.map(async x=>{const[detail,analysis]=await Promise.all([api.commercialEstimate(x.id),api.commercialEstimateAnalysis(x.id)]);if(detail.status!=="approved"||!hasPermission(session,"commercial_estimates.snapshots.read"))return{...detail,analysis};return{...detail,analysis,approvedSnapshot:await api.commercialEstimateSnapshot(x.id)}})),[]as CommercialEstimateDto[]);
 const financialSummaries=await safe("director:finance",canFinance?Promise.all(projects.map(project=>api.projectFinancialSummary(project.id))):Promise.resolve([]),[]as ProjectFinancialSummary[]);
 const byProject=new Map<string,BuildingSources>();
 for(const project of projects)byProject.set(project.id,{project,scans:scanPage.data.filter(x=>x.projectId===project.id),assignments:assignments.filter(x=>x.projectId===project.id),designs:designs.filter(x=>x.projectId===project.id),technologies,workScopes:workScopes.filter(x=>x.projectId===project.id),engineeringNorms,materialConsumptions:materialConsumptions.filter(x=>x.projectId===project.id),regionalPricings,companyPriceBooks,commercialEstimates:commercialEstimates.filter(x=>x.projectId===project.id),sourceFailures:partial});
 const state=(key:DirectorSourceKey,allowed:boolean)=>!allowed?{truth:"UNAVAILABLE"as const,reason:`Permission required for ${key} source.`}:partial.includes(`director:${key}`)?{truth:"PARTIAL"as const,reason:`The ${key} source could not be loaded completely.`}:{truth:"REAL"as const,reason:`Authoritative ${key} records loaded through existing REST and RBAC.`};
 const director:DirectorSources={tasks,documents,notifications,users,invoices,payments,expenses,financialSummaries,sourceState:{tasks:state("tasks",canTasks),documents:state("documents",canDocuments),notifications:state("notifications",canNotifications),users:state("users",canUsers),finance:state("finance",canFinance)}};
 return{projects,byProject,director,partial};
}
