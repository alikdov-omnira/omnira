import type{ComponentType}from"react";
import type{Session}from"./api.js";

export type OmniroTruth="REAL"|"DERIVED"|"PARTIAL"|"UNAVAILABLE";
export type OmniroLifecycle="IDLE"|"APPROACH"|"FOCUS"|"RECEIVE"|"PROCESS"|"OUTPUT"|"WAIT"|"APPROVAL_REQUIRED"|"APPROVED"|"COMPLETE"|"CONFLICT"|"BLOCKED";
export type OmniroModuleKind="nucleus"|"authority"|"context";
export type OmniroMicroAnimationKey="scanner-evidence-sweep"|"identity-assembly"|"intent-review"|"design-formation"|"dormant";
export type OmniroEvidenceRef={entityType:string;entityId:string;version?:number;label:string;fingerprint?:string};
export type OmniroPortDefinition={id:string;payloadType:string;label:string};
export type OmniroVisualIdentity={glyph:string;geometry:"core"|"scanner"|"identity"|"layers"|"decisions"|"scope"|"technology"|"norms"|"consumption"|"pricing"|"estimate"|"context";accent:"cyan"|"green"|"amber"|"violet"|"silver"};
export type OmniroAccessibilityDefinition={label:string;description:string;unavailableDescription:string};
export type OmniroMobileRepresentation={priority:number;compactLabel:string};
export type OmniroRecordRef={entityType:string;entityId:string;version?:number};

export type OmniroModuleRuntimeState<T=unknown>={moduleId:string;projectId:string;label?:string;truth:OmniroTruth;lifecycle:OmniroLifecycle;availability:"available"|"partial"|"unavailable";status:string;reason:string;record?:OmniroRecordRef;evidence:OmniroEvidenceRef[];observed?:T;updatedAt?:string};
export type OmniroRuntimeSnapshot={projectId:string;modules:ReadonlyMap<string,OmniroModuleRuntimeState>;loadedAt:string};
export type OmniroRuntimeInput={projectId:string;session:Session;sources:Record<string,unknown>};
export interface OmniroModuleRuntimeAdapter<T=unknown>{resolve(input:OmniroRuntimeInput):OmniroModuleRuntimeState<T>}
export type OmniroWorkspaceProps<T=unknown>={session:Session;projectId:string;runtime:OmniroModuleRuntimeState<T>;onClose:()=>void};
export type OmniroWorkspaceReference={id:string;routeSegment:string};
export type OmniroWorkspaceDefinition<T=unknown>={id:string;moduleId:string;routeSegment:string;requiredPermissions:string[];load:()=>Promise<{default:ComponentType<OmniroWorkspaceProps<T>>}>};
export type OmniroApprovalProjection={source:OmniroEvidenceRef;readiness:string;consequence:string;permitted:boolean;permission:string;downstreamModuleId?:string;openWorkspaceId:string;conflictPolicy:"reload-in-workspace"};
export interface OmniroApprovalAdapter<T=unknown>{detect(state:OmniroModuleRuntimeState<T>,session:Session):OmniroApprovalProjection|undefined}
export type OmniroExplanationProjection={currentModuleId:string;source?:OmniroEvidenceRef;destinationModuleId?:string;reason:string;evidence:OmniroEvidenceRef[];waitingReason?:string;humanAction?:string;nextAction?:string;classification:"authoritative"|"derived"|"unavailable";highlight:{moduleIds:string[];flowIds:string[]}};
export interface OmniroExplanationAdapter<T=unknown>{explain(state:OmniroModuleRuntimeState<T>,snapshot:OmniroRuntimeSnapshot):OmniroExplanationProjection}
export type OmniroModuleDefinition<T=unknown>={id:string;label:string;entityType:string;kind:OmniroModuleKind;defaultTruth:OmniroTruth;visual:OmniroVisualIdentity;permissions:{read:string[];enter?:string[];approve?:string[]};inputs:OmniroPortDefinition[];outputs:OmniroPortDefinition[];dependencies:string[];runtime:OmniroModuleRuntimeAdapter<T>;workspace?:OmniroWorkspaceReference;approval?:OmniroApprovalAdapter<T>;explain:OmniroExplanationAdapter<T>;processingVisual?:OmniroMicroAnimationKey;mobile:OmniroMobileRepresentation;accessibility:OmniroAccessibilityDefinition};
