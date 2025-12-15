import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SolanaProvider } from "@/components/solana/SolanaProvider";
import { siteConfig } from "@/lib/config/site";
import { getEnvPublic } from "@/lib/env/env.public";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const env = getEnvPublic();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider networkId={env.X402_NETWORK}>{children}</SolanaProvider>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
