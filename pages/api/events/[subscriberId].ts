import CryptoJS from 'crypto-js';
import debug from 'debug';
import { NextApiRequest, NextApiResponse } from 'next';
import kafka from '../(kafka)';

const log = debug('nf:events');
log.log = console.log.bind(console);

// curl -Nv localhost:3210/api/events/xxx
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { subscriberId } = req.query;
  let sid = '';
  try {
    sid = CryptoJS.AES.decrypt(
      subscriberId as string,
      process.env.SESSION_SECRET!,
    ).toString(CryptoJS.enc.Utf8);
    log('received subscriber ID', subscriberId, '->', sid);
  } catch (err) {
    throw Error(`Invalid subscriberId: ${err}`);
  }
  if (sid === '') {
    throw Error('Invalid subscriberId');
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/event-stream;charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');

  const closed = new Promise((resolve) => {
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
      topic: 'nf.sse.response',
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
    await closed;
  } catch (err) {
    log(`SSE error: ${err}`);
  } finally {
    log('SSE finish');
    res.end('done\n');
    await consumer.disconnect();
  }
};

export default handler;
