'use strict';

/**
 * Currency utilities.
 * All prices are stored in paise (smallest INR unit, 1 rupee = 100 paise).
 * This avoids floating point arithmetic errors.
 */

/**
 * Convert paise (integer) to rupees string for display
 * @param {number} paise
 * @returns {string} e.g. "15.00"
 */
function paiseToRupees(paise) {
  return (paise / 100).toFixed(2);
}

/**
 * Format paise as ₹ currency string
 * @param {number} paise
 * @returns {string} e.g. "₹15.00"
 */
function formatRupees(paise) {
  return `₹${paiseToRupees(paise)}`;
}

/**
 * Convert rupees (float) to paise (integer)
 * @param {number} rupees
 * @returns {number}
 */
function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}

module.exports = { paiseToRupees, formatRupees, rupeesToPaise };
