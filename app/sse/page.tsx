import Link from 'next/link';
import log from '../logger';
import SSEMain from './main';
import { Data, DataResults } from './types';

async function getData(): Promise<Data> {
  let result: DataResults = { results: {} };

  const cacheRes = await fetch(
    `${process.env.NEXT_PUBLIC_TOP_URL}/api/cache/get`,
  );
  if (!cacheRes.ok) {
    const msg = await cacheRes.text();
    log('fetch response', cacheRes.url, cacheRes.status, msg);
    throw new Error(`Failed to fetch data: ${cacheRes.status} ${msg}`);
  }
  result = await cacheRes.json();
  log('server-side cache', result);

  const res = await fetch(`${process.env.NEXT_PUBLIC_TOP_URL}/api/v1/data`);
  if (!res.ok) {
    const msg = await res.text();
    log('fetch response', res.url, res.status, msg);
    throw new Error(`Failed to fetch data: ${res.status} ${msg}`);
  }
  const resJson = await res.json();
  result = { results: { ...result.results, ...resJson.results } };
  log('server-side result', result);

  return result.results;
}

export default async function SSERoot() {
  const data = await getData();
  log('fetched data', data);

  return (
    <>
      <div>
        <Link href="/" className="text-blue-500 hover:underline">
          Top
        </Link>
      </div>
      <SSEMain data={data} />
    </>
  );
}
