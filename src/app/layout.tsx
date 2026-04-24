import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import AuthGuard from "@/components/AuthGuard";
import { OrgProvider } from "@/components/org/OrgProvider";
import { SessionCookieSync } from "@/components/SessionCookieSync";

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
  metadataBase: new URL("https://daedalussky.com"),
  title: {
    default: "Daedalus Sky",
    template: "%s · Daedalus Sky",
  },
  description:
    "Multi-tenant flight operations platform with clinical interoperability.",
  openGraph: {
    title: "Daedalus Sky",
    description:
      "Human–machine interface for flight operations, crew state, and clinical sync.",
    images: [
      {
        url: "/hero-daedalus.png",
        width: 1024,
        height: 534,
        alt: "Daedalus Sky — anatomy and mechanical wing study",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SessionCookieSync />
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] flex-1 items-center justify-center text-sm text-neutral-500">
              Checking sign-in…
            </div>
          }
        >
          <AuthGuard>
            <OrgProvider>{children}</OrgProvider>
          </AuthGuard>
        </Suspense>
      </body>
    </html>
  );
}
