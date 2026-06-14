/**
 * Validates and sanitizes the carbon calculator input data.
 * Returns an object with:
 * - isValid: boolean indicating if all fields are valid
 * - errors: an object mapping field names to error messages
 * - data: sanitized data (converted to correct types, default values applied)
 */
export function validateFootprintInput(input = {}) {
  const errors = {};
  const sanitized = {};

  // Helper to validate non-negative numbers within a max range
  const validateNumeric = (name, val, max, defaultValue = 0) => {
    if (val === undefined || val === null || val === '') {
      sanitized[name] = defaultValue;
      return;
    }
    const num = Number(val);
    if (isNaN(num)) {
      errors[name] = `${name} must be a number`;
    } else if (num < 0) {
      errors[name] = `${name} cannot be negative`;
    } else if (num > max) {
      errors[name] = `${name} exceeds realistic maximum value (${max})`;
    } else {
      sanitized[name] = num;
    }
  };

  // 1. Home Energy Validation
  validateNumeric('electricity', input.electricity, 50000, 0); // max 50,000 kWh/month
  validateNumeric('gas', input.gas, 50000, 0); // max 50,000 kWh/month
  validateNumeric('heatingOil', input.heatingOil, 10000, 0); // max 10,000 liters/month
  sanitized.electricityGreen = Boolean(input.electricityGreen);

  // 2. Transport Validation
  validateNumeric('carDistance', input.carDistance, 500000, 0); // max 500,000 km/year
  
  const validFuelTypes = ['petrol', 'diesel', 'hybrid', 'electric'];
  const fuel = input.carFuel || 'petrol';
  if (validFuelTypes.includes(fuel)) {
    sanitized.carFuel = fuel;
  } else {
    errors.carFuel = 'Invalid fuel type selected';
  }

  validateNumeric('transitHours', input.transitHours, 168, 0); // max 168 hours/week
  validateNumeric('flightHours', input.flightHours, 1000, 0);  // max 1,000 flight hours/year

  // 3. Diet Validation
  const validDietTypes = ['meat-heavy', 'average', 'vegetarian', 'vegan'];
  const diet = input.dietType || 'average';
  if (validDietTypes.includes(diet)) {
    sanitized.dietType = diet;
  } else {
    errors.dietType = 'Invalid diet type selected';
  }

  // 4. Waste & Consumption Validation
  validateNumeric('wasteGenerated', input.wasteGenerated, 2000, 0); // max 2,000 kg/month
  
  // recycling rate should be between 0 and 100
  const recycling = Number(input.recyclingRate === undefined || input.recyclingRate === '' ? 0 : input.recyclingRate);
  if (isNaN(recycling)) {
    errors.recyclingRate = 'Recycling rate must be a number';
  } else if (recycling < 0 || recycling > 100) {
    errors.recyclingRate = 'Recycling rate must be between 0 and 100%';
  } else {
    sanitized.recyclingRate = recycling;
  }

  const validShoppingHabits = ['heavy', 'average', 'minimal'];
  const shopping = input.shoppingHabits || 'average';
  if (validShoppingHabits.includes(shopping)) {
    sanitized.shoppingHabits = shopping;
  } else {
    errors.shoppingHabits = 'Invalid shopping habit selection';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: sanitized
  };
}
