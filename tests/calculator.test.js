import test from 'node:test';
import assert from 'node:assert';
import {
  calculateHomeEnergy,
  calculateTransport,
  calculateDiet,
  calculateWasteAndConsumption,
  calculateTotal
} from '../src/utils/calculator.js';

test('Carbon Footprint Calculator - Home Energy Calculations', () => {
  // Electricity: 100 kWh/mo * 0.385 kg/kWh * 12 mo = 462
  // Gas: 200 kWh/mo * 0.185 kg/kWh * 12 mo = 444
  // Heating Oil: 50 L/mo * 2.68 kg/L * 12 mo = 1608
  // Total = 462 + 444 + 1608 = 2514
  const energy = calculateHomeEnergy(100, false, 200, 50);
  assert.strictEqual(energy, 2514);

  // Green electricity discount
  // Electricity: 100 kWh/mo * 0.038 kg/kWh * 12 mo = 45.6
  // Gas: 0, Oil: 0
  // Total = 45.6
  const greenEnergy = calculateHomeEnergy(100, true, 0, 0);
  assert.strictEqual(greenEnergy, 45.6);

  // Zero values
  assert.strictEqual(calculateHomeEnergy(0, false, 0, 0), 0);
});

test('Carbon Footprint Calculator - Transport Calculations', () => {
  // Car: 10000 km * 0.17 kg/km (petrol) = 1700
  // Transit: 10 hours/wk * 52 wk * 1.2 kg/hr = 624
  // Flights: 10 hours * 90 kg/hr = 900
  // Total = 1700 + 624 + 900 = 3224
  const transport = calculateTransport(10000, 'petrol', 10, 10);
  assert.strictEqual(transport, 3224);

  // Electric vehicle
  // Car: 10000 km * 0.05 kg/km (electric) = 500
  const evTransport = calculateTransport(10000, 'electric', 0, 0);
  assert.strictEqual(evTransport, 500);

  // Zero values
  assert.strictEqual(calculateTransport(0, 'petrol', 0, 0), 0);
});

test('Carbon Footprint Calculator - Diet Calculations', () => {
  assert.strictEqual(calculateDiet('vegan'), 700);
  assert.strictEqual(calculateDiet('vegetarian'), 1100);
  assert.strictEqual(calculateDiet('average'), 1700);
  assert.strictEqual(calculateDiet('meat-heavy'), 2500);
  assert.strictEqual(calculateDiet('unknown-type'), 1700); // defaults to average
});

test('Carbon Footprint Calculator - Waste & Consumption Calculations', () => {
  // Waste: 50 kg/mo * 12 mo * 0.5 kg/kg * (1 - 0.5 recycling) = 150
  // Shopping: average = 400
  // Total = 150 + 400 = 550
  const waste = calculateWasteAndConsumption(50, 50, 'average');
  assert.strictEqual(waste, 550);

  // Zero waste, heavy shopping
  const heavyShopping = calculateWasteAndConsumption(0, 0, 'heavy');
  assert.strictEqual(heavyShopping, 1000);
});

test('Carbon Footprint Calculator - Total Breakdown Calculation', () => {
  const inputData = {
    electricity: 100,
    electricityGreen: false,
    gas: 0,
    heatingOil: 0,
    carDistance: 10000,
    carFuel: 'petrol',
    transitHours: 0,
    flightHours: 0,
    dietType: 'vegan',
    wasteGenerated: 0,
    recyclingRate: 0,
    shoppingHabits: 'minimal'
  };

  // Energy: 100 * 0.385 * 12 = 462
  // Transport: 10000 * 0.17 = 1700
  // Diet: vegan = 700
  // Waste/Shopping: minimal = 100
  // Total = 462 + 1700 + 700 + 100 = 2962
  const result = calculateTotal(inputData);
  
  assert.strictEqual(result.total, 2962);
  assert.deepStrictEqual(result.breakdown, {
    energy: 462,
    transport: 1700,
    diet: 700,
    waste: 100
  });
});
