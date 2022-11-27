import CryptoJS from 'crypto-js';
import debug from 'debug';
import { Kafka } from 'kafkajs';
import { NextApiRequest, NextApiResponse } from 'next';

const log = debug('nf:events');

log.log = console.log.bind(console);

const kafka = new Kafka({
  clientId: 'nf.api',
  brokers: [process.env.KAFKA_SERVER!],
});

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// curl -Nv localhost:3210/api/events/xxx
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { subscriberId } = req.query;
  log('received subscriber ID', subscriberId);
  const sid = CryptoJS.AES.decrypt(
    subscriberId as string,
    process.env.SESSION_SECRET!,
  ).toString(CryptoJS.enc.Utf8);
  log('received subscriber ID', subscriberId, '->', sid);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  const stop = new Promise((resolve) => {
    req.once('close', () => {
      resolve(null);
    });
  });

  const consumer = kafka.consumer({
    groupId: `nf.consumer.${sid}`, // must be unique to the browser session
  });
  await consumer.connect();
  log(`SSE start: ${process.env.KAFKA_SERVER}`);
  try {
    await consumer.subscribe({
      topic: 'nf.response',
      fromBeginning: false,
    });
    await consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        log(`message: ${message.value ? message.value.toString() : 'null'}`);
        if (message.value) {
          res.write(`data: ${message.value.toString()}\n\n`);
        }
        await consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
      },
    });
    await stop;
  } catch (err) {
    log(`SSE error: ${err}`);
  } finally {
    log('SSE finish');
    res.end('done\n');
    await consumer.disconnect();
  }
};

export default handler;
