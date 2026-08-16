import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/shared/Toaster";
import { ThemeInit } from "@/core/store/ThemeInit";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SwissTool",
  description: "Le couteau suisse numérique.",
  // Pas de champ `icons` ici : src/app/icon.png et src/app/apple-icon.png
  // sont détectés automatiquement par Next.js (convention de fichiers) et
  // génèrent les <link rel="icon"/apple-touch-icon"> tout seuls.
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbf0" },
    { media: "(prefers-color-scheme: dark)", color: "#14170f" },
  ],
  // Sans ça, Safari garde le contenu à distance du home indicator tout
  // seul MAIS n'expose pas env(safe-area-inset-bottom) à notre CSS (la
  // valeur reste à 0) — on ne peut donc pas ajuster nous-mêmes le padding
  // du BottomNav pour ce cas précis. "cover" étend le contenu sous cette
  // zone et nous laisse gérer l'espacement via env() (voir BottomNav.tsx).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={hankenGrotesk.variable} suppressHydrationWarning>
      <body className="antialiased">
        {/* Applique la classe .dark avant le premier rendu visible, pour
            éviter un flash clair→sombre au chargement. */}
        <ThemeInit />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
