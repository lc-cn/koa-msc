import {Service} from "koa-msc";
import {Model,ModelStatic} from "sequelize";
import {UserInfo} from "@/models/User";
@Service
export class UserService{
    constructor(public model:ModelStatic<Model<UserInfo>>,public models) {
    }
    async getUserList(){
        return await this.model.findAll()
    }
    async add(params){
        return await this.model.create(params)
    }
    async edit(condition:Partial<Pick<UserInfo, 'id'|'userName'>>,update:Partial<Exclude<UserInfo, 'id'>>){
        return await this.model.update(update,{
            where:condition
        })
    }
    async remove(params:Partial<Pick<UserInfo, 'id'|'userName'>>){
        return await this.model.destroy({
            where:params
        })
    }
}
