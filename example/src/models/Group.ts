import {Model} from "koa-msc";
import {DataTypes} from "sequelize";
import {Table} from "koa-msc";
@Model
export class GroupModel extends Table{
    groupName=DataTypes.STRING
}
export interface UserInfo{
    id:number
    userName?:string
    age?:number
}
