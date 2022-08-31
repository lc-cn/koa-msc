import {Model} from "koa-msc";
import {DataTypes} from "sequelize";
@Model
export class UserModel{
    static userName=DataTypes.STRING
}
export interface UserInfo{
    id:number
    userName?:string
}
