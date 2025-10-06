export const ACTION_TYPES = {
    SEND_SMS: "send_sms",
    SEND_EMAIL: "send_email",
    CONDITION: "condition",
    LOOP: "loop",
} as const;

export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

