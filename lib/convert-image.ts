import { ConvertSettings, SupportedConvertFormat } from '@/types/image';
import { PDFDocument } from 'pdf-lib';

/**
 * Creates a Windows BMP File Blob from canvas ImageData.
 */
function createBmpBlob(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // BMP rows must be padded to a multiple of 4 bytes (for 24-bit BGR: 3 bytes per pixel)
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // 1. BMP Header (14 bytes)
  view.setUint16(0, 0x424d, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true); // reserved
  view.setUint16(8, 0, true); // reserved
  view.setUint32(10, 54, true); // pixel data offset

  // 2. DIB Header (BITMAPINFOHEADER - 40 bytes)
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // positive = bottom to top
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // 24 bits per pixel (BGR)
  view.setUint32(30, 0, true); // BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // 3. Pixel Data (Bottom-to-Top, BGR order)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      const a = data[srcIdx + 3] / 255;

      // Alpha composite against white for opaque 24-bit BMP
      const bgrB = Math.round(b * a + 255 * (1 - a));
      const bgrG = Math.round(g * a + 255 * (1 - a));
      const bgrR = Math.round(r * a + 255 * (1 - a));

      view.setUint8(offset++, bgrB);
      view.setUint8(offset++, bgrG);
      view.setUint8(offset++, bgrR);
    }
    // Pad row to multiple of 4 bytes
    const padding = rowSize - width * 3;
    for (let p = 0; p < padding; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Creates a Truevision TGA (Targa) 32-bit BGRA uncompressed image Blob.
 */
function createTgaBlob(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // 18-byte TGA Header
  const header = new Uint8Array(18);
  header[2] = 2; // uncompressed true-color image
  header[12] = width & 0xff;
  header[13] = (width >> 8) & 0xff;
  header[14] = height & 0xff;
  header[15] = (height >> 8) & 0xff;
  header[16] = 32; // 32 bits per pixel (BGRA)
  header[17] = 0x20; // top-to-bottom pixel order

  const pixelData = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * 4;
    pixelData[srcIdx] = data[srcIdx + 2]; // B
    pixelData[srcIdx + 1] = data[srcIdx + 1]; // G
    pixelData[srcIdx + 2] = data[srcIdx]; // R
    pixelData[srcIdx + 3] = data[srcIdx + 3]; // A
  }

  return new Blob([header, pixelData], { type: 'image/x-tga' });
}

/**
 * Creates a Netpbm PPM (P6 Binary) Image Blob.
 */
function createPpmBlob(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const headerStr = `P6\n${width} ${height}\n255\n`;
  const headerBytes = new TextEncoder().encode(headerStr);
  const rgbData = new Uint8Array(width * height * 3);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * 4;
    rgbData[i * 3] = data[srcIdx];
    rgbData[i * 3 + 1] = data[srcIdx + 1];
    rgbData[i * 3 + 2] = data[srcIdx + 2];
  }

  return new Blob([headerBytes, rgbData], { type: 'image/x-portable-pixmap' });
}

/**
 * Creates a Baseline Little-Endian TIFF Image Blob (RGBA).
 */
function createTiffBlob(imageData: ImageData): Blob {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  const numPixels = width * height;
  const dataOffset = 8;
  const imageByteLength = numPixels * 4;
  const ifdOffset = dataOffset + imageByteLength;
  const numTags = 10;
  const ifdSize = 2 + numTags * 12 + 4;
  const extraDataOffset = ifdOffset + ifdSize;

  const totalSize = extraDataOffset + 32;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);

  // Header: II (Little-endian) + 42 + offset to IFD
  view.setUint16(0, 0x4949, true); // 'II'
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdOffset, true);

  // Write pixel data (RGBA)
  u8.set(data, dataOffset);

  // IFD
  let ifdPos = ifdOffset;
  view.setUint16(ifdPos, numTags, true);
  ifdPos += 2;

  function writeTag(tag: number, type: number, count: number, valueOrOffset: number) {
    view.setUint16(ifdPos, tag, true);
    view.setUint16(ifdPos + 2, type, true); // 3=SHORT, 4=LONG
    view.setUint32(ifdPos + 4, count, true);
    if (type === 3 && count === 1) {
      view.setUint16(ifdPos + 8, valueOrOffset, true);
      view.setUint16(ifdPos + 10, 0, true);
    } else {
      view.setUint32(ifdPos + 8, valueOrOffset, true);
    }
    ifdPos += 12;
  }

  const bitsPerSampleOffset = extraDataOffset;
  view.setUint16(bitsPerSampleOffset, 8, true);
  view.setUint16(bitsPerSampleOffset + 2, 8, true);
  view.setUint16(bitsPerSampleOffset + 4, 8, true);
  view.setUint16(bitsPerSampleOffset + 6, 8, true);

  writeTag(256, 4, 1, width); // ImageWidth
  writeTag(257, 4, 1, height); // ImageLength
  writeTag(258, 3, 4, bitsPerSampleOffset); // BitsPerSample (8,8,8,8)
  writeTag(259, 3, 1, 1); // Compression (1 = uncompressed)
  writeTag(262, 3, 1, 2); // PhotometricInterpretation (2 = RGB)
  writeTag(273, 4, 1, dataOffset); // StripOffsets
  writeTag(277, 3, 1, 4); // SamplesPerPixel (4)
  writeTag(278, 4, 1, height); // RowsPerStrip
  writeTag(279, 4, 1, imageByteLength); // StripByteCounts
  writeTag(284, 3, 1, 1); // PlanarConfiguration (1 = chunky)

  view.setUint32(ifdPos, 0, true); // next IFD = 0

  return new Blob([buffer], { type: 'image/tiff' });
}

/**
 * Creates a Windows Favicon (.ico) containing PNG byte payload.
 */
async function createIcoBlob(canvas: HTMLCanvasElement, size: number): Promise<Blob> {
  // Resize to icon dimensions (e.g. 16, 32, 48, 64, 128, 256)
  const iconCanvas = document.createElement('canvas');
  iconCanvas.width = size;
  iconCanvas.height = size;
  const ctx = iconCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not create icon canvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, size, size);

  // Get PNG payload bytes
  const pngBlob = await new Promise<Blob>((res, rej) => {
    iconCanvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG creation failed'))), 'image/png');
  });

  const pngBuffer = await pngBlob.arrayBuffer();
  const pngBytes = new Uint8Array(pngBuffer);

  const icoHeaderSize = 6 + 16;
  const totalIcoSize = icoHeaderSize + pngBytes.length;
  const icoBuffer = new ArrayBuffer(totalIcoSize);
  const view = new DataView(icoBuffer);

  // ICONDIR Header (6 bytes)
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // 1 = ICO icon
  view.setUint16(4, 1, true); // 1 image count

  // ICONDIRENTRY (16 bytes)
  view.setUint8(6, size >= 256 ? 0 : size); // width
  view.setUint8(7, size >= 256 ? 0 : size); // height
  view.setUint8(8, 0); // color count
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bits per pixel
  view.setUint32(14, pngBytes.length, true); // data size in bytes
  view.setUint32(18, icoHeaderSize, true); // data offset

  // Write PNG stream
  const destBytes = new Uint8Array(icoBuffer, icoHeaderSize);
  destBytes.set(pngBytes);

  return new Blob([icoBuffer], { type: 'image/x-icon' });
}

/**
 * Creates a clean Scalable Vector Graphics (SVG) Blob embedding high-res raster data.
 */
function createSvgBlob(canvas: HTMLCanvasElement, width: number, height: number): Blob {
  const dataUrl = canvas.toDataURL('image/png');
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" version="1.1">
  <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;
  return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
}

/**
 * Creates a Vector PDF document Blob containing the converted image.
 */
async function createPdfBlob(canvas: HTMLCanvasElement, width: number, height: number): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  const pngDataUrl = canvas.toDataURL('image/png');
  const base64Data = pngDataUrl.split(',')[1];
  const pngBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

  const embeddedImage = await pdfDoc.embedPng(pngBytes);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as any], { type: 'application/pdf' });
}

/**
 * Universal Multi-Format Image Converter.
 * Supports: WEBP, JPEG, PNG, AVIF, SVG, PDF, TIFF, ICO, BMP, GIF, TGA, PPM.
 */
export async function convertImage(
  file: File,
  settings: ConvertSettings,
  onProgress?: (progress: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(img.src);
      if (onProgress) onProgress(20);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas rendering context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // If format doesn't support transparency (JPEG/BMP/PPM) or user chose a custom bg, fill canvas
      const opaqueFormats: SupportedConvertFormat[] = ['jpeg', 'bmp', 'ppm'];
      const needsBackground =
        opaqueFormats.includes(settings.targetFormat) ||
        (settings.backgroundColor && settings.backgroundColor !== 'transparent');

      if (needsBackground) {
        ctx.fillStyle =
          settings.backgroundColor && settings.backgroundColor !== 'transparent'
            ? settings.backgroundColor
            : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      if (onProgress) onProgress(50);

      const qualityVal = Math.min(1.0, Math.max(0.1, settings.quality / 100));
      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;

      try {
        let outputBlob: Blob;
        let ext = settings.targetFormat as string;

        switch (settings.targetFormat) {
          case 'bmp': {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            outputBlob = createBmpBlob(imgData);
            break;
          }
          case 'tga': {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            outputBlob = createTgaBlob(imgData);
            break;
          }
          case 'ppm': {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            outputBlob = createPpmBlob(imgData);
            break;
          }
          case 'tiff': {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            outputBlob = createTiffBlob(imgData);
            break;
          }
          case 'svg': {
            outputBlob = createSvgBlob(canvas, canvas.width, canvas.height);
            break;
          }
          case 'pdf': {
            outputBlob = await createPdfBlob(canvas, canvas.width, canvas.height);
            break;
          }
          case 'ico': {
            outputBlob = await createIcoBlob(canvas, settings.icoSize || 64);
            break;
          }
          case 'gif': {
            outputBlob = await new Promise<Blob>((res, rej) => {
              canvas.toBlob((b) => (b ? res(b) : rej(new Error('GIF conversion failed'))), 'image/gif');
            });
            break;
          }
          default: {
            // Standard browser formats: webp, jpeg, png, avif
            const mimeType = `image/${settings.targetFormat}`;

            outputBlob = await new Promise<Blob>((res, rej) => {
              canvas.toBlob(
                (b) => {
                  if (b) {
                    res(b);
                  } else {
                    // If AVIF is unsupported on older browser engines, fallback gracefully to WEBP
                    if (settings.targetFormat === 'avif') {
                      canvas.toBlob((fallbackB) => {
                        if (fallbackB) res(fallbackB);
                        else rej(new Error('Format conversion failed'));
                      }, 'image/webp', qualityVal);
                    } else {
                      rej(new Error('Format conversion failed'));
                    }
                  }
                },
                mimeType,
                qualityVal
              );
            });
            break;
          }
        }

        if (onProgress) onProgress(100);

        const convertedFile = new File([outputBlob], `${baseName}_converted.${ext}`, {
          type: outputBlob.type,
          lastModified: Date.now(),
        });

        resolve(convertedFile);
      } catch (err: any) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for format conversion'));
    };
  });
}
