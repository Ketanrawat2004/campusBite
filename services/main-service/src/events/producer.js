'use strict';

const { v4: uuidv4 } = require('uuid');
const { getProducer } = require('../config/kafka');
const logger = require('../utils/logger');

/**
 * Publish an event to a Kafka topic.
 *
 * All events follow the envelope format:
 * { eventId, eventType, timestamp, version, data }
 *
 * The key is used for partitioning — events with the same key
 * go to the same partition, preserving ordering for that entity.
 *
 * @param {string} topic
 * @param {string} key - Partition key (e.g., orderId, batchId)
 * @param {object} data - Event payload
 * @param {string} [eventType] - Defaults to topic name
 */
async function publishEvent(topic, key, data, eventType = null) {
  const envelope = {
    eventId: uuidv4(),
    eventType: eventType || topic,
    timestamp: new Date().toISOString(),
    version: '1',
    data,
  };

  try {
    const producer = await getProducer();
    await producer.send({
      topic,
      messages: [
        {
          key: String(key),
          value: JSON.stringify(envelope),
          headers: {
            eventId: envelope.eventId,
            eventType: envelope.eventType,
          },
        },
      ],
    });

    logger.debug({ msg: 'Event published', topic, key, eventId: envelope.eventId });
    return envelope.eventId;
  } catch (err) {
    logger.error({ msg: 'Failed to publish Kafka event', topic, key, err: err.message });
    // Don't throw — event publishing should not fail the main request
    // In production, consider a dead letter queue or outbox pattern
  }
}

module.exports = { publishEvent };
