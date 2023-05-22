import {BaseController, Controller, Describe, Param, Params, Request, RequestMapping, Tag} from "koa-msc";
import {UserService} from "@/services/User";
import {User} from '@/models/User'

@Controller('/user','用户管理')
export class UserController extends BaseController<UserService>{
    @RequestMapping('list',Request.get)
    @Describe('获取用户列表')
    @Tag('用户','列表')
    async hello(){
        return this.service.pagination({},1,10)
    }
    @RequestMapping('/add',[Request.post,Request.get])
    @Describe('添加用户')
    @Tag('用户','添加')
    @Params({name:{type:'string',required:true,min:4,max:10}})
    async add(userInfo:Omit<User, 'id'>){
        return await this.service.add(userInfo)
    }
    @RequestMapping('/edit',Request.post)
    @Describe('修改用户')
    @Tag('用户','修改')
    @Params({
        id:{type:'number',required:true,transform:(v)=>Number(v)},
        groupId:{type:'string',required:true}
    })
    async edit(params:Required<Pick<User, 'id'>> & Partial<Omit<User, 'id'>>){
        const {id,...other}=params
        return await this.service.update({id},other)
    }
    @RequestMapping('/info',Request.get)
    @Describe('获取用户详情')
    @Tag('用户','详情')
    @Param('id',{type:'number',required:true})
    async info({id}:Pick<User, 'id'>){
        return await this.service.info({id},{
            rejectOnEmpty: true,
            include: {
                model:this.service.models.group,
            }
        })
    }
    @RequestMapping('/remove',Request.delete)
    @Describe('删除用户')
    @Tag('用户','删除')
    @Param('id',{type:'number',transform:(value)=>Number(value)})
    async remove(condition){
        return await this.service.delete(condition)
    }
}
