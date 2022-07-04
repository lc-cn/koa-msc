import {Class} from "../utils";
export * from './controller'
export * from './model'
export * from './service'
export function set(key:Class,value,target:Map<Class,any>){
    if(target.get(key)) throw new Error('重复定义'+value.toString())
    target.set(key,value)
}
