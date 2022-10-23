import {services} from "@/service";
import {set} from "./";
export function Service(target)
export function Service(name?:string)
export function Service(arg){
    if(arg && typeof arg!=="string"){
        set(arg.name.replace('Model',''),arg,services)
        return arg
    }
    else if(arg && typeof arg==='string'){
        return (target)=>{
            set(arg,target,services)
            return target
        }
    }
    return target=>{
        set(target.name.toString().replace('Model',''),target,services)
        return target
    }
}
