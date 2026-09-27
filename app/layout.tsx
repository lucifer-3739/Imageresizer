import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleAdSense } from "@/components/google-adsense";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelShrink Studio — Free Browser-Side Media & Image Suite",
  description: "Compress, resize, convert formats, and create PDFs. 100% private, secure, fast and client-side browser image & media tools.",
  keywords: [
    "image compression",
    "image resizer",
    "image to pdf",
    "convert webp to png",
    "convert to ico",
    "video audio extractor",
    "pixelshrink studio",
    "client-side image tools"
  ],
  authors: [{ name: "PixelShrink" }],
  openGraph: {
    title: "PixelShrink Studio — Free Browser-Side Media & Image Suite",
    description: "Compress, resize, convert formats, and create PDFs. 100% private and secure browser tools.",
    type: "website",
    locale: "en_US",
    siteName: "PixelShrink Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelShrink Studio — Free Browser-Side Media & Image Suite",
    description: "Compress, resize, convert formats, and create PDFs. 100% private and secure browser tools.",
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
