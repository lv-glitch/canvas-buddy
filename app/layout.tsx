import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Canvas Buddy — Spotify Canvas videos in seconds",
  description:
    "Upload your art or describe it. Pick an effect and a filter. Export a Spotify Canvas video in seconds.",
  metadataBase: new URL("https://canvasbuddy.app"),
  openGraph: {
    title: "Canvas Buddy — Spotify Canvas videos in seconds",
    description:
      "Upload your art or describe it. Pick an effect and a filter. Export a Spotify Canvas video in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Canvas Buddy",
    description:
      "Upload your art or describe it. Pick an effect and a filter. Export a Spotify Canvas video in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
