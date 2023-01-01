import {controllers} from '@/controller'
import {Rule, Rules} from 'async-validator'
import {toLowercaseFirst} from "@/utils";
export function Controller(path:string,name?:string){
    return (target)=>{
        name=name||toLowercaseFirst(target.name.replace('Controller',''))
        target.prototype.__ROUTE__={
            path,
            name:name||toLowercaseFirst(target.name.replace('Controller',''))
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
    query?:Rules
    body?:Rules
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
        const methodConfig:MethodConfig=getMethod(target,name)
        const rules=methodConfig.query||={}
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
        const rules=methodConfig.query||={}
        Object.entries(newRules).forEach(([key,rule])=>{
            rules[key]=rule
        })
        return descriptor
    }
}
export function Body(newRules:Rules){
    return (target,name,descriptor)=>{
        const methodConfig=getMethod(target,name)
        const rules=methodConfig.body||={}
        Object.entries(newRules).forEach(([key,rule])=>{
            rules[key]=rule
        })
        return descriptor
    }
}