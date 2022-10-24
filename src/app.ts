import Koa from 'koa'
import * as path from "path";
import {createServer, Server} from 'http'
import KoaBodyParser from "koa-bodyparser";
import Schema, {Rules} from 'async-validator'
import * as fs from 'fs'
import {Class, deepClone, deepMerge, toLowercaseFirst} from "./utils";
import {Logger,getLogger} from "log4js";
import {tables, Model} from "./model";
import {services} from "./service";
import {controllers} from "./controller";
export function getIpAddress(){
    const interfaces=networkInterfaces()
    const ips:string[]=[]
    for (let dev in interfaces) {
        for (let j = 0; j < interfaces[dev].length; j++) {
            if (interfaces[dev][j].family === 'IPv4') {
                ips.push(interfaces[dev][j].address);
            }
        }
    }
    if(!ips.length)ips.push('127.0.0.1')
    return ips
}
import {
    Options as DataBaseConfig,
    Sequelize
} from "sequelize";
import {Router,RouterOptions} from "./router";
import {ColumnConfig, columnsKey, MethodConfig, Relations, relationsKey, Request, RouteConfig} from "./decorators";
import {ListenOptions} from "net";
import {networkInterfaces} from "os";

export class App extends Koa{
    public config:App.Config
    public logger:Logger
    public services:Record<string, any>={}
    public controllers:Record<string,Class>={}
    private tableConfig: Record<string, ColumnConfig> = {}
    public router:Router
    public httpServer:Server
    public sequelize:Sequelize
    static baseDir:string=__dirname
    public apis:App.Api[]=[]
    constructor(config:App.Config) {
        super(config.koa)
        this.httpServer=createServer(this.callback())
        this.config=deepMerge(deepClone(App.defaultConfig) as App.Config,config)
        this.router=new Router(this.httpServer,this.config.router)
        this.logger=this.getLogger('[app]')
        this.logger.info('正在初始化...')
        this.init()
        this.use(async (ctx,next)=>{
            const start=+new Date()
            await next()
            this.logger.info(`[${ctx.method}:${ctx.req.url}]:耗时${(+new Date())-start}ms`)
        })
    }
    init(){
        this.createDataBasePool()
        this.initModels()
        this.initServices()
        this.initControllers()
    }
    extend(name: string, config: ColumnConfig) {
        if (!this.tableConfig[name]) return this.define(name, config)
        Object.assign(this.tableConfig[name], config)
        return this
    }

    define(name: string, config:ColumnConfig) {
        if(this.tableConfig[name]) return this.extend(name,config)
        this.tableConfig[name]=config
        return this
    }
    createDataBasePool(){
        this.logger.info('正在创建数据库连接...')
        this.sequelize=new Sequelize(this.config.sequelize)
    }
    get models(){
        return this.sequelize.models
    }
    model(name:string){
        return this.models[name]
    }
    initModels(){
        this.logger.info('正在扫描并创建Models')
        const tableConfigs=this.load(this.config.model_path,"models")
        for(const [name,Table] of tableConfigs){
            this.define(toLowercaseFirst(name.replace('Model','')),Reflect.get(Table,columnsKey))
        }
    }
    before(event:string,listener:(...args:any[])=>any){
        return this.on('before-'+event,listener)
    }
    service(name:string){
        return this.services[name]
    }
    addService(name:string,service){
        name=name.replace('Service','')
        this.services[name]=service
    }
    initServices(){
        this.logger.info('正在扫描并创建Services')
        for(const [name,Service] of this.load(this.config.service_path,'services')){
            this.addService(name.replace('Service',''),new Service())
        }
    }
    controller(name:string){
        return this.controllers[name]
    }
    addController(name:string,controller){
        this.controllers[name]=controller
        const routeConfig:RouteConfig=controller.__ROUTE__;
        const methodsConfig:MethodConfig[]=controller.__METHODS__;
        for(const methodConfig of methodsConfig){
            const path=routeConfig.path.split('/').concat(methodConfig.path.split('/')).filter(Boolean)
                .join('/')
            this.apis.push({
                name:methodConfig.name,
                desc:methodConfig.desc,
                tags:methodConfig.tags||[],
                path,
                methods:methodConfig.method,
                rules:methodConfig.rules||{}
            })
            for(const method of methodConfig.method){
                this.router[method.toLowerCase()]('/'+path,async (ctx)=>{
                    const params={...ctx.query,...ctx.request.params,...ctx.request.body}
                    if(methodConfig.rules){
                        const schema=new Schema(methodConfig.rules)
                        let err=null
                        await schema.validate(params).catch(e=>err=e)
                        if(err) throw err
                    }
                    const result=await this.controllers[name as string][methodConfig.name](...[Object.keys(params).length?params:null,ctx].filter(Boolean))
                    if(result) ctx.body=result
                })
            }
        }
    }
    initControllers(){
        this.logger.info('正在扫描并创建Controllers')
        for(const [name,Controller] of this.load(this.config.controller_path,'controllers')){
            this.addController(name.replace('Controller',''),new Controller(this,this.service(name),this.services))
        }
    }
    load<T extends 'controllers'|'services'|'models'>(dir,type:T):Map<string,App.LoadResult<T>>{
        const url = path.resolve(App.baseDir, dir);
        const files = fs.readdirSync(url);
        files.forEach(file => {
            if(file.endsWith('.js') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))){
                const filename = file.replace('.js', '').replace('.ts','');
                require(url+'/'+filename);
            }
        });
        switch (type){
            case "services":
                return services
            case "models":
                return tables
            case "controllers":
                return controllers
            default:
                throw '未知加载类型'
        }
    }

    getLogger(category:string){
        const logger:Logger=getLogger(category)
        logger.level=this.config.log_level
        return logger
    }
    listen(port?: number, hostname?: string, backlog?: number, listeningListener?: () => void): Server
    listen(port: number, hostname?: string, listeningListener?: () => void): Server
    listen(port: number, backlog?: number, listeningListener?: () => void): Server
    listen(port: number, listeningListener?: () => void): Server
    listen(path: string, backlog?: number, listeningListener?: () => void): Server
    listen(path: string, listeningListener?: () => void): Server
    listen(options: ListenOptions, listeningListener?: () => void): Server
    listen(handle: any, backlog?: number, listeningListener?: () => void): Server
    listen(handle: any, listeningListener?: () => void): Server
    listen(...params:any[]){
        this.httpServer.listen(...params)
        return this.httpServer
    }
    private async wait(event){
        return await Promise.all(this.listeners(event))
    }
    async start(port:number){
        // 通过sequelize定义模型
        Object.entries(this.tableConfig).forEach(([name, config]) => {
            this.sequelize.define(name, config,{timestamps:false})
        })
        // 根据表关系配置生成模型关系
        for(const [name,table] of tables){
            const relations:Relations=Reflect.get(table.prototype.constructor,relationsKey)
            if(!relations) continue
            for(const relation of relations.hasOne){
                const targetName=[...tables.keys()].find(key=>tables.get(key)===relation.getter())
                this.model(name).hasOne(this.model(targetName),relation.options)
            }
            for(const relation of relations.hasMany){
                const targetName=[...tables.keys()].find(key=>tables.get(key)===relation.getter())
                this.model(name).hasMany(this.model(targetName),relation.options)
            }
            for(const relation of relations.belongsTo){
                const targetName=[...tables.keys()].find(key=>tables.get(key)===relation.getter())
                this.model(name).belongsTo(this.model(targetName),relation.options)
            }
            for(const relation of relations.belongsToMany){
                const targetName=[...tables.keys()].find(key=>tables.get(key)===relation.getter())
                this.model(name).belongsToMany(this.model(targetName),relation.options)
            }
        }
        this.logger.info('正在同步数据库Models')
        await this.sequelize.sync({alter:true}).catch(e=>{
            this.logger.error(e)
        })
        // 把模型挂到服务上去，不然用不了
        for(const name in this.services){
            this.services[name].model=this.model(name)
            this.services[name].models=this.models
        }
        this.use(KoaBodyParser())
            .use(this.router.routes())
            .use(this.router.allowedMethods())
        this.listen(port,()=>{
            this.logger.info('server listening at '+ getIpAddress().map(ip=>`http://${ip}:${port}`).join(' and '))
        })
        this.emit('ready')
    }
}
export namespace App{
    interface KoaOptions{
        env?: string
        keys?: string[]
        proxy?: boolean
        subdomainOffset?: number
        proxyIpHeader?: string
        maxIpsCount?: number
    }
    export const defaultConfig:Partial<Config>={
        controller_path:'controllers',
        model_path:'models',
        log_level:'info',
        service_path:'services',
    }
    export interface Api{
        name:string
        path:string
        methods:Request[]
        desc?:string
        tags?:string[]
        rules?:Rules
    }
    interface ResultMap{
        controllers:Class
        models:Model
        services:Class
    }
    export type LoadResult<T extends keyof ResultMap>=ResultMap[T]
    export type LogLevel="trace" | "debug" | "info" | "warn" | "error" | "fatal" | "mark" | "off"
    export interface Config{
        log_level?:LogLevel
        controller_path?:string
        service_path?:string
        model_path?:string
        koa?:KoaOptions
        router?:RouterOptions
        sequelize:DataBaseConfig
    }
}
