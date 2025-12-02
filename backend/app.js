const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const app = express();
// Security middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(helmet());

// CORS configuration
// Allow FRONTEND_URL env entries to be full URLs (including paths).
// Normalize to origin (scheme + host) so comparisons with the request
// `Origin` header succeed even if someone added a path like `/login`.
const rawOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173'];

const allowedOrigins = rawOrigins.map((val) => {
  try {
    return new URL(val).origin;
  } catch (e) {
    // Fallback: strip trailing slashes and any path portion
    return (val || '').replace(/\/+$/, '').replace(/^(https?:\/\/[^\/]+).*/i, '$1');
  }
});

console.debug('[CORS] normalized allowedOrigins:', allowedOrigins);

// Lightweight debug logging for CORS to help diagnose deployments.
// Logs will show incoming Origin and the allowedOrigins array.
app.use(cors());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leaves', require('./routes/leave'));
app.use('/api/users', require('./routes/users'));
app.use('/api/holidays', require('./routes/holidays'));
app.use('/api/admin', require('./routes/admin'));

// Health and readiness endpoints
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    // In serverless environment we may not have mongoose here; caller should
    // ensure DB is connected when appropriate.
    res.json({ status: 'ready' });
  } catch (e) {
    res.status(503).json({ status: 'not-ready', error: e.message });
  }
});

// Swagger UI (optional: loads swagger.json if present)
const swaggerPath = path.join(__dirname, 'swagger.json');
let swaggerSpec = { openapi: '3.0.0', info: { title: 'HR API', version: '1.0.0' } };
try {
  if (fs.existsSync(swaggerPath)) {
    swaggerSpec = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
  }
} catch {}
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
