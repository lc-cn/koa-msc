import {Service} from "koa-msc";
import {Model,ModelStatic} from "sequelize";
import {GroupInfo} from "@/models/Group";
@Service
export class GroupService{
    public model:ModelStatic<Model<GroupInfo>>
    public models
    constructor() {
    }
    async getGroupList(){
        return await this.model.findAll({
            include:this.models.user
        })
    }
    async add(params){
        return await this.model.create(params)
    }
    async edit(condition:Partial<Pick<GroupInfo, 'id'|'name'>>,update:Partial<Exclude<GroupInfo, 'id'>>){
        return await this.model.update(update,{
            where:condition
        })
    }
    async info(condition:Pick<GroupInfo, 'id'>){
        return await this.model.findOne({where:condition})
    }
    async remove(params:Partial<Pick<GroupInfo, 'id'|'name'>>){
        return await this.model.destroy({
            where:params
        })
    }
}
