const express = require('express');
const { body, param } = require('express-validator');
const { ingestReading, getRecentReadings } = require('../controllers/data.controller');

const router = express.Router();

router.post(
  '/',
  [
    body('device_id').isString().trim().notEmpty().withMessage('device_id is required'),
    body('humidity').optional().isNumeric().withMessage('humidity must be a number')
      .isFloat({ min: 0, max: 100 })
      .withMessage('humidity must be a number between 0 and 100'),
    body('fluoride').isFloat({ min: 0 }).withMessage('fluoride must be a positive number'),
    body('location').optional().isString(),
    body('metadata').optional().isObject(),
  ],
  ingestReading,
);

router.get(
  '/:device_id',
  [param('device_id').isString().trim().notEmpty().withMessage('device_id is required')],
  getRecentReadings,
);

module.exports = router;
