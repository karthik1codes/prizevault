import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "@frontend/styles/index.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PrizeVault · Escrowed hackathon prizes on Stellar",
  description:
    "Lock hackathon prize money in on-chain escrow. Sponsor and organizer both approve before any payout moves.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="pv-theme-boot" strategy="beforeInteractive">{`
          (function () {
            try {
              var t = localStorage.getItem('prize_vault_theme');
              if (t !== 'light' && t !== 'dark') {
                t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              document.documentElement.setAttribute('data-theme', t);
              document.documentElement.style.colorScheme = t;
            } catch (e) {}
            if (typeof global === 'undefined') window.global = window;
          })();
        `}</Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
