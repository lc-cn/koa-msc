import {Controller,RequestMapping,Request} from "koa-msc";
import {HomeService} from "@/services/home";

@Controller('/')
export class HomeController{
    constructor(public service:HomeService,public services) {
        console.log(service)
    }
    @RequestMapping('hello',[Request.get])
    async hello(ctx){
        return await this.service.getHomeList()
    }
    @RequestMapping('/add',[Request.post])
    async add(ctx){
        return await this.service.add(ctx.query)
    }
}
