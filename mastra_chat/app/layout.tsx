import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { config } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fp = config.appFaviconPath;

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: config.appTitle,
  description: config.appDescription,
  icons: {
    icon: [
      { url: `${fp}/favicon.ico`, sizes: 'any' },
      { url: `${fp}/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
      { url: `${fp}/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${fp}/android-chrome-192x192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${fp}/android-chrome-512x512.png`, sizes: '512x512', type: 'image/png' },
    ],
    apple: `${fp}/apple-touch-icon.png`,
  },
  manifest: `${fp}/site.webmanifest`,
  openGraph: {
    title: config.appTitle,
    description: config.appDescription,
    url: config.appUrl,
    siteName: config.appTitle,
    images: [
      {
        url: config.appOgImage,
        width: 1200,
        height: 630,
        alt: config.appTitle,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: config.appTitle,
    description: config.appDescription,
    images: [config.appOgImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
