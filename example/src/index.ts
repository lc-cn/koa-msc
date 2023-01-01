import {App} from "koa-msc";
import {join} from 'path'
const app=new App({
    controller_path:join(__dirname,'controllers'),
    model_path:join(__dirname,'models'),
    service_path:join(__dirname,'services'),
    router:{
        prefix:'/api'
    },
    sequelize:{
        host:'148.70.201.93',
        database:'koa_test',
        logging(sql){
            app.logger.debug(sql)
        },
        dialect:'mysql',
        username:'root',
        password:'l196023.'
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
