import {App} from "koa-msc";
import * as process from "process";
import * as path from "path";
const app=new App({
    controller_path:'src/controllers',
    model_path:'src/models',
    service_path:'src/services',
    log_level:'info',
    transaction:true,
    router:{
        prefix:'/api'
    },
    db_config:{
        isDefault:true,
        dialect:'sqlite',
        storage:path.resolve(process.cwd(),'database.sqlite'),
        database:'test',
        logging(sql){
            app.logger.debug(sql)
        },
    }
})

app.use(async (ctx,next)=>{
    let err:Error
    await next().catch(e=>err=e)
    if(err){
        return ctx.body={
            status:'error',
            code:1,
            fields:err['fields'],
            msg:err.message,
            stack:err.stack.replace(new RegExp(process.cwd(),'g'),'').split('\n').map(str=>str.trim())
        }
    }
    if([].concat(ctx.res.getHeader('content-type')).filter(val=>typeof val==='string').some((val)=>val.startsWith('application/json'))){
        ctx.body={
            status:'success',
            data:ctx.body,
            code:0
        }
    }
})
app.router.ws('/test').on('connection',(socket)=>{

    socket.send('你好呀')
    socket.on('message',(data,isBinary)=>{
        if(!isBinary){
            console.log(data.toString())
        }
    })
})
app.start(8089)
