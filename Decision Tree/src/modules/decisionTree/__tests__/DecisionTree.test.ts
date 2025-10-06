import { DecisionTree } from '../models/DecisionTree';
import { SendSmsAction } from '../models/SendSmsAction';
import { ConditionAction } from '../models/ConditionAction';

describe('DecisionTree', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should create a decision tree with root action', () => {
            const rootAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const tree = new DecisionTree(rootAction);

            expect(tree).toBeInstanceOf(DecisionTree);
        });

        it('should create a decision tree with context', () => {
            const rootAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const tree = new DecisionTree(rootAction, { userId: 123 });

            expect(tree.getContext()).toEqual({ userId: 123 });
        });
    });

    describe('execute', () => {
        it('should execute the root action', async () => {
            const rootAction = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'Test',
            });

            const tree = new DecisionTree(rootAction);

            await tree.execute();

            expect(consoleSpy).toHaveBeenCalledWith('='.repeat(60));
            expect(consoleSpy).toHaveBeenCalledWith('Starting Decision Tree Execution');
            expect(consoleSpy).toHaveBeenCalledWith('Decision Tree Execution Completed');
        });
    });

    describe('toJSON', () => {
        it('should serialize tree to JSON', () => {
            const rootAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const tree = new DecisionTree(rootAction, { userId: 123 });

            const json = tree.toJSON();

            expect(json).toEqual({
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '+1234567890',
                    message: undefined,
                },
                context: { userId: 123 },
            });
        });
    });

    describe('fromJSON', () => {
        it('should create tree from JSON', () => {
            const json = {
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '+1234567890',
                },
                context: { userId: 123 },
            };

            const tree = DecisionTree.fromJSON(json);

            expect(tree).toBeInstanceOf(DecisionTree);
            expect(tree.getContext()).toEqual({ userId: 123 });
        });

        it('should throw error for missing rootAction', () => {
            const json = { context: {} };

            expect(() => DecisionTree.fromJSON(json)).toThrow('Invalid decision tree JSON: missing rootAction');
        });

        it('should use empty context if not provided', () => {
            const json = {
                rootAction: {
                    type: 'send_sms',
                    phoneNumber: '+1234567890',
                },
            };

            const tree = DecisionTree.fromJSON(json);

            expect(tree.getContext()).toEqual({});
        });
    });

    describe('validate', () => {
        it('should validate tree with valid root action', () => {
            const rootAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const tree = new DecisionTree(rootAction);

            expect(tree.validate()).toBe(true);
        });

        it('should fail validation with invalid root action', () => {
            const rootAction = new SendSmsAction({
                phoneNumber: '',
            });

            const tree = new DecisionTree(rootAction);

            expect(tree.validate()).toBe(false);
        });
    });

    describe('integration tests', () => {
        it('should handle complex nested tree', async () => {
            const json = {
                rootAction: {
                    type: 'condition',
                    expression: 'age >= 18',
                    trueAction: {
                        type: 'send_email',
                        sender: 'system@example.com',
                        receiver: 'user@example.com',
                        subject: 'Welcome',
                    },
                    falseAction: {
                        type: 'send_sms',
                        phoneNumber: '+1234567890',
                        message: 'Too young',
                    },
                },
                context: { age: 25 },
            };

            const tree = DecisionTree.fromJSON(json);

            expect(tree.validate()).toBe(true);
            await tree.execute();

            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Result: true');
        });
    });
});

