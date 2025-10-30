const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    relay_state: {
      type: String,
      enum: ['on', 'off'],
      default: 'off',
    },
    last_seen: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

deviceSchema.methods.updateLastSeen = function updateLastSeen(date = new Date()) {
  this.last_seen = date;
  return this.save();
};

const Device = mongoose.model('Device', deviceSchema, 'devices');

module.exports = Device;
