import { Action } from "./Action";
import { SendSmsAction } from "./SendSmsAction";
import { SendEmailAction } from "./SendEmailAction";
import { ConditionAction } from "./ConditionAction";
import { LoopAction } from "./LoopAction";
import { ACTION_TYPES } from "../../../_constants";

export class ActionFactory {
    static fromJSON(json: Record<string, any>): Action {
        if (!json || !json.type) {
            throw new Error("Invalid action JSON: missing type");
        }

        switch (json.type) {
            case ACTION_TYPES.SEND_SMS:
                return this.createSendSmsAction(json);

            case ACTION_TYPES.SEND_EMAIL:
                return this.createSendEmailAction(json);

            case ACTION_TYPES.CONDITION:
                return this.createConditionAction(json);

            case ACTION_TYPES.LOOP:
                return this.createLoopAction(json);

            default:
                throw new Error(`Unknown action type: ${json.type}`);
        }
    }

    private static createSendSmsAction(json: Record<string, any>): SendSmsAction {
        if (!json.phoneNumber) {
            throw new Error("SendSmsAction requires phoneNumber");
        }

        return new SendSmsAction({
            phoneNumber: json.phoneNumber,
            message: json.message,
        });
    }

    private static createSendEmailAction(json: Record<string, any>): SendEmailAction {
        if (!json.sender || !json.receiver) {
            throw new Error("SendEmailAction requires sender and receiver");
        }

        return new SendEmailAction({
            sender: json.sender,
            receiver: json.receiver,
            subject: json.subject,
            body: json.body,
        });
    }

    private static createConditionAction(json: Record<string, any>): ConditionAction {
        if (!json.expression) {
            throw new Error("ConditionAction requires expression");
        }

        const condition = new ConditionAction({
            expression: json.expression,
        });

        if (json.trueAction) {
            condition.setTrueAction(this.fromJSON(json.trueAction));
        }

        if (json.falseAction) {
            condition.setFalseAction(this.fromJSON(json.falseAction));
        }

        return condition;
    }

    private static createLoopAction(json: Record<string, any>): LoopAction {
        if (!json.iterations || typeof json.iterations !== "number") {
            throw new Error("LoopAction requires iterations as a number");
        }

        const loop = new LoopAction({
            iterations: json.iterations,
        });

        if (json.action) {
            loop.setAction(this.fromJSON(json.action));
        }

        return loop;
    }

    static validate(json: Record<string, any>): boolean {
        try {
            const action = this.fromJSON(json);
            return action.validate();
        } catch {
            return false;
        }
    }
}

