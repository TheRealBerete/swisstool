# SwissTool

Le couteau suisse numérique — toolbox personnelle et modulaire (Next.js + Supabase).
Voir [PRD.MD](./PRD.MD) pour le détail du produit.

## Setup

### 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New Project.
2. Une fois créé, ouvre **SQL Editor** et colle le contenu de
   [`supabase/schema.sql`](./supabase/schema.sql), puis exécute-le. Ça crée
   les tables `clipboard_items` / `shared_files`, le bucket Storage
   `shared-files`, active Realtime, et pose les politiques RLS.
3. Va dans **Authentication → Providers → Email** et **désactive "Allow new
   users to sign up"**. C'est important : SwissTool n'a pas de page
   d'inscription (comptes créés uniquement par toi, voir §Multi-tenant plus
   bas), donc si le sign-up public reste activé côté Supabase, n'importe
   qui trouvant l'URL de l'app pourrait se créer un compte tout seul.
4. Va dans **Authentication → Users → Add user** et crée ton compte
   (email + mot de passe) à la main. Répète cette étape pour chaque
   personne à qui tu veux donner un accès — voir §Multi-tenant.
5. Va dans **Authentication → Policies** (ou Providers → Email → Password)
   et active **Leaked Password Protection** si ton plan Supabase le permet
   (Pro et plus — vérifie contre HaveIBeenPwned.org à la création du
   compte). Pas accessible via SQL/MCP, uniquement le dashboard ou l'API
   de management.

### 2. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` avec
les valeurs de **Project Settings → API** dans le dashboard Supabase.
Renseigne aussi `RAPIDAPI_KEY` (voir §Module Téléchargeur) si tu comptes
utiliser cet outil.

### 3. Lancer en dev

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) — tu seras redirigé
vers `/login`.

## Architecture

```
src/
├── app/                 # Routes Next.js (App Router)
│   ├── login/            # Page de connexion (email + mot de passe)
│   └── (app)/             # Routes protégées (groupe de routes, pas d'URL ajoutée)
│       ├── clipboard/
│       ├── password/
│       ├── history/
│       ├── files/
│       └── settings/
├── core/
│   ├── layout/           # Sidebar, TopBar, BottomNav, AppShell
│   ├── services/         # eventBus, clipboardApi, filesApi, downloaderApi, storage (localStorage)
│   ├── store/             # Zustand : thème, toasts
│   └── registry/          # Liste des modules (contrat PRD §12.2)
├── modules/               # Un dossier = un module indépendant
│   ├── clipboard/
│   ├── password/
│   ├── history/
│   ├── files/             # "Secure Drop" — upload vers Supabase Storage
│   └── downloader/         # Téléchargeur de médias (RapidAPI + VidsSave)
├── shared/                 # UI réutilisable (Button, Card, Input, Badge...)
└── lib/
    ├── supabase/            # Clients Supabase (browser / server / proxy)
    └── media-downloader/     # Clients RapidAPI/VidsSave + garde-fou SSRF

src/proxy.ts              # Protection des routes (redirige vers /login si non connecté)
supabase/schema.sql        # Schéma DB + Storage + RLS + triggers
```

## Multi-tenant

Depuis le 2026-08-20, plusieurs comptes peuvent coexister, chacun avec son
propre espace **totalement isolé** (Presse-papier, Fichiers, Historique) —
un compte ne voit ni ne modifie jamais les données d'un autre. Isolation
posée en base (RLS Postgres scopée sur `user_id`/`owner_id`), pas dans le
code applicatif : voir `supabase/schema.sql`.

**Ajouter un nouveau compte** (invite-only, pas de formulaire public) :
**Authentication → Users → Add user** dans le dashboard Supabase. Le
nouveau compte démarre avec un espace vide — rien à migrer, rien à
configurer côté app.

## Module Téléchargeur

Récupère un lien de téléchargement direct depuis Instagram, TikTok,
Facebook, X/Twitter et YouTube. Deux providers externes, routés
automatiquement selon le domaine de l'URL collée (voir
`src/lib/media-downloader/`) :

- **RapidAPI `social-download-all-in-one`** — Instagram/TikTok/Facebook/X.
  Un seul appel, URL de téléchargement immédiatement disponible. Nécessite
  `RAPIDAPI_KEY` (compte sur rapidapi.com).
- **VidsSave** (non-officiel) — YouTube uniquement, plus fiable que
  RapidAPI sur cette plateforme spécifique. Flux en 3 appels dont une
  attente SSE (résolution déclenchée seulement au moment où l'utilisateur
  choisit un format, jamais pour tous les formats d'un coup).

Les deux providers renvoient des fichiers déjà complets (vidéo + son
intégré) — pas de montage côté client nécessaire.

**Enregistrement direct dans la galerie (iPhone/Android)** : le bouton
"Enregistrer dans Photos" utilise `navigator.share({ files })` (Web Share
API) plutôt qu'un geste (appui long), plus fiable en pratique. Comme les
CDN médias externes n'envoient pas d'en-têtes CORS, ce bouton passe par un
proxy serveur (`/api/downloader/stream`) qui relaie les octets — ce proxy
valide que la cible ne résout pas vers une IP privée/interne avant de la
fetcher (défense SSRF, voir `src/lib/media-downloader/ssrf.ts`).

## Sécurité — état des lieux

Vérifié via les *Security Advisors* Supabase (MCP `get_advisors`) :

| Point | État |
| :--- | :--- |
| RLS activé sur `clipboard_items`, `shared_files`, `storage.objects` | ✅ |
| Isolation multi-tenant (`user_id`/`owner_id`, policies scopées `auth.uid()`) | ✅ vérifiée le 20.08 |
| Fonctions `SECURITY DEFINER` non exposées publiquement (`enforce_clipboard_history_limit`, `redact_expired_passwords`) | ✅ |
| Bucket `shared-files` privé (pas d'URL publique, téléchargement via lien signé 5 min) | ✅ |
| `replica identity` par défaut (pas `full`) sur `clipboard_items`/`shared_files` — évite qu'un DELETE fasse fuiter la ligne complète via Realtime, qui n'applique pas RLS aux DELETE | ✅ corrigé le 20.08 |
| Inscription publique désactivée, comptes créés à la main (dashboard) | ✅ |
| Leaked Password Protection | ⚠️ à activer manuellement (dashboard, nécessite plan Pro+) |
| Proxy `/api/downloader/stream` (module Téléchargeur) protégé contre le SSRF par résolution DNS + blocage des IP privées/internes, pas d'allowlist de domaine | ✅ |
| `public.rls_auto_enable()` visible par `anon`/`authenticated` | ℹ️ fonction interne à la plateforme Supabase, pas la nôtre — rien à corriger |

### ⚠️ Limite connue : purge automatique des fichiers expirés

Contrairement à `clipboard_items` (dont le *contenu* des mots de passe
expirés est redirigé par `redact_expired_passwords()`), il n'existe **pas
encore** de nettoyage automatique des fichiers expirés dans
`shared_files` / le bucket Storage. Un fichier expiré s'affiche "Expiré"
dans l'UI mais reste techniquement téléchargeable et consomme du quota
jusqu'à suppression manuelle. À industrialiser plus tard via une Edge
Function + pg_cron si l'usage le justifie.

## Déploiement

Déploiement continu sur [Vercel](https://vercel.com) — connecte ce repo,
renseigne les mêmes variables d'environnement que `.env.local`.
