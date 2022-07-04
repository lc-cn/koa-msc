import {DataType} from "sequelize";
import {ModelAttributeColumnReferencesOptions, ModelValidateOptions} from "sequelize/types/model";
import {Class} from "./utils";

export const models:Map<ModelConfig,any>=new Map<ModelConfig, any>()
export interface ModelConfig extends Class{
    [key:string]:DataType|{
        type: DataType;
        unique?: boolean | string | { name: string; msg: string };
        primaryKey?: boolean;
        autoIncrement?: boolean;
        autoIncrementIdentity?: boolean;
        comment?: string;
        references?: string | ModelAttributeColumnReferencesOptions;
        onUpdate?: string;
        onDelete?: string;
        validate?: ModelValidateOptions;
        values?: readonly string[];
        get?(): unknown;
        set?(val: unknown): void;
    }
}
