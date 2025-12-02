const serverless = require('serverless-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('../app');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Cache mongoose connection across lambda invocations
const connectToDatabase = async () => {
  // Return existing connection if already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  
  if (global.__mongooseConnection && mongoose.connection.readyState === 2) {
    // Connection in progress, wait for it
    return global.__mongooseConnection;
  }
  
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    throw new Error('MONGO_URI not set');
  }
  
  // Set a connection timeout
  const connectionTimeout = setTimeout(() => {
    console.error('MongoDB connection timeout after 10s');
    global.__mongooseConnection = null;
  }, 10000);
  
  try {
    global.__mongooseConnection = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    await global.__mongooseConnection;
    clearTimeout(connectionTimeout);
    console.log('MongoDB connected');
    return global.__mongooseConnection;
  } catch (e) {
    clearTimeout(connectionTimeout);
    global.__mongooseConnection = null;
    console.error('MongoDB connection failed:', e.message);
    throw e;
  }
};

const handler = serverless(app);

module.exports = async (req, res) => {
  // Quick health/root response to verify the serverless function is reachable
  // without forcing a DB connection. Useful for debugging deployment issues.
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    return res.status(200).json({
      status: 'ok',
      mongoConfigured: !!process.env.MONGO_URI
    });
  }

  await connectToDatabase();
  return handler(req, res);
};
