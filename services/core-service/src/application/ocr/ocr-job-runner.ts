import type {Pool} from "pg";
import type {OcrService} from "./ocr-service.js";
export class OcrJobRunner{
 constructor(private pool:Pool,private service:OcrService,private batchSize=1){}
 async runOnce(){let processed=0;const tenants=(await this.pool.query<{id:string}>("SELECT id FROM tenants ORDER BY id")).rows;for(const tenant of tenants)for(let i=0;i<this.batchSize;i++){if(!await this.service.processNext(tenant.id))break;processed++;}return {processed};}
}
