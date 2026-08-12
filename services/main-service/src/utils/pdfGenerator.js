'use strict';

const invoiceService = require('../services/invoiceService');

/**
 * Proxy function for backwards compatibility.
 * Redirects to the centralized single invoice generator in invoiceService.js.
 */
async function generateOrderReceiptPDF(options) {
  const orderObj = {
    orderNumber: options.orderNumber,
    studentId: { name: options.studentName, email: options.studentEmail },
    canteenId: { name: options.canteenName },
    items: options.items,
    pricingBreakdown: options.pricingBreakdown,
    fulfillmentType: options.fulfillmentType,
    deliveryDetails: options.deliveryDetails,
    createdAt: options.createdAt,
    status: options.status,
    paymentId: options.paymentId,
  };

  return invoiceService.generateOrderInvoicePdf(orderObj);
}

module.exports = {
  generateOrderReceiptPDF,
};
