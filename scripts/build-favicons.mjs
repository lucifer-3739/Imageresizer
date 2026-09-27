import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function buildFavicons() {
  const svgPath = path.resolve('public/favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Render PNGs at various resolutions
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const png180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();

  fs.writeFileSync('public/favicon-32x32.png', png32);
  fs.writeFileSync('public/favicon-16x16.png', png16);
  fs.writeFileSync('public/apple-touch-icon.png', png180);

  // Build true Windows multi-resolution ICO file
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // 1 = icon
  icoHeader.writeUInt16LE(2, 4); // 2 images (32x32, 16x16)

  const offset1 = 6 + 16 * 2;
  const offset2 = offset1 + png32.length;

  const entry1 = Buffer.alloc(16);
  entry1.writeUInt8(32, 0); // width
  entry1.writeUInt8(32, 1); // height
  entry1.writeUInt8(0, 2); // color count
  entry1.writeUInt8(0, 3); // reserved
  entry1.writeUInt16LE(1, 4); // color planes
  entry1.writeUInt16LE(32, 6); // bits per pixel
  entry1.writeUInt32LE(png32.length, 8); // image size
  entry1.writeUInt32LE(offset1, 12); // data offset

  const entry2 = Buffer.alloc(16);
  entry2.writeUInt8(16, 0); // width
  entry2.writeUInt8(16, 1); // height
  entry2.writeUInt8(0, 2); // color count
  entry2.writeUInt8(0, 3); // reserved
  entry2.writeUInt16LE(1, 4); // color planes
  entry2.writeUInt16LE(32, 6); // bits per pixel
  entry2.writeUInt32LE(png16.length, 8); // image size
  entry2.writeUInt32LE(offset2, 12); // data offset

  const icoBuffer = Buffer.concat([icoHeader, entry1, entry2, png32, png16]);

  fs.writeFileSync('app/favicon.ico', icoBuffer);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  console.log('Successfully generated app/favicon.ico and public/favicon.ico!');
}

buildFavicons().catch(console.error);
