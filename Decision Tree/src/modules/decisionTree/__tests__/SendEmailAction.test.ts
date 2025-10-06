import { SendEmailAction } from '../models/SendEmailAction';
import { ACTION_TYPES } from '../../../_constants';

describe('SendEmailAction', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('constructor', () => {
        it('should create an instance with all parameters', () => {
            const action = new SendEmailAction({
                sender: 'sender@example.com',
                receiver: 'receiver@example.com',
                subject: 'Test Subject',
                body: 'Test Body',
            });

            expect(action).toBeInstanceOf(SendEmailAction);
            expect(action.type).toBe(ACTION_TYPES.SEND_EMAIL);
        });
    });

    describe('execute', () => {
        it('should log email details', async () => {
            const action = new SendEmailAction({
                sender: 'sender@example.com',
                receiver: 'receiver@example.com',
                subject: 'Test Subject',
                body: 'Test Body',
            });

            await action.execute();

            expect(consoleSpy).toHaveBeenCalledWith(
                '[EMAIL] Sending email from: sender@example.com to: receiver@example.com'
            );
            expect(consoleSpy).toHaveBeenCalledWith('[EMAIL] Subject: Test Subject');
            expect(consoleSpy).toHaveBeenCalledWith('[EMAIL] Body: Test Body');
        });
    });

    describe('toJSON', () => {
        it('should serialize to JSON correctly', () => {
            const action = new SendEmailAction({
                sender: 'sender@example.com',
                receiver: 'receiver@example.com',
                subject: 'Test',
                body: 'Body',
            });

            const json = action.toJSON();

            expect(json).toEqual({
                type: ACTION_TYPES.SEND_EMAIL,
                sender: 'sender@example.com',
                receiver: 'receiver@example.com',
                subject: 'Test',
                body: 'Body',
            });
        });
    });

    describe('validate', () => {
        it('should validate successfully with sender and receiver', () => {
            const action = new SendEmailAction({
                sender: 'sender@example.com',
                receiver: 'receiver@example.com',
            });

            expect(action.validate()).toBe(true);
        });

        it('should fail validation without sender', () => {
            const action = new SendEmailAction({
                sender: '',
                receiver: 'receiver@example.com',
            });

            expect(action.validate()).toBe(false);
        });

        it('should fail validation without receiver', () => {
            const action = new SendEmailAction({
                sender: 'sender@example.com',
                receiver: '',
            });

            expect(action.validate()).toBe(false);
        });
    });
});

