// routes/classes.js
import express from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';
import { authenticate } from '../middleware/auth.js';
import { isPrincipal } from '../middleware/roleCheck.js';

const router = express.Router();

// @route   GET /api/classes
// @desc    Get all classes
// @access  Private
router.get('/', authenticate, getAllClasses);

// @route   GET /api/classes/:id
// @desc    Get a class by ID
// @access  Private
router.get('/:id', authenticate, getClassById);

// @route   POST /api/classes
// @desc    Create a new class
// @access  Private/Principal
router.post('/', authenticate, isPrincipal, createClass);

// @route   PUT /api/classes/:id
// @desc    Update a class
// @access  Private/Principal
router.put('/:id', authenticate, isPrincipal, updateClass);

// @route   DELETE /api/classes/:id
// @desc    Delete a class
// @access  Private/Principal
router.delete('/:id', authenticate, isPrincipal, deleteClass);

export default router;
