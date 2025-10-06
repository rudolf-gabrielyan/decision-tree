import { Action } from "./Action";
import { ACTION_TYPES } from "../../../_constants";

export interface LoopParams {
    iterations: number;
    action?: Action;
}

export class LoopAction extends Action {
    private iterations: number;
    private action?: Action;

    constructor(params: LoopParams) {
        super(ACTION_TYPES.LOOP);
        this.iterations = params.iterations;
        this.action = params.action;
    }

    async execute(context: Record<string, any> = {}): Promise<void> {
        console.log(`[LOOP] Starting loop for ${this.iterations} iterations`);

        if (!this.action) {
            console.log(`[LOOP] No action to execute`);
            return;
        }

        for (let i = 0; i < this.iterations; i++) {
            console.log(`[LOOP] Iteration ${i + 1}/${this.iterations}`);
            
            const loopContext = {
                ...context,
                loopIndex: i,
                loopIteration: i + 1,
            };

            await this.action.execute(loopContext);
        }

        console.log(`[LOOP] Completed ${this.iterations} iterations`);
    }

    toJSON(): Record<string, any> {
        return {
            type: this.type,
            iterations: this.iterations,
            action: this.action?.toJSON(),
        };
    }

    validate(): boolean {
        return this.iterations > 0 && Number.isInteger(this.iterations);
    }

    setAction(action: Action): void {
        this.action = action;
    }
}

