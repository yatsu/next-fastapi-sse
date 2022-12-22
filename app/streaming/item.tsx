import log from '../logger';

async function getData(index: number) {
  const url = `${process.env.NEXT_PUBLIC_TOP_URL}/api/stream/${index}`;
  log(`streaming fetch: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

export type ItemProps = {
  index: number;
};

export default async function Item(props: ItemProps) {
  const { index } = props;

  const data = await getData(index);

  return (
    <div>
      Item {index}: {JSON.stringify(data)}
    </div>
  );
}
