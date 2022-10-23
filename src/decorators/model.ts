import {Model, tables} from "@/model";
import {set} from "./index";
import {BelongsToManyOptions, BelongsToOptions, DataType, DataTypes, HasManyOptions, HasOneOptions} from "sequelize";
import {deepClone, toLowercaseFirst} from "@/utils";
export function Table(name){
    if(name && typeof name!=="string"){
        set(toLowercaseFirst(name.name.replace('Model','')),name,tables)
        return name
    }
    else if(name && typeof name==='string'){
        return (target)=>{
            set(name,target,tables)
            return target
        }
    }
    return (target)=>{
        set(toLowercaseFirst(target.name.toString().replace('Model','')),target,tables)
        return target
    }
}
export const relationsKey=Symbol('relations')
export const columnsKey=Symbol('columns')
export interface Relation<O> {
    getter:Getter,
    options:O,
    through?:Getter
}
export interface Relations {
    belongsTo:Relation<BelongsToOptions>[],
    belongsToMany:Relation<BelongsToManyOptions>[],
    hasOne:Relation<HasOneOptions>[],
    hasMany:Relation<HasManyOptions>[]
}
export type ColumnDesc=DataType|{
    allowNull?: boolean
    field?: string
    defaultValue?: unknown
    type: DataType;
    unique?: boolean | string | { name: string; msg: string };
    primaryKey?: boolean;
    autoIncrement?: boolean;
    autoIncrementIdentity?: boolean;
    comment?: string;

    get?(): unknown

    set?(value: unknown): void
}
export interface ColumnConfig{
    [key:string]:ColumnDesc
}
type Getter=()=>Model
function get(target,key,defaultValue){
    if(!Reflect.has(target,key)) Reflect.set(target,key,defaultValue)
    return Reflect.get(target,key)
}
const defaultRelation:Relations={
    belongsTo:[],
    hasMany:[],
    hasOne:[],
    belongsToMany:[]
}
export function BelongsTo(getter:Getter,options?:BelongsToOptions){
    return (target)=>{
        const relations:Relations=get(target,relationsKey,deepClone(defaultRelation))
        relations.belongsTo.push({
            getter,
            options
        })
    }
}
export function BelongsToMany(getter:Getter,options?:BelongsToManyOptions){
    return (target)=>{
        const relations:Relations=get(target,relationsKey,deepClone(defaultRelation))
        relations.belongsToMany.push({
            getter,
            options
        })
    }
}
const typeMap={
    string:DataTypes.TEXT,
    number:DataTypes.NUMBER,
    date:DataTypes.DATE
}
export function Column(config:ColumnDesc){
    return (target,name)=>{
        const columnConfig:ColumnConfig=get(target.constructor,columnsKey,{})
        columnConfig[name]=config
    }
}
export function HasMany(getter:Getter,options?:HasManyOptions){
    return (target)=>{
        const relations:Relations=get(target,relationsKey,deepClone(defaultRelation))
        relations.hasMany.push({
            getter,
            options
        })
    }
}
export function HasOne(getter:Getter,options?:HasOneOptions){
    return (target)=>{
        const relations:Relations=get(target,relationsKey,deepClone(defaultRelation))
        relations.hasOne.push({
            getter,
            options
        })
    }
}
