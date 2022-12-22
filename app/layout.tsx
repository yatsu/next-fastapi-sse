import '@/styles/dist.css';
import React from 'react';

import '@tremor/react/dist/esm/tremor.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <title>Next.js FastAPI example</title>
      </head>
      <body>
        <div className="my-2 mx-4">{children}</div>
      </body>
    </html>
  );
}
