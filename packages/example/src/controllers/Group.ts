import {BaseController, Controller, Describe, Param, Params, Request, RequestMapping, Tag} from "koa-msc";
import {GroupService} from "@/services/Group";
import {Group} from "@/models/Group";

@Controller('/group','分组管理')
export class GroupController extends BaseController<GroupService>{
    @RequestMapping('list',Request.get)
    @Describe('获取分组列表')
    @Tag('分组','列表')
    async hello(){
        return this.service.pagination({},1,10)
    }
    @RequestMapping('/add',[Request.post,Request.get])
    @Describe('添加分组')
    @Tag('分组','添加')
    @Params({name:{type:'string',required:true,min:4,max:10}})
    async add(userInfo:Omit<Group, 'id'>){
        return await this.service.add(userInfo)
    }
    @RequestMapping('/edit',Request.post)
    @Describe('修改分组')
    @Tag('分组','修改')
    @Params({
        id:{type:'number',required:true},
    })
    async edit(params:Required<Pick<Group, 'id'>> & Partial<Omit<Group, 'id'>>){
        const {id,...other}=params
        return await this.service.update({id},other)
    }
    @RequestMapping('/info',Request.get)
    @Describe('获取分组详情')
    @Tag('分组','详情')
    @Param('id',{type:'number',required:true})
    async info({id}:Pick<Group, 'id'>){
        return await this.service.info({id},{
            rejectOnEmpty:true,
            include:{
                model:this.service.models.user,
                attributes:['id','name']
            }
        })
    }
    @RequestMapping('/remove',Request.get)
    @Describe('删除分组')
    @Tag('分组','删除')
    @Param('id',{type:'number',transform:(value)=>Number(value)})
    async remove(condition){
        return await this.service.delete(condition)
    }
}
