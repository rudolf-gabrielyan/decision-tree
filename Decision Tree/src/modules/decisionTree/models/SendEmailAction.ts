import { Action } from "./Action";
import { ACTION_TYPES } from "../../../_constants";

export interface SendEmailParams {
    sender: string;
    receiver: string;
    subject?: string;
    body?: string;
}

export class SendEmailAction extends Action {
    private sender: string;
    private receiver: string;
    private subject?: string;
    private body?: string;

    constructor(params: SendEmailParams) {
        super(ACTION_TYPES.SEND_EMAIL);
        this.sender = params.sender;
        this.receiver = params.receiver;
        this.subject = params.subject;
        this.body = params.body;
    }

    async execute(context?: Record<string, any>): Promise<void> {
        console.log(`[EMAIL] Sending email from: ${this.sender} to: ${this.receiver}`);
        if (this.subject) {
            console.log(`[EMAIL] Subject: ${this.subject}`);
        }
        if (this.body) {
            console.log(`[EMAIL] Body: ${this.body}`);
        }
        if (context) {
            console.log(`[EMAIL] Context:`, JSON.stringify(context, null, 2));
        }
    }

    toJSON(): Record<string, any> {
        return {
            type: this.type,
            sender: this.sender,
            receiver: this.receiver,
            subject: this.subject,
            body: this.body,
        };
    }

    validate(): boolean {
        return !!this.sender && !!this.receiver && 
               this.sender.length > 0 && this.receiver.length > 0;
    }
}

