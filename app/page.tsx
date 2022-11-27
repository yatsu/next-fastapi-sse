import log from './logger';
import SSEContainer from './sse';

async function getData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_TOP_URL}/api/v1/data`);
  if (!res.ok) {
    const msg = await res.text();
    log('fetch response', res.url, res.status, msg);
    throw new Error(`Failed to fetch data: ${res.status} ${msg}`);
  }
  return res.json();
}

export default async function Page() {
  const data = await getData();
  log('fetched data', data);

  return (
    <>
      <div>
        Initial data: <pre>{JSON.stringify(data)}</pre>
      </div>
      <SSEContainer />
    </>
  );
}
