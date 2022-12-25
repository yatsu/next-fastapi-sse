import { NextApiRequest, NextApiResponse } from 'next';
import { serverSideCache } from '../../../cache';

const handler = async (_: NextApiRequest, res: NextApiResponse) => {
  res.json(serverSideCache);
};

export default handler;
