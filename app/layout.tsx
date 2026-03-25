import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
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
  icons: {
    icon: "/favicon.svg",
  },
};

import { ThemeProvider } from "@/components/ThemeProvider";

import { UIProvider } from "@/components/UIContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <UIProvider>
            <AppShell>{children}</AppShell>
          </UIProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
