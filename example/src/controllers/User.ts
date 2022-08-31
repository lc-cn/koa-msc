import {Controller, pagination, Param, Params, Request, RequestMapping} from "koa-msc";
import {UserService} from "@/services/User";
import {UserInfo} from '@/models/User'

@Controller('/user')
export class UserController{
    constructor(public service:UserService,public services) {
    }
    @RequestMapping('list',Request.get)
    async hello(ctx){
        return pagination(await this.service.getUserList(),1,10)
    }
    @RequestMapping('/add',[Request.post,Request.get])
    @Params({userName:{type:'string',required:true,min:4,max:10}})
    async add(userInfo:UserInfo){
        return await this.service.add(userInfo)
    }
    @RequestMapping('/edit',Request.get)
    @Params({
        id:{type:'number',required:true,transform:(v)=>Number(v)},
        userName:{type:'string',required:true,min:4,max:10}
    })
    async edit(params){
        const {id,...other}=params
        return await this.service.edit({id},other)
    }
    @RequestMapping('/remove',Request.get)
    @Param('id',{type:'number',transform:(value)=>Number(value)})
    @Param('userName',{type:'string'})
    async remove(condition){
        return await this.service.remove(condition)
    }
}
