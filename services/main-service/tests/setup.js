'use strict';
// Jest global setup — will configure test DB etc. in Phase 15
// For now, just suppress logs during tests
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';
