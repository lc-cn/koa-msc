import {services} from "../service";
import {set} from "./";
export function Service(target)
export function Service(name?:string)
export function Service(arg){
    if(arg && typeof arg!=="string"){
        set(arg.prototype.constructor,arg,services)
        return arg
    }
    return target=>{
        set(target.prototype.constructor,target,services)
    }
}
