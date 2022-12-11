import CryptoJS from 'crypto-js';
import debug from 'debug';
import { NextApiRequest, NextApiResponse } from 'next';
import kafka from '../../(kafka)';

const log = debug('nf:events');
log.log = console.log.bind(console);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { subscriberId, index } = req.query;
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

  const consumer = kafka.consumer({
    groupId: `nf.consumer.${sid}.${index}`, // must be unique to the browser session
  });
  await consumer.connect();

  try {
    const topic = `nf.streaming.response.${index}`;
    log(`subscribe: ${topic}`);
    await consumer.subscribe({
      topic,
      fromBeginning: false,
    });
    await new Promise((resolve) => {
      consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
          log(`streaming message: ${message.value ? message.value.toString() : 'null'}`);
          if (message.value) {
            res.json(JSON.parse(message.value.toString()));
          } else {
            throw Error(`Bad message ${message}`);
          }
          await consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (Number(message.offset) + 1).toString(),
            },
          ]);
          resolve(null);
        },
      });
    });
  } catch (err) {
    log(`Streaming error: ${err}`);
  } finally {
    log('Streaming finish');
    await consumer.disconnect();
  }
};

export default handler;
