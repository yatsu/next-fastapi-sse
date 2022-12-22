import debug from 'debug';
import { NextApiRequest, NextApiResponse } from 'next';
import kafka from '../(kafka)';

const log = debug('nf:events');
log.log = console.log.bind(console);

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { index } = req.query;
  const consumer = kafka.consumer({
    // groupId must be unique to the browser session
    groupId: `nf.consumer.${Math.random().toString(32).substring(2)}`,
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
          log(
            `streaming message: ${
              message.value ? message.value.toString() : 'null'
            }`,
          );
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
