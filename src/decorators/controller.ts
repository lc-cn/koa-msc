import {controllers} from '../controller'
import {Class} from "../utils";
export function Controller(path:string,name?:string){
    return (target)=>{
        target.prototype.__ROUTE__={
            path,
            name:name||target.name.replace('Controller','')
        }
        target.prototype.__METHODS__=methodsMap.get(target.prototype.constructor)
        controllers.set(target.prototype.constructor,target)
        return target
    }
}
export enum Request{
    get='GET',
    post='POST',
    put='PUT',
    delete='DELETE'
}
const methodsMap:Map<Class,MethodConfig[]>=new Map<Class, MethodConfig[]>()
export interface RouteConfig{
    path:string,
    name?:string
}
export interface MethodConfig{
    path:string,
    name:string,
    method:Request[]
}
export function RequestMapping(path:string,method:Request|Request[]){
    return (target, name, descriptor)=> {
        let methods=methodsMap.get(target.constructor);
        if(!methods){
            methods=[] as MethodConfig[]
            methodsMap.set(target.constructor,methods)
        }
        methods.push({
            path,
            name,
            method:[].concat(method)
        })
        return descriptor;
    };
}
