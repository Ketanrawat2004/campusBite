'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

function formatRupees(p) {
  return `Rs. ${((p || 0) / 100).toFixed(2)}`;
}

/**
 * Single Authoritative PDF Tax Invoice Generator for CampusBite
 * Restores and enhances the exact visual layout matching official order receipt PDF specifications.
 */
async function generateOrderInvoicePdf(orderInput) {
  let order = orderInput;

  // If orderInput is an ID or unpopulated, fetch and populate strictly from MongoDB
  if (!order || typeof order !== 'object' || !order.orderNumber) {
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.models && mongoose.models.Order) {
      const Order = mongoose.model('Order');
      order = await Order.findById(orderInput)
        .populate('studentId', 'name email phone')
        .populate('canteenId', 'name location');
    }
  }

  if (!order || typeof order !== 'object') {
    throw new Error('Order not found for PDF invoice generation');
  }

  const orderNumber = order.orderNumber || 'CB-ORDER';
  const studentName = order.studentId?.name || order.studentName || order.user?.name || order.customerName || 'Valued Customer';
  const studentEmail = order.studentId?.email || order.studentEmail || order.user?.email || order.customerEmail || 'N/A';
  const studentPhone = order.studentId?.phone || order.studentPhone || order.user?.phone || order.customerPhone || 'N/A';
  const canteenName = order.canteenId?.name || order.canteenName || 'Campus Canteen';
  const items = order.items && order.items.length > 0 ? order.items : [];
  const pricingBreakdown = order.pricingBreakdown || {};
  const fulfillmentType = order.fulfillmentType || 'PICKUP';
  const deliveryDetails = order.deliveryDetails || null;
  const createdAt = order.createdAt || new Date();
  const paymentId = order.paymentId || 'VERIFIED_RAZORPAY';

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Logo Check with Comprehensive Paths
      const candidateLogoPaths = [
        path.join(process.cwd(), 'public/logo.png'),
        path.join(process.cwd(), 'src/public/logo.png'),
        path.join(__dirname, '../public/logo.png'),
        path.join(__dirname, '../../public/logo.png'),
        path.join(__dirname, '../../../public/logo.png'),
        path.join(process.cwd(), 'frontend/student/public/logo.png'),
        '/app/public/logo.png',
        '/app/src/public/logo.png',
      ];
      const logoPath = candidateLogoPaths.find((p) => fs.existsSync(p)) || null;

      const pageLeftMargin = 36;
      const pageRightMargin = doc.page.width - 36;
      const printableWidth = doc.page.width - 72; // ~523.28pt for A4

      // 1. Header Section (Logo, Title, Subtitle, Payment Verified Badge)
      let brandTextX = pageLeftMargin;

      if (logoPath && fs.existsSync(logoPath)) {
        doc.image(logoPath, pageLeftMargin, 24, { width: 48, height: 48 });
        brandTextX = pageLeftMargin + 58;
      }

      // CampusBite Brand Title
      doc.fillColor('#ea580c')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('CampusBite', brandTextX, 24);

      // Subtitle
      doc.fillColor('#64748b')
         .fontSize(9.5)
         .font('Helvetica')
         .text('NIT Jamshedpur • Official Tax Invoice & Order Receipt', brandTextX, 52);

      // Payment Verified Badge on Top Right
      doc.fillColor('#059669')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('✓ PAYMENT VERIFIED (CONFIRMED)', pageLeftMargin, 26, {
           width: printableWidth,
           align: 'right',
         });

      // 2. Full-Width Orange Separator Line
      let y = 78;
      doc.moveTo(pageLeftMargin, y)
         .lineTo(pageRightMargin, y)
         .strokeColor('#ea580c')
         .lineWidth(2.5)
         .stroke();

      y += 16; // y = 94

      // 3. Order Invoice Header Title & Card Box Header
      doc.fillColor('#0f172a')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(`Tax Invoice #${orderNumber}`, pageLeftMargin, y);

      y += 22; // y = 116

      // 4. Two-Column Metadata Box Card Background
      const cardHeight = 84;
      doc.rect(pageLeftMargin, y, printableWidth, cardHeight)
         .fillAndStroke('#f8fafc', '#e2e8f0');

      let cardY = y + 10;
      const col1X = pageLeftMargin + 12;
      const col2X = 300;

      const formatDateStr = (dateVal) => {
        try {
          const d = new Date(dateVal);
          return d.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        } catch {
          return new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      };

      const dateStr = formatDateStr(createdAt);

      const fulfillmentLabel = fulfillmentType === 'DELIVERY'
        ? (deliveryDetails?.hostelName
            ? `Hostel Delivery (${deliveryDetails.hostelName}${deliveryDetails.roomNumber ? `, Rm ${deliveryDetails.roomNumber}` : ''})`
            : 'Hostel Delivery')
        : 'Counter Pickup';

      // Metadata Grid Row 1
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER NAME: ', col1X, cardY, { continued: true });
      doc.fillColor('#1e293b').font('Helvetica').text(studentName);

      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('CANTEEN: ', col2X, cardY, { continued: true });
      doc.fillColor('#1e293b').font('Helvetica').text(canteenName);

      cardY += 16;

      // Metadata Grid Row 2
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER EMAIL: ', col1X, cardY, { continued: true });
      doc.fillColor('#1e293b').font('Helvetica').text(studentEmail);

      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('FULFILLMENT: ', col2X, cardY, { continued: true });
      doc.fillColor('#ea580c').font('Helvetica-Bold').text(fulfillmentLabel);

      cardY += 16;

      // Metadata Grid Row 3
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER PHONE: ', col1X, cardY, { continued: true });
      doc.fillColor('#1e293b').font('Helvetica').text(studentPhone);

      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('DATE & TIME: ', col2X, cardY, { continued: true });
      doc.fillColor('#1e293b').font('Helvetica').text(dateStr);

      cardY += 16;

      // Metadata Grid Row 4
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('PAYMENT REF: ', col1X, cardY, { continued: true });
      doc.fillColor('#64748b').font('Helvetica').text(String(paymentId));

      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('STATUS: ', col2X, cardY, { continued: true });
      doc.fillColor('#059669').font('Helvetica-Bold').text('PAID (CONFIRMED)');

      y += cardHeight + 16; // y = 216

      // 5. Table Header Row (Solid Gray Background Box)
      const tableHeaderHeight = 22;
      doc.rect(pageLeftMargin, y, printableWidth, tableHeaderHeight).fill('#f1f5f9');

      const headerTextY = y + 7;
      const colItemX = pageLeftMargin + 10;
      const colQtyX = 290;
      const colPriceX = 360;
      const colAmountX = 440;
      const colAmountWidth = pageRightMargin - colAmountX - 10;

      doc.fillColor('#475569').fontSize(8.5).font('Helvetica-Bold');
      doc.text('ITEM DESCRIPTION', colItemX, headerTextY);
      doc.text('QTY', colQtyX, headerTextY, { width: 40, align: 'center' });
      doc.text('UNIT PRICE', colPriceX, headerTextY, { width: 70, align: 'right' });
      doc.text('AMOUNT', colAmountX, headerTextY, { width: colAmountWidth, align: 'right' });

      y += tableHeaderHeight + 8;

      // 6. Table Data Rows
      let calculatedSubtotalInPaise = 0;

      if (items.length === 0) {
        doc.fillColor('#64748b').fontSize(9.5).font('Helvetica-Oblique').text('No items specified', colItemX, y);
        y += 20;
      } else {
        items.forEach((item) => {
          const qty = item.quantity || 1;
          const priceInPaise = item.priceInPaise || (item.itemTotalInPaise ? Math.round(item.itemTotalInPaise / qty) : 0);
          const itemTotalInPaise = item.itemTotalInPaise ?? (priceInPaise * qty);
          calculatedSubtotalInPaise += itemTotalInPaise;

          doc.fillColor('#1e293b').fontSize(9.5).font('Helvetica-Bold').text(item.name || 'Food Item', colItemX, y, { width: 265 });
          doc.fillColor('#475569').fontSize(9.5).font('Helvetica').text(String(qty), colQtyX, y, { width: 40, align: 'center' });
          doc.fillColor('#64748b').fontSize(9.5).font('Helvetica').text(formatRupees(priceInPaise), colPriceX, y, { width: 70, align: 'right' });
          doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text(formatRupees(itemTotalInPaise), colAmountX, y, { width: colAmountWidth, align: 'right' });

          y += 16;

          // Render customizations if present
          if (item.customizations && Array.isArray(item.customizations) && item.customizations.length > 0) {
            const customText = item.customizations
              .map((c) => `${c.groupName || 'Option'}: ${c.selectedOption || c.optionName || ''}`)
              .filter(Boolean)
              .join(' • ');
            if (customText) {
              doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique').text(`+ ${customText}`, colItemX, y, { width: 265 });
              y += 12;
            }
          }

          y += 8;
        });
      }

      y += 4;

      // 7. Thin Table Bottom Border
      doc.moveTo(pageLeftMargin, y)
         .lineTo(pageRightMargin, y)
         .strokeColor('#e2e8f0')
         .lineWidth(0.8)
         .stroke();

      y += 14;

      // 8. Totals & Pricing Breakdown Section
      const subtotalInPaise = pricingBreakdown.subtotalInPaise ?? calculatedSubtotalInPaise;
      const deliveryFeeInPaise = pricingBreakdown.deliveryFeeInPaise ?? 0;
      const discountInPaise = pricingBreakdown.discountInPaise ?? 0;
      const taxInPaise = pricingBreakdown.taxInPaise ?? 0;
      const totalInPaise = pricingBreakdown.totalInPaise ?? (subtotalInPaise + deliveryFeeInPaise - discountInPaise + taxInPaise);

      // Food Subtotal Row
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Food Subtotal:', 280, y, { width: 150, align: 'right' });
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(formatRupees(subtotalInPaise), colAmountX, y, { width: colAmountWidth, align: 'right' });
      y += 16;

      // Delivery Fee Row
      if (deliveryFeeInPaise > 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Delivery Fee:', 280, y, { width: 150, align: 'right' });
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(formatRupees(deliveryFeeInPaise), colAmountX, y, { width: colAmountWidth, align: 'right' });
        y += 16;
      }

      // Discount Row
      if (discountInPaise > 0) {
        doc.fillColor('#059669').fontSize(9).font('Helvetica').text('Discount Saved:', 280, y, { width: 150, align: 'right' });
        doc.fillColor('#059669').fontSize(9).font('Helvetica-Bold').text(`-${formatRupees(discountInPaise)}`, colAmountX, y, { width: colAmountWidth, align: 'right' });
        y += 16;
      }

      // Tax Row
      if (taxInPaise > 0) {
        doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Taxes & Charges:', 280, y, { width: 150, align: 'right' });
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(formatRupees(taxInPaise), colAmountX, y, { width: colAmountWidth, align: 'right' });
        y += 16;
      }

      y += 6;

      // 9. TOTAL PAID Highlight Box (Orange Cream Container Box)
      const totalBoxWidth = 250;
      const totalBoxHeight = 32;
      const totalBoxX = pageRightMargin - totalBoxWidth;

      doc.rect(totalBoxX, y, totalBoxWidth, totalBoxHeight)
         .fillAndStroke('#fff7ed', '#fed7aa');

      const totalTextY = y + 9;
      doc.fillColor('#ea580c').fontSize(11).font('Helvetica-Bold').text('TOTAL PAID:', totalBoxX + 14, totalTextY);
      doc.fillColor('#ea580c').fontSize(11).font('Helvetica-Bold').text(formatRupees(totalInPaise), colAmountX, totalTextY, { width: colAmountWidth, align: 'right' });

      y += totalBoxHeight + 36;

      // 10. Official Footer & Security Note
      doc.moveTo(pageLeftMargin, y)
         .lineTo(pageRightMargin, y)
         .strokeColor('#cbd5e1')
         .lineWidth(0.8)
         .stroke();

      y += 10;

      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(
        'This is an official computer-generated tax invoice issued by CampusBite (NIT Jamshedpur Campus Food Delivery). No physical signature required.',
        pageLeftMargin,
        y,
        { width: printableWidth, align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateOrderInvoicePdf,
};

