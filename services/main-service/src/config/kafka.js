'use strict';

const { Kafka, logLevel } = require('kafkajs');
const logger = require('../utils/logger');

let kafkaInstance = null;
let producer = null;

function getKafka() {
  if (kafkaInstance) return kafkaInstance;

  const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  const clientId = process.env.KAFKA_CLIENT_ID || 'campusbite-api';

  kafkaInstance = new Kafka({
    clientId,
    brokers,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 300,
      retries: 5,
    },
  });

  return kafkaInstance;
}

async function getProducer() {
  if (producer) return producer;

  const kafka = getKafka();
  producer = kafka.producer({
    allowAutoTopicCreation: true,
  });

  try {
    await producer.connect();
    logger.info({ msg: 'Kafka producer connected' });
  } catch (err) {
    logger.debug({ msg: 'Kafka unavailable — running in standalone mode', err: err.message });
    producer = {
      send: async () => {},
      disconnect: async () => {},
    };
  }

  return producer;
}

async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    logger.info({ msg: 'Kafka producer disconnected' });
  }
}

module.exports = { getKafka, getProducer, disconnectProducer };
