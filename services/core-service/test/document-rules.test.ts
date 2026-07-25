import {describe,expect,it} from "vitest";
import {normalizeFilename,validateCategory,validateFile} from "../src/domain/document/document-rules.js";
const pdf=Buffer.from("%PDF-1.4\nsmall");
describe("Document security rules",()=>{
 it("normalizes safe filenames",()=>expect(normalizeFilename("  Project   Plan.pdf ")).toBe("Project Plan.pdf"));
 it.each(["../x.pdf","a/b.pdf","a\\b.pdf","a.exe.pdf","a.pdf.exe"])("rejects unsafe or double filenames %s",name=>expect(()=>normalizeFilename(name)).toThrow());
 it("rejects empty files",()=>expect(()=>validateFile("x.pdf","application/pdf",Buffer.alloc(0),100)).toThrow("Empty"));
 it("rejects oversized files",()=>expect(()=>validateFile("x.pdf","application/pdf",pdf,2)).toThrow("maximum"));
 it("rejects forbidden extensions",()=>expect(()=>validateFile("x.js","application/javascript",Buffer.from("alert(1)"),100)).toThrow("not allowed"));
 it("rejects MIME mismatch",()=>expect(()=>validateFile("x.pdf","image/png",pdf,100)).toThrow("does not match"));
 it("rejects signature mismatch",()=>expect(()=>validateFile("x.pdf","application/pdf",Buffer.from("not pdf"),100)).toThrow("does not match"));
 it("calculates a stable checksum",()=>expect(validateFile("x.pdf","application/pdf",pdf,100).checksum).toMatch(/^[a-f0-9]{64}$/));
 it("centralizes category validation",()=>{expect(validateCategory("contract")).toBe("contract");expect(()=>validateCategory("malware")).toThrow();});
});
