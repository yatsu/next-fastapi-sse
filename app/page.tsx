import debug from 'debug';

const log = debug('nf:main');

log.log = console.log.bind(console);

async function getData() {
  const res = await fetch(`${process.env.TOP_URL}/api/data`);
  if (!res.ok) {
    const msg = await res.text();
    log('fetch response', res.url, res.status, msg);
    throw new Error(`Failed to fetch data: ${res.status} ${msg}`);
  }
  return res.json();
}

export default async function Page() {
  const data = await getData();
  log("fetched data", data);

  return (
    <div>
      <div>Data: <pre>{JSON.stringify(data)}</pre></div>
    </div>
  );
}
