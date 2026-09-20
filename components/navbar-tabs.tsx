'use client';

import React from 'react';
import { ToolMode } from '@/types/image';
import { Minimize2, Scaling, RefreshCw, Crop, Film } from 'lucide-react';

interface NavbarTabsProps {
  activeMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  disabled?: boolean;
}

export function NavbarTabs({ activeMode, onSelectMode, disabled = false }: NavbarTabsProps) {
  const tabs: { id: ToolMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'compress', label: 'Compress', icon: <Minimize2 className="w-4 h-4" /> },
    { id: 'resize', label: 'Resize', icon: <Scaling className="w-4 h-4" />, badge: 'Presets' },
    { id: 'convert', label: 'Convert', icon: <RefreshCw className="w-4 h-4" />, badge: '6 Formats' },
    { id: 'crop', label: 'Crop & Rotate', icon: <Crop className="w-4 h-4" /> },
    { id: 'media', label: 'Audio & Frames', icon: <Film className="w-4 h-4" />, badge: 'Media' },
  ];

  return (
    <div className="w-full flex justify-center pb-2">
      <div className="inline-flex p-1.5 bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-inner max-w-full overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectMode(tab.id)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer select-none
                ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-white/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/40'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider
                    ${
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }
                  `}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
