/**
 * Validates and sanitizes the carbon calculator input data.
 * Returns an object with:
 * - isValid: boolean indicating if all fields are valid
 * - errors: an object mapping field names to error messages
 * - data: sanitized data (converted to correct types, default values applied)
 */

export const VALID_FUEL_TYPES = ['petrol', 'diesel', 'hybrid', 'electric'];
export const VALID_DIET_TYPES = ['meat-heavy', 'average', 'vegetarian', 'vegan'];
export const VALID_SHOPPING_HABITS = ['heavy', 'average', 'minimal'];

export function validateFootprintInput(input = {}) {
  // Guard: reject non-object payloads
  if (typeof input !== 'object' || Array.isArray(input) || input === null) {
    return {
      isValid: false,
      errors: { _body: 'Request body must be a JSON object' },
      data: {}
    };
  }

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
  validateNumeric('electricity', input.electricity, 50000, 0);
  validateNumeric('gas', input.gas, 50000, 0);
  validateNumeric('heatingOil', input.heatingOil, 10000, 0);

  // Coerce electricityGreen properly (handles "true"/"false" strings from forms)
  sanitized.electricityGreen = input.electricityGreen === true
    || input.electricityGreen === 'true'
    || input.electricityGreen === 1;

  // 2. Transport Validation
  validateNumeric('carDistance', input.carDistance, 500000, 0);

  const fuel = input.carFuel || 'petrol';
  if (VALID_FUEL_TYPES.includes(fuel)) {
    sanitized.carFuel = fuel;
  } else {
    errors.carFuel = 'Invalid fuel type selected';
  }

  validateNumeric('transitHours', input.transitHours, 168, 0);
  validateNumeric('flightHours', input.flightHours, 1000, 0);

  // 3. Diet Validation
  const diet = input.dietType || 'average';
  if (VALID_DIET_TYPES.includes(diet)) {
    sanitized.dietType = diet;
  } else {
    errors.dietType = 'Invalid diet type selected';
  }

  // 4. Waste & Consumption Validation
  validateNumeric('wasteGenerated', input.wasteGenerated, 2000, 0);

  const recycling = Number(input.recyclingRate === undefined || input.recyclingRate === '' ? 0 : input.recyclingRate);
  if (isNaN(recycling)) {
    errors.recyclingRate = 'Recycling rate must be a number';
  } else if (recycling < 0 || recycling > 100) {
    errors.recyclingRate = 'Recycling rate must be between 0 and 100%';
  } else {
    sanitized.recyclingRate = recycling;
  }

  const shopping = input.shoppingHabits || 'average';
  if (VALID_SHOPPING_HABITS.includes(shopping)) {
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
