import {App} from "koa-msc";
import {join} from 'path'
const app=new App({
    controller_path:join(__dirname,'controllers'),
    model_path:join(__dirname,'models'),
    service_path:join(__dirname,'services'),
    sequelize:{
        host:'localhost',
        database:'koa_test',
        logging(sql){
            app.logger.debug(sql)
        },
        dialect:'mysql',
        username:'root',
        password:'123456'
    }
})
app.start(8080)
