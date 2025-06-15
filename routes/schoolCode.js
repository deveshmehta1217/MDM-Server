import express from 'express';
import {
  generateSchoolCode,
  getActiveSchoolCode,
  deactivateSchoolCode,
  getSchoolCodeHistory,
  validateSchoolCode,
  extendSchoolCodeExpiry
} from '../controllers/schoolCodeController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/validate/:code', validateSchoolCode);

// Principal only routes
router.post('/generate', authenticateAdmin, generateSchoolCode);
router.get('/', authenticateAdmin, getActiveSchoolCode);
router.delete('/:code', authenticateAdmin, deactivateSchoolCode);
router.get('/history', authenticateAdmin, getSchoolCodeHistory);
router.patch('/:code/extend', authenticateAdmin, extendSchoolCodeExpiry);

export default router;
