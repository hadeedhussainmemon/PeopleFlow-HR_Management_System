const serverless = require('serverless-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('../app');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Ensure MONGO_URI is set
if (!process.env.MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined.');
  // In a serverless environment, throwing an error is better than process.exit
  throw new Error('MONGO_URI is not defined.');
}

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    // If a connection is cached, use it
    return cachedDb;
  }

  // If no connection is cached, create a new one
  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10-second timeout
    });
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Throw the error to be caught by the handler
    throw error;
  }
};

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return handler(req, res);
  } catch (error) {
    // This will catch connection errors and return a 500
    console.error('Failed to connect to database:', error);
    return res.status(500).json({ message: 'Internal Server Error: Could not connect to the database.' });
  }
};