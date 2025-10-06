import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

export function validateRequest(
    schema: Schema,
    property: "body" | "query" | "params" = "body"
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: false,
        });

        if (error) {
            const errorDetails = error.details.map((detail) => ({
                field: detail.path.join("."),
                message: detail.message,
            }));

            res.status(400).json({
                error: "Validation failed",
                message: "Please check your input data",
                details: errorDetails,
            });
            return;
        }

        req[property] = value;
        next();
    };
}

export const validateBody = (schema: Schema) => validateRequest(schema, "body");
export const validateQuery = (schema: Schema) => validateRequest(schema, "query");
export const validateParams = (schema: Schema) => validateRequest(schema, "params");

