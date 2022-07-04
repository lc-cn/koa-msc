import {models} from "../model";
import {set} from "./index";

export function Model(target)
export function Model(name?:string)
export function Model(name){
    if(name && typeof name!=="string"){
        set(name.prototype.constructor,name,models)
        return name
    }
    return target=>{
        set(target.name.toString().replace('Model',''),target,models)
    }
}
