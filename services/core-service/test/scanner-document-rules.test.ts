import {describe,expect,it} from "vitest";
import {sanitizeScannerFilename,validateDocumentType,validateScannerFile} from "../src/domain/document/document-rules.js";

describe("Scanner document rules",()=>{
 const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,0,0,0xff,0xd9]);
 const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
 const webp=Buffer.from("RIFF0000WEBPVP8 ");
 const pdf=Buffer.from("%PDF-1.7\n");
 it.each([["scan.jpg","image/jpeg",jpeg],["scan.png","image/png",png],["scan.webp","image/webp",webp],["scan.pdf","application/pdf",pdf]])("accepts %s", (name,mime,bytes)=>expect(validateScannerFile(name,mime,bytes,1000).checksum).toHaveLength(64));
 it("rejects empty, oversized, mismatched, executable and SVG files",()=>{
  expect(()=>validateScannerFile("x.pdf","application/pdf",Buffer.alloc(0),100)).toThrow();
  expect(()=>validateScannerFile("x.pdf","application/pdf",pdf,2)).toThrow();
  expect(()=>validateScannerFile("x.pdf","image/png",pdf,100)).toThrow();
  expect(()=>validateScannerFile("x.exe","application/octet-stream",Buffer.from("MZ"),100)).toThrow();
  expect(()=>validateScannerFile("x.svg","image/svg+xml",Buffer.from("<svg/>"),100)).toThrow();
 });
 it("sanitizes traversal and control characters without accepting a second extension",()=>{
  expect(sanitizeScannerFilename("../../evil\r\nname.pdf")).toBe("evilname.pdf");
  expect(()=>sanitizeScannerFilename("invoice.pdf.exe")).toThrow();
 });
 it("validates extensible document types",()=>{
  expect(validateDocumentType("acceptance_act")).toBe("acceptance_act");
  expect(()=>validateDocumentType("script")).toThrow();
 });
});
