const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    fluoride: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      type: String,
      default: 'Unknown',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

sensorReadingSchema.index({ device_id: 1, timestamp: -1 });

const SensorReading = mongoose.model('SensorReading', sensorReadingSchema, 'sensor_readings');

module.exports = SensorReading;
