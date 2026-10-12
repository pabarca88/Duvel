import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duvel | Gestión de rendiciones",
  description: "Administración de proyectos y rendiciones documentales.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
