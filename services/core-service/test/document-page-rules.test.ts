import {describe,expect,it} from "vitest";
import {requireProcessableMime,validateCrop,validatePageOrder,validatePerspective,validateRotation} from "../src/domain/document/document-page-rules.js";
import {scannerEnvironmentInteger} from "../src/application/document/document-page-service.js";

describe("document page rules",()=>{
 it("accepts supported rotation, crop, perspective and a complete order",()=>{
  expect(validateRotation(270)).toBe(270);
  expect(()=>validateCrop({left:1,top:2,width:10,height:20},20,30)).not.toThrow();
  expect(()=>validatePerspective({topLeft:{x:0,y:0},topRight:{x:10,y:0},bottomRight:{x:10,y:10},bottomLeft:{x:0,y:10}},10,10)).not.toThrow();
  expect(()=>validatePageOrder(["a","b"],["b","a"])).not.toThrow();
 });
 it("rejects invalid input and PDF processing",()=>{
  expect(()=>validateRotation(45)).toThrow();
  expect(()=>validateCrop({left:10,top:0,width:2,height:2},10,10)).toThrow();
  expect(()=>validateCrop({left:Number.MAX_SAFE_INTEGER,top:0,width:2,height:2},10,10)).toThrow();
  expect(()=>validatePerspective({topLeft:{x:0,y:0},topRight:{x:0,y:0},bottomRight:{x:0,y:0},bottomLeft:{x:0,y:0}},10,10)).toThrow();
  expect(()=>validatePageOrder(["a","b"],["a","a"])).toThrow();
  expect(()=>requireProcessableMime("application/pdf")).toThrow();
 });
 it("validates scanner integer configuration safely",()=>{
  const previous=process.env.SCANNER_OUTPUT_JPEG_QUALITY;
  try{process.env.SCANNER_OUTPUT_JPEG_QUALITY="101";expect(()=>scannerEnvironmentInteger("SCANNER_OUTPUT_JPEG_QUALITY",88,1,100)).toThrow("Invalid SCANNER_OUTPUT_JPEG_QUALITY");process.env.SCANNER_OUTPUT_JPEG_QUALITY="80";expect(scannerEnvironmentInteger("SCANNER_OUTPUT_JPEG_QUALITY",88,1,100)).toBe(80);}
  finally{if(previous===undefined)delete process.env.SCANNER_OUTPUT_JPEG_QUALITY;else process.env.SCANNER_OUTPUT_JPEG_QUALITY=previous;}
 });
});
