import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'nf.api',
  brokers: [process.env.KAFKA_SERVER!],
});

export default kafka;
