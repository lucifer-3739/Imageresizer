# PixelShrink — Free Browser-Side Image Compressor

PixelShrink is a privacy-focused, browser-based image compression application built using Next.js 15 (running Next 16 in this environment), React 19, Tailwind CSS v4, TypeScript, and Lucide React. 

All compression operations are performed entirely client-side using `browser-image-compression` and HTML5 Canvas in Web Workers. Your images never leave your local device, ensuring absolute privacy.

## Features

- 🔒 **100% Client-Side Privacy**: No backend or server uploads. Your data remains fully secure.
- ⚡ **Multi-Image Batch Processing**: Upload, preview, and compress multiple images (JPEG, JPG, PNG, WEBP) in parallel.
- 🎚️ **Granular Controls**:
  - Adjust compression quality (10% to 100%).
  - Convert image formats (Keep Original, JPEG, PNG, WEBP).
  - Custom width/height resizing with optional aspect ratio lock.
- 🔍 **Interactive Before/After Wipe Slider**: Visual split-screen preview allows comparing quality changes side-by-side in real time.
- 📊 **Detailed Space-Savings Dashboard**: Displays original vs compressed file sizes, saving percentages, and dimensions.
- 📋 **Copy Stats Clipboard Tool**: Share or save image optimization metrics instantly.
- 📦 **Download Bundling**: Download individual images or compile all compressed files into a single ZIP archive.
- 🌓 **Dark & Light Mode**: Seamless dark and light themes with selector support in Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 (Selector-based Dark mode custom variant)
- **Icons**: Lucide React
- **Upload Zone**: React Dropzone
- **Compression**: browser-image-compression (Web Workers)
- **ZIP Bundler**: JSZip
- **Theme Manager**: next-themes

## Getting Started

### Prerequisites

Make sure you have Node.js (v18.x or higher) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lucifer-3739/Imageresizer.git
   cd Imageresizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Production Build

To compile a highly optimized production build:
```bash
npm run build
npm start
```
