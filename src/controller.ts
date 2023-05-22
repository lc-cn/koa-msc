import {Class} from "./utils";
import {BaseService} from "koa-msc/service";
import {App} from "koa-msc/app";

export class BaseController<S extends BaseService=BaseService> {
    constructor(public app: App, public service: S, public services: App.Services) {
    }
}

export type ControllerConstruct = Class<BaseController>
export const controllers: Map<string, ControllerConstruct> = new Map<string, ControllerConstruct>()
