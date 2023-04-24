import {BelongsTo, Column, Model,BaseModel} from "koa-msc";
import {DataTypes} from "sequelize";
import {Group} from "@/models/Group";
@Model
@BelongsTo(()=>Group)
export class User extends BaseModel{
    @Column(DataTypes.STRING)
    public name:string
    @Column({
        type:DataTypes.INTEGER,
        defaultValue:18
    })
    public age:number
}
export interface UserInfo{
    id:number
    name?:string
    age?:number
}
