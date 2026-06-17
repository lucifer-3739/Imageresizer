import React from 'react';
import { Shield } from 'lucide-react';

export function Hero() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 pt-12 pb-6 max-w-3xl mx-auto px-4">
      {/* Privacy Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800/50 shadow-xs transition-colors">
        <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
        <span>100% Secure — Browser-side only</span>
      </div>
      
      {/* Main Title */}
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
        Compress Images Instantly
      </h1>
      
      {/* Subheading */}
      <p className="text-base md:text-xl text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
        Reduce image size without sacrificing quality. Fast, secure, and completely browser-based.
      </p>
    </div>
  );
}
