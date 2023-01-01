import {Serve, Service} from "koa-msc";
import {UserInfo} from "@/models/User";
import {Transaction} from "sequelize";
@Service
export class UserService extends Serve<UserInfo>{
    async getUserList(){
        const t=await this.transaction()
        return await this.model.findAll({
            include:this.models.group,
            transaction:t
        })
        return this.transaction(async (t:Transaction)=>{
            return await this.model.findAll({
                include:this.models.group,
                transaction:t
            })
        })
    }
    async add(params){
        return await this.model.create(params)
    }
    async edit(condition:Partial<Pick<UserInfo, 'id'|'name'>>,update:Partial<Exclude<UserInfo, 'id'>>){
        return await this.model.update(update,{
            where:condition
        })
    }
    async info(condition:Pick<UserInfo, 'id'>){
        return await this.model.findOne({where:condition})
    }
    async remove(params:Partial<Pick<UserInfo, 'id'|'name'>>){
        return await this.model.destroy({
            where:params
        })
    }
}
