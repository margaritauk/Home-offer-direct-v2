import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabBar } from "@/components/nav/mobile-tab-bar";
import { CloudSync } from "@/components/cloud-sync";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "HomeOffer Direct — Buy a home without a realtor",
    template: "%s · HomeOffer Direct",
  },
  description:
    "A step-by-step, self-serve guide that walks US home buyers through the entire purchase — from search to closing — so you can skip the buyer's agent and save on commissions.",
  metadataBase: new URL("https://homeoffer-direct.example.com"),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <CloudSync />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
