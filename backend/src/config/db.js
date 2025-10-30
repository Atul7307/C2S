const mongoose = require('mongoose');

const connectDB = async (uri) => {
  try {
    return await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
}
catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};


module.exports = {
  connectDB,
};
