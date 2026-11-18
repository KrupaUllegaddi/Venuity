import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { RealtimeSubscriber } from "@/components/realtime-subscriber";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Venuity — Campus Venue Management",
  description:
    "Streamlined venue booking and management for campus operations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} font-sans h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground pb-16 md:pb-0">
        <Toaster position="top-right" richColors />
        <RealtimeSubscriber />
        <ConditionalNavbar>
          <Navbar />
        </ConditionalNavbar>
        <main className="flex-1 flex flex-col">{children}</main>
        <ConditionalNavbar>
          <BottomNav />
        </ConditionalNavbar>
      </body>
    </html>
  );
}
