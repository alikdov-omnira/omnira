import{lazy,Suspense,useEffect,useMemo,useReducer,useState}from"react";
import type{Session}from"./api.js";
import{ErrorState,LoadingState,type WorkspaceTab}from"./construction-ui.js";
import{buildingModuleRegistry}from"./omniro-building-modules.js";
import{buildingFlowRegistry}from"./omniro-building-flows.js";
import{loadOmniroData,type OmniroLoadedData}from"./omniro-command-center-data.js";
import{parentOmniroRoute,parseOmniroRoute,serializeOmniroRoute,type OmniroRoute}from"./omniro-command-center-route.js";
import{initialInteraction,reduceInteraction}from"./omniro-interaction-model.js";
import{resolveRuntime}from"./omniro-building-adapters.js";
import{OmniroCommandCenterShell}from"./omniro-command-center-shell.js";
import type{OmniroModuleRuntimeAdapter,OmniroRuntimeInput,OmniroRuntimeSnapshot}from"./omniro-module-contract.js";
import type{OmniroQuality}from"./omniro-operational-scene.js";
import{environmentHash,parseEnvironmentRoute,type OmniroEnvironmentLayer}from"./omniro-operating-environment-model.js";
import type{DirectorContextPage}from"./omniro-director-workspace.js";

const OmniroOperatingEnvironment=lazy(()=>import("./omniro-operating-environment.js").then(module=>({default:module.OmniroOperatingEnvironment})));

type Navigate=(page:"omniro"|"overview"|"construction-projects"|DirectorContextPage,projectId?:string,tab?:WorkspaceTab)=>void;
const defaultQuality=():OmniroQuality=>typeof matchMedia!=="undefined"&&matchMedia("(prefers-reduced-motion: reduce)").matches?"reduced":typeof navigator!=="undefined"&&((navigator.hardwareConcurrency??8)<=4||navigator.maxTouchPoints>0)?"balanced":"enhanced";

export function OmniroCommandCenter({session,navigate,forceRendererFailure=false}:{session:Session;navigate:Navigate;forceRendererFailure?:boolean}){
 const[data,setData]=useState<OmniroLoadedData>(),[error,setError]=useState<unknown>(),[quality,setQuality]=useState<OmniroQuality>(defaultQuality),[environment,setEnvironment]=useState(()=>parseEnvironmentRoute(typeof location==="undefined"?"":location.hash)),[environmentProjectId,setEnvironmentProjectId]=useState<string>(),[interaction,dispatch]=useReducer(reduceInteraction,parseOmniroRoute(typeof location==="undefined"?"#omniro":location.hash),initialInteraction);
 const load=()=>{setError(undefined);void loadOmniroData(session).then(setData).catch(setError)};
 useEffect(load,[session]);
 useEffect(()=>{const restore=()=>{setEnvironment(parseEnvironmentRoute(location.hash));dispatch({type:"ROUTE",route:parseOmniroRoute(location.hash)})};addEventListener("hashchange",restore);addEventListener("popstate",restore);return()=>{removeEventListener("hashchange",restore);removeEventListener("popstate",restore)}},[]);
 const project=data?.projects.find(item=>item.id===(environmentProjectId??interaction.route.projectId))??data?.projects[0],sources=project&&data?.byProject.get(project.id),adapters=useMemo(()=>new Map(buildingModuleRegistry.definitions.map(item=>[item.id,item.runtime as OmniroModuleRuntimeAdapter])),[]),runtimes=useMemo(()=>{const resolved=new Map<string,OmniroRuntimeSnapshot>();for(const item of data?.projects??[]){const itemSources=data?.byProject.get(item.id);if(itemSources)resolved.set(item.id,resolveRuntime(item.id,session,itemSources,adapters))}return resolved},[adapters,data,session]),runtime=project?runtimes.get(project.id):undefined,flows=useMemo(()=>{if(!runtime||!sources)return[];const input:OmniroRuntimeInput={projectId:runtime.projectId,session,sources:sources as unknown as Record<string,unknown>};return buildingFlowRegistry.definitions.map(flow=>flow.resolve(input,runtime))},[runtime,session,sources]);
 const selectedId=interaction.route.moduleId??"project",selected=runtime?.modules.get(selectedId),definition=buildingModuleRegistry.get(selectedId),explanation=selected&&runtime&&definition?definition.explain.explain(selected,runtime):undefined;
 const go=(route:OmniroRoute,replace=false)=>{const hash=serializeOmniroRoute(route);history[replace?"replaceState":"pushState"]({omniro:true},"",`${location.pathname}${location.search}${hash}`);setEnvironment(undefined);setEnvironmentProjectId(undefined);dispatch({type:"ROUTE",route})};
 const goLayer=(layer:OmniroEnvironmentLayer)=>{const route={layer,roleId:layer==="role"?"director":undefined};history.pushState({omniro:true},"",`${location.pathname}${location.search}${environmentHash(route)}`);setEnvironment(route);dispatch({type:"ROUTE",route:{level:"operational"}})};
 if(error)return <section className="oc-load"><ErrorState error={error} onRetry={load}/></section>;
 if(!data)return <section className="oc-load"><LoadingState label="Resolving authenticated OMNIRO project context"/></section>;
 if(!project||!sources||!runtime)return <section className="oc-load"><p>No authoritative projects are available.</p></section>;
 const openWorkspace=(id:string,projectId=project.id)=>{const targetRuntime=runtimes.get(projectId),item=buildingModuleRegistry.get(id),state=targetRuntime?.modules.get(id);if(item?.workspace&&state?.availability!=="unavailable")go({level:"workspace",projectId,moduleId:id,entityId:state?.record?.entityId})};
 if(environment)return <Suspense fallback={<section className="oc-load"><LoadingState label="Loading OMNIRO operating environment"/></section>}><OmniroOperatingEnvironment session={session} projects={data.projects} project={project} runtime={runtime} runtimes={runtimes} directorSources={data.director} flows={flows} layer={environment.layer} onLayer={goLayer} onProject={setEnvironmentProjectId} onModule={(id,projectId=project.id)=>go({level:"focus",projectId,moduleId:id})} onWorkspace={openWorkspace} onContext={(page,id)=>navigate(page,id)}/></Suspense>;
 return <OmniroCommandCenterShell session={session} projects={data.projects} project={project} runtime={runtime} flows={flows} route={interaction.route} quality={quality} forceFallback={forceRendererFailure} explanation={explanation} explanationOpen={interaction.explanationOpen} onProject={id=>go({level:"focus",projectId:id,moduleId:"project"})} onFocus={id=>go({level:"focus",projectId:project.id,moduleId:id})} onWorkspace={openWorkspace} onCloseWorkspace={()=>go(parentOmniroRoute(interaction.route))} onToggleExplanation={()=>dispatch({type:interaction.explanationOpen?"CLOSE_EXPLANATION":"EXPLAIN"})} onQuality={setQuality} onNavigateContext={page=>navigate(page,project.id)} onUniverse={()=>goLayer("universe")}/>;
}
