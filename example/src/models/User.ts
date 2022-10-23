import {BelongsTo, Column, Model} from "koa-msc";
import {DataTypes} from "sequelize";
import {Table} from "koa-msc";
import {Group} from "@/models/Group";
@Table
@BelongsTo(()=>Group)
export class User extends Model{
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
