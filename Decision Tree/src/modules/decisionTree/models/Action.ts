import { ActionType } from "../../../_constants";

export abstract class Action {
    public readonly type: ActionType;

    constructor(type: ActionType) {
        this.type = type;
    }

    abstract execute(context?: Record<string, any>): Promise<void>;

    abstract toJSON(): Record<string, any>;

    abstract validate(): boolean;
}

