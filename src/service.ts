import {
    Attributes, CreateOptions, DestroyOptions,
    FindAndCountOptions, FindOptions,
    Model as SModel,
    ModelStatic,
    NonNullFindOptions,
    Sequelize,
    Transaction, UpdateOptions,
    WhereOptions,
} from "sequelize";
import {Class, PageConfig, Pagination, pagination} from "@/utils";
import {Col, Fn, Literal, MakeNullishOptional} from "sequelize/types/utils";
import {App} from "@/app";
type TransactionCallback=(t:Transaction)=>any|Promise<any>
type Result<T extends (...args:any[])=>any>=T extends (...args:any[])=>infer R?R:unknown
export type ServiceConstruct=Class<BaseService>
export const services:Map<string,ServiceConstruct>=new Map<string, ServiceConstruct>()
export interface BaseService{
    new(...args:any[]):any
}
type Values<M>={[key in keyof Attributes<SModel<M>>]?: Attributes<SModel<M>>[key] | Fn | Col | Literal}
export class BaseService<M extends object=object>{
    public model:ModelStatic<SModel<M>>
    public models:App.Models
    public sequelize:Sequelize
    async transaction():Promise<Transaction>
    transaction<T extends TransactionCallback=TransactionCallback>(callback:T):Result<T>
    async transaction(callback?:TransactionCallback):Promise<Transaction|any>{
        return new Promise(async resolve => {
            const t:Transaction=await this.sequelize.transaction()
            if(callback) return resolve(callback(t))
            resolve(t)
        })
    }
    list(condition:FindOptions<Attributes<SModel<M>>>['where'],options?:Omit<FindOptions<Attributes<SModel<M>>>, 'where'>){
        return this.model.findAll({
            where:condition,
            ...(options||{})
        })
    }
    async pagination(condition:FindAndCountOptions<Attributes<SModel<M>>>['where'],pageNum:number=1,pageSize:number=20,config?:PageConfig,options?:Omit<FindAndCountOptions<Attributes<SModel<M>>>, 'group'|'where'>){
        const {rows:list,count:total}=await this.model.findAndCountAll({
            where:condition,
            limit:pageSize,
            offset:(pageNum-1) * pageSize,
            ...(options||{})
        })
        return pagination({
            list,
            pageNum,
            pageSize,
            total
        },config) as Pagination<SModel<M,M>>
    }
    info(condition:NonNullFindOptions<Attributes<SModel<M>>>['where'],options?:Omit<NonNullFindOptions<Attributes<SModel<M>>>, 'where'>){
        return this.model.findOne({
            where:condition,
            ...(options||{})
        })
    }
    add(info:MakeNullishOptional<M>,options?:CreateOptions<Attributes<SModel<M>>>){
        return this.model.create(info,options)
    }
    update(condition:UpdateOptions<Attributes<SModel<M>>>['where'],payload:Values<M>,options?:Omit<UpdateOptions<Attributes<SModel<M>>>, 'returning'|'where'>){
        return this.model.update(payload,{
            where:condition,
            ...(options||{})
        })
    }
    delete(condition:DestroyOptions<Attributes<SModel<M>>>['where'],options?:Omit<DestroyOptions<Attributes<SModel<M>>>, 'where'>){
        return this.model.destroy({
            where:condition,
            ...(options||{})
        })
    }

}