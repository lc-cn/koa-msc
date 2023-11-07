import {BaseService, Service} from "koa-msc";
import {User} from "@/models/User";
@Service
export class UserService extends BaseService<User>{
}
