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

export const metadata: Metadata = {
  metadataBase: new URL(config.appUrl),
  title: config.appTitle,
  description: config.appDescription,
  icons: {
    icon: config.appFavicon,
    apple: config.appFavicon,
  },
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
