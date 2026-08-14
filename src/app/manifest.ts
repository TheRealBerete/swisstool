import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SwissTool — Le couteau suisse numérique",
    short_name: "SwissTool",
    description:
      "Toolbox personnelle : presse-papier partagé, générateur de mots de passe, transfert de fichiers.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Couleurs Alpine Mint (clair) — cohérent avec globals.css :root.
    // Le manifest ne peut pas suivre le thème sombre dynamiquement, donc
    // on fixe la palette claire par défaut (comportement standard PWA).
    background_color: "#f7fbf0",
    theme_color: "#0d631b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
