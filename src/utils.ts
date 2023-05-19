import {networkInterfaces} from "os";

export function deepMerge<T extends any>(base:T, ...from:T[]):T{
    if(from.length===0){
        return base
    }
    if(typeof base!=='object'){
        return base
    }
    if(Array.isArray(base)){
        return base.concat(...from) as T
    }
    for (const item of from){
        for(const key in item){
            if(base.hasOwnProperty(key)){
                if(typeof base[key]==='object'){
                    base[key]=deepMerge(base[key],item[key])
                }else{
                    base[key]=item[key]
                }
            }else{
                base[key]=item[key]
            }
        }
    }
    return base
}
// 深拷贝
export function deepClone<T extends any>(obj:T):T {
    if(typeof obj!=='object') return obj
    if(!obj) return obj
    //判断拷贝的obj是对象还是数组
    if(Array.isArray(obj)) return obj.map((item)=>deepClone(item)) as T
    const objClone={} as T
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (obj[key] && typeof obj[key] === "object") {
                objClone[key] = deepClone(obj[key]);
            } else {
                objClone[key] = obj[key];
            }
        }
    }
    return objClone;
}
/** 数据类型 */
export enum EnumDataType {

    number = '[object Number]',
    string = '[object String]',
    boolean = '[object Boolean]',
    null = '[object Null]',
    undefined = '[object Undefined]',
    object = '[object Object]',
    array = '[object Array]',
    function = '[object Function]',
    date = '[object Date]',
    regexp = '[object RegExp]',
    promise = '[object Promise]',
    set = '[object Set]',
    map = '[object Map]',
    file = '[object File]'
}
export function isNumber<T extends number>(data: T | unknown): data is T {
    return Object.prototype.toString.call(data) === EnumDataType.number;
}
export function isString<T extends string>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.string;
}
export function isBoolean<T extends boolean>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.boolean;
}
export function isNull<T extends null>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.null;
}
export function isUndefined<T extends undefined>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.undefined;
}
export function isObject<T extends Record<string, any>>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.object;
}
export function isArray<T extends any[]>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.array;
}
export function isFunction<T extends (...args: any[]) => any | void | never>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.function;
}
export function isDate<T extends Date>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.date;
}
export function isRegExp<T extends RegExp>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.regexp;
}
export function isPromise<T extends Promise<any>>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.promise;
}
export function isSet<T extends Set<any>>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.set;
}
export function isMap<T extends Map<any, any>>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.map;
}
export function isFile<T extends File>(data: T | unknown): data is T {

    return Object.prototype.toString.call(data) === EnumDataType.file;
}
export interface Class<T=any>{
    new(...args:any[]):T
}
export function toLowercaseFirst(str){
    if(!str) return str
    if(typeof str!=='string') return str
    return str[0].toLowerCase()+str.slice(1)
}
export function Mixin(base:Class,...classes:Class[]){
    classes.forEach(ctr => {
        Object.getOwnPropertyNames(ctr.prototype).forEach(name => {
            if(name==='constructor') return
            base.prototype[name] = ctr.prototype[name];
        });
    });
    return base
}

export type Pagination<I extends any=any,S extends string='pageSize',N extends string='pageNum',T extends string='total',L extends string='list'>={
    [P in (S|N|T|L)]?:P extends L?I[]:number
}
export interface PageConfig extends Partial<Record<keyof Pagination,string>>{}
export const defaultPageConfig:PageConfig={
    pageNum:'pageNum',
    pageSize:'pageSize',
    total:'total',
    list:'list'
}
export type DataInfo<I extends any>={
    list:I[]
    pageSize:number
    pageNum:number
    total:number
}
export function pagination<I extends any>(dataInfo:DataInfo<I>,config:PageConfig=defaultPageConfig):Pagination<I>{
    config=deepMerge(deepClone(defaultPageConfig),config)
    return {
        [config.pageNum]:dataInfo.pageNum,
        [config.pageSize]:dataInfo.pageSize,
        [config.list]:dataInfo.list,
        [config.total]:dataInfo.total
    }
}

export function getIpAddress() {
    const interfaces = networkInterfaces()
    const ips: string[] = []
    for (let dev in interfaces) {
        for (let j = 0; j < interfaces[dev].length; j++) {
            if (interfaces[dev][j].family === 'IPv4') {
                ips.push(interfaces[dev][j].address);
            }
        }
    }
    if (!ips.length) ips.push('127.0.0.1')
    return ips
}

