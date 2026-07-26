import sharp from "sharp";
import {domainErrors} from "../../domain/errors.js";
import {validateCrop,validatePerspective} from "../../domain/document/document-page-rules.js";
import type {ImageProcessor} from "../../application/document/image-processor.js";

export class SharpImageProcessor implements ImageProcessor{
 async metadata(bytes:Buffer,maxPixels=40_000_000,maxDimension=12_000){
  try{
   const value=await sharp(bytes,{failOn:"error",limitInputPixels:maxPixels}).metadata();
   if(!value.width||!value.height||!["jpeg","png","webp"].includes(value.format??""))throw domainErrors.imageProcessing("Image dimensions or format could not be determined");
   if(value.width>maxDimension||value.height>maxDimension)throw domainErrors.validation("Image exceeds the configured dimension limit",{maxDimension});
   return {width:value.width,height:value.height,format:value.format as "jpeg"|"png"|"webp"};
  }catch(error){if(error instanceof Error&&"code" in error)throw error;throw domainErrors.imageProcessing();}
 }
 async process(input:Parameters<ImageProcessor["process"]>[0]){
  if(input.perspective)throw domainErrors.perspectiveUnsupported();
  const original=await this.metadata(input.bytes,input.maxPixels,input.maxDimension);
  if(original.width*original.height>input.maxPixels)throw domainErrors.validation("Decoded image exceeds the configured pixel limit",{maxPixels:input.maxPixels});
  if(original.width>input.maxDimension||original.height>input.maxDimension)throw domainErrors.validation("Image exceeds the configured dimension limit",{maxDimension:input.maxDimension});
  const oriented=await sharp(input.bytes,{failOn:"error",limitInputPixels:input.maxPixels}).rotate().toBuffer({resolveWithObject:true});
  let width=input.rotationDegrees===90||input.rotationDegrees===270?oriented.info.height:oriented.info.width;
  let height=input.rotationDegrees===90||input.rotationDegrees===270?oriented.info.width:oriented.info.height;
  validatePerspective(input.perspective,width,height);
  validateCrop(input.crop,width,height);
  let pipeline=sharp(oriented.data,{failOn:"error",limitInputPixels:input.maxPixels}).rotate(input.rotationDegrees);
  if(input.crop){pipeline=pipeline.extract(input.crop);width=input.crop.width;height=input.crop.height;}
  if(input.enhancementPreset==="document_color")pipeline=pipeline.normalize({lower:1,upper:99}).sharpen();
  if(input.enhancementPreset==="document_grayscale")pipeline=pipeline.grayscale().normalize({lower:1,upper:99}).sharpen();
  if(input.enhancementPreset==="document_black_white")pipeline=pipeline.grayscale().normalize().threshold(180);
  if(input.enhancementPreset==="photo_enhance")pipeline=pipeline.modulate({saturation:1.08,brightness:1.03}).sharpen();
  try{
   const result=await pipeline.flatten({background:"#ffffff"}).jpeg({quality:input.outputJpegQuality,chromaSubsampling:"4:4:4"}).toBuffer({resolveWithObject:true});
   if(result.info.width*result.info.height>input.maxPixels)throw domainErrors.validation("Processed image exceeds the configured pixel limit",{maxPixels:input.maxPixels});
   if(result.info.width>input.maxDimension||result.info.height>input.maxDimension)throw domainErrors.validation("Processed image exceeds the configured dimension limit",{maxDimension:input.maxDimension});
   return {bytes:result.data,width:result.info.width,height:result.info.height,originalWidth:original.width,originalHeight:original.height,mimeType:"image/jpeg" as const};
  }catch(error){if(error instanceof Error&&"code" in error)throw error;throw domainErrors.imageProcessing();}
 }
}
