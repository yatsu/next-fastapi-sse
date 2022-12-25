'use client'; // SSEProvider uses `useContext()` which is not available in a Server Component

import { EventSourceMessage } from '@microsoft/fetch-event-source';
import { Reducer, useCallback, useReducer } from 'react';

import log from '../logger';
import SSEProvider from './provider';
import { Data } from './types';

type DataAction =
  | { type: 'merge'; results: Data }
  | { type: 'set'; results: Data };

const dataReducer: Reducer<Data, DataAction> = (state, action) => {
  switch (action.type) {
    case 'merge':
      return { ...state, ...action.results };
    default:
      return action.results;
  }
};

export type SSEMainProps = {
  data: Data;
};

export default function SSEMain(props: SSEMainProps) {
  const initialData = props.data;

  const [data, dispatch] = useReducer(dataReducer, initialData);

  const messageCB = useCallback(
    (esmsg: EventSourceMessage) => {
      log('SSE receive message', data, esmsg.data);
      dispatch({ type: 'merge', results: JSON.parse(esmsg.data) });
    },
    [data],
  );
  function handleClickGet(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.preventDefault();

    dispatch({ type: 'set', results: initialData });

    const url = `/api/v1/sse_req`;
    log(`fetch: ${url}`);
    fetch(url).then(() => {});
  }

  function handleClickClear(ev: React.MouseEvent<HTMLButtonElement>) {
    ev.preventDefault();

    const url = `/api/cache/clear`;
    log(`fetch: ${url}`);
    fetch(url).then((res) => {
      res.json().then(() => {
        log('cleared data', initialData);
        dispatch({ type: 'set', results: initialData });
      });
    });
  }

  return (
    <SSEProvider onmessage={messageCB}>
      <button
        className="py-0.5 px-2 text-gray-600 bg-gray-300 rounded border-gray-800 hover:bg-gray-200"
        onClick={handleClickGet}
      >
        Get events
      </button>
      <button
        className="py-0.5 px-2 ml-2 text-gray-600 bg-gray-300 rounded border-gray-800 hover:bg-gray-200"
        onClick={handleClickClear}
      >
        Clear cache
      </button>
      <SSEData data={data} />
    </SSEProvider>
  );
}

type SSEDataProps = {
  data: Data;
};

function SSEData(props: SSEDataProps) {
  const { data } = props;
  // log('SSE data', data);

  return <p>{data ? JSON.stringify(data) : '...'}</p>;
}
