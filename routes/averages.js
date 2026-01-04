
import express from 'express';
import { getMonthlyPresentAverages } from '../controllers/avereageController.js';
import { authenticateSchool } from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

// @route   GET /api/averages/:year/:month
// @desc    Get monthly average of present students by standard and school
// @access  Private (Requires Verification)
router.get('/:year/:month', authenticateSchool, requireVerification, getMonthlyPresentAverages);

export default router;
