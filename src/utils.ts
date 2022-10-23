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
export interface Class{
    new(...args:any[]):any
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
