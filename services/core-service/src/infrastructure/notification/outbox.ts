import {randomUUID} from "node:crypto";
import type {PoolClient} from "pg";
import {notificationEventTypes,type NotificationEventType} from "../../domain/notification/notification-types.js";

const supported=new Set<string>(notificationEventTypes);
export async function enqueueDomainEvent(db:PoolClient,input:{tenantId:string;actorId:string;action:string;entityType:string;entityId?:string;correlationId:string;metadata?:Record<string,unknown>}){
 if(!input.entityId)return;
 let action=input.action,entityType=input.entityType,entityId=input.entityId;
 if(action==="payment.created")action="payment.received";
 if(action==="payment.allocated"&&input.metadata?.invoiceStatus==="paid"&&typeof input.metadata.invoiceId==="string"){action="invoice.paid";entityType="invoice";entityId=input.metadata.invoiceId;}
 if(!supported.has(action))return;
 await db.query("SELECT set_config('app.worker','true',true)");
 await db.query("INSERT INTO outbox_events(tenant_id,event_type,entity_type,entity_id,actor_user_id,payload,correlation_id) VALUES($1,$2,$3,$4,$5,$6,$7)",[input.tenantId,action as NotificationEventType,entityType,entityId,input.actorId,input.metadata??{},input.correlationId||randomUUID()]);
}
