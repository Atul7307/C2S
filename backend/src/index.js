require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { connectDB } = require('./config/db');
const { port } = require('./config/appConfig');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await connectDB(uri);
    logger.info('Connected to MongoDB');

    const server = app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    });

    const gracefulShutdown = async () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      await mongoose.disconnect();
      process.exit(0);
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

