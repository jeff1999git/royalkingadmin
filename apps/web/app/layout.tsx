import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import PwaRegister from "./components/PwaRegister";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Royal King Water Supply",
  description: "Royal King Water Supply Management System",
  applicationName: "Royal King",
  appleWebApp: {
    capable: true,
    title: "Royal King",
    // "default" keeps the iOS status bar above the sticky blue headers
    // instead of drawing over them.
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a3d91",
  // Lets env(safe-area-inset-*) work, so the bottom tab bars clear the
  // iPhone home indicator when the app is installed.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          {children}
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
