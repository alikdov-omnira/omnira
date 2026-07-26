import type {DocumentClassifier} from "../../application/document-analysis/document-classifier.js";
import type {AnalysisDocumentType} from "../../domain/document-analysis/analysis-types.js";
const signals:Record<Exclude<AnalysisDocumentType,"unknown"|"other">,readonly [RegExp,number,string][]>={
 invoice:[[/invoice|faktura|фактура|рахунок/iu,4,"invoice-title"],[/vat|nip|invoice number|termin płatності|termin płatności/iu,2,"invoice-details"]],
 receipt:[[/\b(receipt|paragon|чек|касовий чек)\b/iu,4,"receipt-title"],[/\b(total|suma)\b/iu,1,"receipt-total"]],
 contract:[[/\b(agreement|contract|umowa|договор|договір)\b/iu,4,"contract-title"],[/\b(strony|postanowienia|parties)\b/iu,2,"contract-terms"]],
 estimate:[[/\b(estimate|quotation|kosztorys|oferta|смета|кошторис)\b/iu,4,"estimate-title"],[/\b(quantity|unit price|ilość|cena jednostkowa)\b/iu,2,"estimate-lines"]],
 work_acceptance_act:[[/protokół odbioru|akt wykonanych prac|акт выполненных работ|акт виконаних робіт/iu,6,"acceptance-title"]],
 delivery_note:[[/\b(delivery note|wz|list przewozowy|накладная|накладна)\b/iu,5,"delivery-title"]],
 bank_document:[[/\b(iban|swift|bank statement|wyciąg bankowy|платіжне доручення)\b/iu,4,"bank-signal"]],
 identity_document:[[/\b(passport|paszport|паспорт|identity card|dowód osobisty)\b/iu,5,"identity-title"]],
 letter:[[/\b(dear sir|sincerely|szanowni państwo|уважаемый|шановний)\b/iu,4,"letter-signal"]]};
export class DeterministicDocumentClassifier implements DocumentClassifier{readonly name="omnira-deterministic";readonly version="1.0.0";async classify(input:Parameters<DocumentClassifier["classify"]>[0]){const scores=Object.entries(signals).map(([type,rules])=>{let score=0;const matched:string[]=[];for(const [pattern,weight,label] of rules)if(pattern.test(input.text)){score+=weight;matched.push(label);}return {type:type as AnalysisDocumentType,score,matched};}).sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type)),top=scores[0],second=scores[1],confidence=top.score?Math.min(.99,top.score/8)*(top.score===second.score?.7:1):0;return {documentType:confidence>=input.threshold?top.type:"unknown",confidence:Number(confidence.toFixed(4)),matchedSignals:top.matched,classifier:this.name,version:this.version};}}
