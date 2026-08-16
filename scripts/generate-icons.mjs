// Génère l'ensemble des icônes PWA/favicon à partir de swisstool_icon_clean.png
// (source 1024x1024, transparent). Relancer avec `node scripts/generate-icons.mjs`
// si le logo source change un jour.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "swisstool_icon_clean.png";
// Fond plein utilisé derrière le logo (maskable + apple-touch-icon) : blanc,
// pas la couleur primaire — décision utilisateur, le vert plein sur l'icône
// d'accueil rendait mal comparé au logo original (fond transparent).
const ICON_BACKGROUND = "#ffffff";

await mkdir("public/icons", { recursive: true });

// Icônes "any" — transparentes, pleine bleed. Utilisées pour le favicon,
// l'icône d'app générique (icon-192/512) et src/app/icon.png.
async function transparentIcon(size, outPath) {
  await sharp(SOURCE).resize(size, size).png().toFile(outPath);
}

// Icônes "maskable" — le logo touche presque les bords de l'image source,
// donc on le réduit à 70% et on le centre sur un fond plein pour respecter
// la "safe zone" de 80% exigée par le standard maskable (sinon Android/iOS
// rognent les dents de l'engrenage en cercle).
async function maskableIcon(size, outPath) {
  const inner = Math.round(size * 0.7);
  const logo = await sharp(SOURCE).resize(inner, inner).toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: ICON_BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);
}

// Apple ne gère pas bien la transparence sur apple-touch-icon (rendu
// noir/blanc selon le contexte) — fond plein obligatoire, même logique
// que le maskable mais sans les contraintes de safe zone Android.
async function appleIcon(size, outPath) {
  const inner = Math.round(size * 0.82);
  const logo = await sharp(SOURCE).resize(inner, inner).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: ICON_BACKGROUND },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);
}

await transparentIcon(256, "src/app/icon.png");
await transparentIcon(192, "public/icons/icon-192.png");
await transparentIcon(512, "public/icons/icon-512.png");
await maskableIcon(192, "public/icons/maskable-icon-192.png");
await maskableIcon(512, "public/icons/maskable-icon-512.png");
await appleIcon(180, "src/app/apple-icon.png");

console.log("✓ Icônes générées.");
