'use client';

import { Card, ColGrid, Title } from '@tremor/react';
import Link from 'next/link';

export default function Page() {
  return (
    <main>
      <Title>
        <Link href="/">next-fastapi-sse</Link>
      </Title>
      <ColGrid numColsMd={2} gapX="gap-x-6" gapY="gap-y-6" marginTop="mt-6">
        <Card>
          <div className="h-28">
            <Link
              href="/sse"
              prefetch={false}
              className="text-blue-500 hover:underline"
            >
              SSE example
            </Link>
          </div>
        </Card>
        <Card>
          <div className="h-28">
            <Link
              href="/streaming"
              prefetch={false}
              className="text-blue-500 hover:underline"
            >
              Streaming SSR example
            </Link>
          </div>
        </Card>
      </ColGrid>
    </main>
  );
}
