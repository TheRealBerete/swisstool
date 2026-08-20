# Lotus Vids API — Documentation développeur

API de téléchargement de médias (YouTube et autres plateformes prises en charge).
Récupération des infos d'une vidéo (formats, thumbnail) et génération de liens de téléchargement.

## Base URL

```
https://api.lotusvids.online
```

Tous les endpoints renvoient du **JSON**. Les erreurs suivent le format `{"error": "<message>"}`.

---

## 1. Authentification

L'API utilise un **token JWT (Bearer)** généré par l'endpoint `get-token`.

### `POST /api/get-token`

Aucun paramètre ni authentification requis.

```bash
curl -X POST "https://api.lotusvids.online/api/get-token"
```

**Réponse `200` :**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODcyNTYxMjIsImV4cCI6MTc4NzI1NjMwMn0.…"
}
```

> ⚠️ **Le token expire en 180 secondes (3 min).** Il faut le régénérer à chaque expiration avant chaque appel (`info` ou `download`).

Le payload JWT ne contient que `iat` et `exp` :

```json
{ "iat": 1787256122, "exp": 1787256302 }
```

### En-tête d'autorisation

Tous les autres endpoints exigent :

```
Authorization: Bearer <token>
```

| Erreur | Code | Signification |
|---|---|---|
| `{"error":"Non autorise"}` | `401` | Header `Authorization` manquant |
| `{"error":"Token invalide ou expire"}` | `403` | Token invalide ou expiré |

---

## 2. Récupérer les infos d'une vidéo

### `GET /api/info`

Retourne le titre, la miniature, la durée et la liste des formats disponibles.

**Paramètres de requête :**

| Paramètre | Requis | Description |
|---|---|---|
| `url` | ✅ | Lien de la vidéo. Toutes les plateformes prises en charge sont détectées automatiquement. |
| `lc` | ❌ | Identifiant de commentaire YouTube (facultatif, transmis tel quel). |
| `si` | ❌ | Paramètre de signature YouTube (facultatif, transmis tel quel). |

**Exemple :**

```bash
curl "https://api.lotusvids.online/api/info?url=https://youtube.com/watch?v=eWQR20QavJE&lc=Ugxd_QGRHbIj7aMJJhZ4AaABAg&si=70ktkNfnJIBBkzLR" \
  -H "Authorization: Bearer <token>"
```

**Réponse `200` :**

```json
{
  "title": "2023 UNREALEASED THREESTYLE",
  "thumbnail": "https://i.ytimg.com/vi/eWQR20QavJE/maxresdefault.jpg",
  "duration": 90,
  "platform": "youtube",
  "formats": [
    {
      "format_id": "140",
      "ext": "m4a",
      "resolution": "audio",
      "height": 0,
      "fps": null,
      "vcodec": "none",
      "acodec": "mp4a.40.2",
      "filesize": 1452429
    },
    {
      "format_id": "313",
      "ext": "webm",
      "resolution": "2160p",
      "height": 2160,
      "fps": 60,
      "vcodec": "vp9",
      "acodec": "none",
      "filesize": 50384721
    }
  ]
}
```

### Champs de `formats`

| Champ | Type | Description |
|---|---|---|
| `format_id` | `string` | Identifiant du format (à passer à `download`). |
| `ext` | `string` | Extension (`mp4`, `webm`, `m4a`, …). |
| `resolution` | `string` | `"audio"` ou résolution (`"144p"`, `"2160p"`, …). |
| `height` | `int` | Hauteur en pixels (`0` pour l'audio). |
| `fps` | `int\|null` | Images par seconde (`null` pour l'audio). |
| `vcodec` | `string` | Codec vidéo (`"none"` si audio uniquement). |
| `acodec` | `string` | Codec audio (`"none"` si vidéo uniquement). |
| `filesize` | `int` | Taille en octets. |

> 💡 Un `format_id` avec `vcodec` **et** `acodec` non-`none` contient à la fois vidéo et audio (ex. `format_id: "18"`).
> Sinon, la vidéo et l'audio sont séparés (formats progressifs vs adaptatifs).

### Erreurs `info`

| Erreur | Code | Cas |
|---|---|---|
| `{"error":"URL invalide"}` | `400` | Le paramètre `url` est manquant ou malformé. |
| `{"error":"Impossible de lire ce lien"}` | `502` | La vidéo n'a pas pu être lue (lien supprimé, privé, plateforme non supportée). |

---

## 3. Télécharger un média

### `POST /api/download`

Génère un lien de téléchargement direct (URL signée Cloudflare R2).

**En-têtes :**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Corps JSON :**

```json
{
  "url": "https://youtube.com/watch?v=eWQR20QavJE&lc=Ugxd_QGRHbIj7aMJJhZ4AaABAg&si=70ktkNfnJIBBkzLR",
  "formatId": "313"
}
```

| Champ | Requis | Description |
|---|---|---|
| `url` | ✅ | Lien de la vidéo (même valeur que pour `info`). |
| `formatId` | ✅ | `format_id` choisi dans la réponse de `info`. |

**Exemple :**

```bash
curl -X POST "https://api.lotusvids.online/api/download" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=eWQR20QavJE&lc=Ugxd_QGRHbIj7aMJJhZ4AaABAg&si=70ktkNfnJIBBkzLR","formatId":"313"}'
```

**Réponse `200` :**

```json
{
  "url": "https://pub-b9be694153824cdd849621117e68ec59.r2.dev/lotus-youtube-1787256146187.mp4",
  "filename": "lotus-youtube-1787256146187.mp4"
}
```

| Champ | Description |
|---|---|
| `url` | Lien de téléchargement direct (signé, temporaire). |
| `filename` | Nom de fichier suggéré. |

---

## 4. Workflow complet

```bash
# 1. Générer un token (valable 3 min)
TOKEN=$(curl -s -X POST "https://api.lotusvids.online/api/get-token" | jq -r '.token')

# 2. Récupérer les infos et choisir un format
curl -s "https://api.lotusvids.online/api/info?url=https://youtube.com/watch?v=eWQR20QavJE" \
  -H "Authorization: Bearer $TOKEN" | jq '.formats[] | {format_id, resolution, ext, filesize}'

# 3. Lancer le téléchargement (prendre le format_id souhaité)
curl -s -X POST "https://api.lotusvids.online/api/download" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=eWQR20QavJE","formatId":"313"}' | jq -r '.url'
```

---

## 5. Récapitulatif des endpoints

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/get-token` | ❌ | Génère un token JWT (expire en 180 s). |
| `GET` | `/api/info?url=…` | ✅ Bearer | Infos vidéo : titre, thumbnail, durée, formats. |
| `POST` | `/api/download` | ✅ Bearer | Retourne un lien de téléchargement direct. |

## 6. Codes d'erreur

| Code HTTP | Message | Cause |
|---|---|---|
| `400` | `URL invalide` | Paramètre `url` absent ou invalide. |
| `401` | `Non autorise` | Header `Authorization` manquant. |
| `403` | `Token invalide ou expire` | Token JWT invalide ou expiré (régénérer via `get-token`). |
| `502` | `Impossible de lire ce lien` | Échec de lecture du lien (plateforme/vidéo indisponible). |
