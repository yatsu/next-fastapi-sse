import debug from 'debug';
import { NextApiRequest, NextApiResponse } from 'next';
import { serverSideCache } from '../../cache';
import kafka from './(kafka)';

const log = debug('nf:events');
log.log = console.log.bind(console);

// curl -Nv localhost:3210/api/events/xxx
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
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
    // groupId must be unique to the browser session
    groupId: `nf.consumer.${Math.random().toString(32).substring(2)}`,
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
        if (message.value) {
          const value = JSON.parse(message.value.toString());
          serverSideCache.results = { ...serverSideCache.results, ...value };
          log(`SSE cache: ${JSON.stringify(serverSideCache.results)}`);
          log(`SSE send message: ${JSON.stringify(value)}`);
          res.write(`data: ${JSON.stringify(value)}\n\n`);
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
