const dotenv = require('dotenv');
dotenv.config();

const serverless = require('serverless-http');
const mongoose = require('mongoose');
const app = require('../app');

let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined.');
  }
  
  const db = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  cachedDb = db;
  return db;
};

const handler = serverless(app);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://people-flow-by-hh.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cookie,X-Requested-With');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectToDatabase();
    return handler(req, res);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};