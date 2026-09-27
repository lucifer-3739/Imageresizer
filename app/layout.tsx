import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAdSense } from "@/components/google-adsense";
import { JsonLd } from "@/components/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixelshrink.com';

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PixelShrink — Free Image Compressor, Resizer, 12-Format Converter & PDF Suite",
    template: "%s | PixelShrink Studio",
  },
  description:
    "Compress, resize, convert 12 image formats, edit PDFs, and extract media audio 100% free and client-side. Fast, private, zero data uploads.",
  applicationName: "PixelShrink Studio",
  keywords: [
    "image compressor",
    "compress image online",
    "lossless image compression",
    "image resizer",
    "youtube thumbnail resizer",
    "instagram photo resizer",
    "image to pdf converter",
    "pdf editor free",
    "pdf watermark online",
    "merge pdf files",
    "convert webp to png",
    "convert png to webp",
    "convert to ico favicon",
    "avif to jpg converter",
    "video audio extractor",
    "youtube to mp3 320kbps",
    "pixelshrink studio",
    "client-side browser tools",
    "free media tools"
  ],
  authors: [{ name: "PixelShrink Studio", url: siteUrl }],
  creator: "PixelShrink",
  publisher: "PixelShrink Studio",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "PixelShrink — Free Image Compressor, Resizer, Converter & PDF Suite",
    description: "Compress images up to 90%, convert between 12 formats, edit PDFs, and extract media with 100% client-side privacy.",
    url: siteUrl,
    type: "website",
    locale: "en_US",
    siteName: "PixelShrink Studio",
    images: [
      {
        url: "/apple-touch-icon.png",
        width: 180,
        height: 180,
        alt: "PixelShrink Studio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelShrink — Free Image Compressor, Resizer, Converter & PDF Suite",
    description: "Compress images up to 90%, convert between 12 formats, edit PDFs, and extract media with 100% client-side privacy.",
    images: ["/apple-touch-icon.png"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3' },
      { url: '/favicon.svg?v=3', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=3', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: [
      { url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: 'googleb3c5ff019a78c86a',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
        <JsonLd />
        <GoogleAdSense />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
