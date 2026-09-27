'use client';

import React from 'react';
import {
  PdfSettings,
  PdfToolSubMode,
  ImageFile,
  PdfPageEditState,
} from '@/types/image';
import {
  FileText,
  Scaling,
  RotateCw,
  RotateCcw,
  Trash2,
  Undo2,
  Stamp,
  Split,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  Sliders,
  Palette,
  Hash,
} from 'lucide-react';

interface PdfEditorPanelProps {
  settings: PdfSettings;
  onSettingsChange: (settings: PdfSettings) => void;
  activeFile: ImageFile | null;
  filesCount: number;
  onPageEditsChange: (edits: Record<number, PdfPageEditState>) => void;
  disabled?: boolean;
}

export function PdfEditorPanel({
  settings,
  onSettingsChange,
  activeFile,
  filesCount,
  onPageEditsChange,
  disabled = false,
}: PdfEditorPanelProps) {
  const updateSettings = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const isPdfInput = activeFile?.isPdf || activeFile?.originalType === 'application/pdf';
  const pageCount = activeFile?.pdfDocInfo?.pageCount || 1;
  const pageEdits = activeFile?.pdfPageEdits || {};

  const subModes: { id: PdfToolSubMode; label: string; icon: React.ReactNode }[] = [
    { id: 'image-to-pdf', label: 'Image to PDF', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'resize-pdf', label: 'Resize PDF', icon: <Scaling className="w-3.5 h-3.5" /> },
    { id: 'edit-pages', label: 'Rotate & Delete', icon: <RotateCw className="w-3.5 h-3.5" /> },
    { id: 'watermark', label: 'Watermark & #' , icon: <Stamp className="w-3.5 h-3.5" /> },
    { id: 'split-merge', label: 'Split & Merge', icon: <Split className="w-3.5 h-3.5" /> },
  ];

  // Page Edit Actions
  const rotatePage = (pageIdx: number, delta: number) => {
    const cur = pageEdits[pageIdx] || { pageIndex: pageIdx, rotation: 0, deleted: false };
    const nextRot = (cur.rotation + delta + 360) % 360;
    const nextEdits = {
      ...pageEdits,
      [pageIdx]: { ...cur, rotation: nextRot },
    };
    onPageEditsChange(nextEdits);
  };

  const toggleDeletePage = (pageIdx: number) => {
    const cur = pageEdits[pageIdx] || { pageIndex: pageIdx, rotation: 0, deleted: false };
    const nextEdits = {
      ...pageEdits,
      [pageIdx]: { ...cur, deleted: !cur.deleted },
    };
    onPageEditsChange(nextEdits);
  };

  const rotateAllPages = (delta: number) => {
    const nextEdits: Record<number, PdfPageEditState> = {};
    for (let i = 0; i < pageCount; i++) {
      const cur = pageEdits[i] || { pageIndex: i, rotation: 0, deleted: false };
      nextEdits[i] = { ...cur, rotation: (cur.rotation + delta + 360) % 360 };
    }
    onPageEditsChange(nextEdits);
  };

  const resetAllEdits = () => {
    onPageEditsChange({});
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">PDF Studio Pro</h2>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          PDF Pro Engine
        </span>
      </div>

      {/* Sub Mode Switcher Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        {subModes.map((m) => {
          const isActive = settings.subMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => updateSettings('subMode', m.id)}
              disabled={disabled}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none
                ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }
              `}
            >
              {m.icon}
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBMODE 1: RESIZE PDF */}
      {settings.subMode === 'resize-pdf' && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
              Target Paper Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'a4', label: 'A4', desc: '210 × 297 mm' },
                { id: 'letter', label: 'US Letter', desc: '8.5 × 11 in' },
                { id: 'legal', label: 'US Legal', desc: '8.5 × 14 in' },
                { id: 'a3', label: 'A3', desc: '297 × 420 mm' },
                { id: 'a5', label: 'A5', desc: '148 × 210 mm' },
              ].map((ps) => (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() =>
                    updateSettings('resizeOptions', {
                      ...settings.resizeOptions,
                      targetSize: ps.id as any,
                    })
                  }
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all
                    ${
                      settings.resizeOptions.targetSize === ps.id
                        ? 'border-rose-600 bg-rose-50/60 dark:border-rose-500 dark:bg-rose-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{ps.label}</p>
                  <p className="text-[10px] text-zinc-400">{ps.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
              Orientation
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
              {(['auto', 'portrait', 'landscape'] as const).map((ori) => (
                <button
                  key={ori}
                  type="button"
                  onClick={() =>
                    updateSettings('resizeOptions', {
                      ...settings.resizeOptions,
                      orientation: ori,
                    })
                  }
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer text-center
                    ${
                      settings.resizeOptions.orientation === ori
                        ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                    }
                  `}
                >
                  {ori}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
              Page Margins
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['none', 'small', 'normal', 'large'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    updateSettings('resizeOptions', {
                      ...settings.resizeOptions,
                      margin: m,
                    })
                  }
                  className={`py-1.5 rounded-xl border text-center text-xs font-semibold capitalize transition-all cursor-pointer
                    ${
                      settings.resizeOptions.margin === m
                        ? 'border-rose-600 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                    }
                  `}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <label
            onClick={() =>
              updateSettings('resizeOptions', {
                ...settings.resizeOptions,
                scaleContent: !settings.resizeOptions.scaleContent,
              })
            }
            className="flex items-center gap-2 pt-2 cursor-pointer select-none"
          >
            <div className="text-rose-600 dark:text-rose-400 shrink-0">
              {settings.resizeOptions.scaleContent ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Scale document content proportionally to fit new page boundaries
            </span>
          </label>
        </div>
      )}

      {/* SUBMODE 2: EDIT PAGES (ROTATE & DELETE) */}
      {settings.subMode === 'edit-pages' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Manage Pages ({pageCount} Total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => rotateAllPages(90)}
                className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3 h-3 text-rose-500" />
                <span>Rotate All 90°</span>
              </button>
              <button
                type="button"
                onClick={resetAllEdits}
                className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
              >
                <Undo2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Page Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
            {Array.from({ length: pageCount }).map((_, idx) => {
              const edit = pageEdits[idx] || { pageIndex: idx, rotation: 0, deleted: false };
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2
                    ${
                      edit.deleted
                        ? 'border-red-300 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 opacity-60'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        edit.deleted ? 'line-through text-red-600' : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      Page {idx + 1}
                    </span>
                    {edit.rotation > 0 && (
                      <span className="text-[10px] font-mono font-bold text-rose-600">
                        {edit.rotation}°
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => rotatePage(idx, 90)}
                      disabled={edit.deleted}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer disabled:opacity-30"
                      title="Rotate 90° Clockwise"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotatePage(idx, -90)}
                      disabled={edit.deleted}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer disabled:opacity-30"
                      title="Rotate 90° Counter-Clockwise"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDeletePage(idx)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        edit.deleted
                          ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
                          : 'text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50'
                      }`}
                      title={edit.deleted ? 'Restore Page' : 'Delete Page'}
                    >
                      {edit.deleted ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBMODE 3: WATERMARK & PAGE NUMBERS */}
      {settings.subMode === 'watermark' && (
        <div className="space-y-4 animate-fade-in">
          {/* Watermark text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
              Watermark Stamp Text
            </label>
            <input
              type="text"
              placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
              value={settings.watermarkOptions.text}
              onChange={(e) =>
                updateSettings('watermarkOptions', {
                  ...settings.watermarkOptions,
                  text: e.target.value,
                })
              }
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-rose-500 outline-hidden"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    updateSettings('watermarkOptions', {
                      ...settings.watermarkOptions,
                      text: chip,
                    })
                  }
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Opacity</span>
                <span className="font-mono font-bold">
                  {Math.round(settings.watermarkOptions.opacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={Math.round(settings.watermarkOptions.opacity * 100)}
                onChange={(e) =>
                  updateSettings('watermarkOptions', {
                    ...settings.watermarkOptions,
                    opacity: parseInt(e.target.value) / 100,
                  })
                }
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Font Size</span>
                <span className="font-mono font-bold">
                  {settings.watermarkOptions.fontSize}pt
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="96"
                value={settings.watermarkOptions.fontSize}
                onChange={(e) =>
                  updateSettings('watermarkOptions', {
                    ...settings.watermarkOptions,
                    fontSize: parseInt(e.target.value),
                  })
                }
                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>
          </div>

          {/* Page Numbers Switch */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850 space-y-3">
            <label
              onClick={() =>
                updateSettings('watermarkOptions', {
                  ...settings.watermarkOptions,
                  addPageNumbers: !settings.watermarkOptions.addPageNumbers,
                })
              }
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="text-rose-600 dark:text-rose-400 shrink-0">
                {settings.watermarkOptions.addPageNumbers ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-rose-500" />
                Stamp Page Numbers onto all pages
              </span>
            </label>

            {settings.watermarkOptions.addPageNumbers && (
              <div className="grid grid-cols-2 gap-3 pl-6 animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-500 block">Position</label>
                  <select
                    value={settings.watermarkOptions.pageNumberPosition}
                    onChange={(e) =>
                      updateSettings('watermarkOptions', {
                        ...settings.watermarkOptions,
                        pageNumberPosition: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-1.5 px-2 text-xs"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-500 block">Format</label>
                  <select
                    value={settings.watermarkOptions.pageNumberFormat}
                    onChange={(e) =>
                      updateSettings('watermarkOptions', {
                        ...settings.watermarkOptions,
                        pageNumberFormat: e.target.value as any,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-1.5 px-2 text-xs"
                  >
                    <option value="page-x-of-y">Page 1 of {pageCount}</option>
                    <option value="x-of-y">1 / {pageCount}</option>
                    <option value="x">1</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMODE 4: SPLIT & MERGE */}
      {settings.subMode === 'split-merge' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() =>
                updateSettings('splitMergeOptions', {
                  ...settings.splitMergeOptions,
                  action: 'split',
                })
              }
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center
                ${
                  settings.splitMergeOptions.action === 'split'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }
              `}
            >
              Split / Extract Pages
            </button>
            <button
              type="button"
              onClick={() =>
                updateSettings('splitMergeOptions', {
                  ...settings.splitMergeOptions,
                  action: 'merge',
                })
              }
              className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center
                ${
                  settings.splitMergeOptions.action === 'merge'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }
              `}
            >
              Merge {filesCount} PDFs
            </button>
          </div>

          {settings.splitMergeOptions.action === 'split' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
                Extract Page Range Query
              </label>
              <input
                type="text"
                placeholder="e.g. 1-3, 5, 8-10"
                value={settings.splitMergeOptions.splitRange}
                onChange={(e) =>
                  updateSettings('splitMergeOptions', {
                    ...settings.splitMergeOptions,
                    splitRange: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
              />
              <p className="text-[11px] text-zinc-500">
                Document has {pageCount} pages. Examples: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">1-2</code> or <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">1, 3, 5</code>
              </p>
            </div>
          )}

          {settings.splitMergeOptions.action === 'merge' && (
            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-xs text-zinc-700 dark:text-zinc-300">
              <p className="font-bold">
                Ready to merge {filesCount} PDF documents into 1 single file.
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Pages from all uploaded PDF files will be sequenced sequentially into one master document.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBMODE 5: IMAGE TO PDF */}
      {settings.subMode === 'image-to-pdf' && (
        <div className="space-y-4 animate-fade-in">
          {filesCount > 1 && (
            <label
              onClick={() => updateSettings('mergeAllIntoSinglePdf', !settings.mergeAllIntoSinglePdf)}
              className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer select-none"
            >
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Merge all {filesCount} images into 1 combined PDF book
                </p>
                <p className="text-[10px] text-zinc-500">
                  {settings.mergeAllIntoSinglePdf
                    ? 'Generates a unified multi-page PDF document.'
                    : 'Generates separate PDF files per image.'}
                </p>
              </div>
              <div className="text-rose-600 dark:text-rose-400 shrink-0">
                {settings.mergeAllIntoSinglePdf ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </div>
            </label>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
              Paper Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'a4', label: 'A4', desc: 'Standard' },
                { id: 'letter', label: 'Letter', desc: '8.5 × 11 in' },
                { id: 'fit', label: 'Fit Photo', desc: 'Borderless' },
              ].map((ps) => (
                <button
                  key={ps.id}
                  type="button"
                  onClick={() => updateSettings('pageSize', ps.id as any)}
                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all
                    ${
                      settings.pageSize === ps.id
                        ? 'border-rose-600 bg-rose-50/60 dark:border-rose-500 dark:bg-rose-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{ps.label}</p>
                  <p className="text-[10px] text-zinc-400">{ps.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                PDF Embedded Image Quality
              </label>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {settings.imageQuality}%
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={settings.imageQuality}
              onChange={(e) => updateSettings('imageQuality', parseInt(e.target.value))}
              disabled={disabled}
              className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
