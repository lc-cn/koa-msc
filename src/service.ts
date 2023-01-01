import {Model, ModelStatic, Sequelize, Transaction,WhereOptions} from "sequelize";
import {Class, PageConfig, pagination} from "@/utils";
import {MakeNullishOptional} from "sequelize/types/utils";
type TransactionCallback=(t:Transaction)=>any|Promise<any>
type Result<T extends (...args:any[])=>any>=T extends (...args:any[])=>infer R?R:unknown
export type ServiceConstruct=Class<BaseService>
export const services:Map<string,ServiceConstruct>=new Map<string, ServiceConstruct>()
export interface BaseService{
    new(...args:any[]):any
}
export class BaseService<M=Record<string, any>>{
    public model:ModelStatic<Model<M>>
    public models:Record<string, ModelStatic<Model>>
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
    list(condition:WhereOptions<M>){
        return this.model.findAll({
            where:condition
        })
    }
    async pagination(condition:WhereOptions<M>,pageNum:number=1,pageSize:number=2,config?:PageConfig){
        const total=await this.model.count({where:condition})
        if(!total) return {list:[],pageNum,pageSize,total}
        const list=await this.model.findAll({
            where:condition,
            limit:pageNum,
            offset:(pageNum-1)* pageSize
        })
        return pagination({
            list,
            pageNum,
            pageSize,
            total
        },config)
    }
    info(condition:WhereOptions<M>){
        return this.model.findOne({
            where:condition,
            include:[
                {
                    model:this.models.route,
                    through:{attributes:[]},
                },
            ]
        })
    }
    // @ts-ignore
    add(info:MakeNullishOptional<M>){
        return this.model.create(info)
    }
    update(condition:WhereOptions<M>,payload:Partial<M>){
        return this.model.update(payload,{
            where:condition
        })
    }
    delete(condition:WhereOptions<M>){
        return this.model.destroy({
            where:condition
        })
    }

}