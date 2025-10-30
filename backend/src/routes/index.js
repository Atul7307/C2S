const express = require('express');
const dataRoutes = require('./data.routes');
const deviceRoutes = require('./device.routes');

const router = express.Router();

router.use('/data', dataRoutes);
router.use('/devices', deviceRoutes);

module.exports = router;
