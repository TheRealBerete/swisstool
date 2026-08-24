import { lookup } from "node:dns/promises";

const BLOCKED_HOSTNAMES = new Set(["localhost"]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) || // lien-local — inclut 169.254.169.254, le
    // point de métadonnées cloud (AWS/GCP/Azure/Vercel) : c'est LA cible
    // classique d'un SSRF réussi (vol de credentials d'instance).
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fe80:") || // lien-local
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") // adresses locales uniques (fc00::/7)
  );
}

/**
 * 🧠 Concept — SSRF (Server-Side Request Forgery)
 * Notre route /api/downloader/stream fait un `fetch()` côté SERVEUR vers
 * une URL fournie par le client (nécessaire pour contourner le CORS des
 * CDN médias, voir stream/route.ts). Sans contrôle, un utilisateur
 * authentifié pourrait lui faire requêter n'importe quelle adresse
 * atteignable depuis notre serveur — y compris le réseau interne
 * (base de données, service interne) ou, sur une plateforme cloud, un
 * endpoint de métadonnées exposant des credentials. C'est le SSRF.
 *
 * Contrairement à l'ancienne route Lotus (un seul CDN R2, allowlist par
 * suffixe de domaine `.r2.dev`), les médias RapidAPI viennent de CDN très
 * variés et imprévisibles (fbcdn.net, twimg.com, sous-domaines TikTok
 * différents à chaque appel...) — une allowlist de domaines serait soit
 * trop large pour rester sûre, soit constamment en retard sur les
 * nouveaux sous-domaines. On bloque donc plutôt par IP RÉSOLUE : toute
 * cible qui pointe vers une plage privée/interne est refusée, qui que
 * soit le nom de domaine.
 *
 * Limite assumée : ceci ne protège pas d'un DNS rebinding parfait (l'IP
 * pourrait changer entre cette vérification et le fetch() réel juste
 * après) — un blindage complet épinglerait l'IP vérifiée pour le fetch
 * lui-même. Non fait ici : risque jugé acceptable pour une app à accès
 * invite-only avec authentification déjà en place (README §Sécurité).
 */
export async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "https:") {
    throw new Error("Seules les URLs HTTPS sont autorisées");
  }
  if (BLOCKED_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
    throw new Error("Hôte non autorisé");
  }

  const addresses = await lookup(parsed.hostname, { all: true });
  const hasPrivateAddress = addresses.some((a) =>
    a.family === 4 ? isPrivateIPv4(a.address) : isPrivateIPv6(a.address)
  );
  if (hasPrivateAddress) {
    throw new Error("Hôte non autorisé");
  }

  return parsed;
}
