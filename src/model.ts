export class BaseModel{
}
export interface BaseModel{
    new(...args:any[]):any
}
export const models:Map<string,BaseModel>=new Map<string, BaseModel>()