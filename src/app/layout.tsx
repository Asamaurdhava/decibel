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
          {/* Database paused banner — remove when Supabase is unpaused */}
          <div className="hidden md:block fixed top-0 left-0 right-0 z-[60] bg-primary/10 border-b border-primary/20 text-center py-1.5 px-4">
            <p className="text-primary/80 text-[10px] font-mono tracking-wide">
              Cloud sync paused — local monitoring works fine. Session history and map pins require database to be active.
            </p>
          </div>
          <div className="md:hidden fixed top-auto bottom-14 left-0 right-0 z-[60] bg-primary/10 border-t border-primary/20 text-center py-1.5 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <p className="text-primary/80 text-[10px] font-mono tracking-wide">
              Cloud sync paused — local features work fine
            </p>
          </div>
          <Navbar />
          <main className="flex-1 md:pt-[calc(3.5rem+1.5rem)] pb-[calc(4rem+1.5rem)] md:pb-0">
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
