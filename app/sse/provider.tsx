import {
  EventSourceMessage,
  fetchEventSource,
  FetchEventSourceInit,
} from '@microsoft/fetch-event-source';
import { ReactNode, useEffect } from 'react';

export default function SSEProvider(
  props: FetchEventSourceInit & { children: ReactNode },
) {
  const {
    headers,
    onopen,
    onmessage,
    onclose,
    onerror,
    openWhenHidden,
    fetch,
    children,
  } = props;
  useEffect(() => {
    const ctrl = new AbortController();
    fetchEventSource(
      // JavaScript (Node.js) implementation
      `${process.env.NEXT_PUBLIC_TOP_URL}/api/events`,
      // Python implementation (does not work well)
      // `${process.env.NEXT_PUBLIC_TOP_URL}/api/events/${subscriberId}`
      {
        headers,
        onopen,
        onmessage: (esmsg: EventSourceMessage) => {
          onmessage && onmessage(esmsg);
        },
        onclose,
        onerror,
        openWhenHidden,
        fetch,
        signal: ctrl.signal,
      },
    );
    return function cleanup() {
      ctrl.abort();
    };
  }, []);

  return <>{children}</>;
}
