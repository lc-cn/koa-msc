import Koa, {Context} from 'koa'
import * as path from "path";
import * as cls from 'cls-hooked'
import {createServer, Server} from 'http'
import KoaBodyParser from "koa-bodyparser";
import Schema, {Rules} from 'async-validator'
import * as fs from 'fs'
import {Logger, getLogger} from "log4js";
import {
    BelongsToManyOptions,
    ModelAttributes, ModelOptions,
    Options as SequelizeConfig,
    Sequelize
} from "sequelize";
import {ListenOptions} from "net";
import {Class, deepClone, deepMerge, getIpAddress, toLowercaseFirst} from "./utils";
import {
    ColumnsConfig,
    columnsKey, dbNameKey, isGetter,
    MethodConfig, optionsKey,
    Relations,
    relationsKey,
    Request,
    RouteConfig, TableConfig
} from "./decorators";
import {Router, RouterOptions} from "./router";
import {models, BaseModel} from "./model";
import {BaseService, ServiceConstruct, services} from "./service";
import {ControllerConstruct, controllers} from "./controller";
import {SequelizeHooks} from "sequelize/types/hooks";
import * as process from "process";


export class App extends Koa {
    public config: App.Config
    public logger: Logger
    public services: App.Services={}
    public controllers: Record<string, ControllerConstruct> = {}
    private tableConfig: Record<string, TableConfig> = {}
    public router: Router
    public httpServer: Server
    public db:App.DbList
    static baseDir: string
    public apis: App.Api[] = []
    get sequelize() {
        return this.db.default
    }
    constructor(config: App.Config) {
        super(config.koa)
        App.baseDir = process.cwd()
        this.httpServer = createServer(this.callback())
        this.config = deepMerge(deepClone(App.defaultConfig) as App.Config, config)
        this.db = new App.DbList(this)
        if(this.config.transaction) {
            const namespace=cls.createNamespace(typeof this.config.transaction==='string'?this.config.transaction:'koa-msc')
            Sequelize.useCLS(namespace)
        }
        this.router = new Router(this.httpServer, this.config.router)
        this.logger = this.getLogger('[app]')
        this.logger.info('正在初始化...')
        this.init()
        this.use(async (ctx, next) => {
            const start = +new Date()
            await next()
            this.logger.info(`[${ctx.method}:${ctx.req.url}]:耗时${(+new Date()) - start}ms`)
        })
    }

    init() {
        this.createDataBasePool()
        this.initModels()
        this.initServices()
        this.initControllers()
    }

    extend(name: string, config: TableConfig,dbName:string='$default') {
        name=`${dbName}.${name}`
        if (!this.tableConfig[name]) return this.define(name, config,dbName)
        Object.assign(this.tableConfig[name], config)
        return this
    }

    define(name: string, config: TableConfig,dbName:string='$default') {
        name=`${dbName}.${name}`
        if (this.tableConfig[name]) return this.extend(name, config,dbName)
        this.tableConfig[name] = config
        return this
    }

    createDataBasePool() {
        this.logger.info('正在创建数据库连接...')
        this.db.init()
    }

    addHook<K extends keyof SequelizeHooks>(type: K, name: string, fn: SequelizeHooks[K])
    addHook<K extends keyof SequelizeHooks>(type: K, fn: SequelizeHooks[K])
    addHook<K extends keyof SequelizeHooks>(type: K, ...args: [string, SequelizeHooks[K]] | [SequelizeHooks[K]]) {
        const [name, fn] = args
        if (typeof name !== "string") {
            this.sequelize.addHook(type, name)
        } else {
            this.sequelize.addHook(type, name, fn)
        }
        return this
    }

    removeHook<K extends keyof SequelizeHooks>(type: K, name: string) {
        this.sequelize.removeHook(type, name)
    }

    hasHook<K extends keyof SequelizeHooks>(type: K) {
        return this.sequelize.hasHook(type)
    }

    hasHooks<K extends keyof SequelizeHooks>(type: K) {
        return this.sequelize.hasHooks(type)
    }

    get models() {
        return this.sequelize.models
    }

    model(name: string) {
        return this.models[name]
    }

    initModels() {
        this.logger.info('正在扫描Models配置')
        const tableConfigs = this.load(this.config.model_path, "models")
        for (const [name, Table] of tableConfigs) {
            this.define(toLowercaseFirst(name.replace('Model', '')), {
                columns:Reflect.get(Table, columnsKey),
                ...Reflect.get(Table, optionsKey)
            },Reflect.get(Table, dbNameKey))
        }
    }

    before(event: string, listener: (...args: any[]) => any) {
        return this.on('before-' + event, listener)
    }

    service(name: string) {
        return this.services[name]
    }

    addService(name: string, service: BaseService) {
        name = name.replace('Service', '')
        service.sequelize = this.sequelize
        this.services[name] = service
    }

    initServices() {
        this.logger.info('正在扫描并创建Services')
        for (const [name, Service] of this.load(this.config.service_path, 'services')) {
            this.addService(name.replace('Service', ''), new Service(this))
        }
    }

    controller(name: string) {
        return this.controllers[name]
    }

    addController(name: string, controller) {
        this.controllers[name] = controller
        const routeConfig: RouteConfig = controller.__ROUTE__;
        const methodsConfig: MethodConfig[] = controller.__METHODS__;
        for (const methodConfig of methodsConfig) {
            const path = routeConfig.path.split('/').concat(methodConfig.path.split('/')).filter(Boolean)
                .join('/')
            this.apis.push({
                name: methodConfig.name,
                desc: methodConfig.desc,
                tags: methodConfig.tags || [],
                group: routeConfig.name,
                path,
                methods: methodConfig.method,
                query: methodConfig.query,
                body: methodConfig.body
            })
            for (const method of methodConfig.method) {
                this.router[method.toLowerCase()]('/' + path, async (ctx: Context) => {
                    let queryObj = JSON.parse(JSON.stringify(ctx['query']))
                    if (queryObj) queryObj = Object.fromEntries(Object.entries(queryObj).map(([key, value]: [string, string]) => {
                        try {
                            return [key, JSON.parse(value)]
                        } catch {
                            return [key, value]
                        }
                    }))
                    if (methodConfig.query) {
                        const schema = new Schema(methodConfig.query)
                        let err = null
                        await schema.validate(queryObj).catch(e => err = e)
                        if (err) throw err
                    }
                    if (methodConfig.body) {
                        const schema = new Schema(methodConfig.body)
                        let err = null
                        await schema.validate(ctx.request['body'] || {}).catch(e => err = e)
                        if (err) throw err
                    }
                    const result = await this.controllers[name as string][methodConfig.funcName](queryObj, ctx.request['body'], ctx)
                    if (result) ctx.body = result
                })
            }
        }
    }

    initControllers() {
        this.logger.info('正在扫描并创建Controllers')
        for (const [name, Controller] of this.load(this.config.controller_path, 'controllers')) {
            this.addController(name.replace('Controller', ''), new Controller(this, this.service(name), this.services))
        }
    }

    load<T extends 'controllers' | 'services' | 'models'>(dir: string, type: T): Map<string, App.LoadResult<T>> {
        const url = path.resolve(App.baseDir, dir);
        const files = fs.readdirSync(url,{withFileTypes:true});
        files.forEach((file) => {
            if(file.isFile()){
                if (file.name.endsWith('.js') || (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts'))) {
                    const filename = file.name.replace('.js', '').replace('.ts', '');
                    require(url + '/' + filename);
                }
            }else if(file.isDirectory() && this.config.deep_scan){
                this.load(dir + '/' + file.name, type);
            }
        });
        switch (type) {
            case "services":
                return services as Map<string, App.LoadResult<T>>
            case "models":
                return models
            case "controllers":
                return controllers as Map<string, App.LoadResult<T>>
            default:
                throw '未知加载类型'
        }
    }

    getLogger(category: string) {
        const logger: Logger = getLogger(category)
        logger.level = this.config.log_level
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
    listen(...params: any[]) {
        this.httpServer.listen(...params)
        return this.httpServer
    }

    private async wait(event) {
        return await Promise.all(this.listeners(event))
    }

    async start(port: number) {

        this.logger.info('根据Model配置创建模型...')
        // 通过sequelize定义模型
        const relateModel: { name: string, config: TableConfig }[] = []
        for (const [name, {columns,...config}] of Object.entries(this.tableConfig)) {
            if (Object.values(columns).some(column=>column.references)) {
                relateModel.push({name, config:{
                        ...config,
                        columns,
                    }})// 关联表先跳过，避免循环依赖问题
            } else {
                const [dbName,tableName] = name.split('.')
                const db=dbName==='$default'?this.sequelize:this.db.get(dbName)
                const options:ModelOptions={
                    ...config,
                    timestamps:!!config.timestamps,
                    createdAt:typeof config.timestamps==='object'?config.timestamps.createdAt:true,
                    updatedAt:typeof config.timestamps==='object'?config.timestamps.updatedAt:true,
                }
                db.define(tableName, columns as unknown as ModelAttributes, options)
            }
        }
        // 创建关联表
        for (const {name, config} of relateModel) {
            const [dbName,tableName] = name.split('.')
            const db=dbName==='$default'?this.sequelize:this.db.get(dbName)
            Object.keys(config).forEach(key => {
                if (config[key].references) {
                    const model = config[key].references
                    if (typeof model !== "string" && isGetter(model.model)) {
                        const modelName: string = toLowercaseFirst(model.model().name.replace('Model', ''))
                        model.model = db.model(modelName)
                        if(!model.model) throw new Error(`未找到模型${modelName} 请确认关联模型存在于同一数据库`)
                    }
                }
            })
            db.define(tableName, config.columns as unknown as ModelAttributes, {timestamps: false})
        }
        this.logger.info('根据Model配置构建模型关联关系...')
        // 根据表关系配置生成模型关系
        for (const [name, table] of models) {
            const dbName=Reflect.get(table.prototype.constructor, dbNameKey)
            const db=dbName?this.db.get(dbName):this.sequelize
            const relations: Relations = Reflect.get(table.prototype.constructor, relationsKey)
            if (!relations) continue
            // 建立 一对一 关系
            for (const relation of relations.hasOne) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                db.model(name).hasOne(db.model(targetName), relation.options)
            }
            // 建立 一对多 关系
            for (const relation of relations.hasMany) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                db.model(name).hasMany(db.model(targetName), relation.options)
            }
            // 建立 多对一 关系
            for (const relation of relations.belongsTo) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                db.model(name).belongsTo(db.model(targetName), relation.options)
            }
            // 建立 多对多 关系
            for (const relation of relations.belongsToMany) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                if (relation.options.through && isGetter(relation.options.through)) {
                    const modelName: string = toLowercaseFirst(relation.options.through().name.replace('Model', ''))
                    relation.options.through = db.model(modelName)
                }
                db.model(name).belongsToMany(db.model(targetName), relation.options as unknown as BelongsToManyOptions)
            }
        }
        this.logger.info('正在同步数据库Models')
        // 同步数据库
        await this.db.sync()
        this.logger.info('挂载Model到对应Service....')
        // 把模型挂到服务上去，不然用不了
        for (const name in this.services) {
            this.services[name].model = this.model(name)
            this.services[name].models = this.models
        }
        this.emit('ready')
        this.use(KoaBodyParser())
            .use(this.router.routes())
            .use(this.router.allowedMethods())
        this.listen(port, () => {
            this.logger.info('server listening at ' + getIpAddress().map(ip => `http://${ip}:${port}`).join(' and '))
        })
        this.emit('start')
    }
}

export namespace App {
    interface KoaOptions {
        env?: string
        keys?: string[]
        proxy?: boolean
        subdomainOffset?: number
        proxyIpHeader?: string
        maxIpsCount?: number
    }

    export const defaultConfig: Partial<Config> = {
        controller_path: path.resolve(process.cwd(), 'src/controllers'),
        model_path: path.resolve(process.cwd(), 'src/models'),
        deep_scan: true,
        log_level: 'info',
        service_path: path.resolve(process.cwd(), 'src/services'),
    }
    export interface Services extends Record<string,BaseService> {
    }
    export interface Models extends Record<string,BaseModel> {

    }
    export class DbList extends Map<string,Sequelize>{
        private readonly configs:DbConfig[]
        constructor(private app:App){
            super()
            this.configs = [].concat(this.app.config.db_config||this.app.config.sequelize||[])
        }
        get default(){
            const defaultDbName = this.configs.find(config => config.isDefault)?.name
            if(!defaultDbName){
                if(this.size===0) throw new Error('未配置默认数据库')
                if(this.size===1) return this.values().next().value as Sequelize
            }
            return this.get(defaultDbName)
        }
        init(){
            const dbConfigs:DbConfig[]=this.configs
            for(const config of dbConfigs){
                const {name=[config.dialect,config.dialect].join(':'),...rest}=config
                if(this.has(name)) throw new Error(`数据库${name}已存在`)
                const sequelize = new Sequelize(rest)
                this.set(name, sequelize)
            }
        }
        async sync(){
            for(const [name,sequelize] of this){
                this.app.logger.info(`正在同步数据库${name}...`)
                await sequelize.sync({
                    alter: {
                        drop: false
                    }
                }).catch(e => {
                    this.app.logger.error(e)
                })
            }
        }
    }
    export interface Api {
        name: string
        path: string
        methods: Request[]
        group?: string
        desc?: string
        tags?: string[]
        query: Rules
        body: Rules
    }

    interface ResultMap {
        controllers: ControllerConstruct
        models: BaseModel
        services: ServiceConstruct
    }
    export interface DbConfig extends SequelizeConfig{
        name?:string
        isDefault?:boolean
    }
    export type LoadResult<T extends keyof ResultMap> = ResultMap[T]
    export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "mark" | "off"
    type MayBeArray<T> = T | T[]
    export interface Config {
        log_level?: LogLevel
        // 是否自动使用事务,传string时表示事务命名空间名称(传boolean时为'koa-msc')
        transaction?:boolean|string
        controller_path?: string
        service_path?: string
        model_path?: string
        deep_scan?: boolean
        koa?: KoaOptions
        router?: RouterOptions
        /**
         * deprecated
         * use db_config instead
         * */
        sequelize?: SequelizeConfig
        db_config?: MayBeArray<DbConfig>
    }
}
