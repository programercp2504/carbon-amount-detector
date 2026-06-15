/**
 * Unit tests for src/utils/calculator.js
 *
 * Run with: node --test tests/calculator.test.js
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMISSION_FACTORS,
  calculateHomeEnergy,
  calculateTransport,
  calculateDiet,
  calculateWasteAndConsumption,
  calculateTotal
} from '../src/utils/calculator.js';

// ── EMISSION_FACTORS ──────────────────────────────────────────────────────────

test('EMISSION_FACTORS - all required keys are present', () => {
  assert.ok(EMISSION_FACTORS.electricity,     'electricity factor missing');
  assert.ok(EMISSION_FACTORS.electricityGreen,'electricityGreen factor missing');
  assert.ok(EMISSION_FACTORS.gas,             'gas factor missing');
  assert.ok(EMISSION_FACTORS.heatingOil,      'heatingOil factor missing');
  assert.ok(EMISSION_FACTORS.car,             'car factors missing');
  assert.ok(EMISSION_FACTORS.diet,            'diet factors missing');
  assert.ok(EMISSION_FACTORS.shopping,        'shopping factors missing');
});

test('EMISSION_FACTORS - green electricity is significantly lower than standard', () => {
  assert.ok(
    EMISSION_FACTORS.electricityGreen < EMISSION_FACTORS.electricity * 0.5,
    'Green electricity should be at least 50% lower than standard'
  );
});

// ── calculateHomeEnergy ───────────────────────────────────────────────────────

test('calculateHomeEnergy - combined usage (electricity + gas + oil)', () => {
  // 100 kWh/mo * 0.385 * 12 = 462
  // 200 kWh/mo * 0.185 * 12 = 444
  //  50 L/mo   * 2.68  * 12 = 1608
  // Total = 2514
  assert.equal(calculateHomeEnergy(100, false, 200, 50), 2514);
});

test('calculateHomeEnergy - green tariff reduces electricity footprint', () => {
  // 100 kWh/mo * 0.038 * 12 = 45.6
  assert.equal(calculateHomeEnergy(100, true, 0, 0), 45.6);
});

test('calculateHomeEnergy - all zeros returns 0', () => {
  assert.equal(calculateHomeEnergy(0, false, 0, 0), 0);
});

test('calculateHomeEnergy - default parameters return 0', () => {
  assert.equal(calculateHomeEnergy(), 0);
});

test('calculateHomeEnergy - electricity only (no gas, no oil)', () => {
  // 250 kWh/mo * 0.385 * 12 = 1155
  assert.equal(calculateHomeEnergy(250, false, 0, 0), 1155);
});

test('calculateHomeEnergy - gas only', () => {
  // 300 kWh/mo * 0.185 * 12 = 666
  assert.equal(calculateHomeEnergy(0, false, 300, 0), 666);
});

test('calculateHomeEnergy - result is rounded to 2 decimal places', () => {
  const result = calculateHomeEnergy(1, false, 1, 1);
  assert.equal(result, Math.round(result * 100) / 100);
});

// ── calculateTransport ────────────────────────────────────────────────────────

test('calculateTransport - petrol car + transit + flights', () => {
  // 10000 km * 0.17 = 1700
  // 10 h/wk * 52 wk * 1.2 = 624
  // 10 h    * 90    = 900
  // Total = 3224
  assert.equal(calculateTransport(10000, 'petrol', 10, 10), 3224);
});

test('calculateTransport - electric vehicle lower than petrol', () => {
  const ev     = calculateTransport(10000, 'electric', 0, 0);
  const petrol = calculateTransport(10000, 'petrol',   0, 0);
  assert.ok(ev < petrol, 'EV footprint should be lower than petrol');
  assert.equal(ev, 500);
});

test('calculateTransport - diesel car', () => {
  // 10000 km * 0.16 = 1600
  assert.equal(calculateTransport(10000, 'diesel', 0, 0), 1600);
});

test('calculateTransport - hybrid car', () => {
  // 10000 km * 0.11 = 1100
  assert.equal(calculateTransport(10000, 'hybrid', 0, 0), 1100);
});

test('calculateTransport - unknown fuel type falls back to petrol', () => {
  const unknown = calculateTransport(10000, 'hydrogen', 0, 0);
  const petrol  = calculateTransport(10000, 'petrol',   0, 0);
  assert.equal(unknown, petrol);
});

test('calculateTransport - all zeros returns 0', () => {
  assert.equal(calculateTransport(0, 'petrol', 0, 0), 0);
});

test('calculateTransport - default parameters return 0', () => {
  assert.equal(calculateTransport(), 0);
});

test('calculateTransport - transit only (no car, no flights)', () => {
  // 5 h/wk * 52 * 1.2 = 312
  assert.equal(calculateTransport(0, 'petrol', 5, 0), 312);
});

// ── calculateDiet ─────────────────────────────────────────────────────────────

test('calculateDiet - vegan is lowest footprint', () => {
  assert.equal(calculateDiet('vegan'), 700);
});

test('calculateDiet - vegetarian', () => {
  assert.equal(calculateDiet('vegetarian'), 1100);
});

test('calculateDiet - average', () => {
  assert.equal(calculateDiet('average'), 1700);
});

test('calculateDiet - meat-heavy is highest footprint', () => {
  assert.equal(calculateDiet('meat-heavy'), 2500);
});

test('calculateDiet - unknown type defaults to average', () => {
  assert.equal(calculateDiet('unknown-type'), 1700);
  assert.equal(calculateDiet(),               1700);
  assert.equal(calculateDiet(null),           1700);
});

test('calculateDiet - footprint ordering is correct', () => {
  assert.ok(calculateDiet('vegan')        < calculateDiet('vegetarian'));
  assert.ok(calculateDiet('vegetarian')   < calculateDiet('average'));
  assert.ok(calculateDiet('average')      < calculateDiet('meat-heavy'));
});

// ── calculateWasteAndConsumption ──────────────────────────────────────────────

test('calculateWasteAndConsumption - waste + average shopping', () => {
  // Waste: 50 kg/mo * 12 * 0.5 * (1 - 0.5) = 150
  // Shopping: average = 400
  // Total = 550
  assert.equal(calculateWasteAndConsumption(50, 50, 'average'), 550);
});

test('calculateWasteAndConsumption - no waste, heavy shopping', () => {
  assert.equal(calculateWasteAndConsumption(0, 0, 'heavy'), 1000);
});

test('calculateWasteAndConsumption - no waste, minimal shopping', () => {
  assert.equal(calculateWasteAndConsumption(0, 0, 'minimal'), 100);
});

test('calculateWasteAndConsumption - recycling rate capped at 80%', () => {
  const at80  = calculateWasteAndConsumption(100, 80,  'minimal');
  const at100 = calculateWasteAndConsumption(100, 100, 'minimal');
  assert.equal(at80, at100, '100% recycling should equal 80% (cap applied)');
});

test('calculateWasteAndConsumption - zero recycling keeps all waste', () => {
  const withRecycling    = calculateWasteAndConsumption(100, 50, 'minimal');
  const withoutRecycling = calculateWasteAndConsumption(100, 0,  'minimal');
  assert.ok(withRecycling < withoutRecycling, 'Recycling should reduce waste footprint');
});

test('calculateWasteAndConsumption - default parameters return minimal shopping only', () => {
  // wasteGenerated = 0, recyclingRate = 0, shoppingHabits = 'average' → 400
  assert.equal(calculateWasteAndConsumption(), 400);
});

// ── calculateTotal ────────────────────────────────────────────────────────────

test('calculateTotal - returns correct breakdown and total', () => {
  const inputData = {
    electricity:      100,
    electricityGreen: false,
    gas:              0,
    heatingOil:       0,
    carDistance:      10000,
    carFuel:          'petrol',
    transitHours:     0,
    flightHours:      0,
    dietType:         'vegan',
    wasteGenerated:   0,
    recyclingRate:    0,
    shoppingHabits:   'minimal'
  };

  // energy    = 100 * 0.385 * 12 = 462
  // transport = 10000 * 0.17     = 1700
  // diet      = 700
  // waste     = 100
  // total     = 2962
  const result = calculateTotal(inputData);

  assert.equal(result.total, 2962);
  assert.deepEqual(result.breakdown, {
    energy:    462,
    transport: 1700,
    diet:      700,
    waste:     100
  });
});

test('calculateTotal - all zeros returns diet baseline only', () => {
  const result = calculateTotal({
    electricity: 0, gas: 0, heatingOil: 0, electricityGreen: false,
    carDistance: 0, carFuel: 'petrol', transitHours: 0, flightHours: 0,
    dietType: 'average',
    wasteGenerated: 0, recyclingRate: 0, shoppingHabits: 'average'
  });
  // Diet average = 1700, shopping average = 400
  assert.equal(result.breakdown.energy,    0);
  assert.equal(result.breakdown.transport, 0);
  assert.equal(result.breakdown.diet,   1700);
  assert.equal(result.breakdown.waste,   400);
  assert.equal(result.total, 2100);
});

test('calculateTotal - empty object uses all defaults', () => {
  const result = calculateTotal({});
  assert.ok(typeof result.total === 'number',     'total should be a number');
  assert.ok(typeof result.breakdown === 'object', 'breakdown should be an object');
  assert.ok(result.total >= 0,                   'total should be non-negative');
});

test('calculateTotal - total equals sum of breakdown values', () => {
  const result = calculateTotal({
    electricity: 200, gas: 100, carDistance: 8000, dietType: 'vegetarian'
  });
  const breakdownSum = Math.round(
    (result.breakdown.energy + result.breakdown.transport +
     result.breakdown.diet   + result.breakdown.waste) * 100
  ) / 100;
  assert.equal(result.total, breakdownSum);
});

test('calculateTotal - green electricity produces lower energy footprint', () => {
  const standard = calculateTotal({ electricity: 200, electricityGreen: false });
  const green    = calculateTotal({ electricity: 200, electricityGreen: true  });
  assert.ok(green.total < standard.total, 'Green electricity should lower total footprint');
});
