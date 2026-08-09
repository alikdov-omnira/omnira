import type{OmniroEvidenceRef,OmniroRuntimeInput,OmniroRuntimeSnapshot,OmniroTruth}from"./omniro-module-contract.js";
export type OmniroFlowState="idle"|"available"|"selected"|"traveling"|"suspended"|"blocked";
export type OmniroFlowRuntimeState={flowId:string;truth:OmniroTruth;state:OmniroFlowState;reason:string;evidence:OmniroEvidenceRef[];payload?:{type:string;recordRefs:OmniroEvidenceRef[]}};
export type OmniroFlowDefinition={id:string;source:{moduleId:string;output:string};destination:{moduleId:string;input:string};relation:"authority"|"dependency"|"derivation"|"context";payloadType:string;defaultTruth:OmniroTruth;approvalBoundary?:{moduleId:string};resolve:(input:OmniroRuntimeInput,snapshot:OmniroRuntimeSnapshot)=>OmniroFlowRuntimeState};
