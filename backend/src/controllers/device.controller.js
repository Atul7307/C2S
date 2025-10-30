const { validationResult } = require('express-validator');
const Device = require('../models/device.model');
const SensorReading = require('../models/sensorReading.model');

const listDevices = async (req, res, next) => {
  try {
    const devices = await Device.find().sort({ device_id: 1 });
    if (devices.length === 0) {
      return res.json({ devices: [] });
    }

    const deviceIds = devices.map((device) => device.device_id);

    const latestReadings = await SensorReading.aggregate([
      { $match: { device_id: { $in: deviceIds } } },
      { $sort: { device_id: 1, timestamp: -1 } },
      {
        $group: {
          _id: '$device_id',
          latest: { $first: '$$ROOT' },
        },
      },
    ]);

    const readingsMap = latestReadings.reduce((acc, readingGroup) => {
      acc[readingGroup._id] = readingGroup.latest;
      return acc;
    }, {});

    const payload = devices.map((device) => ({
      device_id: device.device_id,
      location: device.location,
      relay_state: device.relay_state,
      last_seen: device.last_seen,
      metadata: device.metadata,
      last_reading: readingsMap[device.device_id] || null,
    }));

    return res.json({ devices: payload });
  } catch (error) {
    return next(error);
  }
};

const getLedState = async (req, res, next) => {
  try {
    const { device_id } = req.params;
    const device = await Device.findOne({ device_id });

    if (!device) {
      return res.json({ device_id, relay_state: 'off' });
    }

    return res.json({ device_id, relay_state: device.relay_state });
  } catch (error) {
    return next(error);
  }
};

const updateLedState = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { device_id } = req.params;
    const { relay_state } = req.body;

    const device = await Device.findOneAndUpdate(
      { device_id },
      {
        $set: {
          relay_state,
          last_seen: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.json({
      message: 'Relay state updated',
      device: {
        device_id: device.device_id,
        relay_state: device.relay_state,
        last_seen: device.last_seen,
        location: device.location,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listDevices,
  getLedState,
  updateLedState,
};
