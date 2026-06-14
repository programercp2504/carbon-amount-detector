import test from 'node:test';
import assert from 'node:assert';
import { validateFootprintInput } from '../src/utils/validator.js';

test('Security Validator - Valid inputs', () => {
  const input = {
    electricity: '120.5',
    electricityGreen: 'true',
    gas: '0',
    heatingOil: '',
    carDistance: 15000,
    carFuel: 'hybrid',
    transitHours: 5,
    flightHours: '2.5',
    dietType: 'vegetarian',
    wasteGenerated: 35,
    recyclingRate: 40,
    shoppingHabits: 'minimal'
  };

  const { isValid, errors, data } = validateFootprintInput(input);

  assert.strictEqual(isValid, true);
  assert.strictEqual(Object.keys(errors).length, 0);
  assert.strictEqual(data.electricity, 120.5);
  assert.strictEqual(data.electricityGreen, true);
  assert.strictEqual(data.gas, 0);
  assert.strictEqual(data.heatingOil, 0); // default applied
  assert.strictEqual(data.carDistance, 15000);
  assert.strictEqual(data.carFuel, 'hybrid');
  assert.strictEqual(data.transitHours, 5);
  assert.strictEqual(data.flightHours, 2.5);
  assert.strictEqual(data.dietType, 'vegetarian');
  assert.strictEqual(data.wasteGenerated, 35);
  assert.strictEqual(data.recyclingRate, 40);
  assert.strictEqual(data.shoppingHabits, 'minimal');
});

test('Security Validator - Invalid values and ranges', () => {
  const invalidInput = {
    electricity: -50,          // Negative value
    gas: 999999,              // Exceeds realistic maximum
    carFuel: 'nuclear',        // Invalid enum
    transitHours: 'abc',       // Not a number
    recyclingRate: 150,        // Percent greater than 100
    dietType: 'cookies',       // Invalid enum
    shoppingHabits: 'extreme'  // Invalid enum
  };

  const { isValid, errors } = validateFootprintInput(invalidInput);

  assert.strictEqual(isValid, false);
  assert.strictEqual(errors.electricity, 'electricity cannot be negative');
  assert.strictEqual(errors.gas, 'gas exceeds realistic maximum value (50000)');
  assert.strictEqual(errors.carFuel, 'Invalid fuel type selected');
  assert.strictEqual(errors.transitHours, 'transitHours must be a number');
  assert.strictEqual(errors.recyclingRate, 'Recycling rate must be between 0 and 100%');
  assert.strictEqual(errors.dietType, 'Invalid diet type selected');
  assert.strictEqual(errors.shoppingHabits, 'Invalid shopping habit selection');
});
