import log from '../logger';

async function getData(subscriberId: string, index: number) {
  const url = `${process.env.NEXT_PUBLIC_TOP_URL}/api/stream/${subscriberId}/${index}`;
  log(`streaming fetch: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data');
  }
  return res.json();
}

export type ItemProps = {
  subscriberId: string;
  index: number;
};

export default async function Item(props: ItemProps) {
  const { subscriberId, index } = props;

  const data = await getData(subscriberId, index);

  return (
    <div>
      Item {index}: {JSON.stringify(data)}
    </div>
  );
}
