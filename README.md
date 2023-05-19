<div align="center">

# koa-msc
<p>
基于koa+sequelize+mysql，使用装饰器+typescript的一个NodeJS后端开发框架
</p>
<p>

[样例](/example)
</p>

[![node engine](https://img.shields.io/node/v/koa-msc?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)
[![dm](https://shields.io/npm/dm/koa-msc)](https://www.npmjs.com/package/koa-msc)

</div>

# 使用示例
- 完整样例参考example目录代码

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
## 3. 根据你的数据库类型安装对应的依赖
```shell
npm i pg pg-hstore # PostgreSQL
npm i mysql2 # MySQL
npm i mariadb # MariaDB
npm i sqlite3 # SQLite
npm i tedious # Microsoft SQL Server
npm i ibm_db # DB2
```
## 4. 新建入口文件src/index.ts
```typescript
import {App} from 'koa-msc'
const app=new App({
    controller_path:'src/controllers',// 相对于启动目录
    service_path:'src/services',// 相对于启动目录
    model_path:'src/models',// 相对于启动目录
    transaction: true, // 是否启用事务
    log_level:'info', // 日志等级
    router:{ // KoaRouter初始化配置 参见 https://github.com/koajs/router/blob/master/API.md#new-routeropts
        prefix:'/api'
    },
    sequelzie:{ // Sequelize初始化配置 参见 https://www.sequelize.cn/core-concepts/getting-started
        dialect:'sqlite', 
        storage:path.resolve(process.cwd(),'database.sqlite'),
        database:'test',
        logging(msg){
            app.logger.info(msg)
        }
    },
    // ... Koa初始化配置 参见 https://koajs.com/#application
})
app.start(7777)
```
## 5.在src目录新建三个文件夹，分别是`controllers`,`services`,`models`
```shell
mkdir controllers
mkdir services
mkdir models
```
## 6.在对应文件夹新建`User.ts`，并编写相关代码
1. src/models/User.ts

```typescript
import {Column, Model,BaseModel} from 'koa-msc'
import {DataTypes} from "sequelize";

@Model
class UserModel extends BaseModel{
    @Column(DataTypes.STRING)
    user_id: string
    @Column(DataTypes.STRING)
    name: string
    @Column(DataTypes.INTEGER)
    age: number
}
```
2. src/services/User.ts

```typescript
import {Service,BaseService} from 'koa-msc'
import {ModelStatic,Model} from "sequelize";
import {UserModel} from '../models/User'

@Service
export class UserService extends BaseService<UserService>{
}
```
3. src/controllers/User.ts

```typescript
import {Controller,BaseController, RequestMapping, Request} from 'koa-msc'
import {UserService} from '../services/User'

@Controller('/hello')
export class UserController extends BaseController<UserController> {
    @RequestMapping('list', Request.get)
    getUserList(ctx) {
        return this.service.list()
    }

    @RequestMapping('add', Request.post)
    addUser(ctx) {
        return this.service.add(ctx.req.body)
    }
}
```
## 7. 配置启动命令(若为模板仓库创建并未做修改，可跳过)
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
## 8. 启动项目
```shell
npm run dev # 开发环境
npm start # 生产环境(此处仅做演示，真实情况可根据个人需求处理，如tsc)
```
