'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const ApiError = require('./utils/ApiError');
const router = require('./routes/index');

const app = express();

// ─── Security headers ────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));

// ─── Request middleware ──────────────────────────────────────────
app.use(requestId);
app.use(compression());
app.use(cookieParser());

// Parse JSON bodies. Razorpay webhooks need raw body for signature verification.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/v1/payments/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.info({ msg: msg.trim(), type: 'access' }) },
    })
  );
}

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── 404 handler ─────────────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route '${req.method} ${req.path}'`));
});

// ─── Centralized error handler ────────────────────────────────────
app.use(errorHandler);

module.exports = app;
