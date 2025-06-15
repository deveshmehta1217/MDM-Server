import express from 'express';
import {
  generateSchoolCode,
  getActiveSchoolCode,
  deactivateSchoolCode,
  getSchoolCodeHistory,
  validateSchoolCode,
  extendSchoolCodeExpiry
} from '../controllers/schoolCodeController.js';
import { authenticatePrincipal } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/validate/:code', validateSchoolCode);

// Principal only routes
router.post('/generate', authenticatePrincipal, generateSchoolCode);
router.get('/', authenticatePrincipal, getActiveSchoolCode);
router.delete('/:code', authenticatePrincipal, deactivateSchoolCode);
router.get('/history', authenticatePrincipal, getSchoolCodeHistory);
router.patch('/:code/extend', authenticatePrincipal, extendSchoolCodeExpiry);

export default router;
