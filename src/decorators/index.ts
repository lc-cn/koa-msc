export * from './controller'
export * from './model'
export * from './service'
export function set<K,V>(key:K,value:V,target:Map<K,V>){
    if(target.get(key)) throw new Error('重复定义'+value.toString())
    target.set(key,value)
}
