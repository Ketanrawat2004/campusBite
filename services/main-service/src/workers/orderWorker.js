'use strict';

const Order = require('../models/Order');
const { transitionStatus } = require('../services/order/orderStateMachine');
const { publishEvent } = require('../events/producer');
const { getKafka } = require('../config/kafka');
const { KAFKA_TOPICS, ORDER_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Order Worker
 * Consumes Kafka events related to Orders.
 * Currently listens to PAYMENT_COMPLETED to transition orders to CONFIRMED.
 */

async function start() {
  const kafka = getKafka();
  const consumer = kafka.consumer({ groupId: 'campusbite-order-worker' });

  await consumer.connect();
  logger.info({ msg: 'Order worker connected to Kafka' });

  await consumer.subscribe({
    topics: [
      KAFKA_TOPICS.PAYMENT_COMPLETED,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const envelope = JSON.parse(message.value.toString());
        const data = envelope.data;

        logger.debug({ msg: 'Order worker received event', topic, eventId: envelope.eventId });

        if (topic === KAFKA_TOPICS.PAYMENT_COMPLETED) {
          const order = await Order.findById(data.orderId)
            .populate('canteenId', 'name imageUrl contactPhone location avgPrepTimeMinutes')
            .populate('studentId', 'name email phone studentProfile')
            .populate('deliveryBatchId', 'batchNumber status deliveryFeePerOrderInPaise deliveryPartnerId');

          if (!order) {
            logger.warn({ msg: 'Order not found for PAYMENT_COMPLETED event', orderId: data.orderId });
            return;
          }

          if (order.status === ORDER_STATUS.PENDING_PAYMENT) {
            logger.info({ msg: 'Transitioning order to CONFIRMED', orderId: order._id });
            await transitionStatus(order, ORDER_STATUS.CONFIRMED, { id: 'SYSTEM', role: 'SYSTEM', note: 'Payment verified successfully' });

            // Publish ORDER_CONFIRMED event with full populated details for notification-service
            publishEvent(KAFKA_TOPICS.ORDER_CONFIRMED, order._id, {
              orderId: order._id,
              orderNumber: order.orderNumber,
              studentId: order.studentId._id,
              canteenId: order.canteenId._id,
              student: order.studentId, // Full populated student
              canteen: order.canteenId, // Full populated canteen
              items: order.items,
              pricingBreakdown: order.pricingBreakdown,
              fulfillmentType: order.fulfillmentType,
              deliveryDetails: order.deliveryDetails,
              estimatedReadyAt: order.estimatedReadyAt,
            });
            logger.info({ msg: 'Published ORDER_CONFIRMED event', orderId: order._id });
          } else {
            logger.info({ msg: 'Order already processed', orderId: order._id, status: order.status });
          }
        }
      } catch (err) {
        logger.error({ msg: 'Order worker error', err: err.message });
      }
    },
  });
}

module.exports = { start };
