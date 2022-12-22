import Link from 'next/link';
import { Suspense } from 'react';
import log from '../logger';
import Item from './item';

async function getData() {
  const url = `${process.env.NEXT_PUBLIC_TOP_URL}/api/v1/streaming_req`;
  log(`fetch: ${url}`);
  await fetch(url);
  return {};
}

export default async function StreamingTop() {
  await getData();

  return (
    <>
      <Link href="/" prefetch={false} className="text-blue-500 hover:underline">
        Top
      </Link>
      <h1>Streaming</h1>
      {[...Array(3)].map((_, i) => (
        <Suspense key={`item-suspense-${i}`} fallback={<Loading index={i} />}>
          {/* @ts-expect-error Server Component */}
          <Item key={`item-${i + 1}`} index={i + 1} />
        </Suspense>
      ))}
    </>
  );
}

type LoadingProps = {
  index: number;
};

function Loading(props: LoadingProps) {
  const { index } = props;
  return <div>Item {index + 1}: Loading</div>;
}
