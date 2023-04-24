import { BaseController, Controller, Param, Params, Request, RequestMapping} from "koa-msc";
import {UserInfo} from '@/models/User'
import {GroupService} from "@/services/Group";
import {Group} from "@/models/Group";

@Controller('/group')
export class GroupController extends BaseController<GroupService>{
    @RequestMapping('list',Request.get)
    async hello(){
        return this.service.pagination({},1,10)
    }
    @RequestMapping('/add',[Request.post,Request.get])
    @Params({name:{type:'string',required:true,min:4,max:10}})
    async add(userInfo:Omit<Group, 'id'>){
        return await this.service.add(userInfo)
    }
    @RequestMapping('/edit',Request.post)
    @Params({
        id:{type:'number',required:true},
    })
    async edit(params:Required<Pick<Group, 'id'>> & Partial<Omit<Group, 'id'>>){
        const {id,...other}=params
        return await this.service.update({id},other)
    }
    @Param('id',{type:'number',required:true})
    @RequestMapping('/info',Request.get)
    async info({id}:Pick<Group, 'id'>){
        return await this.service.info({id})
    }
    @RequestMapping('/remove',Request.get)
    @Param('id',{type:'number',transform:(value)=>Number(value)})
    async remove(condition){
        return await this.service.delete(condition)
    }
}
