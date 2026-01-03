// Jest Testing Suite for index.js (Solution 1)

const { someFunctionality } = require('../index');

describe('Testing core functionality of index.js - Solution 1', () => {
    test('should return true when valid input is provided', () => {
        const input = 'validInput';
        const result = someFunctionality(input);
        expect(result).toBe(true);
    });

    test('should return false for invalid input', () => {
        const input = 'invalidInput';
        const result = someFunctionality(input);
        expect(result).toBe(false);
    });

    test('should throw an error if no input is provided', () => {
        expect(() => someFunctionality()).toThrow();
    });

    // Edge case: null input
    test('should throw an error when null is provided', () => {
        expect(() => someFunctionality(null)).toThrow('Input is required');
    });

    // Edge case: undefined input explicitly
    test('should throw an error when undefined is provided explicitly', () => {
        expect(() => someFunctionality(undefined)).toThrow('Input is required');
    });

    // Edge case: empty string
    test('should return false for empty string', () => {
        const result = someFunctionality('');
        expect(result).toBe(false);
    });

    // Edge case: whitespace-only strings
    test('should return false for whitespace-only string', () => {
        const result = someFunctionality('   ');
        expect(result).toBe(false);
    });

    test('should return false for string with tabs and newlines', () => {
        const result = someFunctionality('\t\n');
        expect(result).toBe(false);
    });

    // Edge case: special characters
    test('should return false for string with special characters', () => {
        const result = someFunctionality('!@#$%^&*()');
        expect(result).toBe(false);
    });

    // Edge case: numeric string
    test('should return false for numeric string', () => {
        const result = someFunctionality('12345');
        expect(result).toBe(false);
    });

    // Edge case: non-string types - number
    test('should return false when number is provided', () => {
        const result = someFunctionality(123);
        expect(result).toBe(false);
    });

    // Edge case: non-string types - boolean
    test('should return false when boolean is provided', () => {
        const result = someFunctionality(true);
        expect(result).toBe(false);
    });

    // Edge case: non-string types - object
    test('should return false when object is provided', () => {
        const result = someFunctionality({ key: 'value' });
        expect(result).toBe(false);
    });

    // Edge case: non-string types - array
    test('should return false when array is provided', () => {
        const result = someFunctionality(['validInput']);
        expect(result).toBe(false);
    });

    // Edge case: case sensitivity
    test('should return false for valid input with different case', () => {
        const result = someFunctionality('ValidInput');
        expect(result).toBe(false);
    });

    test('should return false for valid input in uppercase', () => {
        const result = someFunctionality('VALIDINPUT');
        expect(result).toBe(false);
    });

    // Edge case: valid input with extra spaces
    test('should return false for valid input with leading spaces', () => {
        const result = someFunctionality(' validInput');
        expect(result).toBe(false);
    });

    test('should return false for valid input with trailing spaces', () => {
        const result = someFunctionality('validInput ');
        expect(result).toBe(false);
    });

    // Parameterized tests for multiple invalid inputs
    describe('should return false for various invalid inputs', () => {
        const invalidInputs = [
            'invalid',
            'notValid',
            'something else',
            'valid',
            'Input',
            '123validInput',
            'validInput123',
            'valid_input',
            'valid-input',
        ];

        invalidInputs.forEach(input => {
            test(`should return false for input: "${input}"`, () => {
                const result = someFunctionality(input);
                expect(result).toBe(false);
            });
        });
    });
});
