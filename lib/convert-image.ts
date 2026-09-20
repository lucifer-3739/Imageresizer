import { ConvertSettings, SupportedConvertFormat } from '@/types/image';

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
 * Universal Multi-Format Image Converter.
 * Supports: JPEG, PNG, WEBP, AVIF, BMP, ICO.
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
      if (onProgress) onProgress(25);

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

      // If format doesn't support transparency (JPEG/BMP) or user chose a custom bg, fill canvas
      const needsBackground =
        settings.targetFormat === 'jpeg' ||
        settings.targetFormat === 'bmp' ||
        (settings.backgroundColor && settings.backgroundColor !== 'transparent');

      if (needsBackground) {
        ctx.fillStyle = settings.backgroundColor && settings.backgroundColor !== 'transparent'
          ? settings.backgroundColor
          : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      if (onProgress) onProgress(60);

      const qualityVal = Math.min(1.0, Math.max(0.1, settings.quality / 100));
      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;

      try {
        let outputBlob: Blob;
        let ext = settings.targetFormat as string;

        if (settings.targetFormat === 'bmp') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          outputBlob = createBmpBlob(imgData);
        } else if (settings.targetFormat === 'ico') {
          outputBlob = await createIcoBlob(canvas, settings.icoSize || 64);
        } else {
          // Standard browser formats: jpeg, png, webp, avif
          const mimeType = `image/${settings.targetFormat}`;

          outputBlob = await new Promise<Blob>((res, rej) => {
            canvas.toBlob(
              (b) => {
                if (b) {
                  res(b);
                } else {
                  // If AVIF is unsupported on older browsers, fallback gracefully to WEBP
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
        }

        if (onProgress) onProgress(100);

        const convertedFile = new File(
          [outputBlob],
          `${baseName}_converted.${ext}`,
          { type: outputBlob.type, lastModified: Date.now() }
        );

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
