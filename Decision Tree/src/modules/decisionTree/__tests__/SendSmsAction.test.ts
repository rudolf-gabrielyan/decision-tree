import { SendSmsAction } from '../models/SendSmsAction';
import { ACTION_TYPES } from '../../../_constants';

describe('SendSmsAction', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should create an instance with required parameters', () => {
            const action = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'Test message',
            });

            expect(action).toBeInstanceOf(SendSmsAction);
            expect(action.type).toBe(ACTION_TYPES.SEND_SMS);
        });

        it('should create an instance without optional message', () => {
            const action = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            expect(action).toBeInstanceOf(SendSmsAction);
        });
    });

    describe('execute', () => {
        it('should log SMS details', async () => {
            const action = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'Test message',
            });

            await action.execute();

            expect(consoleSpy).toHaveBeenCalledWith('[SMS] Sending SMS to: +1234567890');
            expect(consoleSpy).toHaveBeenCalledWith('[SMS] Message: Test message');
        });

        it('should log context when provided', async () => {
            const action = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            const context = { userId: 123 };
            await action.execute(context);

            expect(consoleSpy).toHaveBeenCalledWith('[SMS] Context:', JSON.stringify(context, null, 2));
        });
    });

    describe('toJSON', () => {
        it('should serialize to JSON correctly', () => {
            const action = new SendSmsAction({
                phoneNumber: '+1234567890',
                message: 'Test message',
            });

            const json = action.toJSON();

            expect(json).toEqual({
                type: ACTION_TYPES.SEND_SMS,
                phoneNumber: '+1234567890',
                message: 'Test message',
            });
        });
    });

    describe('validate', () => {
        it('should validate successfully with phone number', () => {
            const action = new SendSmsAction({
                phoneNumber: '+1234567890',
            });

            expect(action.validate()).toBe(true);
        });

        it('should fail validation without phone number', () => {
            const action = new SendSmsAction({
                phoneNumber: '',
            });

            expect(action.validate()).toBe(false);
        });
    });
});

