import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import Toast from "@/components/Toast";
import AudioMonitorProvider from "@/components/AudioMonitorProvider";

export const metadata: Metadata = {
  title: "Decibel — Your Ears Don't Get Second Chances",
  description: "Real-time hearing health platform. Track sound levels, map noise exposure, and get personalized hearing risk profiles backed by WHO safety thresholds.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Decibel",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1 md:pt-14 pb-16 md:pb-0">
            <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
              {children}
            </ErrorBoundary>
          </main>
          <Toast />
          <AudioMonitorProvider />
        </div>
      </body>
    </html>
  );
}
