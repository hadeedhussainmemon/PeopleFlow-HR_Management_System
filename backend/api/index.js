const serverless = require('serverless-http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('../app');

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    // If a connection is cached, use it
    return cachedDb;
  }

  // If no connection is cached, create a new one
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined.');
    }
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
    // Always handle CORS preflight and lightweight endpoints without forcing DB connection
    if (req.method === 'OPTIONS') {
      return handler(req, res);
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      return res.status(200).json({ status: 'ok', mongoConfigured: !!process.env.MONGO_URI });
    }

    // Skip DB for unauthenticated auth-check to avoid connection-delay timeouts
    try {
      const cookieHeader = req.headers?.cookie || '';
      const hasToken = /(?:^|;\s*)token=/.test(cookieHeader);
      const isAuthMe = req.method === 'GET' && req.url.startsWith('/api/auth/me');
      if (isAuthMe && !hasToken) {
        return handler(req, res);
      }
    } catch {}

    await connectToDatabase();
    return handler(req, res);
  } catch (error) {
    // This will catch connection errors and return a 500
    console.error('Failed to connect to database:', error);
    return res.status(500).json({ message: 'Internal Server Error: Could not connect to the database.' });
  }
};