const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const Device = require('../models/device.model');
const SensorReading = require('../models/sensorReading.model');

let mongoServer;

describe('Sensor data API', () => {
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
    await SensorReading.deleteMany({});
  });

  it('should store sensor reading and update device metadata', async () => {
    const payload = {
      device_id: '84:F3:EB:AA:9B:21',
      humidity: 67.3,
      fluoride: 1.5,
      location: 'Gorakhpur District',
    };

    const response = await request(app).post('/api/data').send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data.device.device_id).toBe(payload.device_id);
    expect(response.body.data.reading.humidity).toBe(payload.humidity);

    const device = await Device.findOne({ device_id: payload.device_id });
    expect(device).not.toBeNull();
    expect(device.location).toBe('Gorakhpur District');

    const readings = await SensorReading.find({ device_id: payload.device_id });
    expect(readings).toHaveLength(1);
  });

  it('should retrieve recent readings for a device', async () => {
    const deviceId = '8C:4F:00:E0:97:B7';

    await SensorReading.create([
      {
        device_id: deviceId,
        humidity: 60,
        fluoride: 1.2,
        location: 'Test Location',
        timestamp: new Date(Date.now() - 10_000),
      },
      {
        device_id: deviceId,
        humidity: 61,
        fluoride: 1.1,
        location: 'Test Location',
        timestamp: new Date(),
      },
    ]);

    const response = await request(app).get(`/api/data/${deviceId}`);

    expect(response.status).toBe(200);
    expect(response.body.readings).toHaveLength(2);
    expect(response.body.readings[0].humidity).toBeCloseTo(61);
  });
});
