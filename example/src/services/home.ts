import {Service} from "koa-msc";
import {Model,ModelStatic} from "sequelize";
import {HomeModel} from "@/models/home";
@Service
export class HomeService{
    constructor(public model:ModelStatic<Model<HomeModel>>,public models) {
    }
    async getHomeList(){
        return await this.model.findAll()
    }
    async add(params){
        const result=await this.model.create(params)
        console.log(result.get('test'))
    }
}
