import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Vallavan — Documentaries That Matter', template: '%s · Vallavan' },
  description: 'Tamil-first documentary OTT. Watch free, supported by sponsors.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vallavan.in'),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: '#0A0A0A', color: '#fff', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
