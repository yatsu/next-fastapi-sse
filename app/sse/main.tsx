'use client'; // SSEProvider uses `useContext()` which is not available in a Server Component

import { SSEProvider, useSSE } from 'react-hooks-sse';
import log from '../logger';

type State = {
  count: number | null;
};

type Message = {
  value: number;
};

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
    <SSEProvider
      endpoint={
        // JavaScript (Node.js) implementation
        `${process.env.NEXT_PUBLIC_TOP_URL}/api/events/${subscriberId}`
        // Python implementation (does not work well)
        // `${process.env.NEXT_PUBLIC_TOP_URL}/api/events/${subscriberId}`
      }
    >
      <button
        className="py-0.5 px-2 text-gray-600 bg-gray-300 rounded border-gray-800 hover:bg-gray-200"
        onClick={handleClickButton}
      >
        Get events
      </button>
      <SSEData />
    </SSEProvider>
  );
}

function SSEData() {
  const state = useSSE<State, Message>(
    'message',
    {
      count: null,
    },
    {
      stateReducer(prevState, action) {
        log('action', 'data:', action.data, 'prevState:', prevState);
        return {
          count: action.data.value,
        };
      },
      parser(input) {
        return JSON.parse(input);
      },
    },
  );

  return <p>{state.count ? state.count : '...'}</p>;
}
