import {Class} from "./utils";
import {BaseService} from "@/service";
import {App} from "@/app";
export class BaseController<S=BaseService>{
    constructor(public app:App,public service:S,public services:Record<string, BaseService>){}
}
export type ControllerConstruct=Class<BaseController>
export const controllers:Map<string,ControllerConstruct>=new Map<string, ControllerConstruct>()
