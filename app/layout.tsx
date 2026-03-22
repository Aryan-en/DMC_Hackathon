import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
// import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ontora - Global Intelligence & Ontology Analysis",
  description: "Production-grade global intelligence and ontology analysis system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#020817' }}
      >
        <div className="flex min-h-screen flex-col">
          <div className="flex flex-1">
            <Sidebar />
            <div className="flex-1 flex flex-col" style={{ marginLeft: '256px' }}>
              {children}
            </div>
          </div>
          {/* <Footer /> */}
        </div>
      </body>
    </html>
  );
}
