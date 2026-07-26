import type {DocumentActor} from "../../authorization/document-policy.js";
import type {DocumentService} from "./document-service.js";

export class CreateDocumentService{
 constructor(private documents:DocumentService){}
 execute(actor:DocumentActor,metadata:Parameters<DocumentService["upload"]>[1],file:Parameters<DocumentService["upload"]>[2]){return this.documents.upload(actor,metadata,file);}
}
export class GetDocumentService{
 constructor(private documents:DocumentService){}
 execute(actor:DocumentActor,id:string){return this.documents.get(actor,id);}
}
export class ListDocumentsService{
 constructor(private documents:DocumentService){}
 execute(actor:DocumentActor,query:unknown){return this.documents.list(actor,query);}
}
export class UpdateDocumentService{
 constructor(private documents:DocumentService){}
 execute(actor:DocumentActor,id:string,input:unknown){return this.documents.update(actor,id,input);}
}
export class DownloadDocumentService{
 constructor(private documents:DocumentService){}
 execute(actor:DocumentActor,id:string){return this.documents.download(actor,id);}
}
