import {controllers} from '@/controller'
import {Rule, Rules} from 'async-validator'
import {deepClone, deepMerge} from "@/utils";
export function Controller(path:string,name?:string){
    return (target)=>{
        name=name||target.name.replace('Controller','')
        target.prototype.__ROUTE__={
            path,
            name:name||target.name.replace('Controller','')
        }
        target.prototype.__METHODS__=methodsMap.get(target.prototype.constructor)
        controllers.set(name,target)
        return target
    }
}
export enum Request{
    get='GET',
    post='POST',
    put='PUT',
    delete='DELETE'
}
const methodsMap:Map<Function,MethodConfig[]>=new Map<Function, MethodConfig[]>()
export interface RouteConfig{
    path:string,
    name?:string
}
export interface MethodConfig{
    name:string
    path:string
    method:Request[]
    desc?:string
    tags?:string[]
    rules?:Rules
}
export function RequestMapping(path:string,method:Request|Request[]){
    return (target, name, descriptor)=> {
        const methodConfig=getMethod(target,name)
        methodConfig.name=name
        methodConfig.path=path
        methodConfig.method=[].concat(method)
        return descriptor;
    };
}
function getMethod(target,name:string){
    let methods=methodsMap.get(target.constructor);
    if(!methods){
        methods=[] as MethodConfig[]
        methodsMap.set(target.constructor,methods)
    }
    let methodConfig=methods.find(c=>c.name===name)
    if(!methodConfig){
        methodConfig={name,method:[],path:''}
        methods.push(methodConfig)
    }
    return methodConfig
}
export function Param(key:string,value:Rule){
    return (target,name,descriptor)=>{
        const methodConfig=getMethod(target,name)
        const rules=methodConfig.rules||={}
        rules[key]=value
        return descriptor
    }
}
export function Tag(tag:string){
    return (target,name,descriptor)=>{
        const methodConfig=getMethod(target,name)
        const tags=methodConfig.tags||=[]
        if(!tags.includes(tag))tags.push(tag)
        return descriptor
    }
}
export function Describe(desc:string){
    return (target,name,descriptor)=>{
        const methodConfig=getMethod(target,name)
        methodConfig.desc=desc
        return descriptor
    }
}

export function Params(newRules:Rules){
    return (target,name,descriptor)=>{
        const methodConfig=getMethod(target,name)
        const rules=methodConfig.rules||={}
        Object.entries(newRules).forEach(([key,rule])=>{
            rules[key]=rule
        })
        return descriptor
    }
}
export type Pagination<I extends any=any,S extends string='pageSize',N extends string='pageNum',T extends string='total',L extends string='list'>={
    [P in (S|N|T|L)]?:P extends L?I[]:number
}
export interface PageConfig extends Partial<Record<keyof Pagination,string>>{}
export const defaultPageConfig:PageConfig={
    pageNum:'pageNum',
    pageSize:'pageSize',
    total:'total',
    list:'list'
}
export function pagination<I extends any>(list:I[],pageNum:number=1,pageSize:number=10,config:PageConfig=defaultPageConfig):Pagination<I>{
    config=deepMerge(deepClone(defaultPageConfig),config)
    return {
        [config.pageNum]:pageNum,
        [config.pageSize]:pageSize,
        [config.list]:list.filter((_,index)=>index>=(pageNum-1)*pageSize && index<pageNum*pageSize),
        [config.total]:list.length
    }
}
