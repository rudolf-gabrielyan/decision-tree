import { Request, Response } from "express";
import {
    executeDecisionTree,
    validateDecisionTree,
} from "../services/DecisionTreeService";

export async function execute(req: Request, res: Response): Promise<void> {
    try {
        const treeJson = req.body;

        const result = await executeDecisionTree(treeJson);

        if (!result.success) {
            console.error("Execution failed:", result.error);
            res.status(400).json({
                error: "Execution failed",
                message: result.error,
                executionTime: result.executionTime,
            });
            return;
        }

        res.status(200).json({
            message: "Decision tree executed successfully",
            data: {
                executionTime: result.executionTime,
            },
        });
    } catch (error: any) {
        console.error("Error executing decision tree:", error);
        console.error("Stack trace:", error.stack);
        res.status(500).json({
            error: "Internal server error",
            message: error.message || "Failed to execute decision tree",
        });
    }
}

export async function validate(req: Request, res: Response): Promise<void> {
    try {
        const treeJson = req.body;

        const result = await validateDecisionTree(treeJson);

        if (!result.valid) {
            res.status(400).json({
                error: "Validation failed",
                message: result.error,
                valid: false,
            });
            return;
        }

        res.status(200).json({
            message: "Decision tree is valid",
            data: {
                valid: true,
            },
        });
    } catch (error: any) {
        console.error("Error validating decision tree:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to validate decision tree",
        });
    }
}

export async function getExamples(req: Request, res: Response): Promise<void> {
    try {
        const examples = [
            {
                name: "Christmas Greeting",
                description: "Check if date is 1.1.2025 and send SMS",
                tree: {
                    rootAction: {
                        type: "condition",
                        expression: "new Date().toDateString() === new Date('2025-01-01').toDateString()",
                        trueAction: {
                            type: "send_sms",
                            phoneNumber: "+1234567890",
                            message: "Happy Christmas!",
                        },
                    },
                    context: {},
                },
            },
            {
                name: "Send Email and SMS",
                description: "Send email, then SMS, then another email",
                tree: {
                    rootAction: {
                        type: "send_email",
                        sender: "service@example.com",
                        receiver: "user@example.com",
                        subject: "First Email",
                        body: "This is the first email",
                    },
                    context: {},
                },
                note: "This example shows a single action. For sequential actions, wrap in a custom SequenceAction or use multiple API calls.",
            },
            {
                name: "10 Optional Mails",
                description: "Loop 10 times, check condition, send SMS if true",
                tree: {
                    rootAction: {
                        type: "loop",
                        iterations: 10,
                        action: {
                            type: "condition",
                            expression: "loopIndex % 2 === 0",
                            trueAction: {
                                type: "send_sms",
                                phoneNumber: "+1234567890",
                                message: "Condition met for iteration",
                            },
                        },
                    },
                    context: {},
                },
            },
        ];

        res.status(200).json({
            message: "Example decision trees",
            data: examples,
        });
    } catch (error: any) {
        console.error("Error getting examples:", error);
        res.status(500).json({
            error: "Internal server error",
            message: "Failed to get examples",
        });
    }
}

