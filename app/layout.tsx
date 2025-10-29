import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/ReactToastify.css";
import "./globals.css";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "ProTrack - Sistema de Gestión de Inventario",
  description: "Organiza, optimiza y domina tu stock",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Suspense
          fallback={
            <div className="size-full flex justify-center items-center">
              <Spinner className="size-8" />
            </div>
          }
        >
          {children}
          <Analytics />
        </Suspense>
        <ToastProvider />
      </body>
    </html>
  );
}
