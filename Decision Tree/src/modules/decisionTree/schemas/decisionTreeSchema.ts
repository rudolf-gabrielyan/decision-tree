import Joi from "joi";

const actionSchema = Joi.object({
    type: Joi.string()
        .valid("send_sms", "send_email", "condition", "loop")
        .required()
        .messages({
            "any.only": "Action type must be one of: send_sms, send_email, condition, loop",
            "any.required": "Action type is required",
        }),
    phoneNumber: Joi.string(),
    message: Joi.string(),
    sender: Joi.string(),
    receiver: Joi.string(),
    subject: Joi.string(),
    body: Joi.string(),
    expression: Joi.string(),
    trueAction: Joi.any(),
    falseAction: Joi.any(),
    iterations: Joi.number().integer().min(1),
    action: Joi.any(),
}).unknown(false);

export const executeDecisionTreeSchema = Joi.object({
    rootAction: actionSchema.required().messages({
        "any.required": "Root action is required",
    }),
    context: Joi.object().optional().default({}),
}).messages({
    "object.base": "Request body must be a valid JSON object",
});

export const validateDecisionTreeSchema = Joi.object({
    rootAction: actionSchema.required().messages({
        "any.required": "Root action is required",
    }),
    context: Joi.object().optional(),
}).messages({
    "object.base": "Request body must be a valid JSON object",
});

