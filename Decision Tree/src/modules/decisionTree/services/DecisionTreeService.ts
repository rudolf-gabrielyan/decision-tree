import { DecisionTree } from "../models/DecisionTree";

export interface ExecutionResult {
    success: boolean;
    executionTime: number;
    logs?: string[];
    error?: string;
}

export async function executeDecisionTree(
    treeJson: Record<string, any>
): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
        const tree = DecisionTree.fromJSON(treeJson);

        if (!tree.validate()) {
            throw new Error("Invalid decision tree structure");
        }

        await tree.execute();

        const executionTime = Date.now() - startTime;

        return {
            success: true,
            executionTime,
        };
    } catch (error: any) {
        const executionTime = Date.now() - startTime;

        return {
            success: false,
            executionTime,
            error: error.message || "Unknown error occurred",
        };
    }
}

export async function validateDecisionTree(
    treeJson: Record<string, any>
): Promise<{ valid: boolean; error?: string }> {
    try {
        const tree = DecisionTree.fromJSON(treeJson);
        const isValid = tree.validate();

        return {
            valid: isValid,
            error: isValid ? undefined : "Invalid tree structure",
        };
    } catch (error: any) {
        return {
            valid: false,
            error: error.message || "Failed to parse decision tree",
        };
    }
}

export function serializeDecisionTree(tree: DecisionTree): Record<string, any> {
    return tree.toJSON();
}

export function deserializeDecisionTree(
    treeJson: Record<string, any>
): DecisionTree {
    return DecisionTree.fromJSON(treeJson);
}

