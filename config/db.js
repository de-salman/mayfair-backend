const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is not set');
    }
    
    // If credentials are provided separately, construct the connection string
    if (process.env.DATABASE_USERNAME && process.env.DATABASE_PASSWORD) {
      const host = process.env.DATABASE_HOST || 'localhost';
      const port = process.env.DATABASE_PORT || '27017';
      const database = process.env.DATABASE_NAME || 'mayfair-one';
      const authSource = process.env.DATABASE_AUTH_SOURCE || 'admin';
      
      mongoUri = `mongodb://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${host}:${port}/${database}?authSource=${authSource}`;
    }
    
    // MongoDB connection options (removed deprecated options for newer mongoose versions)
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    };

    const conn = await mongoose.connect(mongoUri, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.error('MONGO_URI:', process.env.MONGO_URI ? 'Set (length: ' + process.env.MONGO_URI.length + ')' : 'NOT SET');
    process.exit(1);
  }
};

module.exports = connectDB;
