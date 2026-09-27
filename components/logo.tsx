import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

export function Logo({ className = '', size = 'md', showBadge = true }: LogoProps) {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', badge: 'text-[9px]' },
    md: { icon: 34, text: 'text-xl', badge: 'text-[10px]' },
    lg: { icon: 44, text: 'text-2xl', badge: 'text-xs' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom PixelShrink Emblem */}
      <svg
        width={current.icon}
        height={current.icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="ps-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <linearGradient id="ps-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="ps-pdf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
          <linearGradient id="ps-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <filter id="ps-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#6366f1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Base Squircle */}
        <rect width="40" height="40" rx="10" fill="url(#ps-bg)" />
        <rect
          x="0.75"
          y="0.75"
          width="38.5"
          height="38.5"
          rx="9.25"
          stroke="#27272a"
          strokeWidth="1.5"
        />

        {/* Background Multi-Format Document/Image Layer */}
        <rect
          x="19"
          y="8"
          width="13"
          height="16"
          rx="2.5"
          fill="url(#ps-pdf)"
          opacity="0.85"
        />

        {/* Primary Pixel / Media Aperture Sheet */}
        <rect
          x="8"
          y="11"
          width="18"
          height="20"
          rx="3.5"
          fill="url(#ps-primary)"
          filter="url(#ps-glow)"
        />

        {/* Crisp 'P' Cutout Overlay */}
        <path
          d="M12 14.5h6a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5h-3v6h-3v-13z"
          fill="#ffffff"
        />
        <path
          d="M15 17v2.5h3a1.25 1.25 0 0 0 0-2.5h-3z"
          fill="#09090b"
        />

        {/* Shrink / Focus Spark Node */}
        <circle cx="29" cy="11" r="3" fill="url(#ps-cyan)" />
        <path
          d="M29 6v2M29 14v2M24 11h2M32 11h2"
          stroke="#38bdf8"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Wordmark */}
      <div className="flex items-center gap-1.5">
        <span
          className={`font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 ${current.text}`}
        >
          Pixel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Shrink</span>
        </span>
        {showBadge && (
          <span
            className={`font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-400 ${current.badge}`}
          >
            STUDIO
          </span>
        )}
      </div>
    </div>
  );
}
