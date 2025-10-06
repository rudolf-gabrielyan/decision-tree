import { ActionFactory } from '../models/ActionFactory';
import { SendSmsAction } from '../models/SendSmsAction';
import { SendEmailAction } from '../models/SendEmailAction';
import { ConditionAction } from '../models/ConditionAction';
import { LoopAction } from '../models/LoopAction';

describe('ActionFactory', () => {
    describe('fromJSON', () => {
        it('should create SendSmsAction from JSON', () => {
            const json = {
                type: 'send_sms',
                phoneNumber: '+1234567890',
                message: 'Test',
            };

            const action = ActionFactory.fromJSON(json);

            expect(action).toBeInstanceOf(SendSmsAction);
        });

        it('should create SendEmailAction from JSON', () => {
            const json = {
                type: 'send_email',
                sender: 'sender@example.com',
                receiver: 'receiver@example.com',
            };

            const action = ActionFactory.fromJSON(json);

            expect(action).toBeInstanceOf(SendEmailAction);
        });

        it('should create ConditionAction from JSON', () => {
            const json = {
                type: 'condition',
                expression: 'true',
            };

            const action = ActionFactory.fromJSON(json);

            expect(action).toBeInstanceOf(ConditionAction);
        });

        it('should create LoopAction from JSON', () => {
            const json = {
                type: 'loop',
                iterations: 5,
            };

            const action = ActionFactory.fromJSON(json);

            expect(action).toBeInstanceOf(LoopAction);
        });

        it('should create nested actions', () => {
            const json = {
                type: 'condition',
                expression: 'true',
                trueAction: {
                    type: 'send_sms',
                    phoneNumber: '+1234567890',
                },
            };

            const action = ActionFactory.fromJSON(json) as ConditionAction;

            expect(action).toBeInstanceOf(ConditionAction);
            expect(action.toJSON().trueAction).toBeDefined();
        });

        it('should throw error for missing type', () => {
            const json = {};

            expect(() => ActionFactory.fromJSON(json)).toThrow('Invalid action JSON: missing type');
        });

        it('should throw error for unknown type', () => {
            const json = { type: 'unknown' };

            expect(() => ActionFactory.fromJSON(json)).toThrow('Unknown action type: unknown');
        });

        it('should throw error for SendSmsAction without phoneNumber', () => {
            const json = { type: 'send_sms' };

            expect(() => ActionFactory.fromJSON(json)).toThrow('SendSmsAction requires phoneNumber');
        });

        it('should throw error for SendEmailAction without sender', () => {
            const json = {
                type: 'send_email',
                receiver: 'receiver@example.com',
            };

            expect(() => ActionFactory.fromJSON(json)).toThrow('SendEmailAction requires sender and receiver');
        });

        it('should throw error for ConditionAction without expression', () => {
            const json = { type: 'condition' };

            expect(() => ActionFactory.fromJSON(json)).toThrow('ConditionAction requires expression');
        });

        it('should throw error for LoopAction without iterations', () => {
            const json = { type: 'loop' };

            expect(() => ActionFactory.fromJSON(json)).toThrow('LoopAction requires iterations as a number');
        });
    });

    describe('validate', () => {
        it('should validate valid action JSON', () => {
            const json = {
                type: 'send_sms',
                phoneNumber: '+1234567890',
            };

            expect(ActionFactory.validate(json)).toBe(true);
        });

        it('should fail validation for invalid JSON', () => {
            const json = {};

            expect(ActionFactory.validate(json)).toBe(false);
        });
    });
});

