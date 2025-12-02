const serverless = require('serverless-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('../app');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Cache mongoose connection across lambda invocations
const connectToDatabase = async () => {
  if (global.__mongooseConnection) {
    return global.__mongooseConnection;
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set');
    throw new Error('MONGO_URI not set');
  }
  global.__mongooseConnection = mongoose.connect(process.env.MONGO_URI, {});
  try {
    await global.__mongooseConnection;
    return global.__mongooseConnection;
  } catch (e) {
    global.__mongooseConnection = null;
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
