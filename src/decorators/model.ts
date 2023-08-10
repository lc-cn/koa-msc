import {BaseModel, models} from "koa-msc/model";
import {set} from "./index";
import {
    Model as SModel,
    BelongsToOptions,
    DataType,
    DataTypes,
    HasManyOptions,
    HasOneOptions, ManyToManyOptions, ModelStatic,
} from "sequelize";
import {deepClone, toLowercaseFirst} from "koa-msc/utils";
import {ModelAttributeColumnReferencesOptions} from "sequelize/types/model";
import {ForeignKeyOptions} from "sequelize/types/associations/base";
import {ThroughOptions} from "sequelize/types/associations/belongs-to-many";
export interface BelongsToManyOptions extends ManyToManyOptions{
    through: ModelStatic<SModel> | string | ThroughOptions|Getter;
    otherKey?: string | ForeignKeyOptions;
    sourceKey?: string;
    targetKey?: string;
    timestamps?: boolean;
    uniqueKey?: string;
}
export function Model(name){
    if(name && typeof name!=="string"){
        set(toLowercaseFirst(name.name.replace('Model','')),name,models)
        return name
    }
    else if(name && typeof name==='string'){
        return (target)=>{
            set(name,target,models)
            return target
        }
    }
    return (target)=>{
        set(toLowercaseFirst(target.name.toString().replace('Model','')),target,models)
        return target
    }
}
export const relationsKey=Symbol('relations')
export const dbNameKey=Symbol('dbName')
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
export type ColumnConfig<M extends SModel =SModel>={
    allowNull?: boolean
    field?: string
    defaultValue?: unknown
    type: DataType;
    unique?: boolean | string | { name: string; msg: string };
    primaryKey?: boolean;
    autoIncrement?: boolean;
    references?:string | {model:Getter,key:string} | ModelAttributeColumnReferencesOptions
    autoIncrementIdentity?: boolean;
    comment?: string;
    get?(this:M): unknown
    set?(this:M,value: unknown): void
}
export function isGetter(source:any):source is Getter{
    return typeof source==="function" && source.prototype===undefined
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
export interface ColumnsConfig{
    [key:string]:ColumnConfig
}
type Getter=()=>BaseModel
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
export function Db(name:string){
    return (target)=>{
        Reflect.set(target,dbNameKey,name)
        return target
    }
}
export function ForeignKey(getter:Getter,key:string='id'){
    return (target,name)=>{
        const columnsConfig:ColumnsConfig=get(target.constructor,columnsKey,{})
        const columnConfig:ColumnConfig=columnsConfig[name]||{type:DataTypes.TEXT}
        columnsConfig[name]={
            ...columnConfig,
            references:{
                model:getter,
                key
            }
        }
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

export function HasMany(getter:Getter,options?:HasManyOptions){
    return (target)=>{
        const relations:Relations=get(target,relationsKey,deepClone(defaultRelation))
        relations.hasMany.push({
            getter,
            options
        })
    }
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
export function isDataType(config:ColumnDesc):config is DataType{
    return typeof config==="string" || (typeof config==='function' && Object.keys(DataTypes).includes(config.name)) || config['validate']
}
export function Column(config:ColumnDesc){
    return (target,name)=>{
        const columnsConfig:ColumnsConfig=get(target.constructor,columnsKey,{})
        const transConfig:ColumnConfig=isDataType(config)?{
            type:config
        }:config
        const columnConfig:ColumnConfig=columnsConfig[name]||{type:transConfig.type}
        columnsConfig[name]={
            ...columnConfig,
            ...transConfig,
        }
    }
}
export function AllowNull(allow:boolean=true){
    return (target,name)=>{
        const columnsConfig:ColumnsConfig=get(target.constructor,columnsKey,{})
        const columnConfig:ColumnConfig=columnsConfig[name]||{type:DataTypes.TEXT}
        columnsConfig[name]={
            ...columnConfig,
            allowNull:!!allow
        }
    }
}
export function PrimaryKey(isPrimaryKey:boolean=true){
    return (target,name)=>{
        const columnsConfig:ColumnsConfig=get(target.constructor,columnsKey,{})
        const columnConfig:ColumnConfig=columnsConfig[name]||{type:DataTypes.TEXT}
        columnsConfig[name]={
            ...columnConfig,
            primaryKey:!!isPrimaryKey
        }
    }
}
export function Comment(comment:string){
    return (target,name)=>{
        const columnsConfig:ColumnsConfig=get(target.constructor,columnsKey,{})
        const columnConfig:ColumnConfig=columnsConfig[name]||{type:DataTypes.TEXT}
        columnsConfig[name]={
            ...columnConfig,
            comment
        }
    }
}
