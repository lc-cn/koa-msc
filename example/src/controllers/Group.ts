import {Controller, pagination, Param, Params, Request, RequestMapping} from "koa-msc";
import {UserInfo} from '@/models/User'
import {GroupService} from "@/services/Group";

@Controller('/group')
export class GroupController{
    constructor(public service:GroupService,public services) {

    }
    @RequestMapping('list',Request.get)
    async hello(ctx){
        return pagination(await this.service.getGroupList(),1,10)
    }
    @RequestMapping('/add',[Request.post,Request.get])
    @Params({name:{type:'string',required:true,min:4,max:10}})
    async add(userInfo:UserInfo){
        return await this.service.add(userInfo)
    }
    @RequestMapping('/edit',Request.post)
    @Params({
        id:{type:'number',required:true},
    })
    async edit(params){
        const {id,...other}=params
        return await this.service.edit({id},other)
    }
    @Param('id',{type:'number',required:true})
    @RequestMapping('/info',Request.get)
    async info({id}){
        return await this.service.info({id})
    }
    @RequestMapping('/remove',Request.get)
    @Param('id',{type:'number',transform:(value)=>Number(value)})
    async remove(condition){
        return await this.service.remove(condition)
    }
}
