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
  title: "PixelShrink — Free Browser-Side Image Compressor",
  description: "Reduce image size without sacrificing quality. 100% private, secure, fast and client-side browser image compression.",
  keywords: ["image compression", "compress jpg", "compress png", "compress webp", "pixelshrink", "client-side compressor", "privacy image compressor"],
  authors: [{ name: "PixelShrink" }],
  openGraph: {
    title: "PixelShrink — Free Browser-Side Image Compressor",
    description: "Reduce image size without sacrificing quality. 100% private and secure browser image compression.",
    type: "website",
    locale: "en_US",
    siteName: "PixelShrink",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelShrink — Free Browser-Side Image Compressor",
    description: "Reduce image size without sacrificing quality. 100% private and secure browser image compression.",
  },
  icons: {
    icon: "/favicon.ico",
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
