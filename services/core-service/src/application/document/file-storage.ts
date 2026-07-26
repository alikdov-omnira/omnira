export type StoredObject={
 provider:"local"|"s3";
 bucket:string;
 key:string;
 sizeBytes:number;
};

export interface FileStorage{
 putObject(input:{key:string;body:Buffer;contentType:string;checksumSha256:string}):Promise<StoredObject>;
 getObject(input:{key:string}):Promise<Buffer>;
 deleteObject(input:{key:string}):Promise<void>;
 headObject(input:{key:string}):Promise<{sizeBytes:number}|undefined>;
}
