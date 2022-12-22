'use client'; // SSEProvider uses `useContext()` which is not available in a Server Component

import {
  EventSourceMessage,
  fetchEventSource,
} from '@microsoft/fetch-event-source';
import { useEffect, useState } from 'react';

import log from '../logger';

type SSEMainProps = {
  subscriberId: string;
};

export default function SSEMain(props: SSEMainProps) {
  const { subscriberId } = props;

  const [esmsg, setESMsg] = useState<EventSourceMessage | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchEventSource(
      // JavaScript (Node.js) implementation
      `${process.env.NEXT_PUBLIC_TOP_URL}/api/events/${subscriberId}`,
      // Python implementation (does not work well)
      // `${process.env.NEXT_PUBLIC_TOP_URL}/api/events/${subscriberId}`
      {
        onmessage: (esmsg: EventSourceMessage) => {
          setESMsg(esmsg);
        },
        signal: ctrl.signal,
      },
    );
    return function cleanup() {
      ctrl.abort();
    };
  }, []);

  function handleClickButton(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.preventDefault();

    const url = `${process.env.NEXT_PUBLIC_TOP_URL}/api/v1/sse_req`;
    log(`fetch: ${url}`);
    fetch(url).then(() => {});
  }

  return (
    <>
      <button
        className="py-0.5 px-2 text-gray-600 bg-gray-300 rounded border-gray-800 hover:bg-gray-200"
        onClick={handleClickButton}
      >
        Get events
      </button>
      <SSEData esmsg={esmsg} />
    </>
  );
}

type SSEDataProps = {
  esmsg: EventSourceMessage | null;
};

function SSEData(props: SSEDataProps) {
  const { esmsg } = props;

  return <p>{esmsg ? esmsg.data : '...'}</p>;
}
