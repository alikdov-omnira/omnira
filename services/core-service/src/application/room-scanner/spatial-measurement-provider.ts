import type{ProviderProposal}from"../../domain/room-scanner/spatial-geometry.js";
export interface SpatialMeasurementProviderPort{readonly providerType:string;capabilities():Promise<{supported:boolean;reason?:string}>;measure(input:{captureSessionId:string;purpose:string}):Promise<ProviderProposal>}
export interface SpatialRecognitionProposal{kind:"wall"|"floor"|"ceiling"|"door"|"window"|"opening_contour"|"material"|"defect";confidence:number;source:string;payloadReference?:string;state:"proposed"}
export interface SpatialRecognitionProviderPort{readonly providerType:string;propose(input:{captureSessionId:string;artifactReference:string}):Promise<SpatialRecognitionProposal[]>}
