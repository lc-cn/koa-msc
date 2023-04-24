export class BaseModel{
}
export interface BaseModel{
    id?:number
    new(...args:any[]):any
}
export const models:Map<string,BaseModel>=new Map<string, BaseModel>()