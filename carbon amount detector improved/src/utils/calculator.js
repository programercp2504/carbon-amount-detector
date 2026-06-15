/**
 * Emission factors based on EPA, UK Defra, and international carbon accounting standards.
 * All output values are in kg CO2e.
 */
export const EMISSION_FACTORS = {
  // Monthly factors (multiplied by 12 for annual totals)
  electricity: 0.385,       // kg CO2e per kWh
  electricityGreen: 0.038,  // kg CO2e per kWh (approx. 90% reduction for green tariffs)
  gas: 0.185,               // kg CO2e per kWh
  heatingOil: 2.68,         // kg CO2e per liter

  // Annual/Weekly factors
  car: {
    petrol: 0.17,           // kg CO2e per km
    diesel: 0.16,           // kg CO2e per km
    hybrid: 0.11,           // kg CO2e per km
    electric: 0.05          // kg CO2e per km (grid average indirect emissions)
  },
  transitHour: 1.2,         // kg CO2e per hour of transit (assuming average speed 40 km/h)
  flightHour: 90.0,         // kg CO2e per hour of short/long haul flight average

  // Annual dietary footprint
  diet: {
    'meat-heavy': 2500,     // kg CO2e per year (high meat consumption)
    'average': 1700,        // kg CO2e per year (moderate meat consumption)
    'vegetarian': 1100,     // kg CO2e per year (no meat, some dairy/eggs)
    'vegan': 700            // kg CO2e per year (plant-based)
  },

  // Waste & Consumption
  wastePerKg: 0.5,          // kg CO2e per kg of landfill waste
  shopping: {
    'heavy': 1000,          // kg CO2e per year (frequent tech, clothes, fast fashion)
    'average': 400,         // kg CO2e per year (moderate buyer)
    'minimal': 100          // kg CO2e per year (frugal, second-hand buyer)
  }
};

/**
 * Calculates the annual carbon footprint for Home Energy in kg CO2e.
 */
export function calculateHomeEnergy(electricity = 0, electricityGreen = false, gas = 0, heatingOil = 0) {
  const electricityFactor = electricityGreen ? EMISSION_FACTORS.electricityGreen : EMISSION_FACTORS.electricity;
  const annualElectricity = electricity * electricityFactor * 12;
  const annualGas = gas * EMISSION_FACTORS.gas * 12;
  const annualHeatingOil = heatingOil * EMISSION_FACTORS.heatingOil * 12;

  return Math.round((annualElectricity + annualGas + annualHeatingOil) * 100) / 100;
}

/**
 * Calculates the annual carbon footprint for Transportation in kg CO2e.
 */
export function calculateTransport(carDistance = 0, carFuel = 'petrol', transitHours = 0, flightHours = 0) {
  const fuelFactor = EMISSION_FACTORS.car[carFuel] || EMISSION_FACTORS.car.petrol;
  const annualCar = carDistance * fuelFactor;
  const annualTransit = transitHours * 52 * EMISSION_FACTORS.transitHour; // 52 weeks/year
  const annualFlights = flightHours * EMISSION_FACTORS.flightHour;

  return Math.round((annualCar + annualTransit + annualFlights) * 100) / 100;
}

/**
 * Calculates the annual carbon footprint for Diet in kg CO2e.
 */
export function calculateDiet(dietType = 'average') {
  return EMISSION_FACTORS.diet[dietType] || EMISSION_FACTORS.diet.average;
}

/**
 * Calculates the annual carbon footprint for Waste and Consumption in kg CO2e.
 */
export function calculateWasteAndConsumption(wasteGenerated = 0, recyclingRate = 0, shoppingHabits = 'average') {
  const effectiveRecycling = Math.min(Math.max(recyclingRate, 0), 80) / 100;
  const netWaste = wasteGenerated * (1 - effectiveRecycling);
  const annualWaste = netWaste * EMISSION_FACTORS.wastePerKg * 12;

  const annualShopping = EMISSION_FACTORS.shopping[shoppingHabits] || EMISSION_FACTORS.shopping.average;

  return Math.round((annualWaste + annualShopping) * 100) / 100;
}

/**
 * Calculates the complete carbon footprint breakdown.
 * @param {Object} data - Input data containing all parameters.
 * @returns {Object} Footprint breakdown and total in kg CO2e.
 */
export function calculateTotal(data = {}) {
  const energy = calculateHomeEnergy(
    Number(data.electricity || 0),
    Boolean(data.electricityGreen),
    Number(data.gas || 0),
    Number(data.heatingOil || 0)
  );

  const transport = calculateTransport(
    Number(data.carDistance || 0),
    data.carFuel || 'petrol',
    Number(data.transitHours || 0),
    Number(data.flightHours || 0)
  );

  const diet = calculateDiet(data.dietType || 'average');

  const waste = calculateWasteAndConsumption(
    Number(data.wasteGenerated || 0),
    Number(data.recyclingRate || 0),
    data.shoppingHabits || 'average'
  );

  const total = Math.round((energy + transport + diet + waste) * 100) / 100;

  return {
    breakdown: { energy, transport, diet, waste },
    total
  };
}
