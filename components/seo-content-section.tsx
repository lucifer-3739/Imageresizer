'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Sparkles,
  ChevronDown,
  FileCheck2,
  Cpu,
  Globe2,
  CheckCircle,
} from 'lucide-react';

export function SeoContentSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does PixelShrink compress images without losing quality?',
      a: 'PixelShrink uses advanced browser-native canvas quantization and progressive entropy encoding algorithms. By eliminating redundant metadata and selectively reducing imperceptible high-frequency color variations, files can be reduced in size by up to 90% while retaining pixel-sharp clarity.',
    },
    {
      q: 'Is PixelShrink safe and private to use for sensitive documents?',
      a: 'Absolutely. Unlike traditional online converters that upload your confidential photos and PDF contracts to third-party cloud servers, PixelShrink processes 100% of your images and PDF files locally inside your web browser. No data ever leaves your computer or phone.',
    },
    {
      q: 'Which image formats can I convert between?',
      a: 'PixelShrink supports 12 modern and legacy image formats: WEBP, JPEG, PNG, AVIF (next-generation), SVG (vector XML), PDF (document wrapper), TIFF (32-bit print/HDR), ICO (multi-resolution 16px-256px favicon), BMP (Windows bitmap), GIF (animation), TGA (3D & game texture), and PPM (raw binary pixmap).',
    },
    {
      q: 'How do I resize an image for a YouTube thumbnail or Instagram post?',
      a: 'Navigate to the Resizer tab, upload your photo, and click the preset of your choice: YouTube Thumbnail (1280×720 px), YouTube Channel Banner (2560×1440 px), Instagram Square (1080×1080 px), Story (1080×1920 px), or enter custom pixel dimensions.',
    },
    {
      q: 'Can I resize, watermark, merge, and split PDF documents for free?',
      a: 'Yes! The PDF Suite Pro tool allows you to scale documents to standard ISO page sizes (A4, Letter, Legal, A3, A5), rotate individual pages by 90/180/270 degrees, delete unwanted pages, apply customized text watermarks & page numbering, and merge multiple PDFs together.',
    },
    {
      q: 'Can I download videos and extract audio tracks from web links?',
      a: 'Yes. The Universal Audio & Media tool lets you input links from supported platforms to download high-definition MP4 video (with synchronized audio remuxed at up to 4K resolution) or extract standalone high-fidelity audio tracks in MP3 (320kbps), Lossless WAV, M4A, or OPUS format.',
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto mt-16 pt-12 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-16 text-left">
      {/* SECTION 1: Key Advantages & Privacy Value */}
      <div className="space-y-6 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal Browser-Side Media Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Why Millions Choose PixelShrink for Image & Media Optimization
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The all-in-one suite designed for creators, web developers, designers, and marketers who demand maximum speed, zero server queues, and total data privacy.
        </p>
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            100% Private & Client-Side
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Your files never touch remote cloud servers. All conversions, compressions, and PDF operations run directly in your browser using WebAssembly and HTML5 Canvas.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Lightning Fast Batch Processing
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            No upload queues, file size limits, or throttling. Optimize hundreds of images simultaneously and download them in a single high-speed ZIP archive.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/60 space-y-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            12 Formats & Pro PDF Tools
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Convert seamlessly between WEBP, PNG, AVIF, SVG, TIFF, ICO, PDF, and BMP. Resize to ISO A4 documents, watermark, and split or merge with pixel precision.
          </p>
        </div>
      </div>

      {/* SECTION 2: HOW-TO GUIDES */}
      <div className="p-8 rounded-3xl bg-zinc-900 text-white dark:bg-zinc-900/80 border border-zinc-800 space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Quick Tutorial
          </span>
          <h2 className="text-xl sm:text-2xl font-bold">
            How to Optimize Your Media in 3 Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-zinc-100">Select Tool & Upload</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Choose Compressor, Resizer, Converter, PDF Suite, or Media Extractor, then drag and drop your files or paste a media link.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-zinc-100">Customize Settings</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Fine-tune quality sliders, pick social media dimensions, choose target formats, or apply PDF watermarks in real-time.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-zinc-100">Export & Download</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Click Download for individual files or grab all processed assets together in a clean, high-speed ZIP package.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Common Questions
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Frequently Asked Questions (FAQ)
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors"
                >
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3.5 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
