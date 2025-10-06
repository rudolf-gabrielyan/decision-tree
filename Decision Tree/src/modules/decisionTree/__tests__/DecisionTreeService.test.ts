import {
    executeDecisionTree,
    validateDecisionTree,
} from '../services/DecisionTreeService';

describe('DecisionTreeService', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('executeDecisionTree', () => {
        it('should execute valid decision tree successfully', async () => {
            const treeJson = {
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '+1234567890',
                    message: 'Test',
                },
            };

            const result = await executeDecisionTree(treeJson);

            expect(result.success).toBe(true);
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
        });

        it('should return error for invalid tree structure', async () => {
            const treeJson = {
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '',
                },
            };

            const result = await executeDecisionTree(treeJson);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should return error for missing rootAction', async () => {
            const treeJson = {};

            const result = await executeDecisionTree(treeJson);

            expect(result.success).toBe(false);
            expect(result.error).toContain('missing rootAction');
        });

        it('should execute tree with context', async () => {
            const treeJson = {
                rootAction: {
                    type: 'condition',
                    expression: 'temperature > 30',
                    trueAction: {
                        type: 'send_sms',
                        phoneNumber: '+1234567890',
                        message: 'Hot',
                    },
                },
                context: { temperature: 35 },
            };

            const result = await executeDecisionTree(treeJson);

            expect(result.success).toBe(true);
        });

        it('should handle loop execution', async () => {
            const treeJson = {
                rootAction: {
                    type: 'loop',
                    iterations: 3,
                    action: {
                        type: 'send_sms',
                        phoneNumber: '+1234567890',
                        message: 'Loop',
                    },
                },
            };

            const result = await executeDecisionTree(treeJson);

            expect(result.success).toBe(true);
        });
    });

    describe('validateDecisionTree', () => {
        it('should validate valid decision tree', async () => {
            const treeJson = {
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '+1234567890',
                },
            };

            const result = await validateDecisionTree(treeJson);

            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should fail validation for invalid tree', async () => {
            const treeJson = {
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '',
                },
            };

            const result = await validateDecisionTree(treeJson);

            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should fail validation for missing rootAction', async () => {
            const treeJson = {};

            const result = await validateDecisionTree(treeJson);

            expect(result.valid).toBe(false);
            expect(result.error).toContain('missing rootAction');
        });
    });
});

