import{afterEach,describe,expect,it,vi}from"vitest";
import{api,type MaterialConsumptionDto,type Session}from"./api.js";
import{loadOmniroData}from"./omniro-command-center-data.js";

const session:Session={accessToken:"x",refreshToken:"x",user:{id:"u",email:"u@example.test",displayName:"User"},permissions:["projects.read","material_consumption.read"]};
const consumption:MaterialConsumptionDto={id:"run-1",projectId:"project-1",code:"MC-1",title:"Real demand",revisionId:"revision-1",revisionNumber:1,status:"draft",version:1,workScopeSnapshotId:"scope-1",normSnapshotId:"norm-1",knowledgeVersionId:"knowledge-1",technologyVersionId:"technology-1",workItemId:"item-1",evaluatedParameters:{},workQuantity:12,workQuantityUnit:"m2",lines:[]};

describe("OMNIRO Command Center Material Consumption source",()=>{
 afterEach(()=>vi.restoreAllMocks());
 it("loads the real list and detail endpoints into project runtime sources",async()=>{
  vi.spyOn(api,"projectsPage").mockResolvedValue({data:[{id:"project-1",name:"Project",projectNumber:"P-1",status:"active",currencyCode:"PLN",version:1}],pagination:{page:1,pageSize:100,total:1,totalPages:1}}as never);
  vi.spyOn(api,"roomScans").mockResolvedValue({data:[],pagination:{page:1,pageSize:25,total:0,totalPages:0}});
  vi.spyOn(api,"technicalAssignments").mockResolvedValue([]);
  vi.spyOn(api,"designProjects").mockResolvedValue([]);
  vi.spyOn(api,"technologies").mockResolvedValue([]);
  vi.spyOn(api,"workScopes").mockResolvedValue([]);
  vi.spyOn(api,"engineeringNorms").mockResolvedValue([]);
  const list=vi.spyOn(api,"materialConsumptions").mockResolvedValue([consumption]),detail=vi.spyOn(api,"materialConsumption").mockResolvedValue(consumption);
  const loaded=await loadOmniroData(session);
  expect(list).toHaveBeenCalledWith();
  expect(detail).toHaveBeenCalledWith("run-1");
  expect(loaded.byProject.get("project-1")?.materialConsumptions).toEqual([consumption]);
  expect(loaded.partial).not.toContain("material-consumption");
 });

 it("records an API failure as partial instead of fabricating a run",async()=>{
  vi.spyOn(api,"projectsPage").mockResolvedValue({data:[{id:"project-1",name:"Project",projectNumber:"P-1",status:"active",currencyCode:"PLN",version:1}],pagination:{page:1,pageSize:100,total:1,totalPages:1}}as never);
  vi.spyOn(api,"roomScans").mockResolvedValue({data:[],pagination:{page:1,pageSize:25,total:0,totalPages:0}});
  vi.spyOn(api,"technicalAssignments").mockResolvedValue([]);vi.spyOn(api,"designProjects").mockResolvedValue([]);vi.spyOn(api,"technologies").mockResolvedValue([]);vi.spyOn(api,"workScopes").mockResolvedValue([]);vi.spyOn(api,"engineeringNorms").mockResolvedValue([]);
  vi.spyOn(api,"materialConsumptions").mockRejectedValue(new Error("offline"));
  const loaded=await loadOmniroData(session),source=loaded.byProject.get("project-1");
  expect(source?.materialConsumptions).toEqual([]);
  expect(source?.sourceFailures).toContain("material-consumption");
 });
});
