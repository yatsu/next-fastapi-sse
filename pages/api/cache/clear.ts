import { NextApiRequest, NextApiResponse } from 'next';
import { serverSideCache } from '../../../cache';

const handler = async (_: NextApiRequest, res: NextApiResponse) => {
  serverSideCache.results = {};
  res.json(serverSideCache);
};

export default handler;
