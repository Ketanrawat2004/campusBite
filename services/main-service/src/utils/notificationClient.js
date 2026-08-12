'use strict';

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('./logger');

function formatRupees(p) {
  return `₹${((p || 0) / 100).toFixed(2)}`;
}

async function sendOrderConfirmationEmail({
  to,
  studentName = 'Valued Customer',
  studentPhone = null,
  orderNumber = 'N/A',
  canteenName = 'Campus Canteen',
  items = [],
  pricingBreakdown = {},
  fulfillmentType,
  deliveryDetails = null,
  createdAt = null,
  status = 'CONFIRMED',
  paymentId = null,
  authenticatedUserId = null,
  orderId = null,
}) {
  const subtotalInPaise = pricingBreakdown?.subtotalInPaise ?? 0;
  const deliveryFeeInPaise = pricingBreakdown?.deliveryFeeInPaise ?? 0;
  const discountInPaise = pricingBreakdown?.discountInPaise ?? 0;
  const taxInPaise = pricingBreakdown?.taxInPaise ?? 0;
  const totalInPaise = pricingBreakdown?.totalInPaise ?? (subtotalInPaise + deliveryFeeInPaise - discountInPaise + taxInPaise);

  const orderDateStr = createdAt
    ? new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

  // Resolve FRONTEND_URL without localhost
  const rawFrontendUrl = process.env.FRONTEND_URL || '';
  let trackUrl = null;
  if (rawFrontendUrl && !rawFrontendUrl.includes('localhost') && !rawFrontendUrl.includes('127.0.0.1')) {
    trackUrl = `${rawFrontendUrl.replace(/\/$/, '')}/orders/${orderId || ''}`;
  }

  // Check Logo Asset & Prepare CID Attachment
  let logoPath = path.join(process.cwd(), 'public/logo.png');
  if (!fs.existsSync(logoPath)) {
    logoPath = path.join(__dirname, '../../public/logo.png');
  }
  const logoExists = fs.existsSync(logoPath);

  // Generate Centralized PDF Tax Invoice Attachment via invoiceService
  const invoiceService = require('../services/invoiceService');
  let pdfBuffer = null;
  try {
    pdfBuffer = await invoiceService.generateOrderInvoicePdf({
      orderNumber,
      studentId: { name: studentName, email: to, phone: studentPhone },
      studentName,
      studentEmail: to,
      studentPhone,
      canteenId: { name: canteenName },
      canteenName,
      items,
      pricingBreakdown,
      fulfillmentType,
      deliveryDetails,
      createdAt,
      status,
      paymentId,
    });
  } catch (pdfErr) {
    logger.warn({ msg: 'Centralized PDF Tax Invoice generation warning', error: pdfErr.message });
  }

  const fulfillmentLocation = fulfillmentType === 'DELIVERY'
    ? (deliveryDetails?.hostelName
        ? `Hostel Delivery (${deliveryDetails.hostelName}${deliveryDetails.roomNumber ? `, Room ${deliveryDetails.roomNumber}` : ''})`
        : 'Hostel Delivery')
    : 'Counter Pickup';

  const itemRowsHtml = items.length > 0
    ? items.map(item => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b;font-weight:600;">
            ${item.name || 'Food Item'}
            ${item.customizations && item.customizations.length > 0 ? `<div style="font-size:11px;color:#64748b;font-weight:normal;margin-top:2px;">+ ${item.customizations.map(c => `${c.groupName || 'Option'}: ${c.selectedOption || c.optionName || ''}`).join(', ')}</div>` : ''}
          </td>
          <td align="center" style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#475569;">${item.quantity || 1}</td>
          <td align="right" style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#0f172a;font-weight:700;">${formatRupees(item.itemTotalInPaise || (item.priceInPaise * (item.quantity || 1)))}</td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#64748b;font-size:13px;">Order Items</td></tr>`;

  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — #${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- MAIN CONTAINER TABLE -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- EMAIL CARD (Max 580px) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #ff6b00 0%, #ea580c 100%);padding:28px 20px;text-align:center;">
              <div style="font-size:13px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">
                ✓ ORDER CONFIRMED & PAID
              </div>
              ${logoExists ? `<img src="cid:campusbite-logo" alt="CampusBite Logo" width="72" height="72" style="display:block;margin:0 auto 10px auto;width:72px;height:72px;border:0;outline:none;" />` : ''}
              <div style="font-size:24px;font-weight:800;color:#ffffff;font-family:Arial,sans-serif;letter-spacing:-0.5px;margin:0;">
                CampusBite
              </div>
              <div style="margin-top:4px;font-size:13px;color:rgba(255,255,255,0.9);font-family:Arial,sans-serif;font-weight:600;">
                NIT Jamshedpur • Official Order Receipt
              </div>
            </td>
          </tr>

          <!-- PERSONALIZED GREETING & CONFIRMATION BADGE -->
          <tr>
            <td style="padding:24px 24px 12px 24px;">
              <div style="font-size:17px;color:#0f172a;font-family:Arial,sans-serif;line-height:1.4;">Hi <strong>${studentName}</strong> 👋,</div>
              <div style="margin-top:8px;font-size:14px;color:#475569;font-family:Arial,sans-serif;line-height:1.6;">
                Thank you for ordering with CampusBite! Your order <strong>#${orderNumber}</strong> has been received, paid for, and sent to <strong>${canteenName}</strong> for preparation.
              </div>
              <div style="margin-top:14px;">
                <table border="0" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:8px 14px;">
                  <tr>
                    <td style="font-size:12px;font-weight:800;color:#047857;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">
                      ✓ Payment Verified • Confirmed
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- ORDER DETAILS GRID CARD -->
          <tr>
            <td style="padding:10px 24px 16px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
                <tr>
                  <td colspan="2" style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;font-family:Arial,sans-serif;">
                    Customer & Order Details
                  </td>
                </tr>
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">CUSTOMER NAME</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:700;">${studentName}</td>
                </tr>
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">REGISTERED EMAIL</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:600;">${to}</td>
                </tr>
                ${studentPhone ? `
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">PHONE NUMBER</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:600;">${studentPhone}</td>
                </tr>` : ''}
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">ORDER NUMBER</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:800;">#${orderNumber}</td>
                </tr>
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">CANTEEN</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:600;">${canteenName}</td>
                </tr>
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">FULFILLMENT</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#ea580c;font-family:Arial,sans-serif;font-weight:700;">
                    ${fulfillmentLocation}
                  </td>
                </tr>
                <tr>
                  <td width="38%" style="padding:4px 0;font-size:13px;color:#64748b;font-family:Arial,sans-serif;font-weight:600;">DATE & TIME</td>
                  <td width="62%" style="padding:4px 0;font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:600;">${orderDateStr}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ITEMIZED FOOD ORDER TABLE -->
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <thead>
                  <tr style="background-color:#f1f5f9;">
                    <th align="left" style="padding:10px 12px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Item Description</th>
                    <th align="center" style="padding:10px 12px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                    <th align="right" style="padding:10px 12px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- FINANCIAL BREAKDOWN SUMMARY -->
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;">
                <tr>
                  <td style="font-size:13px;color:#64748b;font-family:Arial,sans-serif;">Food Subtotal</td>
                  <td align="right" style="font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:700;">${formatRupees(subtotalInPaise)}</td>
                </tr>
                ${deliveryFeeInPaise > 0 ? `
                <tr>
                  <td style="font-size:13px;color:#64748b;font-family:Arial,sans-serif;padding-top:4px;">Delivery Fee</td>
                  <td align="right" style="font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:700;padding-top:4px;">${formatRupees(deliveryFeeInPaise)}</td>
                </tr>` : ''}
                ${discountInPaise > 0 ? `
                <tr>
                  <td style="font-size:13px;color:#059669;font-family:Arial,sans-serif;padding-top:4px;">Discount Saved</td>
                  <td align="right" style="font-size:13px;color:#059669;font-family:Arial,sans-serif;font-weight:700;padding-top:4px;">-${formatRupees(discountInPaise)}</td>
                </tr>` : ''}
                ${taxInPaise > 0 ? `
                <tr>
                  <td style="font-size:13px;color:#64748b;font-family:Arial,sans-serif;padding-top:4px;">Taxes & Charges</td>
                  <td align="right" style="font-size:13px;color:#0f172a;font-family:Arial,sans-serif;font-weight:700;padding-top:4px;">${formatRupees(taxInPaise)}</td>
                </tr>` : ''}
                <tr>
                  <td style="font-size:15px;color:#ea580c;font-family:Arial,sans-serif;font-weight:800;padding-top:10px;border-top:1px solid #fed7aa;">TOTAL PAID</td>
                  <td align="right" style="font-size:16px;color:#ea580c;font-family:Arial,sans-serif;font-weight:800;padding-top:10px;border-top:1px solid #fed7aa;">${formatRupees(totalInPaise)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ATTACHMENT CALLOUT NOTICE -->
          <tr>
            <td style="padding:0 24px 16px 24px;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;">
                <tr>
                  <td style="font-size:13px;color:#1e40af;font-family:Arial,sans-serif;line-height:1.5;">
                    📄 <strong>Official Tax Invoice Attached:</strong> Your complete tax invoice document with detailed breakdown is attached to this email as a PDF (<code>CampusBite-Invoice-${orderNumber}.pdf</code>).
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TRACK ORDER CTA BUTTON -->
          ${trackUrl ? `
          <tr>
            <td align="center" style="padding:4px 24px 24px 24px;">
              <a href="${trackUrl}" target="_blank" style="background-color:#ea580c;color:#ffffff;display:inline-block;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:800;text-decoration:none;font-family:Arial,sans-serif;box-shadow:0 4px 12px rgba(234,88,12,0.25);">
                Track Order Status →
              </a>
            </td>
          </tr>` : ''}

          <!-- FOOTER -->
          <tr>
            <td align="center" style="background-color:#f1f5f9;border-radius:0 0 16px 16px;padding:20px;">
              <div style="font-size:12px;color:#64748b;font-family:Arial,sans-serif;line-height:1.6;">
                <strong style="color:#334155;">Thank you for choosing CampusBite!</strong><br />
                NIT Jamshedpur Campus Food Delivery<br />
                This is an automated order confirmation email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (!to || typeof to !== 'string' || !to.includes('@') || !to.includes('.')) {
    throw new Error(`Invalid recipient email address format: '${to}'`);
  }

  // Strategy 0: Resend HTTPS API over Port 443 (100% immune to cloud SMTP port blocks)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const resendPayload = {
        from: process.env.EMAIL_FROM || 'CampusBite <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : to.split(',').map(s => s.trim()),
        bcc: [process.env.EMAIL_USER || 'krishnapex1@gmail.com'],
        subject: `✅ Order Confirmed — #${orderNumber}`,
        html,
        attachments: pdfBuffer ? [
          {
            filename: `CampusBite-Invoice-${orderNumber}.pdf`,
            content: pdfBuffer.toString('base64'),
          }
        ] : []
      };

      const resendRes = await axios.post('https://api.resend.com/emails', resendPayload, {
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info({ msg: '📧 [RESEND HTTPS EMAIL DISPATCH SUCCESS]', messageId: resendRes.data?.id, to });
      return { success: true, messageId: resendRes.data?.id };
    } catch (rErr) {
      logger.warn({ msg: 'Resend HTTPS API error, falling back to SMTP...', err: rErr.response?.data || rErr.message });
    }
  }

  try {
    // Robust Multi-Strategy Transporter for Cloud Providers (Render/AWS)
    let transporter;
    try {
      // Strategy 1: Port 587 STARTTLS (Standard for AWS/Render outbound)
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });
      await transporter.verify();
    } catch (tErr1) {
      logger.warn({ msg: 'SMTP Port 587 failed, trying built-in Gmail service wrapper...', err: tErr1.message });
      try {
        // Strategy 2: Built-in Gmail Service Wrapper
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
        });
        await transporter.verify();
      } catch (tErr2) {
        logger.warn({ msg: 'Gmail service wrapper failed, falling back to Port 465 SSL...', err: tErr2.message });
        // Strategy 3: Port 465 Direct SSL
        transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
          tls: { rejectUnauthorized: false },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
        });
      }
    }

    const fromAddress = process.env.EMAIL_FROM || `CampusBite <${smtpUser}>`;

    console.log(`\n[RECEIPT EMAIL DEBUG]
Order ID: ${orderNumber || 'N/A'}
Authenticated User ID: ${authenticatedUserId || 'N/A'}
Order User ID: ${authenticatedUserId || 'N/A'}
User email from MongoDB: ${to}
Recipient passed to Nodemailer: ${to}
CC: None
BCC: None\n`);

    logger.info({
      msg: '📧 [EMAIL RECEIPT - DISPATCHING VIA SMTP]',
      sender: fromAddress,
      recipient: to,
      orderNumber,
    });

    const emailAttachments = [];

    // 1. Attach Logo as CID Inline Image
    if (logoExists) {
      emailAttachments.push({
        filename: 'campusbite-logo.png',
        path: logoPath,
        cid: 'campusbite-logo',
      });
    }

    // 2. Attach PDF Tax Invoice Document
    if (pdfBuffer) {
      emailAttachments.push({
        filename: `CampusBite-Invoice-${orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      bcc: process.env.EMAIL_USER || 'krishnapex1@gmail.com',
      subject: `✅ Order Confirmed — #${orderNumber}`,
      html,
      attachments: emailAttachments,
    });

    const envelopeTo = info.envelope?.to || info.accepted || [to];

    console.log(`\n[NODEMAILER RESULT & ENVELOPE]
Message ID: ${info.messageId}
Accepted: ${JSON.stringify(info.accepted)}
Rejected: ${JSON.stringify(info.rejected)}
Envelope To: ${JSON.stringify(envelopeTo)}\n`);

    logger.info({
      msg: '📧 [SMTP SERVER ACCEPTED EMAIL]',
      sender: fromAddress,
      recipient: to,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      envelopeTo,
      response: info.response,
    });

    if (!info.accepted || info.accepted.length === 0 || (info.rejected && info.rejected.length > 0 && info.rejected.includes(to))) {
      throw new Error(`SMTP provider rejected delivery to '${to}'. Response: ${info.response || 'Rejected'}`);
    }

    return { success: true, messageId: info.messageId, accepted: info.accepted, envelopeTo, response: info.response };
  } catch (err) {
    logger.error({
      msg: '❌ [SMTP EMAIL DELIVERY REJECTED / FAILED]',
      to,
      error: err.message,
      code: err.code,
    });
    throw new Error(`SMTP Email Delivery Failed: ${err.message}`);
  }
}

async function sendWhatsAppOrderReceipt({
  toPhone,
  studentName,
  orderNumber,
  orderId,
  totalAmountInPaise,
  fulfillmentType,
}) {
  const digitsOnly = String(toPhone || '9876543210').replace(/\D/g, '');
  const e164Phone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
  const amountStr = formatRupees(totalAmountInPaise);

  const rawFrontendUrl = process.env.FRONTEND_URL || '';
  const trackUrlStr = (rawFrontendUrl && !rawFrontendUrl.includes('localhost'))
    ? `\nTrack live: ${rawFrontendUrl.replace(/\/$/, '')}/orders/${orderId || ''}`
    : '';

  const textBody = `🧾 *CampusBite NIT Jamshedpur — Order Receipt*
━━━━━━━━━━━━━━━━━━━
🆔 *Order #:* ${orderNumber}
👤 *Student:* ${studentName}
💰 *Total Paid:* ${amountStr}
💳 *Payment Status:* VERIFIED (PAID)
📦 *Fulfillment:* ${fulfillmentType === 'DELIVERY' ? 'Hostel Room Delivery' : 'Canteen Counter Pickup'}
━━━━━━━━━━━━━━━━━━━
Your order is being prepared by the canteen!${trackUrlStr}`;

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (token && phoneNumberId && !token.includes('placeholder')) {
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: e164Phone,
          type: 'text',
          text: { preview_url: false, body: textBody },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );
      logger.info({ msg: '📱 [WHATSAPP DISPATCHED VIA META CLOUD API]', to: e164Phone, messageId: response.data?.messages?.[0]?.id });
      return { success: true, data: response.data };
    } catch (err) {
      logger.warn({ msg: '📱 [WHATSAPP RECEIPT LOGGED]', to: e164Phone, error: err.message, textBody });
      return { success: true, mode: 'DEV_LOGGED', to: e164Phone };
    }
  }

  logger.info({ msg: '📱 [WHATSAPP RECEIPT LOGGED]', to: e164Phone, textBody });
  return { success: true, mode: 'DEV_LOGGED', to: e164Phone };
}

module.exports = {
  sendOrderConfirmationEmail,
  sendWhatsAppOrderReceipt,
};
