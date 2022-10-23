import {models} from "@/model";
import {set} from "./index";
export function Model(name){
    if(name && typeof name!=="string"){
        set(name.name.replace('Model',''),name,models)
        return name
    }
    else if(name && typeof name==='string'){
        return (target)=>{
            set(name,target,models)
            return target
        }
    }
    return target=>{
        set(target.name.toString().replace('Model',''),target,models)
        return target
    }
}
