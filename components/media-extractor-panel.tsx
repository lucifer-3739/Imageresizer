'use client';

import React from 'react';
import { MediaExtractSettings, ImageFile } from '@/types/image';
import { Music, Film, Info, Download, AlertTriangle, Play, Sparkles } from 'lucide-react';
import { formatSize } from '@/lib/format-size';

interface MediaExtractorPanelProps {
  settings: MediaExtractSettings;
  onSettingsChange: (settings: MediaExtractSettings) => void;
  activeFile: ImageFile | null;
  onDownloadAudio?: (file: File) => void;
  onDownloadFrame?: (frame: { url: string; name: string; file: File }) => void;
  disabled?: boolean;
}

export function MediaExtractorPanel({
  settings,
  onSettingsChange,
  activeFile,
  onDownloadAudio,
  onDownloadFrame,
  disabled = false,
}: MediaExtractorPanelProps) {
  const update = <K extends keyof MediaExtractSettings>(
    key: K,
    value: MediaExtractSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-sky-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Media Extractor</h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          Audio & Frames
        </span>
      </div>

      {/* Mode Switcher: Audio vs Video Frames */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => update('mode', 'audio')}
          disabled={disabled}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer
            ${
              settings.mode === 'audio'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }
          `}
        >
          <Music className="w-4 h-4 text-sky-500" />
          <span>Extract Audio (WAV)</span>
        </button>

        <button
          type="button"
          onClick={() => update('mode', 'frames')}
          disabled={disabled}
          className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer
            ${
              settings.mode === 'frames'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }
          `}
        >
          <Film className="w-4 h-4 text-sky-500" />
          <span>Extract Frames (JPG)</span>
        </button>
      </div>

      {/* Frame Extraction Controls */}
      {settings.mode === 'frames' && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Snapshot Interval
              </label>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                Every {settings.frameInterval}s
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={settings.frameInterval}
              onChange={(e) => update('frameInterval', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Maximum Frame Limit
              </label>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {settings.maxFrames} frames
              </span>
            </div>
            <div className="flex gap-2">
              {[4, 8, 12, 16].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => update('maxFrames', cnt)}
                  disabled={disabled}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center
                    ${
                      settings.maxFrames === cnt
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-300'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                    }
                  `}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Extracted Audio Playback & Download Card */}
      {settings.mode === 'audio' && activeFile?.extractedAudioFile && (
        <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                {activeFile.extractedAudioFile.name}
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-sky-700 dark:text-sky-300">
              {formatSize(activeFile.extractedAudioFile.size)}
            </span>
          </div>

          <audio
            controls
            src={URL.createObjectURL(activeFile.extractedAudioFile)}
            className="w-full h-8"
          />

          {onDownloadAudio && (
            <button
              type="button"
              onClick={() => onDownloadAudio(activeFile.extractedAudioFile!)}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Extracted Audio (WAV)</span>
            </button>
          )}
        </div>
      )}

      {/* Extracted Frames Gallery */}
      {settings.mode === 'frames' && activeFile?.extractedFrames && activeFile.extractedFrames.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
            Captured Video Frames ({activeFile.extractedFrames.length})
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {activeFile.extractedFrames.map((frame, idx) => (
              <div
                key={idx}
                className="group relative aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.url}
                  alt={frame.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/70 text-white text-[9px] font-mono">
                  {Math.round(frame.time)}s
                </span>
                {onDownloadFrame && (
                  <button
                    type="button"
                    onClick={() => onDownloadFrame(frame)}
                    className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 hover:bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Download Frame"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note about YouTube / Remote URLs */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/60 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
          <Info className="w-3.5 h-3.5 text-sky-500" />
          <span>Client-Side Privacy Architecture</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          PixelShrink processes all media <strong>100% locally in your browser</strong> via Web Audio API & Canvas. To respect platform terms & browser CORS boundaries, please upload your local video/audio files directly to convert them privately.
        </p>
      </div>
    </div>
  );
}
