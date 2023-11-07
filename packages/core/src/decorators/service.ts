import {services} from "koa-msc/service";
import {set} from "./";
import {toLowercaseFirst} from "koa-msc/utils";
export function Service(target)
export function Service(name?:string)
export function Service(arg){
    if(arg && typeof arg!=="string"){
        set(toLowercaseFirst(arg.name.replace('Model','')),arg,services)
        return arg
    }
    else if(arg && typeof arg==='string'){
        return (target)=>{
            set(arg,target,services)
            return target
        }
    }
    return target=>{
        set(toLowercaseFirst(target.name.toString().replace('Model','')),target,services)
        return target
    }
}
