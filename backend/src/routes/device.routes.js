const express = require('express');
const { param, body } = require('express-validator');
const { listDevices, getLedState, updateLedState } = require('../controllers/device.controller');

const router = express.Router();

router.get('/', listDevices);

router.get(
  '/led/:device_id',
  [param('device_id').isString().trim().notEmpty().withMessage('device_id is required')],
  getLedState,
);

router.put(
  '/led/:device_id',
  [
    param('device_id').isString().trim().notEmpty().withMessage('device_id is required'),
    body('relay_state')
      .isIn(['on', 'off'])
      .withMessage("relay_state must be either 'on' or 'off'"),
  ],
  updateLedState,
);

module.exports = router;
