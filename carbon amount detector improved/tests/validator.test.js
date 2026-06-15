/**
 * Unit tests for src/utils/validator.js
 *
 * Run with: node --test tests/validator.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFootprintInput,
  VALID_FUEL_TYPES,
  VALID_DIET_TYPES,
  VALID_SHOPPING_HABITS
} from '../src/utils/validator.js';

// ── Exported constants ────────────────────────────────────────────────────────

test('Exported constants - VALID_FUEL_TYPES contains expected values', () => {
  ['petrol', 'diesel', 'hybrid', 'electric'].forEach((v) =>
    assert.ok(VALID_FUEL_TYPES.includes(v), `${v} should be a valid fuel type`)
  );
});

test('Exported constants - VALID_DIET_TYPES contains expected values', () => {
  ['meat-heavy', 'average', 'vegetarian', 'vegan'].forEach((v) =>
    assert.ok(VALID_DIET_TYPES.includes(v), `${v} should be a valid diet type`)
  );
});

test('Exported constants - VALID_SHOPPING_HABITS contains expected values', () => {
  ['heavy', 'average', 'minimal'].forEach((v) =>
    assert.ok(VALID_SHOPPING_HABITS.includes(v), `${v} should be a valid shopping habit`)
  );
});

// ── Happy-path: fully valid input ─────────────────────────────────────────────

test('Valid input - all fields present and correct', () => {
  const input = {
    electricity:      '120.5',
    electricityGreen: 'true',
    gas:              '0',
    heatingOil:       '',
    carDistance:      15000,
    carFuel:          'hybrid',
    transitHours:     5,
    flightHours:      '2.5',
    dietType:         'vegetarian',
    wasteGenerated:   35,
    recyclingRate:    40,
    shoppingHabits:   'minimal'
  };

  const { isValid, errors, data } = validateFootprintInput(input);

  assert.equal(isValid, true);
  assert.equal(Object.keys(errors).length, 0);

  // Type coercions
  assert.equal(data.electricity,      120.5);
  assert.equal(data.electricityGreen, true);
  assert.equal(data.gas,              0);
  assert.equal(data.heatingOil,       0);    // empty string → default 0
  assert.equal(data.carDistance,      15000);
  assert.equal(data.carFuel,          'hybrid');
  assert.equal(data.transitHours,     5);
  assert.equal(data.flightHours,      2.5);
  assert.equal(data.dietType,         'vegetarian');
  assert.equal(data.wasteGenerated,   35);
  assert.equal(data.recyclingRate,    40);
  assert.equal(data.shoppingHabits,   'minimal');
});

test('Valid input - minimal (only required-ish fields)', () => {
  const { isValid, errors } = validateFootprintInput({
    electricity: 100,
    carFuel:     'petrol',
    dietType:    'average',
    shoppingHabits: 'average'
  });
  assert.equal(isValid, true);
  assert.equal(Object.keys(errors).length, 0);
});

// ── Default values ─────────────────────────────────────────────────────────────

test('Defaults - empty object uses sensible defaults', () => {
  const { isValid, data } = validateFootprintInput({});
  assert.equal(isValid, true);
  assert.equal(data.electricity,      0);
  assert.equal(data.electricityGreen, false);
  assert.equal(data.gas,              0);
  assert.equal(data.heatingOil,       0);
  assert.equal(data.carDistance,      0);
  assert.equal(data.carFuel,          'petrol');
  assert.equal(data.transitHours,     0);
  assert.equal(data.flightHours,      0);
  assert.equal(data.dietType,         'average');
  assert.equal(data.wasteGenerated,   0);
  assert.equal(data.recyclingRate,    0);
  assert.equal(data.shoppingHabits,   'average');
});

test('Defaults - undefined / null / empty string fields fall back to defaults', () => {
  const { isValid, data } = validateFootprintInput({
    electricity:    undefined,
    gas:            null,
    heatingOil:     '',
    transitHours:   null,
    flightHours:    undefined,
    wasteGenerated: '',
    recyclingRate:  undefined
  });
  assert.equal(isValid, true);
  assert.equal(data.electricity,    0);
  assert.equal(data.gas,            0);
  assert.equal(data.heatingOil,     0);
  assert.equal(data.transitHours,   0);
  assert.equal(data.flightHours,    0);
  assert.equal(data.wasteGenerated, 0);
  assert.equal(data.recyclingRate,  0);
});

// ── Negative values ────────────────────────────────────────────────────────────

test('Negative values - rejected across all numeric fields', () => {
  const { isValid, errors } = validateFootprintInput({
    electricity:    -1,
    gas:            -0.01,
    heatingOil:     -100,
    carDistance:    -50,
    transitHours:   -1,
    flightHours:    -5,
    wasteGenerated: -10,
    recyclingRate:  -1
  });
  assert.equal(isValid, false);
  assert.ok(errors.electricity,    'negative electricity should error');
  assert.ok(errors.gas,            'negative gas should error');
  assert.ok(errors.heatingOil,     'negative heatingOil should error');
  assert.ok(errors.carDistance,    'negative carDistance should error');
  assert.ok(errors.transitHours,   'negative transitHours should error');
  assert.ok(errors.flightHours,    'negative flightHours should error');
  assert.ok(errors.wasteGenerated, 'negative wasteGenerated should error');
  assert.ok(errors.recyclingRate,  'negative recyclingRate should error');
});

// ── Out-of-range (above maximum) ──────────────────────────────────────────────

test('Out-of-range values - rejected for all numeric fields', () => {
  const { isValid, errors } = validateFootprintInput({
    electricity:    100_001,
    gas:            100_001,
    heatingOil:     20_001,
    carDistance:    600_000,
    transitHours:   200,
    flightHours:    2000,
    wasteGenerated: 5000,
    recyclingRate:  150
  });
  assert.equal(isValid, false);
  assert.ok(errors.electricity,    'electricity above max should error');
  assert.ok(errors.gas,            'gas above max should error');
  assert.ok(errors.heatingOil,     'heatingOil above max should error');
  assert.ok(errors.carDistance,    'carDistance above max should error');
  assert.ok(errors.transitHours,   'transitHours above max should error');
  assert.ok(errors.flightHours,    'flightHours above max should error');
  assert.ok(errors.wasteGenerated, 'wasteGenerated above max should error');
  assert.ok(errors.recyclingRate,  'recyclingRate above 100 should error');
});

// ── Non-numeric strings ───────────────────────────────────────────────────────

test('Non-numeric strings - rejected for numeric fields', () => {
  const { isValid, errors } = validateFootprintInput({
    electricity:  'abc',
    transitHours: 'xyz',
    recyclingRate: 'fifty'
  });
  assert.equal(isValid, false);
  assert.ok(errors.electricity,  'non-numeric electricity should error');
  assert.ok(errors.transitHours, 'non-numeric transitHours should error');
  assert.ok(errors.recyclingRate,'non-numeric recyclingRate should error');
});

// ── Enum validation ───────────────────────────────────────────────────────────

test('Enum validation - invalid fuel type rejected', () => {
  const { isValid, errors } = validateFootprintInput({ carFuel: 'nuclear' });
  assert.equal(isValid, false);
  assert.ok(errors.carFuel);
});

test('Enum validation - all valid fuel types accepted', () => {
  for (const fuel of VALID_FUEL_TYPES) {
    const { isValid, errors } = validateFootprintInput({ carFuel: fuel });
    assert.equal(isValid, true,    `${fuel} should be valid`);
    assert.equal(Object.keys(errors).length, 0);
  }
});

test('Enum validation - invalid diet type rejected', () => {
  const { isValid, errors } = validateFootprintInput({ dietType: 'carnivore' });
  assert.equal(isValid, false);
  assert.ok(errors.dietType);
});

test('Enum validation - all valid diet types accepted', () => {
  for (const diet of VALID_DIET_TYPES) {
    const { isValid } = validateFootprintInput({ dietType: diet });
    assert.equal(isValid, true, `${diet} should be valid`);
  }
});

test('Enum validation - invalid shopping habit rejected', () => {
  const { isValid, errors } = validateFootprintInput({ shoppingHabits: 'extreme' });
  assert.equal(isValid, false);
  assert.ok(errors.shoppingHabits);
});

test('Enum validation - all valid shopping habits accepted', () => {
  for (const habit of VALID_SHOPPING_HABITS) {
    const { isValid } = validateFootprintInput({ shoppingHabits: habit });
    assert.equal(isValid, true, `${habit} should be valid`);
  }
});

// ── Boundary values ────────────────────────────────────────────────────────────

test('Boundary values - exact maximums are accepted', () => {
  const { isValid } = validateFootprintInput({
    electricity:    50_000,
    gas:            50_000,
    heatingOil:     10_000,
    carDistance:   500_000,
    transitHours:      168,
    flightHours:     1_000,
    wasteGenerated:  2_000,
    recyclingRate:     100
  });
  assert.equal(isValid, true);
});

test('Boundary values - recycling rate 0 and 100 are valid', () => {
  const r0   = validateFootprintInput({ recyclingRate: 0   });
  const r100 = validateFootprintInput({ recyclingRate: 100 });
  assert.equal(r0.isValid,   true);
  assert.equal(r100.isValid, true);
});

test('Boundary values - zero electricity is valid', () => {
  const { isValid } = validateFootprintInput({ electricity: 0 });
  assert.equal(isValid, true);
});

// ── electricityGreen coercion ─────────────────────────────────────────────────

test('electricityGreen - coerces truthy string "true" → true', () => {
  const { data } = validateFootprintInput({ electricityGreen: 'true' });
  assert.equal(data.electricityGreen, true);
});

test('electricityGreen - coerces boolean true → true', () => {
  const { data } = validateFootprintInput({ electricityGreen: true });
  assert.equal(data.electricityGreen, true);
});

test('electricityGreen - coerces string "false" → false', () => {
  const { data } = validateFootprintInput({ electricityGreen: 'false' });
  assert.equal(data.electricityGreen, false);
});

test('electricityGreen - coerces 0 → false', () => {
  const { data } = validateFootprintInput({ electricityGreen: 0 });
  assert.equal(data.electricityGreen, false);
});

// ── Malformed payloads ────────────────────────────────────────────────────────

test('Malformed payload - array body is rejected', () => {
  const { isValid, errors } = validateFootprintInput([]);
  assert.equal(isValid, false);
  assert.ok(errors._body, 'array body should produce a _body error');
});

test('Malformed payload - null body is rejected', () => {
  const { isValid, errors } = validateFootprintInput(null);
  assert.equal(isValid, false);
  assert.ok(errors._body);
});

test('Malformed payload - string body is rejected', () => {
  const { isValid, errors } = validateFootprintInput('hello');
  assert.equal(isValid, false);
  assert.ok(errors._body);
});

// ── Multi-field error accumulation ────────────────────────────────────────────

test('Multi-field errors - all invalid fields reported simultaneously', () => {
  const { isValid, errors } = validateFootprintInput({
    electricity:    -50,
    gas:            999_999,
    carFuel:        'nuclear',
    transitHours:   'abc',
    recyclingRate:  150,
    dietType:       'cookies',
    shoppingHabits: 'extreme'
  });

  assert.equal(isValid, false);
  assert.ok(errors.electricity,    'electricity error expected');
  assert.ok(errors.gas,            'gas error expected');
  assert.ok(errors.carFuel,        'carFuel error expected');
  assert.ok(errors.transitHours,   'transitHours error expected');
  assert.ok(errors.recyclingRate,  'recyclingRate error expected');
  assert.ok(errors.dietType,       'dietType error expected');
  assert.ok(errors.shoppingHabits, 'shoppingHabits error expected');
});

// ── Error message quality ─────────────────────────────────────────────────────

test('Error messages - negative value error references the field name', () => {
  const { errors } = validateFootprintInput({ electricity: -1 });
  assert.ok(
    errors.electricity.toLowerCase().includes('electricity') ||
    errors.electricity.toLowerCase().includes('negative'),
    `Error message should mention field or issue: "${errors.electricity}"`
  );
});

test('Error messages - over-max error references the maximum', () => {
  const { errors } = validateFootprintInput({ gas: 999_999 });
  assert.ok(
    errors.gas.includes('50') || errors.gas.toLowerCase().includes('max'),
    `Error message should reference the maximum: "${errors.gas}"`
  );
});
