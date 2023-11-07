import {Column, BaseModel, Model, HasMany} from "koa-msc";
import {DataTypes} from "sequelize";
import {User} from "@/models/User";
@Model
@HasMany(()=>User)
export class Group extends BaseModel{
    @Column(DataTypes.STRING)
    name:string
}
export interface GroupInfo{
    id:number
    name?:string
}

