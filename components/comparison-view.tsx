'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ImageFile } from '@/types/image';
import { Eye } from 'lucide-react';

interface ComparisonViewProps {
  file: ImageFile;
}

export function ComparisonView({ file }: ComparisonViewProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState('100%');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(`${containerRef.current.clientWidth}px`);
      }
    };
    
    updateWidth();
    
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);

  if (!file || file.status !== 'success' || !file.compressedPreviewUrl) {
    return null;
  }

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Bind mouse/touch events globally when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Eye className="w-4 h-4" />
          Visual Comparison
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-550">
          Drag center slider to wipe before/after. Original on left, Compressed on right.
        </span>
      </div>

      {/* Main visual compare */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interactive Comparison Slider */}
        <div className="col-span-1 md:col-span-2">
          <div
            ref={containerRef}
            className="relative h-[300px] sm:h-[380px] md:h-[450px] w-full rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50 dark:bg-zinc-950 select-none cursor-ew-resize shadow-2xs"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                const x = e.clientX - rect.left;
                setSliderPosition((x / rect.width) * 100);
              }
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect && e.touches.length > 0) {
                const x = e.touches[0].clientX - rect.left;
                setSliderPosition((x / rect.width) * 100);
              }
            }}
          >
            {/* Original Image (Background) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.originalPreviewUrl}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            
            {/* Label Original */}
            <div className="absolute top-4 left-4 z-10 px-2 py-1 rounded bg-black/60 text-white backdrop-blur-xs text-[10px] font-extrabold pointer-events-none uppercase tracking-wider">
              Before
            </div>

            {/* Compressed Image (Foreground) */}
            <div
              className="absolute inset-y-0 left-0 right-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              {/* Note: The image inside this container must remain full width of parent container so it aligns perfectly */}
              <div className="absolute inset-0 h-full" style={{ width: containerWidth }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.compressedPreviewUrl}
                  alt="Compressed"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
              </div>
            </div>

            {/* Label Compressed */}
            <div className="absolute top-4 right-4 z-10 px-2 py-1 rounded bg-emerald-900/80 border border-emerald-800/40 text-emerald-350 backdrop-blur-xs text-[10px] font-extrabold pointer-events-none uppercase tracking-wider">
              After
            </div>

            {/* Slider bar line */}
            <div
              className="absolute inset-y-0 z-20 w-0.5 bg-white shadow-lg pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Slider Handle button */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-zinc-200 shadow-md flex items-center justify-center pointer-events-none dark:bg-zinc-900 dark:border-zinc-800">
                <div className="flex gap-0.5 items-center justify-center">
                  <div className="w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-650 rounded-full" />
                  <div className="w-0.5 h-3.5 bg-zinc-400 dark:bg-zinc-650 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Side-by-side thumbnails (stacked on mobile, side-by-side on desktop) */}
        <div className="space-y-1.5 col-span-1">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Before</span>
          <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.originalPreviewUrl}
              alt="Original preview thumbnail"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-1.5 col-span-1">
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">After</span>
          <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-250 dark:border-zinc-855 bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.compressedPreviewUrl}
              alt="Compressed preview thumbnail"
              className="max-h-full max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
