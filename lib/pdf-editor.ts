import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import {
  PdfDocInfo,
  PdfResizeOptions,
  PdfPageEditState,
  PdfWatermarkOptions,
} from '@/types/image';

const PAPER_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
  legal: { width: 612.0, height: 1008.0 },
  a3: { width: 841.89, height: 1190.55 },
  a5: { width: 419.53, height: 595.28 },
};

const MARGIN_VALUES = {
  none: 0,
  small: 14,
  normal: 28,
  large: 45,
};

/**
 * Parses a hex color code (e.g. #ff0000) to pdf-lib rgb values.
 */
function hexToPdfRgb(hex: string) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return rgb(0.2, 0.2, 0.2);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

/**
 * Inspects a PDF file and extracts page count, dimensions, and metadata.
 */
export async function loadPdfDocInfo(file: File): Promise<PdfDocInfo> {
  const arrayBuf = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  const pageInfos = pages.map((p, idx) => {
    const { width, height } = p.getSize();
    const rot = p.getRotation().angle;
    return {
      pageNumber: idx + 1,
      width: Math.round(width),
      height: Math.round(height),
      rotation: rot,
    };
  });

  return {
    pageCount: pages.length,
    pages: pageInfos,
    title: pdfDoc.getTitle() || file.name.replace(/\.pdf$/i, ''),
    author: pdfDoc.getAuthor() || '',
  };
}

/**
 * Resizes pages of an existing PDF document with content scaling and margin placement.
 */
export async function resizeExistingPdf(
  file: File,
  options: PdfResizeOptions,
  onProgress?: (progress: number) => void
): Promise<File> {
  const arrayBuf = await file.arrayBuffer();
  if (onProgress) onProgress(20);

  const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();
  targetDoc.setTitle(srcDoc.getTitle() || file.name);
  targetDoc.setProducer('PixelShrink Studio');

  const pageCount = srcDoc.getPageCount();
  const baseSize =
    options.targetSize === 'custom' && options.customWidth && options.customHeight
      ? { width: options.customWidth, height: options.customHeight }
      : PAPER_SIZES[options.targetSize as keyof typeof PAPER_SIZES] || PAPER_SIZES.a4;

  const margin = MARGIN_VALUES[options.margin] ?? 28;

  for (let i = 0; i < pageCount; i++) {
    const srcPage = srcDoc.getPage(i);
    const srcSize = srcPage.getSize();
    const isSrcLandscape = srcSize.width > srcSize.height;

    let isTargetLandscape = false;
    if (options.orientation === 'landscape') isTargetLandscape = true;
    else if (options.orientation === 'portrait') isTargetLandscape = false;
    else isTargetLandscape = isSrcLandscape;

    const targetW = isTargetLandscape
      ? Math.max(baseSize.width, baseSize.height)
      : Math.min(baseSize.width, baseSize.height);
    const targetH = isTargetLandscape
      ? Math.min(baseSize.width, baseSize.height)
      : Math.max(baseSize.width, baseSize.height);

    const embeddedPage = await targetDoc.embedPage(srcPage);
    const targetPage = targetDoc.addPage([targetW, targetH]);

    if (options.scaleContent) {
      const availW = Math.max(10, targetW - margin * 2);
      const availH = Math.max(10, targetH - margin * 2);

      const scale = Math.min(availW / embeddedPage.width, availH / embeddedPage.height);
      const drawW = embeddedPage.width * scale;
      const drawH = embeddedPage.height * scale;

      const posX = margin + (availW - drawW) / 2;
      const posY = margin + (availH - drawH) / 2;

      targetPage.drawPage(embeddedPage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
      });
    } else {
      // Direct center placement
      const posX = (targetW - embeddedPage.width) / 2;
      const posY = (targetH - embeddedPage.height) / 2;
      targetPage.drawPage(embeddedPage, {
        x: posX,
        y: posY,
      });
    }

    if (onProgress) {
      onProgress(20 + Math.round(((i + 1) / pageCount) * 75));
    }
  }

  const pdfBytes = await targetDoc.save();
  if (onProgress) onProgress(100);

  const baseName = file.name.replace(/\.pdf$/i, '');
  return new File([pdfBytes as any], `${baseName}_resized_${options.targetSize}.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

/**
 * Edits PDF pages by applying rotations, removing deleted pages, and saving.
 */
export async function editPdfPages(
  file: File,
  pageEdits: Record<number, PdfPageEditState>,
  onProgress?: (progress: number) => void
): Promise<File> {
  const arrayBuf = await file.arrayBuffer();
  if (onProgress) onProgress(20);

  const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();
  targetDoc.setTitle(srcDoc.getTitle() || file.name);

  const pageCount = srcDoc.getPageCount();
  const validIndices: number[] = [];

  for (let i = 0; i < pageCount; i++) {
    if (!pageEdits[i]?.deleted) {
      validIndices.push(i);
    }
  }

  if (validIndices.length === 0) {
    throw new Error('Cannot delete all pages from the PDF document.');
  }

  const copiedPages = await targetDoc.copyPages(srcDoc, validIndices);

  for (let idx = 0; idx < copiedPages.length; idx++) {
    const page = copiedPages[idx];
    const srcIdx = validIndices[idx];
    const edit = pageEdits[srcIdx];

    if (edit && edit.rotation) {
      const curRot = page.getRotation().angle;
      page.setRotation(degrees((curRot + edit.rotation) % 360));
    }

    targetDoc.addPage(page);

    if (onProgress) {
      onProgress(20 + Math.round(((idx + 1) / copiedPages.length) * 75));
    }
  }

  const pdfBytes = await targetDoc.save();
  if (onProgress) onProgress(100);

  const baseName = file.name.replace(/\.pdf$/i, '');
  return new File([pdfBytes as any], `${baseName}_edited.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

/**
 * Applies text watermarks and formatted page numbers to all pages of a PDF.
 */
export async function applyWatermarkAndPageNumbers(
  file: File,
  options: PdfWatermarkOptions,
  onProgress?: (progress: number) => void
): Promise<File> {
  const arrayBuf = await file.arrayBuffer();
  if (onProgress) onProgress(20);

  const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const pageCount = pages.length;

  const watermarkColor = hexToPdfRgb(options.color || '#ff0000');
  const pageNumColor = rgb(0.3, 0.3, 0.3);

  for (let i = 0; i < pageCount; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // 1. Draw Watermark
    if (options.text && options.text.trim()) {
      const text = options.text.trim();
      const fontSize = options.fontSize || 42;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      const centerX = width / 2;
      const centerY = height / 2;

      page.drawText(text, {
        x: centerX - textWidth / 2,
        y: centerY - textHeight / 2,
        size: fontSize,
        font,
        color: watermarkColor,
        opacity: Math.max(0.05, Math.min(1.0, options.opacity)),
        rotate: degrees(options.rotation ?? 45),
      });
    }

    // 2. Draw Page Numbers
    if (options.addPageNumbers) {
      let pageNumText = `${i + 1}`;
      if (options.pageNumberFormat === 'page-x-of-y') {
        pageNumText = `Page ${i + 1} of ${pageCount}`;
      } else if (options.pageNumberFormat === 'x-of-y') {
        pageNumText = `${i + 1} / ${pageCount}`;
      }

      const numFontSize = 10;
      const numWidth = font.widthOfTextAtSize(pageNumText, numFontSize);

      let numX = width / 2 - numWidth / 2;
      let numY = 20;

      if (options.pageNumberPosition === 'bottom-right') {
        numX = width - numWidth - 30;
        numY = 20;
      } else if (options.pageNumberPosition === 'top-right') {
        numX = width - numWidth - 30;
        numY = height - 25;
      }

      page.drawText(pageNumText, {
        x: numX,
        y: numY,
        size: numFontSize,
        font,
        color: pageNumColor,
        opacity: 0.85,
      });
    }

    if (onProgress) {
      onProgress(20 + Math.round(((i + 1) / pageCount) * 75));
    }
  }

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);

  const baseName = file.name.replace(/\.pdf$/i, '');
  return new File([pdfBytes as any], `${baseName}_watermarked.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

/**
 * Combines multiple PDF files into one unified master PDF document.
 */
export async function mergeMultiplePdfFiles(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<File> {
  const mergedDoc = await PDFDocument.create();
  mergedDoc.setTitle('pixelshrink_merged_document');
  mergedDoc.setProducer('PixelShrink Studio');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const arrayBuf = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });

    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((p) => mergedDoc.addPage(p));

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 95));
    }
  }

  const pdfBytes = await mergedDoc.save();
  if (onProgress) onProgress(100);

  return new File([pdfBytes as any], `pixelshrink_merged_${Date.now()}.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}

/**
 * Splits / Extracts specific page ranges from a PDF file.
 */
export async function splitPdfByRange(
  file: File,
  rangeStr: string,
  onProgress?: (progress: number) => void
): Promise<File> {
  const arrayBuf = await file.arrayBuffer();
  if (onProgress) onProgress(20);

  const srcDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
  const targetDoc = await PDFDocument.create();
  targetDoc.setTitle(srcDoc.getTitle() || file.name);

  const totalPages = srcDoc.getPageCount();
  const targetIndices = new Set<number>();

  // Parse range query e.g. "1-3, 5, 8-10"
  const parts = rangeStr.split(',').map((s) => s.trim());
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => parseInt(s.trim()));
      if (!isNaN(startStr) && !isNaN(endStr)) {
        const start = Math.max(1, Math.min(startStr, endStr));
        const end = Math.min(totalPages, Math.max(startStr, endStr));
        for (let p = start; p <= end; p++) {
          targetIndices.add(p - 1); // 0-based
        }
      }
    } else {
      const single = parseInt(part);
      if (!isNaN(single) && single >= 1 && single <= totalPages) {
        targetIndices.add(single - 1);
      }
    }
  }

  const sortedIndices = Array.from(targetIndices).sort((a, b) => a - b);
  if (sortedIndices.length === 0) {
    throw new Error(`No valid pages found matching range "${rangeStr}". Document has ${totalPages} pages.`);
  }

  const copiedPages = await targetDoc.copyPages(srcDoc, sortedIndices);
  copiedPages.forEach((p) => targetDoc.addPage(p));

  if (onProgress) onProgress(90);
  const pdfBytes = await targetDoc.save();
  if (onProgress) onProgress(100);

  const baseName = file.name.replace(/\.pdf$/i, '');
  return new File([pdfBytes as any], `${baseName}_extracted_pages.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}
