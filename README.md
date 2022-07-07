<div align="center">

# koa-msc
<p>
基于koa+sequelize+mysql，使用装饰器+typescript的一个NodeJS后端开发框架
</p>

[![node engine](https://img.shields.io/node/v/oitq?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)
[![dm](https://shields.io/npm/dm/koa-msc)](https://www.npmjs.com/package/koa-msc)

</div>

# 使用示例
## 1.初始化项目
1. [点击这里](https://github.com/l-collect/ts-dev-template/generate) 根据[ts-dev-template](https://github.com/l-collect/ts-dev-template) 模板仓库创建一个你自己的ts项目(需要你有github账号并能正常访问github官网)
2. 使用git拉取刚刚创建好的项目
```shell
git clone https://github.com/用户名/仓库名.git # 此处仅为示范，请勿直接复制
```
## 2. 安装依赖
进入刚刚拉下来的项目文件夹，打开终端并执行一下命令
```shell
npm install koa-msc
```
## 3. 新建入口文件src/index.ts
```typescript
import {App} from 'koa-msc'
const app=new App({
    controller_path:'controllers',
    service_path:'services',
    model_path:'models',
    log_level:'info',
    sequelzie:{
        host:'localhost',
        port:3306,
        database:'xxxx',
        username:'root',
        password:'*******',
        logging(msg){
            app.logger.info(msg)
        }
    }
})
app.start(7777)
```
## 4.在src目录新建三个文件夹，分别是`controllers`,`services`,`models`
```shell
mkdir controllers
mkdir services
mkdir models
```
## 5.在对应文件夹新建`User.ts`，并编写相关代码
1. src/controllers/User.ts
```typescript
import {Controller,RequestMapping,Request} from 'koa-msc'
import {UserService} from '../services/User'
@Controller('/hello')
export class UserController{
    constructor(public service:UserService,public services) {
        this.service=service//将会获取到UserService
        this.services=services//可以通过键值对的形式访问当前系统所有service
    }

    @RequestMapping('list',Request.get)
    getUserList(ctx){
        return this.service.getUserList()
    }
    @RequestMapping('add',Request.post)
    addUser(ctx){
        return this.service.addUser(ctx.req.body)
    }
}
```
2. src/services/User.ts

```typescript
import {Service} from 'koa-msc'
import {ModelStatic,Model} from "sequelize";
import {UserModel} from '../models/User'

@Service
export class UserService {
    constructor(model:ModelStatic<Model<UserModel>>, models) {
        this.model = model//将会获取到UserModel
        this.models = models//可以通过键值对的形式访问当前系统所有model
    }

    getUserList() {
        return this.model.findAll()
    }

    addUser(userInfo) {
        return this.model.create(userInfo)
    }
}
```
3. src/models/User.ts

```typescript
import {Model} from 'koa-msc'
import {DataTypes} from "sequelize";

@Model
class UserModel {
    static user_id:DataTypes.STRING
    static name:DataTypes.STRING
    static age:DataTypes.INTEGER
}
```
## 6. 配置启动命令(若为模板仓库创建并未做修改，可跳过)
在`package.json`的scripts添加启动命令
```json5
{
  // ... 其他配置
  scripts: {
    // ... 其他命令
    start: "node ./lib/index.js",// 依赖 ts-node 需自行安装该依赖,执行前需先npm run build
    build: "tsc --project tsconfig.json && tsc-alias -p tsconfig.json",// 依赖typescript和tsc-alias，需自行安装依赖
    dev: "ts-node-dev -r tsconfig-paths/register ./src/index.ts", // 依赖 ts-node-dev和ts-config-paths 需自行安装该依赖
    // ... 其他命令
  },
  // ... 其他配置
}
```
## 7. 启动项目
```shell
npm run dev # 开发环境
npm start # 生产环境(此处仅做演示，真实情况可根据个人需求处理，如tsc)
```
