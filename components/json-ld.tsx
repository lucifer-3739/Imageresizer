import React from 'react';

export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelshrink.com';

  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'PixelShrink Studio',
    url: siteUrl,
    description:
      'Free, private, browser-based image compressor, resizer, 12-format converter, PDF suite, and media audio extractor with zero server latency.',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All (Web Browser, Windows, macOS, Linux, iOS, Android)',
    browserRequirements: 'Requires JavaScript and HTML5 Canvas support',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Lossless & Lossy Image Compression (up to 90% size reduction)',
      '12 Image Format Conversions (WEBP, JPEG, PNG, AVIF, SVG, PDF, TIFF, ICO, BMP, GIF, TGA, PPM)',
      'Social Media Resizer presets for YouTube Thumbnails, Banners, and Instagram Posts',
      'PDF Suite Pro: A4/Letter resizing, page rotation, deletion, watermarking, merging, and splitting',
      'Universal Video & Audio Downloader with direct MP3/WAV/M4A/OPUS extraction and FFmpeg stream merging',
      '100% Client-Side Privacy: files never leave the user browser',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '12840',
      bestRating: '5',
      worstRating: '1',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is PixelShrink free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, PixelShrink Studio is 100% free with unlimited compressions, conversions, PDF edits, and media downloads without any watermark or subscription.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are my images and files private and secure?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, completely private. Image compression, format conversion, and PDF edits happen 100% locally in your web browser using HTML5 Canvas, WebAssembly, and client-side encoders. Your images are never uploaded to any remote server.',
        },
      },
      {
        '@type': 'Question',
        name: 'What image formats can I convert?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'PixelShrink supports converting between 12 popular and next-gen formats: WEBP, JPEG, PNG, AVIF, SVG, PDF, TIFF, ICO (multi-res Favicon), BMP, GIF, TGA (3D Game Texture), and PPM (Netpbm raw pixmap).',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I compress images without losing quality?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Simply drag and drop your JPEG, PNG, or WEBP files into PixelShrink, choose your preferred quality setting (80-85% is optimal for high visual fidelity with up to 90% size reduction), and download your optimized files instantly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I resize images for YouTube thumbnails and Instagram?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! PixelShrink includes instant presets for YouTube 1280x720 Thumbnails, 2560x1440 Channel Banners, Instagram 1080x1080 Square, Portrait, and Story dimensions.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
