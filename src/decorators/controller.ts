import {controllers} from 'koa-msc/controller'
import {Rule, Rules} from 'async-validator'
import {toLowercaseFirst} from "koa-msc/utils";
export function Controller(path:string,name?:string){
    return (target)=>{
        const ctrName=toLowercaseFirst(target.name.replace('Controller',''))
        name=name||toLowercaseFirst(target.name.replace('Controller',''))
        target.prototype.__ROUTE__={
            path,
            name:name||ctrName
        }
        target.prototype.__METHODS__=methodsMap.get(target.prototype.constructor)
        controllers.set(ctrName,target)
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
    funcName:string
    name?:string
    path:string
    method:Request[]
    desc?:string
    tags?:string[]
    query?:Rules
    body?:Rules
}
export function RequestMapping(path:string,method:Request|Request[]){
    return (target, funcName, descriptor)=> {
        const methodConfig=getMethod(target,funcName)
        if(!methodConfig.name) methodConfig.name=funcName
        methodConfig.path=path
        methodConfig.method=[].concat(method)
        return descriptor;
    };
}
function getMethod(target,funcName:string){
    let methods=methodsMap.get(target.constructor);
    if(!methods){
        methods=[] as MethodConfig[]
        methodsMap.set(target.constructor,methods)
    }
    let methodConfig=methods.find(c=>c.funcName===funcName)
    if(!methodConfig){
        methodConfig={funcName,method:[],path:''}
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
export function Tag(...tags:string[]){
    return (target,name,descriptor)=>{
        const methodConfig=getMethod(target,name)
        methodConfig.tags=tags
        return descriptor
    }
}
export function Describe(name:string,desc?:string){
    return (target,name2,descriptor)=>{
        const methodConfig=getMethod(target,name2)
        methodConfig.name=name
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