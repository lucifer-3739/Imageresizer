'use client';

import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

export function AdBanner({
  slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || '',
  format = 'auto',
  responsive = true,
  className = '',
  style,
  label = 'Advertisement',
}: AdBannerProps) {
  const adContainerRef = useRef<HTMLDivElement | null>(null);
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isConfigured = Boolean(publisherId && publisherId.length > 5);

  const formattedPublisherId = publisherId
    ? publisherId.startsWith('ca-pub-')
      ? publisherId
      : publisherId.startsWith('pub-')
      ? `ca-${publisherId}`
      : `ca-pub-${publisherId}`
    : '';

  useEffect(() => {
    if (!isConfigured) return;

    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('Google AdSense banner initialization warning:', err);
    }
  }, [slot, isConfigured]);

  return (
    <div
      ref={adContainerRef}
      className={`w-full my-6 flex flex-col items-center justify-center overflow-hidden ${className}`}
    >
      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-600 mb-1 select-none">
        {label}
      </span>

      {isConfigured ? (
        <ins
          className="adsbygoogle block w-full text-center"
          style={style || { display: 'block', minHeight: '90px' }}
          data-ad-client={formattedPublisherId}
          data-ad-slot={slot || '1234567890'}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      ) : (
        <div className="w-full max-w-4xl min-h-[90px] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 flex flex-col items-center justify-center p-4 text-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Google AdSense Unit
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Configure <code className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">NEXT_PUBLIC_ADSENSE_CLIENT_ID</code> in your environment to show live ads.
          </p>
        </div>
      )}
    </div>
  );
}
