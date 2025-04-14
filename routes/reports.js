// routes/reports.js
import express from 'express';
import { getMonthlyReport, getHalfMonthlyReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reports/monthly
// @desc    Get monthly MDM report
// @access  Private/Principal
router.get('/monthly', authenticate, getMonthlyReport);

// @route   GET /api/reports/half-monthly
// @desc    Get half-monthly MDM report
// @access  Private/Principal
router.get('/half-monthly', authenticate, getHalfMonthlyReport);

export default router;
