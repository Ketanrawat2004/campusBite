'use strict';

const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * WhatsAppService
 * Wrapper around official Meta WhatsApp Cloud API (Test & Production).
 * Converts recipient mobile numbers to E.164 format.
 * Provides resilient fallback to development logs when credentials or Meta API are unconfigured.
 */
class WhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.version = process.env.WHATSAPP_VERSION || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`;
  }

  /**
   * Format phone number into E.164 format.
   * Example: "9876543210" -> "919876543210"
   * Example: "+91 98765 43210" -> "919876543210"
   *
   * @param {string} rawPhone
   * @returns {string} E.164 formatted number without leading +
   */
  formatE164(rawPhone) {
    if (!rawPhone) return '919876543210';
    const digitsOnly = String(rawPhone).replace(/\D/g, '');
    if (digitsOnly.length === 10) {
      return `91${digitsOnly}`; // Prepend India +91 default
    }
    if (digitsOnly.startsWith('0')) {
      return `91${digitsOnly.slice(1)}`;
    }
    return digitsOnly;
  }

  /**
   * Send text message via Meta WhatsApp Cloud API.
   *
   * @param {string} toPhone - Student's phone number
   * @param {string} textBody - Message text
   * @returns {Promise<object>}
   */
  async sendTextMessage(toPhone, textBody) {
    const e164Phone = this.formatE164(toPhone);

    // Check if Meta credentials are present
    const isConfigured =
      this.token &&
      this.phoneNumberId &&
      !this.token.includes('placeholder') &&
      !this.token.includes('your_meta_test');

    if (!isConfigured) {
      logger.info({
        msg: '📱 [WhatsAppService - Dev Fallback Mode] Meta WhatsApp Cloud API unconfigured. Logged notification locally:',
        toE164: `+${e164Phone}`,
        textBody,
      });
      return { success: true, mode: 'DEV_FALLBACK_LOGGED', to: e164Phone };
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: e164Phone,
          type: 'text',
          text: { preview_url: false, body: textBody },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info({
        msg: '🚀 [WhatsAppService] WhatsApp message dispatched via Meta Cloud API',
        toE164: `+${e164Phone}`,
        messageId: response.data?.messages?.[0]?.id,
      });

      return { success: true, data: response.data };
    } catch (err) {
      const errorDetail = err.response?.data || err.message;
      logger.warn({
        msg: '⚠️ [WhatsAppService] Meta WhatsApp Cloud API call failed. Falling back to log:',
        toE164: `+${e164Phone}`,
        error: errorDetail,
      });

      logger.info({
        msg: '📱 [WhatsAppService - Dev Fallback Output]',
        toE164: `+${e164Phone}`,
        textBody,
      });

      return { success: true, mode: 'DEV_FALLBACK_AFTER_ERROR', error: errorDetail };
    }
  }

  /**
   * Formats and sends an itemized Tax Invoice & Receipt to student after payment.completed
   *
   * @param {object} orderData
   * @param {object} studentUser
   */
  async sendOrderReceipt(orderData, studentUser) {
    const rawPhone = studentUser?.phone || orderData?.studentPhone || '9876543210';
    const studentName = studentUser?.name || orderData?.studentName || 'Student';
    const orderNumber = orderData?.orderNumber || 'CB-ORDER';
    const amountInRupees = orderData?.amountInPaise
      ? `₹${(orderData.amountInPaise / 100).toFixed(2)}`
      : orderData?.totalAmountInPaise
      ? `₹${(orderData.totalAmountInPaise / 100).toFixed(2)}`
      : '₹0.00';

    const textBody = `🧾 *CampusBite NIT Jamshedpur — Payment Receipt*
━━━━━━━━━━━━━━━━━━━
🆔 *Order #:* ${orderNumber}
👤 *Student:* ${studentName}
💰 *Total Amount Paid:* ${amountInRupees}
💳 *Payment Gateway:* Razorpay (TEST MODE)
📦 *Fulfillment:* ${orderData?.fulfillmentType === 'DELIVERY' ? 'Hostel Room Delivery' : 'Canteen Counter Pickup'}
━━━━━━━━━━━━━━━━━━━
Your order has been confirmed by the canteen! Live tracking link: http://localhost:3000/orders/${orderData.orderId || orderData._id || ''}`;

    return await this.sendTextMessage(rawPhone, textBody);
  }
}

module.exports = new WhatsAppService();
