'use client'; // SSEProvider uses `useContext()` which is not available in a Server Component

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useSubscription } from 'react-query-subscription';
import { eventSource$ } from 'rx-event-source';

const queryClient = new QueryClient();

import log from '../logger';

type SSEMainProps = {
  subscriberId: string;
};

export default function SSEMain(props: SSEMainProps) {
  const { subscriberId } = props;

  function handleClickButton(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.preventDefault();

    const url = `${process.env.NEXT_PUBLIC_TOP_URL}/api/v1/sse_req`;
    log(`fetch: ${url}`);
    fetch(url).then(() => {});
  }

  return (
    <QueryClientProvider client={queryClient}>
      <button
        className="py-0.5 px-2 text-gray-600 bg-gray-300 rounded border-gray-800 hover:bg-gray-200"
        onClick={handleClickButton}
      >
        Get events
      </button>
      <SSEData subscriberId={subscriberId} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

type SSEDataProps = {
  subscriberId: string;
};

function SSEData(props: SSEDataProps) {
  const { subscriberId } = props;

  const { data, isLoading, isError, error } = useSubscription(
    ['message'],
    () =>
      eventSource$(
        `${process.env.NEXT_PUBLIC_TOP_URL}/api/events/${subscriberId}`,
      ),
    {
      // options
    },
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div role="alert">{error?.message || 'Unknown error'}</div>;
  }
  return <div>Data: {JSON.stringify(data)}</div>;
}
