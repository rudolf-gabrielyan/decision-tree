import { ConditionAction } from '../models/ConditionAction';
import { SendSmsAction } from '../models/SendSmsAction';
import { ACTION_TYPES } from '../../../_constants';

describe('ConditionAction', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should create an instance with expression', () => {
            const action = new ConditionAction({
                expression: 'true',
            });

            expect(action).toBeInstanceOf(ConditionAction);
            expect(action.type).toBe(ACTION_TYPES.CONDITION);
        });
    });

    describe('execute', () => {
        it('should execute true branch when condition is true', async () => {
            const trueAction = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'True branch',
            });

            const action = new ConditionAction({
                expression: '2 + 2 === 4',
                trueAction,
            });

            await action.execute();

            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Evaluating expression: 2 + 2 === 4');
            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Result: true');
            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Executing TRUE branch');
        });

        it('should execute false branch when condition is false', async () => {
            const falseAction = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'False branch',
            });

            const action = new ConditionAction({
                expression: '2 + 2 === 5',
                falseAction,
            });

            await action.execute();

            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Result: false');
            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Executing FALSE branch');
        });

        it('should evaluate expression with context variables', async () => {
            const trueAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const action = new ConditionAction({
                expression: 'age >= 18',
                trueAction,
            });

            await action.execute({ age: 25 });

            expect(consoleSpy).toHaveBeenCalledWith('[CONDITION] Result: true');
        });

        it('should throw error for invalid expression', async () => {
            const action = new ConditionAction({
                expression: 'invalid @#$%',
            });

            await expect(action.execute()).rejects.toThrow('Failed to evaluate condition');
        });
    });

    describe('toJSON', () => {
        it('should serialize to JSON correctly', () => {
            const trueAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const action = new ConditionAction({
                expression: 'true',
                trueAction,
            });

            const json = action.toJSON();

            expect(json).toEqual({
                type: ACTION_TYPES.CONDITION,
                expression: 'true',
                trueAction: {
                    type: ACTION_TYPES.SEND_SMS,
                    phoneNumber: '+1234567890',
                    message: undefined,
                },
                falseAction: undefined,
            });
        });
    });

    describe('validate', () => {
        it('should validate successfully with expression', () => {
            const action = new ConditionAction({
                expression: 'true',
            });

            expect(action.validate()).toBe(true);
        });

        it('should fail validation without expression', () => {
            const action = new ConditionAction({
                expression: '',
            });

            expect(action.validate()).toBe(false);
        });
    });
});

