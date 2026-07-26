import sharp from "sharp";
import {describe,expect,it} from "vitest";
import {SharpImageProcessor} from "../src/infrastructure/document/sharp-image-processor.js";

describe("Sharp image processor",()=>{
 const processor=new SharpImageProcessor();
 async function source(){return sharp({create:{width:40,height:20,channels:4,background:{r:210,g:170,b:120,alpha:0.5}}}).png().withMetadata({orientation:6}).toBuffer();}
 it("auto-orients, manually rotates, crops, emits deterministic JPEG, and strips EXIF",async()=>{
  const bytes=await source(),input={bytes,rotationDegrees:90,crop:{left:2,top:3,width:10,height:12},enhancementPreset:"document_grayscale" as const,maxPixels:10000,maxDimension:1000,outputJpegQuality:80};
  const first=await processor.process(input),second=await processor.process(input),metadata=await sharp(first.bytes).metadata();
  expect(first.bytes).toEqual(second.bytes);expect(first).toMatchObject({width:10,height:12,originalWidth:40,originalHeight:20,mimeType:"image/jpeg"});
  expect(metadata.format).toBe("jpeg");expect(metadata.orientation).toBeUndefined();expect(metadata.exif).toBeUndefined();
 });
 it.each(["original","document_color","document_grayscale","document_black_white","photo_enhance"] as const)("supports %s preset",async enhancementPreset=>{
  const result=await processor.process({bytes:await source(),rotationDegrees:0,enhancementPreset,maxPixels:10000,maxDimension:1000,outputJpegQuality:85});expect(result.bytes.length).toBeGreaterThan(0);
 });
 it("rejects pixel bombs, invalid crops, and unsupported perspective explicitly",async()=>{
  const bytes=await source();
  await expect(processor.process({bytes,rotationDegrees:0,enhancementPreset:"original",maxPixels:10,maxDimension:1000,outputJpegQuality:80})).rejects.toMatchObject({code:"IMAGE_PROCESSING_FAILED"});
  await expect(processor.process({bytes,rotationDegrees:0,crop:{left:0,top:0,width:100,height:100},enhancementPreset:"original",maxPixels:10000,maxDimension:1000,outputJpegQuality:80})).rejects.toMatchObject({code:"VALIDATION_ERROR"});
  await expect(processor.process({bytes,rotationDegrees:0,perspective:{topLeft:{x:0,y:0},topRight:{x:1,y:0},bottomRight:{x:1,y:1},bottomLeft:{x:0,y:1}},enhancementPreset:"original",maxPixels:10000,maxDimension:1000,outputJpegQuality:80})).rejects.toMatchObject({code:"PERSPECTIVE_TRANSFORM_UNSUPPORTED"});
 });
});
