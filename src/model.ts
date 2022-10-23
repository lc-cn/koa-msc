export class Model{
}
export interface Model{
    new(...args:any[]):any
}
export const tables:Map<string,Model>=new Map<string, Model>()