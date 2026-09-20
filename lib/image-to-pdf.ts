import { PDFDocument, rgb } from 'pdf-lib';
import { PdfSettings } from '@/types/image';

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
  legal: { width: 612.0, height: 1008.0 },
  square: { width: 600.0, height: 600.0 },
};

const MARGIN_SIZES = {
  none: 0,
  small: 14,
  normal: 28,
  large: 45,
};

/**
 * Pre-processes an image file into JPEG/PNG bytes with quality compression.
 */
async function prepareImageBytesForPdf(
  file: File,
  quality: number
): Promise<{ bytes: Uint8Array; format: 'jpg' | 'png'; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context for PDF processing'));
        return;
      }

      // Check if original is PNG with potential alpha
      const isPng = file.type === 'image/png';
      const usePng = isPng && quality >= 95;

      if (!usePng) {
        // Fill white background for JPEG compression
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mime = usePng ? 'image/png' : 'image/jpeg';
      const qVal = Math.min(1.0, Math.max(0.2, quality / 100));

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Image blob encoding failed'));
            return;
          }

          const arrayBuf = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(arrayBuf),
            format: usePng ? 'png' : 'jpg',
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        },
        mime,
        qVal
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for PDF embedding'));
    };
  });
}

/**
 * Computes paper page dimensions considering orientation and Fit-to-Image mode.
 */
function getPageDimensions(
  settings: PdfSettings,
  imgW: number,
  imgH: number
): { pageWidth: number; pageHeight: number } {
  if (settings.pageSize === 'fit') {
    return { pageWidth: imgW, pageHeight: imgH };
  }

  const base = PAGE_SIZES[settings.pageSize] || PAGE_SIZES.a4;
  let isLandscape = false;

  if (settings.orientation === 'landscape') {
    isLandscape = true;
  } else if (settings.orientation === 'auto') {
    isLandscape = imgW > imgH;
  }

  return {
    pageWidth: isLandscape ? Math.max(base.width, base.height) : Math.min(base.width, base.height),
    pageHeight: isLandscape ? Math.min(base.width, base.height) : Math.max(base.width, base.height),
  };
}

/**
 * Generates a unified, multi-page or grid PDF document from multiple image files.
 */
export async function generatePdfFromImages(
  files: File[],
  settings: PdfSettings,
  onProgress?: (progress: number) => void
): Promise<File> {
  if (files.length === 0) {
    throw new Error('No images provided for PDF generation');
  }

  const pdfDoc = await PDFDocument.create();
  if (settings.pdfTitle) {
    pdfDoc.setTitle(settings.pdfTitle);
  }
  pdfDoc.setProducer('PixelShrink Studio');
  pdfDoc.setCreator('PixelShrink');

  const margin = MARGIN_SIZES[settings.margin] ?? 28;

  // Process images
  const processedImages = [];
  for (let i = 0; i < files.length; i++) {
    const pImg = await prepareImageBytesForPdf(files[i], settings.imageQuality);
    processedImages.push(pImg);
    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 50));
    }
  }

  // Layout mode handling
  if (settings.layout === '1-per-page') {
    for (let i = 0; i < processedImages.length; i++) {
      const pImg = processedImages[i];
      const embedded =
        pImg.format === 'png'
          ? await pdfDoc.embedPng(pImg.bytes)
          : await pdfDoc.embedJpg(pImg.bytes);

      const { pageWidth, pageHeight } = getPageDimensions(settings, pImg.width, pImg.height);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availW = Math.max(10, pageWidth - margin * 2);
      const availH = Math.max(10, pageHeight - margin * 2);

      const scale = Math.min(availW / embedded.width, availH / embedded.height, 1);
      const drawW = embedded.width * scale;
      const drawH = embedded.height * scale;

      const posX = margin + (availW - drawW) / 2;
      const posY = margin + (availH - drawH) / 2;

      page.drawImage(embedded, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
      });

      if (onProgress) {
        onProgress(50 + Math.round(((i + 1) / processedImages.length) * 45));
      }
    }
  } else if (settings.layout === '2-per-page') {
    // 2 images per page
    for (let i = 0; i < processedImages.length; i += 2) {
      const img1 = processedImages[i];
      const img2 = processedImages[i + 1];

      const { pageWidth, pageHeight } = getPageDimensions(settings, img1.width, img1.height);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availW = Math.max(10, pageWidth - margin * 2);
      const availH = Math.max(10, (pageHeight - margin * 2 - 10) / 2);

      // Draw top image
      const emb1 =
        img1.format === 'png' ? await pdfDoc.embedPng(img1.bytes) : await pdfDoc.embedJpg(img1.bytes);
      const scale1 = Math.min(availW / emb1.width, availH / emb1.height, 1);
      const drawW1 = emb1.width * scale1;
      const drawH1 = emb1.height * scale1;
      page.drawImage(emb1, {
        x: margin + (availW - drawW1) / 2,
        y: pageHeight - margin - availH + (availH - drawH1) / 2,
        width: drawW1,
        height: drawH1,
      });

      // Draw bottom image if present
      if (img2) {
        const emb2 =
          img2.format === 'png'
            ? await pdfDoc.embedPng(img2.bytes)
            : await pdfDoc.embedJpg(img2.bytes);
        const scale2 = Math.min(availW / emb2.width, availH / emb2.height, 1);
        const drawW2 = emb2.width * scale2;
        const drawH2 = emb2.height * scale2;
        page.drawImage(emb2, {
          x: margin + (availW - drawW2) / 2,
          y: margin + (availH - drawH2) / 2,
          width: drawW2,
          height: drawH2,
        });
      }
    }
  } else if (settings.layout === '4-per-page') {
    // 4 images (2x2 grid) per page
    for (let i = 0; i < processedImages.length; i += 4) {
      const batch = processedImages.slice(i, i + 4);
      const { pageWidth, pageHeight } = getPageDimensions(settings, batch[0].width, batch[0].height);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const cellW = (pageWidth - margin * 2 - 10) / 2;
      const cellH = (pageHeight - margin * 2 - 10) / 2;

      for (let j = 0; j < batch.length; j++) {
        const pImg = batch[j];
        const emb =
          pImg.format === 'png'
            ? await pdfDoc.embedPng(pImg.bytes)
            : await pdfDoc.embedJpg(pImg.bytes);

        const col = j % 2;
        const row = Math.floor(j / 2);

        const cellX = margin + col * (cellW + 10);
        const cellY = pageHeight - margin - (row + 1) * cellH - row * 10;

        const scale = Math.min(cellW / emb.width, cellH / emb.height, 1);
        const drawW = emb.width * scale;
        const drawH = emb.height * scale;

        page.drawImage(emb, {
          x: cellX + (cellW - drawW) / 2,
          y: cellY + (cellH - drawH) / 2,
          width: drawW,
          height: drawH,
        });
      }
    }
  }

  if (onProgress) onProgress(98);

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);

  const docTitle = settings.pdfTitle
    ? settings.pdfTitle.replace(/[^a-z0-9_-]/gi, '_')
    : 'pixelshrink_document';

  return new File([pdfBytes as any], `${docTitle}.pdf`, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });
}
