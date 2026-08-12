'use strict';

const { calculateBatchFeePerOrder } = require('../../src/services/delivery/groupingService');

describe('Smart Group Delivery Pricing Tiers', () => {
  const config = {
    tiers: [
      { minOrders: 1, maxOrders: 1, feeInPaise: 2000, label: 'SOLO' },
      { minOrders: 2, maxOrders: 3, feeInPaise: 1500, label: 'SMALL' },
      { minOrders: 4, maxOrders: 99, feeInPaise: 1000, label: 'LARGE' },
    ],
  };

  test('1 order in batch → SOLO tier (₹20 = 2000 paise)', () => {
    const res = calculateBatchFeePerOrder(1, config);
    expect(res.feeInPaise).toBe(2000);
    expect(res.tierLabel).toBe('SOLO');
  });

  test('2 orders in batch → SMALL tier (₹15 = 1500 paise)', () => {
    const res = calculateBatchFeePerOrder(2, config);
    expect(res.feeInPaise).toBe(1500);
    expect(res.tierLabel).toBe('SMALL');
  });

  test('3 orders in batch → SMALL tier (₹15 = 1500 paise)', () => {
    const res = calculateBatchFeePerOrder(3, config);
    expect(res.feeInPaise).toBe(1500);
    expect(res.tierLabel).toBe('SMALL');
  });

  test('4+ orders in batch → LARGE tier (₹10 = 1000 paise)', () => {
    const res = calculateBatchFeePerOrder(4, config);
    expect(res.feeInPaise).toBe(1000);
    expect(res.tierLabel).toBe('LARGE');
  });
});
