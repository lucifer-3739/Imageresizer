import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-icon',
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
