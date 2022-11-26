import '@/styles/dist.css';
import React from 'react';

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
        <div className="mx-4 my-2">{children}</div>
      </body>
    </html>
  );
}
