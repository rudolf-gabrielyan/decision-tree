import { Action } from "./Action";
import { ACTION_TYPES } from "../../../_constants";

export interface SendSmsParams {
    phoneNumber: string;
    message?: string;
}

export class SendSmsAction extends Action {
    private phoneNumber: string;
    private message?: string;

    constructor(params: SendSmsParams) {
        super(ACTION_TYPES.SEND_SMS);
        this.phoneNumber = params.phoneNumber;
        this.message = params.message;
    }

    async execute(context?: Record<string, any>): Promise<void> {
        console.log(`[SMS] Sending SMS to: ${this.phoneNumber}`);
        if (this.message) {
            console.log(`[SMS] Message: ${this.message}`);
        }
        if (context) {
            console.log(`[SMS] Context:`, JSON.stringify(context, null, 2));
        }
    }

    toJSON(): Record<string, any> {
        return {
            type: this.type,
            phoneNumber: this.phoneNumber,
            message: this.message,
        };
    }

    validate(): boolean {
        return !!this.phoneNumber && this.phoneNumber.length > 0;
    }
}

