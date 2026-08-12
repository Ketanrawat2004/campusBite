'use strict';

const pino = require('pino');

const isDevelopment = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'refreshTokenHash',
      'req.headers.authorization',
      'SMTP_PASSWORD',
      'razorpaySignature',
    ],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
