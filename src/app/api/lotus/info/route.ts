import { NextResponse, type NextRequest } from "next/server";
import { fetchVideoInfo, LotusApiError } from "@/lib/lotus/client";

/**
 * Proxy serveur vers `GET /api/info` de Lotus. Pourquoi un proxy et pas un
 * appel direct depuis le navigateur : le token JWT Lotus doit être généré
 * juste avant chaque appel (voir client.ts) — le faire depuis le navigateur
 * exposerait la génération de token à n'importe qui inspectant le réseau.
 * Ici, seul notre serveur parle à api.lotusvids.online ; le proxy Next.js
 * (voir src/proxy.ts) protège déjà cette route derrière l'authentification.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const info = await fetchVideoInfo(url);
    return NextResponse.json(info);
  } catch (err) {
    if (err instanceof LotusApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Erreur inconnue" }, { status: 500 });
  }
}
