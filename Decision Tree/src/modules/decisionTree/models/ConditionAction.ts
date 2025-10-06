import { Action } from "./Action";
import { ACTION_TYPES } from "../../../_constants";

export interface ConditionParams {
    expression: string;
    trueAction?: Action;
    falseAction?: Action;
}

export class ConditionAction extends Action {
    private expression: string;
    private trueAction?: Action;
    private falseAction?: Action;

    constructor(params: ConditionParams) {
        super(ACTION_TYPES.CONDITION);
        this.expression = params.expression;
        this.trueAction = params.trueAction;
        this.falseAction = params.falseAction;
    }

    async execute(context: Record<string, any> = {}): Promise<void> {
        console.log(`[CONDITION] Evaluating expression: ${this.expression}`);
        
        try {
            const result = this.evaluateExpression(this.expression, context);
            console.log(`[CONDITION] Result: ${result}`);

            if (result) {
                if (this.trueAction) {
                    console.log(`[CONDITION] Executing TRUE branch`);
                    await this.trueAction.execute(context);
                }
            } else {
                if (this.falseAction) {
                    console.log(`[CONDITION] Executing FALSE branch`);
                    await this.falseAction.execute(context);
                }
            }
        } catch (error) {
            console.error(`[CONDITION] Error evaluating expression:`, error);
            throw new Error(`Failed to evaluate condition: ${error}`);
        }
    }

    private evaluateExpression(expression: string, context: Record<string, any>): boolean {
        const contextKeys = Object.keys(context);
        const contextValues = Object.values(context);
        
        try {
            const func = new Function(...contextKeys, `return (${expression});`);
            const result = func(...contextValues);
            
            return Boolean(result);
        } catch (error) {
            throw new Error(`Invalid expression: ${expression}`);
        }
    }

    toJSON(): Record<string, any> {
        return {
            type: this.type,
            expression: this.expression,
            trueAction: this.trueAction?.toJSON(),
            falseAction: this.falseAction?.toJSON(),
        };
    }

    validate(): boolean {
        return !!this.expression && this.expression.length > 0;
    }

    setTrueAction(action: Action): void {
        this.trueAction = action;
    }

    setFalseAction(action: Action): void {
        this.falseAction = action;
    }
}

