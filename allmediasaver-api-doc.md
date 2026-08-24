# Documentation API — Providers de téléchargement de médias

> Objectif du projet : ces APIs sont le moteur de récupération de médias d'un **bot Telegram Python** capable de télécharger des vidéos/photos/audios depuis des réseaux sociaux (Instagram, TikTok, Facebook, YouTube, X/Twitter...) à partir d'un simple lien envoyé par l'utilisateur.

Deux providers sont utilisés (voir `bot/providers/`) :
1. **RapidAPI `social-download-all-in-one`** (sections 1 à 9) — toutes plateformes, clé payante/officielle.
2. **VidsSave.com** (section 10) — YouTube uniquement, API interne non-officielle, utilisée en priorité pour YouTube car plus fiable que RapidAPI sur cette plateforme spécifique.

Dernière analyse et tests effectués le : **22/08/2026**

---

## 1. Vue d'ensemble

| | |
|---|---|
| **Fournisseur** | RapidAPI — `social-download-all-in-one` |
| **Endpoint principal** | `POST https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink` |
| **Méthode** | `POST` |
| **Format** | JSON (requête et réponse) |
| **Principe** | On envoie une URL de post/vidéo/reel, l'API détecte automatiquement la plateforme ("autolink") et renvoie les liens directs de téléchargement des médias. |

🧠 **Concept — API tierce / wrapper**
Cette API ne télécharge rien elle-même : elle va chercher les vraies URLs des fichiers média (hébergées sur les CDN d'Instagram, TikTok, etc.) et te les renvoie. Ton bot devra ensuite lui-même télécharger le fichier depuis ces URLs (souvent temporaires).

---

## 2. Authentification

Toutes les requêtes nécessitent 2 headers RapidAPI :

```
x-rapidapi-host: social-download-all-in-one.p.rapidapi.com
x-rapidapi-key: <TA_CLE_API>
```

⚠️ **Sécurité — clé API en clair**
Une clé RapidAPI réelle était écrite en dur dans ce fichier. C'est risqué : quiconque lit ce fichier (ou un futur `git push` sur un repo, même privé) peut l'utiliser et consommer ton quota, voire dépasser ton plan payant.
**Recommandation pour le bot** : stocker la clé dans une variable d'environnement (`.env` + `python-dotenv`), jamais en dur dans le code, et ajouter `.env` au `.gitignore`.

```python
# .env (jamais commité)
RAPIDAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# bot.py
import os
from dotenv import load_dotenv
load_dotenv()
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
```

🔗 **Lien cybersécurité** : c'est exactement le même principe qu'un token JWT ou une clé AWS qui fuite sur GitHub — les bots de scraping scannent en continu les repos publics à la recherche de ce genre de secrets.

---

## 3. Requête

**Endpoint** : `POST /v1/social/autolink`

**Headers requis** :
```
x-rapidapi-host: social-download-all-in-one.p.rapidapi.com
x-rapidapi-key: <ta clé>
content-type: application/json
```

**Body** :
```json
{ "url": "https://www.instagram.com/reel/DbXGbQ8iO1e/" }
```

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `url` | string | ✅ | Lien public du post à extraire (Instagram, TikTok, Facebook, YouTube, X/Twitter...) |

Exemple `curl` (utilisé pour les tests ci-dessous) :
```bash
curl -X POST "https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink" \
  -H "x-rapidapi-host: social-download-all-in-one.p.rapidapi.com" \
  -H "x-rapidapi-key: $RAPIDAPI_KEY" \
  -H "content-type: application/json" \
  -d '{"url":"https://www.instagram.com/reel/DbXGbQ8iO1e/"}'
```

---

## 4. Plateformes testées (résultats réels)

| Plateforme | URL testée | Résultat | `source` renvoyé | Notes |
|---|---|---|---|---|
| **Instagram** (reel) | `instagram.com/reel/DbXGbQ8iO1e/` | ✅ 200, média trouvé | `instagram` | Renvoie vidéo + piste audio séparée |
| **TikTok** | `tiktok.com/@tiktok/video/71065...` | ✅ 200, média trouvé | `tiktok` | Renvoie 2 versions vidéo (avec/sans watermark) + audio |
| **Facebook** (watch) | `facebook.com/watch/?v=...` | ✅ 200, média trouvé | `facebook` | Plusieurs qualités vidéo (HD/SD) |
| **YouTube** | `youtube.com/watch?v=dQw4w9WgXcQ` | ✅ 200, média trouvé | `youtube` | Renvoie plusieurs formats/qualités (liste `medias[]`) |
| **YouTube Shorts** | `youtube.com/shorts/...` | ⚠️ 204 "No medias found" | `youtube` | L'URL de test était invalide/inexistante — à retester avec un Short réel |
| **X / Twitter** (avec média) | `x.com/NASA/status/648497140113739776` | ✅ 200, média trouvé | `x` | Fonctionne avec `x.com` **et** `twitter.com` |
| **X / Twitter** (texte seul, sans média) | `twitter.com/BarackObama/status/894675613971955712` | ❌ 404 "Not found data" | — | Normal : le tweet ne contient aucune image/vidéo |
| **Domaine non supporté** | `https://example.com/page` | ❌ 204 "URL not supported" | — | Détection de plateforme échoue |

✅ **Conclusion pratique** : l'API détecte la plateforme uniquement via le nom de domaine dans l'URL (`autolink`). Pas besoin de préciser la plateforme — mais **X/Twitter sans média renvoie une erreur 404**, ce qui n'est pas un bug de l'API mais un cas normal à gérer dans le bot (message à l'utilisateur : "ce post ne contient pas de média téléchargeable").

---

## 5. Format de réponse — succès

⚠️ **Point important pour le code du bot** : l'API renvoie **toujours `HTTP 200`**, même en cas d'erreur métier (URL invalide, post introuvable...). Il ne faut **jamais se fier au status code HTTP** — il faut lire le champ `"error"` dans le corps JSON.

### Champs communs à toutes les plateformes

| Champ | Type | Description |
|---|---|---|
| `error` | bool | `false` si succès |
| `url` | string | URL d'origine envoyée |
| `source` | string | Plateforme détectée (`instagram`, `tiktok`, `facebook`, `youtube`, `x`) |
| `title` | string | Titre/légende du post |
| `author` | string | Nom de l'auteur |
| `thumbnail` | string | URL de la miniature |
| `medias` | array | **Liste des fichiers téléchargeables** (le plus important) |
| `type` | string | `"single"` (1 média) ou `"multiple"` (plusieurs qualités/pistes) |
| `time_end` | int | Temps de traitement côté API (ms) |
| `duration` | int | ⚠️ **Unité incohérente selon la plateforme** — en secondes pour YouTube (`213` = 3 min 33) et TikTok (`24` = 24s), mais en **millisecondes** sur l'exemple Facebook testé (`74304` ≈ 74s, pas 20h). À traiter avec prudence côté bot (ne pas afficher tel quel sans vérification de plausibilité). |

### Objet `medias[]` (les champs varient légèrement selon la plateforme)

| Champ | Présent sur | Description |
|---|---|---|
| `url` | toutes | **Lien direct de téléchargement du fichier** (souvent signé et **temporaire**, cf. section 7) |
| `type` | toutes | `"video"`, `"audio"`, `"photo"` |
| `extension` | toutes | `mp4`, `m4a`, `mp3`, `jpg`... |
| `quality` / `resolution` | Instagram, TikTok, Facebook | ex: `"1080x1350p"`, `"HD"`, `"hd_no_watermark"` |
| `width` / `height` | YouTube, X, TikTok | dimensions en pixels |
| `data_size` | TikTok | taille du fichier en octets (utile pour vérifier la limite Telegram) |
| `formatId` | YouTube | identifiant de format façon `yt-dlp` (18 = mp4 360p, etc.) |

### Exemple — Instagram (reel avec vidéo + audio séparé)
```json
{
  "url": "https://www.instagram.com/reel/DbXGbQ8iO1e/",
  "source": "instagram",
  "title": "Photoshop 2026 tutorial reel #graphicinfluence",
  "author": "Graphic Designer",
  "medias": [
    {
      "type": "video",
      "quality": "1080x1350p",
      "extension": "mp4",
      "url": "https://instagram.fdad3-1.fna.fbcdn.net/o1/v/.../video.mp4?...&oe=6A8B0A6B"
    },
    {
      "type": "audio",
      "extension": "m4a",
      "quality": "41kbps",
      "url": "https://instagram.fdad3-5.fna.fbcdn.net/.../audio.mp4?...&oe=6A8B0462"
    }
  ],
  "type": "multiple",
  "error": false
}
```

### Exemple — TikTok (avec/sans watermark)
```json
{
  "source": "tiktok",
  "title": "how many frogs did you find? 🐸 ...",
  "author": "TikTok",
  "statistics": { "digg_count": 98800, "comment_count": 1281, "play_count": 578000 },
  "medias": [
    { "quality": "hd_no_watermark", "extension": "mp4", "type": "video", "data_size": 3360445, "url": "..." },
    { "quality": "no_watermark",    "extension": "mp4", "type": "video", "data_size": 1967308, "url": "..." },
    { "quality": "audio",           "extension": "mp3", "type": "audio", "url": "..." }
  ],
  "type": "multiple",
  "error": false
}
```
💡 Pour le bot : **toujours choisir le média avec `"hd_no_watermark"`** quand il existe (TikTok), sinon prendre le premier `type: "video"`.

### Exemple — X / Twitter (photo simple)
```json
{
  "source": "x",
  "author": "NASA",
  "title": "Mars just got more interesting...",
  "medias": [
    { "type": "photo", "url": "https://pbs.twimg.com/media/....jpg?name=orig", "width": 1024, "height": 1024, "extension": "jpg" }
  ],
  "type": "single",
  "error": false
}
```

### Exemple — YouTube (plusieurs qualités)
```json
{
  "source": "youtube",
  "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
  "duration": 213,
  "medias": [
    { "formatId": 18, "label": "mp4 (360p)", "type": "video", "ext": "mp4", "width": 640, "height": 360, "url": "https://redirector.googlevideo.com/videoplayback?..." }
  ],
  "type": "multiple",
  "error": false
}
```
⚠️ YouTube ne renvoie ici que des formats vidéo **avec son intégré à basse résolution** (le format 18 est un format historique "progressif" YouTube) — pas de séparation vidéo HD / audio comme sur les autres plateformes dans cet essai. À vérifier avec d'autres vidéos si tu as besoin de HD.

---

## 6. Format de réponse — erreur

```json
{ "error": true, "status": 204, "message": "URL not supported", "time_end": 0 }
{ "error": true, "status": 204, "message": "Invalid link or link is empty", "time_end": 0 }
{ "error": true, "status": 404, "message": "Not found data", "time_end": 344 }
{ "error": true, "status": 204, "message": "No medias found", "time_end": 812,
  "data": { "url": "...", "source": "youtube", "medias": [] } }
```

| `status` (interne) | Signification | Cas rencontré |
|---|---|---|
| `204` | Pas de contenu / lien invalide | domaine non supporté, body vide, post sans média |
| `404` | Ressource introuvable | post supprimé, ID inexistant, tweet sans média |

🧠 **Concept — codes HTTP vs codes "métier"**
Normalement en HTTP, `404` = ressource introuvable et devrait être le vrai status code de la réponse. Ici, l'API renvoie **toujours `HTTP 200`** et met son propre code (`204`/`404`) *dans le JSON*. C'est une pratique discutable mais courante sur RapidAPI — ton code Python doit donc parser le JSON et lire `data["error"]`, pas `response.status_code`.

```python
resp = requests.post(url, headers=headers, json={"url": link})
data = resp.json()
if data.get("error"):
    # data["message"] contient l'explication à renvoyer à l'utilisateur Telegram
    raise MediaNotFoundError(data["message"])
```

---

## 7. Comportements et limites observés

- **URLs de médias temporaires** : les liens dans `medias[].url` contiennent des paramètres de signature/expiration (`oe=`, `expire=`, `x-expires=`). Ils expirent après quelques heures. → **Le bot doit télécharger le fichier immédiatement après l'appel API**, jamais stocker l'URL pour un usage différé.
- ⚠️ **YouTube : téléchargement incohérent, pas un verrou IP strict (mis à jour le 22/08/2026)** — un premier test avait échoué en `403 Forbidden` sur un lien `googlevideo.com` contenant un paramètre `ip=...`, laissant penser à un verrou strict sur l'IP du serveur qui a résolu le lien (RapidAPI). **Test de contrôle refait le même jour** : une requête vers l'API renvoie parfois une **réponse mise en cache** (lien identique, y compris son `ip=`, obtenu plusieurs heures plus tôt pour une vidéo très populaire) plutôt qu'une résolution fraîche ; et un téléchargement effectué depuis une IP **totalement différente** de celle inscrite dans le lien a néanmoins réussi (`HTTP 200`). Conclusion : ce n'est **pas** une règle stricte "1 lien = 1 IP autorisée", mais un comportement **incohérent** côté Google (anti-scraping qui varie selon le réseau, la vidéo, le serveur CDN qui répond, le moment). Ni le bot ni un changement de code ne peuvent le rendre fiable à 100% — c'est une caractéristique connue des outils qui font du reverse engineering de l'infrastructure YouTube (même limite que `yt-dlp`). Contrairement à Instagram/TikTok/Facebook, qui se sont montrés systématiquement fiables lors de nos tests.
- **Pas de plateforme explicite à fournir** : la détection est automatique via le domaine de l'URL (`autolink`). Pas de paramètre `platform`.
- **Rate limiting** (headers RapidAPI observés sur la requête de test) :

  ```
  X-RateLimit-Requests-Limit: 6000
  X-RateLimit-Requests-Remaining: 5739
  X-RateLimit-Requests-Reset: 1353968
  ```

  → Quota mensuel de **6000 requêtes** sur le plan actuel (probablement le plan gratuit/Basic). `Reset` est en secondes jusqu'au renouvellement du quota.
  💡 Pour le bot : prévoir un compteur/log des appels API, et un message d'erreur propre pour l'utilisateur si le quota RapidAPI est dépassé (l'API renverrait alors normalement un `429` — non testé ici pour ne pas gaspiller le quota).
- **Latence** : entre ~350 ms et ~2 s selon la plateforme (`time_end` dans la réponse + temps réseau).

---

## 8. Ce qu'il reste à vérifier avant de coder le bot

- [ ] Comportement en cas de clé API invalide/expirée (probablement `401`/`403` — à tester avec précaution, hors quota normal)
- [ ] Comportement en cas de dépassement de quota (`429` attendu)
- [ ] Test avec un post multi-images (carrousel Instagram) → probablement `type: "multiple"` avec plusieurs `type: "photo"`
- [ ] Test avec un Short YouTube réel et une vidéo YouTube longue (voir si des formats HD/audio séparé existent)
- [ ] Taille max des fichiers renvoyés vs limite Telegram Bot API (**50 Mo** en upload direct pour un bot ; au-delà, il faut soit compresser soit envoyer un lien)

---

## 9. Schéma pour le bot Telegram (aperçu)

```
Utilisateur envoie un lien → bot
        │
        ▼
POST /v1/social/autolink  (RapidAPI)
        │
   error == true ?───► message d'erreur clair à l'utilisateur
        │ non
        ▼
choisir le meilleur média dans medias[]
        │
        ▼
télécharger le fichier (requests/httpx, streaming)
        │
        ▼
envoyer via bot.send_video / send_photo / send_audio
```

🧠 **Concept — pourquoi télécharger puis renvoyer, et pas juste envoyer l'URL ?**
Telegram peut parfois envoyer un média directement depuis une URL (`send_video(video=url)`), mais les CDN d'Instagram/TikTok bloquent souvent les requêtes venant des serveurs Telegram (protection anti-hotlinking). La méthode fiable est : **le bot télécharge le fichier lui-même, puis l'upload en pièce jointe** vers Telegram.

---

## 10. Provider #2 — VidsSave.com (YouTube uniquement)

⚠️ **Statut** : API interne non-officielle du site public `vidssave.com`, découverte en inspectant ses requêtes réseau (outils de dev du navigateur). Contrairement à RapidAPI, **pas d'abonnement, pas de garantie de service, pas de documentation officielle**. Le jeton `auth` est visible dans le JavaScript public du site (pas un secret personnel) et peut changer ou cesser de fonctionner sans préavis. Ajouté spécifiquement pour YouTube car RapidAPI s'y est montré peu fiable (section 7), tandis que ce provider héberge les fichiers sur sa propre infrastructure (pas celle de Google) — testé fiable à plusieurs reprises le 22/08/2026.

### 10.1 Différence clé avec RapidAPI

| | RapidAPI | VidsSave |
|---|---|---|
| Nombre d'appels | 1 | 3 (enchaînés) |
| Lien final hébergé sur | CDN Google (`googlevideo.com`) | Serveur de VidsSave (`down-*.vidssave.com`) |
| Fichiers vidéo HD | Flux DASH **sans son** (voir section 7bis) | Fichiers complets (vidéo+son), taille exacte connue à l'avance |
| Fiabilité observée | Incohérente | Fiable sur nos tests |

### 10.2 Flux en 3 étapes

**Étape 1 — lister les formats disponibles**
```
POST https://api.vidssave.com/api/contentsite_api/media/parse
Content-Type: application/x-www-form-urlencoded

auth=20250901majwlqo&domain=api-ak.vidssave.com&origin=source&link=<url YouTube encodée>
```
Réponse :
```json
{
  "data": {
    "title": "...", "thumbnail": "https://i.ytimg.com/...", "duration": 2391,
    "resources": [
      { "resource_id": "...", "quality": "360P", "format": "MP4", "type": "video",
        "size": 50984910, "resource_content": "<jeton opaque, plusieurs milliers de caractères>",
        "download_mode": "", "download_url": "" }
    ]
  }
}
```
`size` est déjà connu ici (pratique pour filtrer par rapport à la limite Telegram AVANT de lancer la suite). `download_url` est toujours vide à ce stade — il faut les 2 étapes suivantes.

**Étape 2 — démarrer la préparation du fichier**
```
POST https://api.vidssave.com/api/contentsite_api/media/download
Content-Type: application/x-www-form-urlencoded

auth=20250901majwlqo&domain=api-ak.vidssave.com&request=<resource_content de l'étape 1>&no_encrypt=1
```
Réponse : `{"data":{"task_id":"..."},"status":1}`

**Étape 3 — attendre le résultat (Server-Sent Events)**
```
GET https://api.vidssave.com/sse/contentsite_api/media/download_query
    ?auth=20250901majwlqo&domain=api-ak.vidssave.com&task_id=<de l'étape 2>
    &download_domain=vidssave.com&origin=content_site
Accept: text/event-stream
```
Le serveur pousse un ou plusieurs événements pendant que le fichier est préparé, puis un événement final :
```
event: success
data: {"status":"success","progress":100,"filesize":66252209,"download_link":"https://api.vidssave.com/api/contentsite_api/media/download_redirect?request=..."}
```
🧠 **Concept — Server-Sent Events (SSE)**
Contrairement à un appel HTTP classique (une requête → une réponse), SSE garde la connexion ouverte et le serveur envoie plusieurs messages au fil du temps (ici : progression de la préparation du fichier). Le client doit lire le flux ligne par ligne jusqu'à recevoir un statut final (`success` ou `error`), pas juste attendre "une" réponse.

`download_link` pointe encore vers un endpoint de VidsSave (`download_redirect`), qui répond par une **redirection HTTP 302** vers le fichier final :
```
Location: https://down-de.vidssave.com/tmp/recycle/.../<fichier>.mp4?expire_ts=...&sign=...
```
Ce dernier lien est directement téléchargeable (`Content-Type: video/mp4`, `Accept-Ranges: bytes`) — `httpx` avec `follow_redirects=True` gère cette redirection automatiquement.

### 10.3 Résultats observés (vidéo de test, ~40 min)

| Qualité | Taille | Sous la limite Telegram (50 Mo) ? |
|---|---|---|
| 144P | 12,4 Mo | ✅ |
| 240P | 26,0 Mo | ✅ |
| 360P | 51,0 Mo | ✅ (de justesse) |
| 480P | 89,0 Mo | ❌ |
| 720P | 155,7 Mo | ❌ |
| 1080P | 516,5 Mo | ❌ |
| 1440P / 2160P | 1,3 Go / 4,0 Go | ❌ |
| Audio 48/128/256 kbps (MP3) | 14,6 / 38,7 / 44,3 Mo | ✅ (les 3) |

→ Le provider filtre lui-même les résultats à ceux `size <= 50 Mo` avant de les proposer au bot (inutile de lancer les étapes 2-3, coûteuses en latence, pour un format qu'on sait déjà trop gros).

### 10.4 Implication d'architecture : résolution paresseuse (lazy)

Contrairement à RapidAPI qui renvoie une URL directement exploitable pour chaque format en un seul appel, VidsSave ne donne qu'un jeton (`resource_content`) par format à l'étape 1 — obtenir la vraie URL de téléchargement coûte 2 appels réseau de plus **par format**, dont une attente SSE de durée variable. Lancer ça pour TOUS les formats juste pour afficher un menu de choix serait lent et gaspillerait des ressources pour des options que l'utilisateur ne choisira pas.

**Solution retenue** : le provider renvoie des `MediaItem` "paresseux" (avec un jeton au lieu d'une URL prête), et la résolution réelle (étapes 2-3) n'est déclenchée qu'au moment où l'utilisateur clique sur le format voulu — pas avant. Voir `bot/utils/media_sender.py::send_media_item` et `MediaProvider.resolve()`.
