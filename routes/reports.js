import express from 'express';
import {
    getDailyReport,
    getSemiMonthlyReport,
    downloadDailyReportExcel,
    downloadDailyAlpaharReportExcel,
    downloadSemiMonthlyReportExcel,
    downloadSemiMonthlyAlpaharReportExcel,
    getSemiMonthlyReportData,
    getDailyReportData,
    getDailyReportDataV2,
    getSemiMonthlyReportV2,
    getDailyReportRangeV2
} from '../controllers/attendanceController.js';
import {
    authenticateSchool,
} from '../middleware/auth.js';
import { requireVerification } from '../middleware/verification.js';

const router = express.Router();

router.get('/daily/:date', authenticateSchool, requireVerification, getDailyReport);
router.get('/excel/daily/mdm/:date', authenticateSchool, requireVerification, downloadDailyReportExcel);
router.get('/excel/daily/alpahar/:date', authenticateSchool, requireVerification, downloadDailyAlpaharReportExcel);
router.get('/data/daily/:date', authenticateSchool, requireVerification, getDailyReportData);
router.get('/v2/daily/:date', authenticateSchool, requireVerification, getDailyReportDataV2);
router.get('/v2/daily-range/:startDate/:endDate', authenticateSchool, requireVerification, getDailyReportRangeV2);

router.get('/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReport);
router.get('/excel/semi-monthly/mdm/:year/:month/:half', authenticateSchool, requireVerification, downloadSemiMonthlyReportExcel);
router.get('/excel/semi-monthly/alpahar/:year/:month/:half', authenticateSchool, requireVerification, downloadSemiMonthlyAlpaharReportExcel);
router.get('/data/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReportData);
router.get('/v2/semi-monthly/:year/:month/:half', authenticateSchool, requireVerification, getSemiMonthlyReportV2);

export default router;
