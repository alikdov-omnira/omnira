import {domainErrors} from "../errors.js";

export const pageMimeTypes=["image/jpeg","image/png","image/webp"] as const;
export const enhancementPresets=["original","document_color","document_grayscale","document_black_white","photo_enhance"] as const;
export type EnhancementPreset=typeof enhancementPresets[number];
export type Crop={left:number;top:number;width:number;height:number};
export type Point={x:number;y:number};
export type Perspective={topLeft:Point;topRight:Point;bottomRight:Point;bottomLeft:Point};

export function requireProcessableMime(mime:string){
 if(!(pageMimeTypes as readonly string[]).includes(mime))throw domainErrors.validation("Only JPEG, PNG, and WebP pages can be processed",{errorCode:"UNSUPPORTED_PAGE_MIME_TYPE"});
}
export function validateRotation(value:number){if(![0,90,180,270].includes(value))throw domainErrors.validation("Rotation must be 0, 90, 180, or 270 degrees");return value;}
export function validateCrop(crop:Crop|undefined,width:number,height:number){
 if(!crop)return;
 if(!Number.isSafeInteger(crop.left)||!Number.isSafeInteger(crop.top)||!Number.isSafeInteger(crop.width)||!Number.isSafeInteger(crop.height)||crop.left<0||crop.top<0||crop.width<=0||crop.height<=0||crop.left>width-crop.width||crop.top>height-crop.height)throw domainErrors.validation("Crop rectangle is outside the image bounds");
}
export function validatePerspective(value:Perspective|undefined,width:number,height:number){
 if(!value)return;
 const points=[value.topLeft,value.topRight,value.bottomRight,value.bottomLeft];
 if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>width||p.y>height))throw domainErrors.validation("Perspective points are outside the image bounds");
 const area=Math.abs(points.reduce((sum,p,index)=>{const n=points[(index+1)%points.length]!;return sum+p.x*n.y-n.x*p.y;},0))/2;
 if(area<1)throw domainErrors.validation("Perspective polygon must have a positive area");
}
export function validatePageOrder(existingIds:readonly string[],orderedIds:readonly string[]){
 if(existingIds.length!==orderedIds.length||new Set(orderedIds).size!==orderedIds.length||existingIds.some(id=>!orderedIds.includes(id)))throw domainErrors.validation("Page order must contain every document page exactly once");
}
