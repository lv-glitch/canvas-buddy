import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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
  // metadataBase = canonical origin. Next.js resolves relative URLs in
  // openGraph.images / twitter.images / etc. against this. opengraph-image.tsx
  // lives at /opengraph-image and is auto-discovered, so no need to repeat
  // the URL here — Next builds the full <meta property="og:image"> tag.
  metadataBase: new URL("https://canvasbuddy.io"),
  openGraph: {
    title: "Canvas Buddy — Spotify Canvas videos in seconds",
    description:
      "Upload your art or describe it. Pick an effect and a filter. Export a Spotify Canvas video in seconds.",
    type: "website",
    siteName: "Canvas Buddy",
    url: "https://canvasbuddy.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "Canvas Buddy — Spotify Canvas videos in seconds",
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
    <ClerkProvider
      // Just brand the primary CTA — leave inputs/OTP/etc. on Clerk defaults.
      // Past attempt to fully theme the modal broke the verification-code
      // input, so keep this minimal.
      appearance={{ variables: { colorPrimary: "#1ED760" } }}
    >
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
