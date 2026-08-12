'use strict';

const Notification = require('../models/Notification');
const User = require('../models/User');
const whatsAppService = require('../services/notification/whatsAppService');
const emailService = require('../services/email/emailService');
const { getKafka } = require('../config/kafka');
const { KAFKA_TOPICS, NOTIFICATION_TYPES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Notification Worker
 * Consumes order/payment/delivery events from Kafka, creates in-app Notifications in MongoDB,
 * and asynchronously dispatches WhatsApp receipts via Meta WhatsApp Cloud API (with dev logging fallback).
 */

async function start() {
  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId: 'campusbite-notification-worker' });

  await consumer.connect();
  logger.info({ msg: 'Notification worker connected to Kafka' });

  // Subscribe to relevant topics
  await consumer.subscribe({
    topics: [
      KAFKA_TOPICS.ORDER_CONFIRMED,
      KAFKA_TOPICS.ORDER_STATUS_UPDATED,
      KAFKA_TOPICS.PAYMENT_COMPLETED,
      KAFKA_TOPICS.PAYMENT_FAILED,
      KAFKA_TOPICS.DELIVERY_ASSIGNED,
      KAFKA_TOPICS.DELIVERY_PICKED_UP,
      KAFKA_TOPICS.DELIVERY_COMPLETED,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const envelope = JSON.parse(message.value.toString());
        const data = envelope.data;

        logger.debug({ msg: 'Notification worker received event', topic, eventId: envelope.eventId });

        let notificationData = null;

        if (topic === KAFKA_TOPICS.ORDER_CONFIRMED) {
          notificationData = {
            userId: data.studentId,
            type: NOTIFICATION_TYPES.ORDER_CONFIRMED,
            title: 'Order Confirmed! 🎉',
            message: `Your order #${data.orderNumber} has been confirmed by the canteen.`,
            relatedEntity: { type: 'order', id: data.orderId },
          };

          // Asynchronously dispatch Meta WhatsApp receipt (Single authoritative email sent by payment verification controller)
          try {
            await whatsAppService.sendOrderReceipt(data, data.student);
          } catch (waErr) {
            logger.warn({ msg: 'WhatsApp receipt dispatch failed gracefully', err: waErr.message });
          }

        } else if (topic === KAFKA_TOPICS.ORDER_STATUS_UPDATED) {
          if (data.newStatus === 'PREPARING') {
            notificationData = {
              userId: data.studentId,
              type: NOTIFICATION_TYPES.ORDER_PREPARING,
              title: 'Order Being Prepared 🍳',
              message: `The canteen is now preparing your order #${data.orderNumber}.`,
              relatedEntity: { type: 'order', id: data.orderId },
            };
          } else if (data.newStatus === 'READY') {
            notificationData = {
              userId: data.studentId,
              type: NOTIFICATION_TYPES.ORDER_READY,
              title: 'Order Ready! 🍱',
              message: `Your order #${data.orderNumber} is ready!`,
              relatedEntity: { type: 'order', id: data.orderId },
            };
            
            // Email receipt
            try {
              const student = await User.findById(data.studentId);
              if (student) {
                await emailService.sendOrderReadyEmail({
                  to: student.email,
                  studentName: student.name,
                  orderNumber: data.orderNumber,
                  canteenName: 'Canteen', // Not available in basic ORDER_STATUS_UPDATED payload, but acceptable
                  fulfillmentType: 'DELIVERY', // Hardcoded fallback or we fetch Order
                });
              }
            } catch (err) {
              logger.warn({ msg: 'Ready email failed', err: err.message });
            }
            
          } else if (data.newStatus === 'DELIVERED') {
            notificationData = {
              userId: data.studentId,
              type: NOTIFICATION_TYPES.ORDER_DELIVERED,
              title: 'Order Delivered 📦',
              message: `Your order #${data.orderNumber} has been delivered. Enjoy your meal!`,
              relatedEntity: { type: 'order', id: data.orderId },
            };
            
            // Email receipt
            try {
              const student = await User.findById(data.studentId);
              if (student) {
                await emailService.sendOrderDeliveredEmail({
                  to: student.email,
                  studentName: student.name,
                  orderNumber: data.orderNumber,
                });
              }
            } catch (err) {
              logger.warn({ msg: 'Delivered email failed', err: err.message });
            }
          }
        }

        if (notificationData) {
          await Notification.create(notificationData);
          logger.info({ msg: 'Notification created in DB', userId: notificationData.userId, title: notificationData.title });
        }
      } catch (err) {
        logger.error({ msg: 'Notification worker error', err: err.message });
      }
    },
  });
}

module.exports = { start };
