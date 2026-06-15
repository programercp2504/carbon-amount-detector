/**
 * API route handlers for the Carbon Footprint Tracker.
 *
 * Endpoints:
 *   POST /api/calculate  – Calculate a carbon footprint from user inputs.
 *   GET  /api/actions    – Retrieve carbon reduction recommendations.
 *   GET  /api/health     – Health-check / readiness probe.
 *
 * @module api
 */

import { Router } from 'express';
import { validateFootprintInput } from '../utils/validator.js';
import { calculateTotal } from '../utils/calculator.js';

const router = Router();

// ── Carbon Reduction Action Catalogue ────────────────────────────────────────

const CARBON_REDUCTION_ACTIONS = Object.freeze([
  {
    id: 'green_energy',
    title: 'Switch to Green Energy',
    description: 'Transition your home electricity tariff to a 100% renewable energy provider.',
    category: 'energy',
    difficulty: 'Easy',
    annualSavingsKg: 1200,
    impactLevel: 'High'
  },
  {
    id: 'smart_thermostat',
    title: 'Install a Smart Thermostat',
    description: 'Optimize heating and cooling schedules, and lower your thermostat by 1–2 °C.',
    category: 'energy',
    difficulty: 'Medium',
    annualSavingsKg: 350,
    impactLevel: 'Medium'
  },
  {
    id: 'led_lighting',
    title: 'Upgrade to LED Bulbs',
    description: 'Replace remaining incandescent bulbs with energy-efficient LEDs.',
    category: 'energy',
    difficulty: 'Easy',
    annualSavingsKg: 80,
    impactLevel: 'Low'
  },
  {
    id: 'public_transit',
    title: 'Commute via Public Transit',
    description: 'Replace single-occupancy car trips with train, bus, or metro commutes.',
    category: 'transport',
    difficulty: 'Medium',
    annualSavingsKg: 800,
    impactLevel: 'High'
  },
  {
    id: 'active_travel',
    title: 'Cycle or Walk Short Distances',
    description: 'For trips under 3 km, walk or cycle instead of driving.',
    category: 'transport',
    difficulty: 'Easy',
    annualSavingsKg: 250,
    impactLevel: 'Medium'
  },
  {
    id: 'ev_upgrade',
    title: 'Switch to an Electric Vehicle',
    description: 'When replacing your vehicle, choose a hybrid or fully electric car.',
    category: 'transport',
    difficulty: 'Hard',
    annualSavingsKg: 1500,
    impactLevel: 'High'
  },
  {
    id: 'plant_diet',
    title: 'Adopt a Plant-Based Diet',
    description: 'Switch from a meat-heavy diet to a vegetarian or vegan diet.',
    category: 'diet',
    difficulty: 'Hard',
    annualSavingsKg: 1000,
    impactLevel: 'High'
  },
  {
    id: 'meatless_mondays',
    title: 'Meatless Mondays',
    description: 'Commit to eating plant-based meals at least one or two days per week.',
    category: 'diet',
    difficulty: 'Easy',
    annualSavingsKg: 200,
    impactLevel: 'Low'
  },
  {
    id: 'reduce_waste',
    title: 'Halve Household Food Waste',
    description: 'Plan meals, buy only what is needed, and compost organic remains.',
    category: 'waste',
    difficulty: 'Medium',
    annualSavingsKg: 150,
    impactLevel: 'Medium'
  },
  {
    id: 'recycle_all',
    title: 'Recycle and Compost Diligently',
    description: 'Properly sort glass, paper, plastics, metals, and compost organic waste.',
    category: 'waste',
    difficulty: 'Easy',
    annualSavingsKg: 120,
    impactLevel: 'Low'
  },
  {
    id: 'mindful_shopping',
    title: 'Adopt Mindful Shopping Habits',
    description: 'Avoid fast fashion, buy second-hand, and repair items instead of replacing them.',
    category: 'waste',
    difficulty: 'Medium',
    annualSavingsKg: 600,
    impactLevel: 'High'
  }
]);

// ── Route Handlers ────────────────────────────────────────────────────────────

/**
 * POST /api/calculate
 * Validates the request body and returns a carbon footprint breakdown.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
router.post('/calculate', (req, res, next) => {
  try {
    const validationResult = validateFootprintInput(req.body);

    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid footprint input parameters.',
        errors: validationResult.errors
      });
    }

    const result = calculateTotal(validationResult.data);

    return res.status(200).json({
      success: true,
      data: {
        inputs:    validationResult.data,
        breakdown: result.breakdown,
        total:     result.total
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/actions
 * Returns the full list of carbon reduction recommendations.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
router.get('/actions', (req, res) => {
  // Optional category filter: GET /api/actions?category=transport
  const { category } = req.query;
  const data = category
    ? CARBON_REDUCTION_ACTIONS.filter((a) => a.category === String(category))
    : CARBON_REDUCTION_ACTIONS;

  return res.status(200).json({ success: true, data });
});

/**
 * GET /api/health
 * Lightweight health-check endpoint for container orchestration probes.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
