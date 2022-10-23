import {UserModel} from "@/models/User";
import {GroupModel} from "@/models/Group";
UserModel.belongsTo(GroupModel)
GroupModel.hasMany(UserModel)