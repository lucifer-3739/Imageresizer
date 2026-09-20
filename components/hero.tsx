'use client';

import React from 'react';
import { ToolMode } from '@/types/image';
import { Shield, Sparkles, Scaling, RefreshCw, Crop, Film, Minimize2 } from 'lucide-react';

interface HeroProps {
  toolMode?: ToolMode;
}

export function Hero({ toolMode = 'compress' }: HeroProps) {
  const contentMap: Record<
    ToolMode,
    { title: string; subtitle: string; badge: string; icon: React.ReactNode }
  > = {
    compress: {
      title: 'Compress Images Instantly',
      subtitle: 'Reduce image size without sacrificing quality. Fast, secure, and completely browser-based.',
      badge: '100% Private — Client-Side Only',
      icon: <Minimize2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
    resize: {
      title: 'Resize Images & Social Graphics',
      subtitle: 'Scale by percentage, set exact pixel dimensions, or apply 1-click YouTube, Instagram, & X presets.',
      badge: 'Smart Aspect Ratio & Fit Modes',
      icon: <Scaling className="w-3.5 h-3.5 text-indigo-500" />,
    },
    convert: {
      title: 'Convert Between 6 Image Formats',
      subtitle: 'Convert between WEBP, JPEG, PNG, AVIF, BMP, and ICO Favicon formats with zero server uploads.',
      badge: 'Multi-Format Batch Engine',
      icon: <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />,
    },
    crop: {
      title: 'Crop, Rotate & Transform Images',
      subtitle: 'Freeform & preset aspect ratio framing, 90°/180° rotations, and horizontal/vertical mirroring.',
      badge: 'Lossless Canvas Transforms',
      icon: <Crop className="w-3.5 h-3.5 text-amber-500" />,
    },
    media: {
      title: 'Extract Audio & Video Snapshots',
      subtitle: 'Extract crystal-clear audio tracks (WAV) and grab high-res video frames directly on your machine.',
      badge: 'Web Audio & Canvas Engine',
      icon: <Film className="w-3.5 h-3.5 text-sky-500" />,
    },
  };

  const current = contentMap[toolMode] || contentMap.compress;

  return (
    <div className="flex flex-col items-center text-center space-y-5 pt-8 pb-4 max-w-3xl mx-auto px-4 animate-fade-in">
      {/* Privacy Badge */}
      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs transition-colors">
        {current.icon}
        <span>{current.badge}</span>
      </div>

      {/* Main Title */}
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        {current.title}
      </h1>

      {/* Subheading */}
      <p className="text-sm sm:text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
        {current.subtitle}
      </p>
    </div>
  );
}
