import Link from 'next/link';

export default function Page() {
  return (
    <ul>
      <li>
        <Link
          href="/sse"
          prefetch={false}
          className="text-blue-500 hover:underline"
        >
          SSE
        </Link>
      </li>
      <li>
        <Link
          href="/streaming"
          prefetch={false}
          className="text-blue-500 hover:underline"
        >
          Streaming SSR
        </Link>
      </li>
    </ul>
  );
}
