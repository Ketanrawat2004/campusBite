'use strict';

const groupingService = require('../services/delivery/groupingService');
const { getKafka } = require('../config/kafka');
const { KAFKA_TOPICS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Delivery Grouping Worker
 * Periodically finalizes forming batches and responds to order events.
 */

async function start() {
  // Start periodic 60-second batch finalization timer
  setInterval(async () => {
    try {
      await groupingService.finalizeFormingBatches();
    } catch (err) {
      logger.error({ msg: 'Batch finalization cron error', err: err.message });
    }
  }, 60000);

  logger.info({ msg: 'Delivery grouping worker background timer started (60s interval)' });

  // Connect Kafka consumer for immediate event triggers
  try {
    const kafka = getKafka();
    const consumer = kafka.consumer({ groupId: 'campusbite-grouping-worker' });

    await consumer.connect();
    await consumer.subscribe({
      topics: [KAFKA_TOPICS.ORDER_READY],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          logger.debug({ msg: 'Grouping worker received Kafka event', topic });
          await groupingService.finalizeFormingBatches();
        } catch (err) {
          logger.error({ msg: 'Grouping worker error', err: err.message });
        }
      },
    });
  } catch (err) {
    logger.warn({ msg: 'Grouping worker Kafka consumer setup skipped or deferred', err: err.message });
  }
}

module.exports = { start };
