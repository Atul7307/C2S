const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Device = require('../models/device.model');

let mongoServer;

describe('Device API', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Device.deleteMany({});
  });

  it('should list devices with last reading when available', async () => {
    await Device.create({
      device_id: 'AA:BB:CC:DD:EE:FF',
      location: 'Lab',
      relay_state: 'off',
    });

    const response = await request(app).get('/api/devices');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.devices)).toBe(true);
    expect(response.body.devices[0].device_id).toBe('AA:BB:CC:DD:EE:FF');
  });

  it('should update relay state', async () => {
    const deviceId = '11:22:33:44:55:66';
    const response = await request(app)
      .put(`/api/devices/led/${deviceId}`)
      .send({ relay_state: 'on' });

    expect(response.status).toBe(200);
    expect(response.body.device.relay_state).toBe('on');

    const device = await Device.findOne({ device_id: deviceId });
    expect(device.relay_state).toBe('on');
  });
});
