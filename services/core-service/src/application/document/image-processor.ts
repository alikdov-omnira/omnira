import type {Crop,EnhancementPreset,Perspective} from "../../domain/document/document-page-rules.js";

export interface ImageMetadata{width:number;height:number;format:"jpeg"|"png"|"webp";}
export interface ProcessedImage{bytes:Buffer;width:number;height:number;originalWidth:number;originalHeight:number;mimeType:"image/jpeg";}
export interface ImageProcessor{
 metadata(bytes:Buffer,maxPixels?:number,maxDimension?:number):Promise<ImageMetadata>;
 process(input:{bytes:Buffer;rotationDegrees:number;crop?:Crop;perspective?:Perspective;enhancementPreset:EnhancementPreset;maxPixels:number;maxDimension:number;outputJpegQuality:number}):Promise<ProcessedImage>;
}
