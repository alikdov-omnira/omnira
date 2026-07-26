import {describe,expect,it} from "vitest";
import {assertOcrTransition,normalizeLanguages,normalizeOcrText,retryDelay,validateConfidence} from "../src/domain/ocr/ocr-rules.js";
describe("OCR domain rules",()=>{
 it("normalizes, sorts, deduplicates and whitelists languages",()=>{expect(normalizeLanguages(["POL","eng","eng"],4)).toEqual(["eng","pol"]);expect(()=>normalizeLanguages(["fra"],4)).toThrow();expect(()=>normalizeLanguages(["eng","pol"],1)).toThrow();});
 it("enforces lifecycle and bounded retry",()=>{expect(()=>assertOcrTransition("pending","processing")).not.toThrow();expect(()=>assertOcrTransition("completed","processing")).toThrow();expect(retryDelay(50)).toBe(256000);});
 it("normalizes text without changing meaning",()=>{expect(normalizeOcrText("A\r\n\u0000B\n\n\n\nC",100)).toBe("A\nB\n\n\nC");expect(()=>normalizeOcrText("abcd",3)).toThrow();});
 it("validates confidence and environment-sized values",()=>{expect(validateConfidence(99.5)).toBe(99.5);expect(()=>validateConfidence(101)).toThrow();});
});
