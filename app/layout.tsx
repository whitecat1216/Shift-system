import type { Metadata, Viewport } from "next";
import { AppStateProvider } from "./(app)/state";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hotel Shift AI",
  description: "ホテル向けシフト表管理画面",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071b34",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-100">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
