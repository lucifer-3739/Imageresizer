'use client';

import React from 'react';
import Script from 'next/script';

interface GoogleAdSenseProps {
  pId?: string;
}

export function GoogleAdSense({ pId }: GoogleAdSenseProps) {
  const publisherId = pId || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!publisherId) {
    return null;
  }

  // Ensure format is ca-pub-XXXXXXXXXXXXXXXX
  const formattedPublisherId = publisherId.startsWith('ca-pub-')
    ? publisherId
    : publisherId.startsWith('pub-')
    ? `ca-${publisherId}`
    : `ca-pub-${publisherId}`;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${formattedPublisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
