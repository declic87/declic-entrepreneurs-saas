import type { Metadata } from "next";
import "./globals.css"; // Réactivé : C'est indispensable pour Tailwind et la charte graphique

export const metadata: Metadata = {
  title: "DÉCLIC Entrepreneurs | Payez moins d'impôts. Légalement.",
  description:
    "Accompagnement fiscal pour micro-entrepreneurs, auto-entrepreneurs, TPE et PME. Optimisez vos charges URSSAF et gardez plus de ce que vous gagnez.",
  metadataBase: new URL("https://declic-entrepreneurs.fr"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://declic-entrepreneurs.fr",
    siteName: "DÉCLIC Entrepreneurs",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}