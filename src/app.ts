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
    ModelAttributes,
    Options as DataBaseConfig,
    Sequelize
} from "sequelize";
import {ListenOptions} from "net";
import {Class, deepClone, deepMerge, getIpAddress, toLowercaseFirst} from "./utils";
import {
    ColumnsConfig,
    columnsKey, isGetter,
    MethodConfig,
    Relations,
    relationsKey,
    Request,
    RouteConfig
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
    private tableConfig: Record<string, ColumnsConfig> = {}
    public router: Router
    public httpServer: Server
    public sequelize: Sequelize
    static baseDir: string
    public apis: App.Api[] = []

    constructor(config: App.Config) {
        super(config.koa)
        App.baseDir = process.cwd()
        this.httpServer = createServer(this.callback())
        this.config = deepMerge(deepClone(App.defaultConfig) as App.Config, config)
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

    extend(name: string, config: ColumnsConfig) {
        if (!this.tableConfig[name]) return this.define(name, config)
        Object.assign(this.tableConfig[name], config)
        return this
    }

    define(name: string, config: ColumnsConfig) {
        if (this.tableConfig[name]) return this.extend(name, config)
        this.tableConfig[name] = config
        return this
    }

    createDataBasePool() {
        this.logger.info('正在创建数据库连接...')
        this.sequelize = new Sequelize(this.config.sequelize)
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
            this.define(toLowercaseFirst(name.replace('Model', '')), Reflect.get(Table, columnsKey))
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
            this.addService(name.replace('Service', ''), new Service())
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
        const relateModel: { name: string, config: ColumnsConfig }[] = []
        for (const [name, config] of Object.entries(this.tableConfig)) {
            if (config.references) {
                relateModel.push({name, config})// 关联表先跳过，避免循环依赖问题
            } else {
                this.sequelize.define(name, config as unknown as ModelAttributes, {timestamps: false})
            }
        }
        // 创建关联表
        for (const {name, config} of relateModel) {
            Object.keys(config).forEach(key => {
                if (config[key].references) {
                    const model = config[key].references
                    if (typeof model !== "string" && isGetter(model.model)) {
                        const modelName: string = toLowercaseFirst(model.model().name.replace('Model', ''))
                        model.model = this.model(modelName)
                    }
                }
            })
            this.sequelize.define(name, config as unknown as ModelAttributes, {timestamps: false})
        }
        this.logger.info('根据Model配置构建模型关联关系...')
        // 根据表关系配置生成模型关系
        for (const [name, table] of models) {
            const relations: Relations = Reflect.get(table.prototype.constructor, relationsKey)
            if (!relations) continue
            // 建立 一对一 关系
            for (const relation of relations.hasOne) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                this.model(name).hasOne(this.model(targetName), relation.options)
            }
            // 建立 一对多 关系
            for (const relation of relations.hasMany) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                this.model(name).hasMany(this.model(targetName), relation.options)
            }
            // 建立 多对一 关系
            for (const relation of relations.belongsTo) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                this.model(name).belongsTo(this.model(targetName), relation.options)
            }
            // 建立 多对多 关系
            for (const relation of relations.belongsToMany) {
                const targetName = [...models.keys()].find(key => models.get(key) === relation.getter())
                if (relation.options.through && isGetter(relation.options.through)) {
                    const modelName: string = toLowercaseFirst(relation.options.through().name.replace('Model', ''))
                    relation.options.through = this.model(modelName)
                }
                this.model(name).belongsToMany(this.model(targetName), relation.options as unknown as BelongsToManyOptions)
            }
        }
        this.logger.info('正在同步数据库Models')
        await this.sequelize.sync({
            alter: {
                drop: false
            }
        }).catch(e => {
            this.logger.error(e)
        })
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

    export type LoadResult<T extends keyof ResultMap> = ResultMap[T]
    export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "mark" | "off"

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
        sequelize: DataBaseConfig
    }
}
