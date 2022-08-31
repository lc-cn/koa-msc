import {models} from "@/model";
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
        return target
    }
}
export type Relation='hasOne'|'hasMany'|'belongsTo'
export function Assocs(relation:Relation,name:string)
export function Assocs(relation:'belongsToMany',name:string,through:string)
export function Assocs(relation:Relation|'belongsToMany',...args:[string]|[string,string]){
    const [name,through]=args
    if(relation==='belongsToMany' && !through) throw new Error(relation+' must define through')
    return target=>{
        target.prototype.__RELATION={
            relation,
            name,
            through
        }
    }
}
