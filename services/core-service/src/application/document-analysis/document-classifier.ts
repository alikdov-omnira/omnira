import type {ClassificationResult,TextPage} from "../../domain/document-analysis/analysis-types.js";
export interface DocumentClassifier{readonly name:string;readonly version:string;classify(input:{text:string;pages:TextPage[];language:string|null;threshold:number}):Promise<ClassificationResult>;}
