'use client';
import { SSEProvider, useSSE } from 'react-hooks-sse';
import log from './logger';

type State = {
  count: number | null;
};

type Message = {
  value: number;
};

export default function SSEContainer() {
  function handleClickButton(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.preventDefault();

    (async () => {
      const url = `${process.env.NEXT_PUBLIC_TOP_URL}/api/v1/async_data`;
      log(`fetch: ${url}`);
      await fetch(url);
    })().then(() => {});
  }

  return (
    <SSEProvider
      endpoint={
        global.location
          ? `${location.origin}/api/events` // JavaScript (Node.js) implementation
          : `${process.env.BACKEND_URL}/api/events`
        // ? `${location.origin}/api/v1/events` // Python implementation (does not work well)
        // : `${process.env.BACKEND_URL}/api/v1/events`
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
