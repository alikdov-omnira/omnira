import type { PoolClient } from "pg";
import type { CreatePropertyCommand,Property,PropertyListQuery,PropertyListResult,UpdatePropertyCommand } from "../../domain/property/property-types.js";

const select=`p.id,p.tenant_id AS "tenantId",p.client_id AS "clientId",p.address_id AS "addressId",p.name,p.property_type AS "propertyType",p.status,p.description,p.version::int,p.created_at AS "createdAt",p.updated_at AS "updatedAt",p.deleted_at AS "archivedAt",
json_build_object('line1',a.line1,'city',a.city,'postalCode',a.postal_code,'countryCode',a.country_code) AS address`;
const sortColumns={name:"p.name",status:"p.status",propertyType:"p.property_type",createdAt:"p.created_at",updatedAt:"p.updated_at"} as const;
export class PropertyRepository {
  async findClient(db:PoolClient,tenantId:string,id:string){return (await db.query<{id:string;status:string;archivedAt:string|null}>("SELECT id,status,deleted_at AS \"archivedAt\" FROM clients WHERE id=$1 AND tenant_id=$2",[id,tenantId])).rows[0];}
  async findById(db:PoolClient,tenantId:string,id:string):Promise<Property|undefined>{return (await db.query<Property>(`SELECT ${select} FROM properties p JOIN addresses a ON a.id=p.address_id AND a.tenant_id=p.tenant_id WHERE p.id=$1 AND p.tenant_id=$2`,[id,tenantId])).rows[0];}
  async create(db:PoolClient,tenantId:string,actorId:string,id:string,addressId:string,input:CreatePropertyCommand):Promise<Property>{
    await db.query("INSERT INTO addresses(id,tenant_id,line1,city,postal_code,country_code,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$7)",[addressId,tenantId,input.address.line1,input.address.city,input.address.postalCode??null,input.address.countryCode,actorId]);
    await db.query("INSERT INTO properties(id,tenant_id,client_id,address_id,name,property_type,status,description,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)",[id,tenantId,input.clientId,addressId,input.name,input.propertyType,input.status??"active",input.description??null,actorId]);
    return (await this.findById(db,tenantId,id))!;
  }
  async list(db:PoolClient,tenantId:string,q:PropertyListQuery):Promise<PropertyListResult>{const values:any[]=[tenantId];const filters=["p.tenant_id=$1"];
    if(q.search){values.push(`%${q.search}%`);filters.push(`(p.name ILIKE $${values.length} OR p.property_type ILIKE $${values.length} OR p.description ILIKE $${values.length})`);}
    if(q.clientId){values.push(q.clientId);filters.push(`p.client_id=$${values.length}`);}if(q.status){values.push(q.status);filters.push(`p.status=$${values.length}`);}if(q.propertyType){values.push(q.propertyType);filters.push(`p.property_type=$${values.length}`);}
    const where=filters.join(" AND ");const total=Number((await db.query<{count:string}>(`SELECT count(*) FROM properties p WHERE ${where}`,values)).rows[0].count);values.push(q.pageSize,(q.page-1)*q.pageSize);
    const items=(await db.query<Property>(`SELECT ${select} FROM properties p JOIN addresses a ON a.id=p.address_id AND a.tenant_id=p.tenant_id WHERE ${where} ORDER BY ${sortColumns[q.sortBy]} ${q.sortOrder==="asc"?"ASC":"DESC"} LIMIT $${values.length-1} OFFSET $${values.length}`,values)).rows;
    return {items,pagination:{page:q.page,pageSize:q.pageSize,total,totalPages:Math.ceil(total/q.pageSize)}};
  }
  async update(db:PoolClient,tenantId:string,actorId:string,id:string,addressId:string,input:UpdatePropertyCommand):Promise<Property|undefined>{
    const fields:{key:keyof UpdatePropertyCommand;column:string}[]=[{key:"clientId",column:"client_id"},{key:"name",column:"name"},{key:"propertyType",column:"property_type"},{key:"status",column:"status"},{key:"description",column:"description"}];const set:string[]=[];const values:any[]=[];
    for(const field of fields)if(input[field.key]!==undefined){values.push(input[field.key]);set.push(`${field.column}=$${values.length}`);}
    values.push(actorId,id,tenantId,input.expectedVersion);const changed=await db.query(`UPDATE properties SET ${set.length?set.join(",")+",":""}updated_by=$${values.length-3},updated_at=now(),version=version+1 WHERE id=$${values.length-2} AND tenant_id=$${values.length-1} AND version=$${values.length} AND deleted_at IS NULL RETURNING id`,values);
    if(!changed.rowCount)return undefined;
    if(input.address){const addressFields:{key:keyof NonNullable<UpdatePropertyCommand["address"]>;column:string}[]=[{key:"line1",column:"line1"},{key:"city",column:"city"},{key:"postalCode",column:"postal_code"},{key:"countryCode",column:"country_code"}];const addressSet:string[]=[];const addressValues:any[]=[];for(const field of addressFields)if(input.address[field.key]!==undefined){addressValues.push(input.address[field.key]);addressSet.push(`${field.column}=$${addressValues.length}`);}if(addressSet.length){addressValues.push(actorId,addressId,tenantId);await db.query(`UPDATE addresses SET ${addressSet.join(",")},updated_by=$${addressValues.length-2},updated_at=now(),version=version+1 WHERE id=$${addressValues.length-1} AND tenant_id=$${addressValues.length}`,addressValues);}}
    return this.findById(db,tenantId,id);
  }
  async archive(db:PoolClient,tenantId:string,actorId:string,id:string,version:number):Promise<Property|undefined>{const row=(await db.query<{addressId:string}>("UPDATE properties SET status='archived',deleted_at=now(),deleted_by=$1,updated_by=$1,updated_at=now(),version=version+1 WHERE id=$2 AND tenant_id=$3 AND version=$4 AND deleted_at IS NULL RETURNING address_id AS \"addressId\"",[actorId,id,tenantId,version])).rows[0];if(!row)return undefined;return this.findById(db,tenantId,id);}
}
