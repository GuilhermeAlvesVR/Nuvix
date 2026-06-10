import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Nuvix Consultórios",
  description: "Sistema para gestão de consultórios, pacientes, consultas e financeiro.",
  manifest: "/manifest",
  appleWebApp: { capable: true, title: "Nuvix" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={inter.variable} lang="pt-BR">
      <head>
        <meta name="theme-color" content="#116466" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/brand/nuvix-logo.png" />
      </head>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
