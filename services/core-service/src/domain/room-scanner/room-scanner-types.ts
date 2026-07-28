export const roomScanStatuses=["draft","capturing","processing","review_required","ready_for_approval","approved","rejected","cancelled"]as const;
export type RoomScanStatus=typeof roomScanStatuses[number];
export const measurementSources=["lidar","arkit","camera_estimation","manual_measurement","laser_measurement","level_rule","imported_plan","design_project","technical_specification","human_correction"]as const;
export type MeasurementSource=typeof measurementSources[number];
export type Point2={x:number;y:number};
export type GeometryQuantityType="wall_gross_area"|"wall_net_area"|"floor_area"|"ceiling_area"|"room_perimeter"|"room_volume"|"opening_area"|"opening_reveal_area"|"internal_corner_length"|"external_corner_length"|"opening_corner_length"|"skirting_length"|"demolition_wall_area"|"demolition_floor_area"|"demolition_ceiling_area"|"defect_count";
export type GeometryQuantity={type:GeometryQuantityType;value:number;unit:"m"|"m2"|"m3"|"count";formulaId:string;inputReferences:string[];calculationVersion:"room-geometry-v1"};
export type CompletenessIssue={code:string;entityType:"scan"|"room"|"surface"|"opening"|"observation";entityId:string;field:string;severity:"error"|"warning";messageKey:string;measurementIds:string[]};
export type CompletenessResult={status:"complete"|"incomplete"|"conflicted"|"requires_review";issues:CompletenessIssue[]};
export type QuantitySourceVersion={sourceType:"measurement"|"opening";sourceId:string;sourceVersion:number;sourceOrder:number};
export type ApprovedScanQuantity={id:string;tenantId:string;approvedSnapshotId:string;propertyId:string;projectId:string|null;roomId:string;surfaceId?:string;type:GeometryQuantityType;value:number;unit:string;capturedValidity:"valid";sourceVersions:QuantitySourceVersion[];calculationProvenance:{formulaId:string;inputReferences:string[];calculationVersion:string};reviewStatus:"verified"};
export type ApprovedScanQuantitySet={approvedSnapshotId:string;contentFingerprint:string;quantities:ApprovedScanQuantity[]};
export interface SurfaceTreatmentRecommendationPort{recommend(input:{surfaceId:string;observations:unknown[]}):Promise<unknown[]>}
export interface RoomScanRecognitionProvider{readonly name:string;recognize(input:unknown):Promise<unknown[]>}
