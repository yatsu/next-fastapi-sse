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
  return (
    <SSEProvider
      endpoint={
        global.location
          ? `${location.origin}/api/stream`
          : `${process.env.BACKEND_URL}/api/stream`
      }
    >
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
      stateReducer(_prevState, action) {
        log('action', action);
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
