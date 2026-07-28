import{domainErrors}from"../errors.js";

const finite=(value:number,name:string)=>{if(!Number.isFinite(value))throw domainErrors.validation(`${name} must be finite`);return value;};
export type FlatnessSample={positionM:number;deviationM:number};
export type ValidatedFlatness={samples:FlatnessSample[];maxPositiveDeviationM:number;maxNegativeDeviationM:number;totalRangeM:number};
export function validateFlatness(input:{spanM:number;spanUnit:"m";samples:FlatnessSample[]}):ValidatedFlatness{
 finite(input.spanM,"span");if(input.spanM<=0)throw domainErrors.validation("Flatness span must be positive");if(input.spanUnit!=="m")throw domainErrors.validation("Flatness span unit must be metres");if(!input.samples.length)throw domainErrors.validation("Flatness samples are required");
 const samples=input.samples.map(x=>({positionM:finite(x.positionM,"sample position"),deviationM:finite(x.deviationM,"sample deviation")})).sort((a,b)=>a.positionM-b.positionM);
 for(const[x,index]of samples.map((x,index)=>[x,index]as const)){if(x.positionM<0||x.positionM>input.spanM)throw domainErrors.validation("Flatness sample is outside measurement span");if(index&&samples[index-1].positionM===x.positionM)throw domainErrors.validation("Duplicate flatness sample position");}
 const deviations=samples.map(x=>x.deviationM),maxPositiveDeviationM=Math.max(0,...deviations),maxNegativeDeviationM=Math.min(0,...deviations);
 return{samples,maxPositiveDeviationM,maxNegativeDeviationM,totalRangeM:maxPositiveDeviationM-maxNegativeDeviationM};
}
export const defectTypes=["crack","chip","hole","delamination","moisture","contamination","corrosion","missing_material","deformation","other"]as const;
export const defectSeverities=["minor","moderate","major","critical"]as const;
export function validateDefect(input:{defectType:string;severity:string;positionXM:number;positionYM:number;lengthM?:number;widthM?:number;depthM?:number;affectedAreaM2?:number}){
 if(!defectTypes.includes(input.defectType as typeof defectTypes[number]))throw domainErrors.validation("Unsupported defect type");if(!defectSeverities.includes(input.severity as typeof defectSeverities[number]))throw domainErrors.validation("Unsupported defect severity");
 for(const[name,value]of Object.entries(input)){if(typeof value==="number"&&(finite(value,name)<0))throw domainErrors.validation(`${name} cannot be negative`);}if([input.lengthM,input.widthM,input.depthM,input.affectedAreaM2].every(x=>x===undefined))throw domainErrors.validation("Defect requires a typed dimension");return input;
}
export function validateCorner(input:{positionM:number;expectedAngleDeg:number;measuredAngleDeg:number}){for(const[name,value]of Object.entries(input))finite(value,name);if(input.positionM<0||input.expectedAngleDeg<=0||input.expectedAngleDeg>=360||input.measuredAngleDeg<=0||input.measuredAngleDeg>=360)throw domainErrors.validation("Invalid corner measurement");return{...input,deviationDeg:input.measuredAngleDeg-input.expectedAngleDeg};}
