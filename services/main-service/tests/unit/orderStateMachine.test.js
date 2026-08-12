'use strict';

const { isValidTransition } = require('../../src/services/order/orderStateMachine');
const { ORDER_STATUS } = require('../../src/config/constants');

describe('Order State Machine', () => {
  test('valid transition from PENDING_PAYMENT to CONFIRMED', () => {
    expect(isValidTransition(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.CONFIRMED)).toBe(true);
  });

  test('valid transition from CONFIRMED to PREPARING', () => {
    expect(isValidTransition(ORDER_STATUS.CONFIRMED, ORDER_STATUS.PREPARING)).toBe(true);
  });

  test('valid transition from PREPARING to READY', () => {
    expect(isValidTransition(ORDER_STATUS.PREPARING, ORDER_STATUS.READY)).toBe(true);
  });

  test('valid transition from ASSIGNED to PICKED_UP', () => {
    expect(isValidTransition(ORDER_STATUS.ASSIGNED, ORDER_STATUS.PICKED_UP)).toBe(true);
  });

  test('invalid transition from PENDING_PAYMENT directly to DELIVERED', () => {
    expect(isValidTransition(ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.DELIVERED)).toBe(false);
  });

  test('invalid transition from COMPLETED to PREPARING', () => {
    expect(isValidTransition(ORDER_STATUS.COMPLETED, ORDER_STATUS.PREPARING)).toBe(false);
  });

  test('invalid transition from CANCELLED to CONFIRMED', () => {
    expect(isValidTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.CONFIRMED)).toBe(false);
  });
});
