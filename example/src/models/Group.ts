import {Column, Table, Model, HasMany} from "koa-msc";
import {DataTypes} from "sequelize";
import {User} from "@/models/User";
@Table
@HasMany(()=>User)
export class Group extends Model{
    @Column(DataTypes.STRING)
    name:string
}
export interface GroupInfo{
    id:number
    name?:string
}

