import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CEBMAG",
  description: "Plataforma de gestión de información Online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans bg-soft text-text">{children}</body>
    </html>
  );
}
