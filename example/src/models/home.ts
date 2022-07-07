import {Model} from "koa-msc";
import {DataTypes} from "sequelize";
@Model
export class HomeModel{
    static test=DataTypes.INTEGER
}
