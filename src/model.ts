import {BelongsToManyOptions, BelongsToOptions, DataType, HasManyOptions, HasOneOptions} from "sequelize";

export namespace TableColumn {
    export interface Config {
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
}

export interface RelationConfig<T>{
    model:string
    options:T
}

export interface Relation{
    belongsTo:RelationConfig<BelongsToOptions>[]
    hasMany:RelationConfig<HasManyOptions>[]
    hasOne:RelationConfig<HasOneOptions>[]
    belongsToMany:RelationConfig<BelongsToManyOptions>[]
}
export class Table{
    static relations:Relation={belongsTo:[],hasMany:[],belongsToMany:[],hasOne:[]}
    static belongsTo(model:Table,options?:BelongsToOptions){
        this.relations.belongsTo.push({model:model.name.replace('Model',''),options})
    }
    static hasMany(model:Table,options?:HasManyOptions){
        this.relations.hasMany.push({model:model.name.replace('Model',''),options})
    }
    static hasOne(model:Table,options?:HasOneOptions){
        this.relations.hasOne.push({model:model.name.replace('Model',''),options})
    }
    static belongsToMany(model:Table,options?:BelongsToManyOptions){
        this.relations.belongsToMany.push({model:model.name.replace('Model',''),options})
    }
}
export interface Table{
    new(...args:any[]):any
    relations?:Relation
}
export type TableDecl = Record<string, DataType | TableColumn.Config>
export const models:Map<string,Table>=new Map<string, Table>()