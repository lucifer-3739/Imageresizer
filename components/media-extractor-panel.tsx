'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaExtractSettings, ImageFile } from '@/types/image';
import {
  Music,
  Film,
  Info,
  Download,
  Play,
  Pause,
  Scissors,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  FolderInput,
  RotateCcw,
  AudioWaveform,
  Video,
  ChevronDown,
  VolumeX,
  Check,
  Globe,
  Share2,
} from 'lucide-react';
import { formatSize } from '@/lib/format-size';
import {
  SAMPLE_MUSIC_TRACKS,
  downloadMediaFromUrl,
  fetchMediaInfo,
  trimAudio,
  getDirectStreamDownloadUrl,
  FetchedMediaResult,
  MediaInfoResult,
  MediaFormatItem,
  audioBufferToWavBlob,
} from '@/lib/url-audio-downloader';

interface MediaExtractorPanelProps {
  settings: MediaExtractSettings;
  onSettingsChange: (settings: MediaExtractSettings) => void;
  activeFile: ImageFile | null;
  onDownloadAudio?: (file: File) => void;
  onDownloadFrame?: (frame: { url: string; name: string; file: File }) => void;
  onImportAudioFile?: (file: File) => void;
  disabled?: boolean;
}

export function MediaExtractorPanel({
  settings,
  onSettingsChange,
  activeFile,
  onDownloadAudio,
  onDownloadFrame,
  onImportAudioFile,
  disabled = false,
}: MediaExtractorPanelProps) {
  // URL Downloader State
  const [urlInput, setUrlInput] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ status: string; percent: number }>({
    status: '',
    percent: 0,
  });
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Inspected Video / Media metadata & formats
  const [mediaInfo, setMediaInfo] = useState<MediaInfoResult | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<MediaFormatItem | null>(null);

  // Active Downloaded Media State
  const [fetchedMedia, setFetchedMedia] = useState<FetchedMediaResult | null>(null);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Trimming State
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);

  const update = <K extends keyof MediaExtractSettings>(
    key: K,
    value: MediaExtractSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync Audio duration & trim boundaries when new audio is loaded
  useEffect(() => {
    if (fetchedMedia) {
      setTrimStart(0);
      setTrimEnd(Math.round(fetchedMedia.duration * 10) / 10);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [fetchedMedia]);

  // Step 1: Inspect URL & load available formats
  const handleInspectUrl = async (customUrl?: string) => {
    const url = (customUrl || urlInput).trim();
    if (!url) {
      setFetchError('Please enter a valid URL.');
      return;
    }

    setIsInspecting(true);
    setFetchError(null);
    setMediaInfo(null);
    setFetchedMedia(null);

    try {
      const info = await fetchMediaInfo(url);
      setMediaInfo(info);
      if (info.formats && info.formats.length > 0) {
        setSelectedFormat(info.formats[0]);
      }
      setIsInspecting(false);
    } catch (err: any) {
      // If direct info inspect fails, attempt direct download fallback
      try {
        const directRes = await downloadMediaFromUrl(url, 'video');
        setFetchedMedia(directRes);
        setIsInspecting(false);
      } catch (fallbackErr: any) {
        setFetchError(err.message || fallbackErr.message || 'Failed to analyze this link.');
        setIsInspecting(false);
      }
    }
  };

  // Step 2: Download specific format from dropdown
  const handleDownloadFormat = async (format: MediaFormatItem) => {
    if (!mediaInfo) return;
    setIsDropdownOpen(false);
    setSelectedFormat(format);
    setFetchError(null);

    const targetUrl = mediaInfo.originalUrl || urlInput.trim();
    if (!targetUrl) {
      setFetchError('Please enter a valid media URL.');
      return;
    }

    // 1. Instant native browser file download
    const directEndpoint = getDirectStreamDownloadUrl(targetUrl, format);
    const downloadLink = document.createElement('a');
    downloadLink.href = directEndpoint;
    downloadLink.setAttribute('download', '');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 2. Concurrently load into in-app media studio preview
    setIsDownloading(true);
    setDownloadProgress({ status: `Downloading ${format.label} (${format.quality})...`, percent: 25 });

    try {
      const result = await downloadMediaFromUrl(
        targetUrl,
        format,
        (status, percent) => {
          setDownloadProgress({ status, percent });
        }
      );
      setFetchedMedia(result);
      setIsDownloading(false);
    } catch (err: any) {
      // Browser already triggered the native download stream
      setIsDownloading(false);
    }
  };

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleApplyTrim = async () => {
    if (!fetchedMedia || !fetchedMedia.audioBuffer) return;
    setIsTrimming(true);
    try {
      const trimmed = await trimAudio(
        fetchedMedia.audioBuffer,
        trimStart,
        trimEnd,
        fetchedMedia.name
      );

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ab = await trimmed.file.arrayBuffer();
      const newBuffer = await audioCtx.decodeAudioData(ab);
      await audioCtx.close();

      setFetchedMedia({
        ...fetchedMedia,
        file: trimmed.file,
        name: trimmed.file.name,
        duration: trimmed.duration,
        audioBuffer: newBuffer,
        peaks: trimmed.peaks,
        mediaUrl: trimmed.audioUrl,
        size: trimmed.file.size,
      });

      setShowTrimmer(false);
      setIsTrimming(false);
    } catch (e: any) {
      console.error('Trim error:', e);
      setIsTrimming(false);
    }
  };

  const handleDownloadDirect = () => {
    if (!fetchedMedia) return;
    const a = document.createElement('a');
    a.href = fetchedMedia.mediaUrl;
    a.download = fetchedMedia.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadWav = () => {
    if (!fetchedMedia || !fetchedMedia.audioBuffer) return;
    const wavBlob = audioBufferToWavBlob(fetchedMedia.audioBuffer);
    const wavUrl = URL.createObjectURL(wavBlob);
    const dotIdx = fetchedMedia.name.lastIndexOf('.');
    const baseName = dotIdx !== -1 ? fetchedMedia.name.substring(0, dotIdx) : fetchedMedia.name;
    const a = document.createElement('a');
    a.href = wavUrl;
    a.download = `${baseName}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(wavUrl);
  };

  const handleImportToWorkspace = () => {
    if (!fetchedMedia || !onImportAudioFile) return;
    onImportAudioFile(fetchedMedia.file);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const supportedProviders = [
    { name: 'youtube.com', color: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/60 dark:text-red-400' },
    { name: 'instagram.com', color: 'bg-pink-500/10 text-pink-600 border-pink-200 dark:border-pink-900/60 dark:text-pink-400' },
    { name: 'facebook.com', color: 'bg-blue-600/10 text-blue-600 border-blue-200 dark:border-blue-900/60 dark:text-blue-400' },
    { name: 'tiktok.com', color: 'bg-zinc-900/10 text-zinc-900 border-zinc-300 dark:border-zinc-700 dark:text-zinc-100' },
    { name: 'google drive', color: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/60 dark:text-amber-400' },
    { name: 'dropbox.com', color: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-900/60 dark:text-sky-400' },
    { name: 'vimeo.com', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-900/60 dark:text-cyan-400' },
    { name: 'dailymotion.com', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/60 dark:text-indigo-400' },
    { name: 'soundcloud.com', color: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/60 dark:text-orange-400' },
    { name: 'reddit.com', color: 'bg-orange-600/10 text-orange-600 border-orange-200 dark:border-orange-900/60 dark:text-orange-400' },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
              Universal Video & Music Downloader
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Download YouTube, Instagram, TikTok, Drive videos & MP3 audio
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          HD Video & Audio
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => update('mode', 'url-music')}
          disabled={disabled}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center
            ${
              settings.mode === 'url-music'
                ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }
          `}
        >
          <LinkIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">URL Downloader</span>
        </button>

        <button
          type="button"
          onClick={() => update('mode', 'audio')}
          disabled={disabled}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center
            ${
              settings.mode === 'audio'
                ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }
          `}
        >
          <Music className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Video Audio</span>
        </button>

        <button
          type="button"
          onClick={() => update('mode', 'frames')}
          disabled={disabled}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center
            ${
              settings.mode === 'frames'
                ? 'bg-white dark:bg-zinc-800 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }
          `}
        >
          <Film className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Video Frames</span>
        </button>
      </div>

      {/* MODE 1: UNIVERSAL URL DOWNLOADER WITH EXACT FORMAT PICKER */}
      {settings.mode === 'url-music' && (
        <div className="space-y-5 animate-fade-in">
          {/* Input Box with Action Button */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Paste Video or Audio URL:</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                YouTube • Instagram • TikTok • Drive
              </span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  placeholder="Paste YouTube, Instagram, TikTok, Google Drive, or media link..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInspectUrl();
                  }}
                  disabled={isInspecting || isDownloading || disabled}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
                />
                <LinkIcon className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              </div>
              <button
                type="button"
                onClick={() => handleInspectUrl()}
                disabled={isInspecting || isDownloading || !urlInput.trim() || disabled}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
              >
                {isInspecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Test Sample Tracks */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Or try sample audio tracks:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_MUSIC_TRACKS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setUrlInput(sample.url);
                    handleInspectUrl(sample.url);
                  }}
                  disabled={isInspecting || isDownloading || disabled}
                  className="p-2.5 text-left rounded-xl border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                      {sample.title}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 group-hover:text-emerald-500">
                      {sample.durationEstimate}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {sample.genre}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Loading Progress Bar */}
          {isDownloading && (
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  {downloadProgress.status}
                </span>
                <span className="font-mono">{downloadProgress.percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-emerald-200/60 dark:bg-emerald-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message & Troubleshooting Guide */}
          {fetchError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 leading-relaxed space-y-2 animate-fade-in">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Notice</span>
              </div>
              <p>{fetchError}</p>
              {fetchError.includes('Google Drive') && (
                <div className="p-2.5 rounded-lg bg-white/70 dark:bg-zinc-900/80 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div className="font-semibold text-rose-600 dark:text-rose-400">How to share Google Drive files:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                    <li>Open your file in Google Drive</li>
                    <li>Click <strong>Share</strong> &gt; Under <strong>General access</strong>, select <strong>Anyone with the link</strong></li>
                    <li>Copy the link and paste it above</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* EXACT FORMAT PICKER RESULT CARD (MATCHING USER SCREENSHOT) */}
          {mediaInfo && (
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Thumbnail with duration */}
                <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  {mediaInfo.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaInfo.thumbnail}
                      alt={mediaInfo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/30 to-zinc-900 text-zinc-400">
                      <Film className="w-8 h-8 opacity-40 mb-1 text-emerald-400" />
                      <span className="text-[10px] font-mono opacity-60">Media Stream</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-white/85 text-zinc-950 flex items-center justify-center shadow-md">
                      <Play className="w-4 h-4 ml-0.5 fill-zinc-950" />
                    </div>
                  </div>
                  {mediaInfo.durationFormatted && (
                    <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-bold">
                      {mediaInfo.durationFormatted}
                    </span>
                  )}
                </div>

                {/* Details & Format Dropdown */}
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug">
                      {mediaInfo.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {mediaInfo.durationFormatted} • {mediaInfo.author || 'Universal Media'}
                    </p>
                  </div>

                  {/* GREEN DOWNLOAD BUTTON WITH DROPDOWN */}
                  <div className="relative inline-block w-full sm:w-auto" ref={dropdownRef}>
                    <div className="inline-flex rounded-xl shadow-xs w-full sm:w-auto border border-emerald-600">
                      <button
                        type="button"
                        onClick={() => handleDownloadFormat(selectedFormat || mediaInfo.formats[0])}
                        disabled={isDownloading}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-l-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isDownloading}
                        className="px-3 py-2.5 rounded-r-xl bg-emerald-700 hover:bg-emerald-800 text-white border-l border-emerald-500/50 flex items-center justify-center cursor-pointer"
                        title="Select Quality & Format"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* DROPDOWN POPUP MENU */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-1.5 w-64 max-h-[380px] overflow-y-auto bg-white dark:bg-zinc-900 border-2 border-emerald-500 rounded-xl shadow-2xl z-50 py-1 divide-y divide-zinc-100 dark:divide-zinc-800 animate-fade-in">
                        {/* Video Formats (MP4 with Audio) */}
                        {mediaInfo.formats.filter((f) => f.type === 'video' && !f.isMuted).length > 0 && (
                          <div className="py-1">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                              <span>Video (MP4 + Sound)</span>
                              <span className="text-[9px] lowercase opacity-70 font-normal">audio included</span>
                            </div>
                            {mediaInfo.formats
                              .filter((f) => f.type === 'video' && !f.isMuted)
                              .map((fmt) => (
                                <button
                                  key={fmt.id}
                                  type="button"
                                  onClick={() => handleDownloadFormat(fmt)}
                                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between transition-colors cursor-pointer text-xs group"
                                >
                                  <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                    <Film className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    {fmt.label}
                                  </span>
                                  <span className="font-mono text-zinc-500 dark:text-zinc-400 font-semibold group-hover:text-emerald-600">
                                    {fmt.quality.includes('p') ? fmt.quality : `${fmt.quality}p`}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}

                        {/* Audio Tracks (MP3 / WAV / M4A / OPUS) */}
                        {mediaInfo.formats.filter((f) => f.type === 'audio').length > 0 && (
                          <div className="py-1">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center justify-between">
                              <span>Audio Only</span>
                              <span className="text-[9px] lowercase opacity-70 font-normal">mp3 / wav / m4a</span>
                            </div>
                            {mediaInfo.formats
                              .filter((f) => f.type === 'audio')
                              .map((fmt) => (
                                <button
                                  key={fmt.id}
                                  type="button"
                                  onClick={() => handleDownloadFormat(fmt)}
                                  className="w-full px-3.5 py-2 text-left hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center justify-between transition-colors cursor-pointer text-xs group"
                                >
                                  <span className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                                    <Music className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                    {fmt.label}
                                  </span>
                                  <span className="font-mono text-zinc-500 dark:text-zinc-400 group-hover:text-sky-600">
                                    {fmt.quality === 'Lossless' ? 'Lossless' : `${fmt.quality} kbps`}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}

                        {/* Optional Muted Video (No Audio) */}
                        {mediaInfo.formats.filter((f) => f.type === 'video' && f.isMuted).length > 0 && (
                          <div className="py-1">
                            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                              <span>Muted Video Stream</span>
                              <span className="text-[9px] lowercase opacity-70 font-normal">no audio</span>
                            </div>
                            {mediaInfo.formats
                              .filter((f) => f.type === 'video' && f.isMuted)
                              .map((fmt) => (
                                <button
                                  key={fmt.id}
                                  type="button"
                                  onClick={() => handleDownloadFormat(fmt)}
                                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors cursor-pointer text-xs"
                                >
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                    <Film className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    {fmt.label}
                                  </span>
                                  <span className="font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                    <VolumeX className="w-3 h-3 text-rose-500" />
                                    {fmt.quality.includes('p') ? fmt.quality : `${fmt.quality}p`}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE DOWNLOADED MEDIA STUDIO PREVIEW */}
          {fetchedMedia && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4 animate-fade-in">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    {fetchedMedia.isVideo ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 truncate">
                      {fetchedMedia.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {formatSize(fetchedMedia.size)} • {formatDuration(fetchedMedia.duration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                    {fetchedMedia.isVideo ? 'MP4 Video' : 'Audio Track'}
                  </span>
                </div>
              </div>

              {/* Video Player Preview */}
              {fetchedMedia.isVideo && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-black border border-zinc-200 dark:border-zinc-800 aspect-video flex items-center justify-center">
                    <video
                      controls
                      src={fetchedMedia.mediaUrl}
                      className="w-full h-full max-h-[300px] object-contain"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleDownloadDirect}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadFormat({ id: 'audio-extract', itag: 140, label: 'Audio', quality: '128', type: 'audio', hasAudio: true })}
                      className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Music className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Extract Audio</span>
                    </button>

                    {onImportAudioFile && (
                      <button
                        type="button"
                        onClick={handleImportToWorkspace}
                        className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Import to PixelShrink Workspace"
                      >
                        <FolderInput className="w-3.5 h-3.5 text-emerald-500" />
                        <span>To Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Audio Player & Waveform Preview */}
              {fetchedMedia.isAudio && (
                <div className="space-y-4">
                  <audio
                    ref={audioRef}
                    src={fetchedMedia.mediaUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnded}
                  />

                  {fetchedMedia.peaks && (
                    <div className="space-y-1.5">
                      <div
                        className="h-16 flex items-end gap-0.5 p-2 bg-zinc-900 dark:bg-black rounded-xl cursor-pointer select-none overflow-hidden relative"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const percent = Math.max(0, Math.min(1, clickX / rect.width));
                          handleSeek(percent * fetchedMedia.duration);
                        }}
                      >
                        {fetchedMedia.peaks.map((peak, idx) => {
                          const barProgress = idx / (fetchedMedia.peaks?.length || 1);
                          const currentProgress = currentTime / fetchedMedia.duration;
                          const isPassed = barProgress <= currentProgress;

                          return (
                            <div
                              key={idx}
                              className={`flex-1 rounded-full transition-colors duration-75 ${
                                isPassed ? 'bg-emerald-400' : 'bg-zinc-700 hover:bg-zinc-500'
                              }`}
                              style={{ height: `${Math.max(10, peak * 100)}%` }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 px-1">
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(fetchedMedia.duration)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSeek(0)}
                        className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-all cursor-pointer"
                        title="Restart"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    {fetchedMedia.audioBuffer && (
                      <button
                        type="button"
                        onClick={() => setShowTrimmer(!showTrimmer)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer
                          ${
                            showTrimmer
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                          }
                        `}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>{showTrimmer ? 'Close Trimmer' : 'Trim & Cut Clip'}</span>
                      </button>
                    )}
                  </div>

                  {/* Trimmer Drawer */}
                  {showTrimmer && fetchedMedia.audioBuffer && (
                    <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-emerald-500" />
                          Trim Audio Segment
                        </span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          Length: {Math.max(0, Math.round((trimEnd - trimStart) * 10) / 10)}s
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-zinc-600 dark:text-zinc-400 font-semibold block">
                            Start Time: {trimStart.toFixed(1)}s
                          </label>
                          <input
                            type="range"
                            min="0"
                            max={Math.max(0, fetchedMedia.duration - 0.5)}
                            step="0.1"
                            value={trimStart}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setTrimStart(val);
                              if (val >= trimEnd) setTrimEnd(Math.min(fetchedMedia.duration, val + 1));
                            }}
                            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-600 dark:text-zinc-400 font-semibold block">
                            End Time: {trimEnd.toFixed(1)}s
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max={fetchedMedia.duration}
                            step="0.1"
                            value={trimEnd}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setTrimEnd(val);
                              if (val <= trimStart) setTrimStart(Math.max(0, val - 1));
                            }}
                            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyTrim}
                        disabled={isTrimming}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isTrimming ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Trimming Audio...</span>
                          </>
                        ) : (
                          <>
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Apply Trim & Extract Segment</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadDirect}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Audio</span>
                    </button>

                    {fetchedMedia.audioBuffer && (
                      <button
                        type="button"
                        onClick={handleDownloadWav}
                        className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <AudioWaveform className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Export WAV</span>
                      </button>
                    )}

                    {onImportAudioFile && (
                      <button
                        type="button"
                        onClick={handleImportToWorkspace}
                        className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Import to PixelShrink Workspace"
                      >
                        <FolderInput className="w-3.5 h-3.5 text-emerald-500" />
                        <span>To Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ALL SUPPORTED RESOURCES & PROVIDERS (MATCHING SCREENSHOT) */}
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <span>Supported Video & Music Platforms</span>
              <span className="text-[11px] text-zinc-400 font-normal">All-in-One Engine</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {supportedProviders.map((prov) => (
                <div
                  key={prov.name}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${prov.color}`}
                >
                  <Globe className="w-3.5 h-3.5 opacity-70" />
                  <span className="truncate">{prov.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: EXTRACT AUDIO FROM LOCAL VIDEO */}
      {settings.mode === 'audio' && (
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Upload your local video file (MP4, WebM, MOV) to extract high-fidelity 16-bit PCM lossless WAV audio directly in your browser.
          </p>

          {activeFile?.extractedAudioFile ? (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                    {activeFile.extractedAudioFile.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
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
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Extracted Audio (WAV)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Select or drop a video file into the workspace to extract its audio track.</span>
            </div>
          )}
        </div>
      )}

      {/* MODE 3: EXTRACT VIDEO FRAMES */}
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
              className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                    }
                  `}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Extracted Frames Gallery */}
          {activeFile?.extractedFrames && activeFile.extractedFrames.length > 0 && (
            <div className="space-y-2 animate-fade-in pt-2">
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
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/60 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
          <Info className="w-3.5 h-3.5 text-emerald-500" />
          <span>Universal Streaming & Client-Side Engine</span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          PixelShrink supports full video and audio downloading from YouTube, Instagram, TikTok, Google Drive, Dropbox, and direct streams with local Web Audio waveform inspection and zero third-party tracking.
        </p>
      </div>
    </div>
  );
}
