import { DownloaderApiError, readJson } from "./errors";
import type { VidsSaveParseData, VidsSseSuccessPayload } from "./raw-types";

const VIDSSAVE_AUTH = process.env.VIDSSAVE_AUTH ?? "20250901majwlqo";
const VIDSSAVE_DOMAIN = process.env.VIDSSAVE_DOMAIN ?? "api-ak.vidssave.com";
const VIDSSAVE_BASE = "https://api.vidssave.com";

/** VidsSave est une API interne non-officielle (doc §10, pas un vrai
 * partenaire) — sans en-têtes qui ressemblent à un navigateur réel
 * appelant depuis vidssave.com, une protection anti-bot (souvent Cloudflare)
 * peut bloquer silencieusement les requêtes venant d'IP de datacenter
 * (Vercel, AWS...), qui n'ont pas la même réputation qu'une IP
 * résidentielle. On imite ici les en-têtes qu'enverrait le site public. */
const BROWSER_LIKE_HEADERS = {
  "content-type": "application/x-www-form-urlencoded",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  origin: "https://vidssave.com",
  referer: "https://vidssave.com/",
};

/** Étape 1 (doc §10.2) — liste les formats disponibles pour une vidéo
 * YouTube, avec leur taille déjà connue (le provider a lui-même filtré à
 * <= 50 Mo, limite Telegram côté bot d'origine — coïncide avec la limite
 * de bon sens pour un téléchargement web aussi). Ne donne PAS encore
 * d'URL de téléchargement : juste un jeton par format (résolution
 * paresseuse, voir resolveResource ci-dessous). */
export async function parseYoutube(url: string): Promise<VidsSaveParseData> {
  const res = await fetch(`${VIDSSAVE_BASE}/api/contentsite_api/media/parse`, {
    method: "POST",
    headers: BROWSER_LIKE_HEADERS,
    body: new URLSearchParams({ auth: VIDSSAVE_AUTH, domain: VIDSSAVE_DOMAIN, origin: "source", link: url }),
    cache: "no-store",
  });
  const json = await readJson(res);
  const data = json.data as VidsSaveParseData | undefined;
  if (!res.ok || !data) {
    // Loggé côté serveur (visible dans les logs de fonction Vercel) pour
    // diagnostiquer SANS exposer le détail brut au client (message
    // générique renvoyé au navigateur).
    console.error("[vidssave] parse échoué", { status: res.status, body: json });
    throw new DownloaderApiError("Impossible de lire cette vidéo YouTube", 502);
  }
  return data;
}

/** Étapes 2 (démarre la préparation) + 3 (attend le résultat via SSE) —
 * déclenchées seulement quand l'utilisateur choisit CE format précis
 * (voir MediaFormat.resolveToken). Peut prendre plusieurs secondes : le
 * fichier est préparé côté VidsSave à la demande, pas stocké à l'avance. */
export async function resolveResource(resourceContent: string): Promise<{ url: string; size: number | null }> {
  const startRes = await fetch(`${VIDSSAVE_BASE}/api/contentsite_api/media/download`, {
    method: "POST",
    headers: BROWSER_LIKE_HEADERS,
    body: new URLSearchParams({
      auth: VIDSSAVE_AUTH,
      domain: VIDSSAVE_DOMAIN,
      request: resourceContent,
      no_encrypt: "1",
    }),
    cache: "no-store",
  });
  const startJson = await readJson(startRes);
  const taskId = (startJson.data as { task_id?: string } | undefined)?.task_id;
  if (!startRes.ok || !taskId) {
    console.error("[vidssave] download (étape 2) échoué", { status: startRes.status, body: startJson });
    throw new DownloaderApiError("Échec de la préparation du fichier", 502);
  }

  const sseParams = new URLSearchParams({
    auth: VIDSSAVE_AUTH,
    domain: VIDSSAVE_DOMAIN,
    task_id: taskId,
    download_domain: "vidssave.com",
    origin: "content_site",
  });

  // Garde-fou de durée : la préparation est de durée variable côté
  // VidsSave (aucune garantie documentée). On coupe après 45s plutôt que
  // de laisser la requête pendre indéfiniment — au-delà, on préfère un
  // message d'erreur clair à un spinner infini.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const sseRes = await fetch(
      `${VIDSSAVE_BASE}/sse/contentsite_api/media/download_query?${sseParams.toString()}`,
      {
        headers: { ...BROWSER_LIKE_HEADERS, accept: "text/event-stream" },
        signal: controller.signal,
        cache: "no-store",
      }
    );
    if (!sseRes.ok || !sseRes.body) {
      console.error("[vidssave] SSE (étape 3) échoué", { status: sseRes.status });
      throw new DownloaderApiError("Échec du suivi de préparation", 502);
    }
    const { downloadLink, size } = await readSseResult(sseRes.body);
    const finalUrl = await followRedirect(downloadLink);
    return { url: finalUrl, size };
  } catch (err) {
    if (err instanceof DownloaderApiError) throw err;
    throw new DownloaderApiError("La préparation du fichier a pris trop de temps — réessaie", 504);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 🧠 Concept — Server-Sent Events (SSE)
 * Contrairement à un appel HTTP classique (une requête → une réponse),
 * SSE garde la connexion ouverte : le serveur pousse plusieurs messages
 * au fil du temps (ici la progression de la préparation du fichier). On
 * doit donc lire le flux morceau par morceau jusqu'à un événement final
 * ("success"/"error"), pas juste attendre "une" réponse — ce que fait
 * cette fonction en accumulant les octets dans `buffer` jusqu'à trouver
 * un événement complet (séparé par une ligne vide, `\n\n`).
 */
async function readSseResult(body: ReadableStream<Uint8Array>): Promise<{ downloadLink: string; size: number | null }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;

      let payload: VidsSseSuccessPayload;
      try {
        payload = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue;
      }

      if (payload.status === "success" && payload.download_link) {
        return { downloadLink: payload.download_link, size: payload.filesize ?? null };
      }
      if (payload.status === "error") {
        throw new DownloaderApiError("Échec de la préparation du fichier", 502);
      }
    }
  }

  throw new DownloaderApiError("Flux de préparation interrompu — réessaie", 502);
}

/** `download_link` pointe vers un endpoint VidsSave qui répond par une
 * redirection HTTP 302 vers le fichier final (doc §10.2) — on la suit
 * nous-mêmes côté serveur (`redirect: "manual"` + lecture de `Location`)
 * plutôt que de laisser `fetch` la suivre automatiquement, pour renvoyer
 * au client l'URL finale directement exploitable. */
async function followRedirect(redirectUrl: string): Promise<string> {
  const res = await fetch(redirectUrl, { redirect: "manual" });
  const location = res.headers.get("location");
  if (!location) {
    throw new DownloaderApiError("Lien de téléchargement introuvable", 502);
  }
  return location;
}
