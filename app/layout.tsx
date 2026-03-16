import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataEdge | Professional Web3 Data Visualizer",
  description: "Enterprise-grade CSV analysis engine with AI anomaly detection, deployed on Tencent Edge Cloud infrastructure.",
  keywords: ["Data Analysis", "Web3", "Tencent Edge Cloud", "CSV Visualizer", "AI Insights"],
  authors: [{ name: "Hans Christian" }],
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/logo.svg", 
    apple: "/logo.svg",
  },
  openGraph: {
    title: "DataEdge - Professional Web3 Data Visualizer",
    description: "Analyze and visualize your CSV data instantly with edge-side AI processing.",
    type: "website",
    locale: "en_US",
    siteName: "DataEdge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#FDFDFD] text-[#2D3436]`}
      >
        {children}
      </body>
    </html>
  );
}