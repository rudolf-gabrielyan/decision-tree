import { Action } from "./Action";
import { ActionFactory } from "./ActionFactory";

export class DecisionTree {
    private rootAction: Action;
    private context: Record<string, any>;

    constructor(rootAction: Action, context: Record<string, any> = {}) {
        this.rootAction = rootAction;
        this.context = context;
    }

    async execute(): Promise<void> {
        console.log("=".repeat(60));
        console.log("Starting Decision Tree Execution");
        console.log("=".repeat(60));
        
        await this.rootAction.execute(this.context);
        
        console.log("=".repeat(60));
        console.log("Decision Tree Execution Completed");
        console.log("=".repeat(60));
    }

    toJSON(): Record<string, any> {
        return {
            rootAction: this.rootAction.toJSON(),
            context: this.context,
        };
    }

    static fromJSON(json: Record<string, any>): DecisionTree {
        if (!json || !json.rootAction) {
            throw new Error("Invalid decision tree JSON: missing rootAction");
        }

        const rootAction = ActionFactory.fromJSON(json.rootAction);
        const context = json.context || {};

        return new DecisionTree(rootAction, context);
    }

    validate(): boolean {
        return this.rootAction.validate();
    }

    getRootAction(): Action {
        return this.rootAction;
    }

    getContext(): Record<string, any> {
        return this.context;
    }

    setContext(context: Record<string, any>): void {
        this.context = context;
    }
}

