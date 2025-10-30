const { validationResult } = require('express-validator');
const SensorReading = require('../models/sensorReading.model');
const Device = require('../models/device.model');

const ingestReading = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id, humidity, fluoride, location, metadata } = req.body;

    const reading = await SensorReading.create({
      device_id,
      humidity,
      fluoride,
      location,
    });

    const deviceUpdate = {
      $set: {
        location: location || 'Unknown',
        metadata: metadata || {},
        last_seen: reading.timestamp,
      },
      $setOnInsert: {
        relay_state: 'off',
      },
    };

    const device = await Device.findOneAndUpdate({ device_id }, deviceUpdate, {
      upsert: true,
      new: true,
    });

    return res.status(201).json({
      message: 'Reading stored successfully',
      data: {
        device,
        reading,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getRecentReadings = async (req, res, next) => {
  try {
    const { device_id } = req.params;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    const readings = await SensorReading.find({ device_id })
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.json({
      device_id,
      count: readings.length,
      readings,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  ingestReading,
  getRecentReadings,
};
