import { LoopAction } from '../models/LoopAction';
import { SendSmsAction } from '../models/SendSmsAction';
import { ACTION_TYPES } from '../../../_constants';

describe('LoopAction', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should create an instance with iterations', () => {
            const action = new LoopAction({
                iterations: 5,
            });

            expect(action).toBeInstanceOf(LoopAction);
            expect(action.type).toBe(ACTION_TYPES.LOOP);
        });
    });

    describe('execute', () => {
        it('should execute action multiple times', async () => {
            const innerAction = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'Loop message',
            });

            const action = new LoopAction({
                iterations: 3,
                action: innerAction,
            });

            await action.execute();

            expect(consoleSpy).toHaveBeenCalledWith('[LOOP] Starting loop for 3 iterations');
            expect(consoleSpy).toHaveBeenCalledWith('[LOOP] Iteration 1/3');
            expect(consoleSpy).toHaveBeenCalledWith('[LOOP] Iteration 2/3');
            expect(consoleSpy).toHaveBeenCalledWith('[LOOP] Iteration 3/3');
            expect(consoleSpy).toHaveBeenCalledWith('[LOOP] Completed 3 iterations');
        });

        it('should provide loop context to inner action', async () => {
            const innerAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const executeSpy = jest.spyOn(innerAction, 'execute');

            const action = new LoopAction({
                iterations: 2,
                action: innerAction,
            });

            await action.execute({ userId: 123 });

            expect(executeSpy).toHaveBeenCalledWith({
                userId: 123,
                loopIndex: 0,
                loopIteration: 1,
            });
            expect(executeSpy).toHaveBeenCalledWith({
                userId: 123,
                loopIndex: 1,
                loopIteration: 2,
            });
        });

        it('should handle no action gracefully', async () => {
            const action = new LoopAction({
                iterations: 3,
            });

            await action.execute();

            expect(consoleSpy).toHaveBeenCalledWith('[LOOP] No action to execute');
        });
    });

    describe('toJSON', () => {
        it('should serialize to JSON correctly', () => {
            const innerAction = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const action = new LoopAction({
                iterations: 5,
                action: innerAction,
            });

            const json = action.toJSON();

            expect(json).toEqual({
                type: ACTION_TYPES.LOOP,
                iterations: 5,
                action: {
                    type: ACTION_TYPES.SEND_SMS,
                    phoneNumber: '+1234567890',
                    message: undefined,
                },
            });
        });
    });

    describe('validate', () => {
        it('should validate successfully with positive integer', () => {
            const action = new LoopAction({
                iterations: 5,
            });

            expect(action.validate()).toBe(true);
        });

        it('should fail validation with zero iterations', () => {
            const action = new LoopAction({
                iterations: 0,
            });

            expect(action.validate()).toBe(false);
        });

        it('should fail validation with negative iterations', () => {
            const action = new LoopAction({
                iterations: -1,
            });

            expect(action.validate()).toBe(false);
        });
    });
});

