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
   d'inscription (verrou d'accès à un seul compte), donc si le sign-up
   public reste activé côté Supabase, n'importe qui trouvant l'URL de l'app
   pourrait se créer un compte tout seul.
4. Va dans **Authentication → Users → Add user** et crée ton compte
   (email + mot de passe) à la main.
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
│   ├── services/         # eventBus, clipboardApi, filesApi, storage (localStorage)
│   ├── store/             # Zustand : thème, toasts
│   └── registry/          # Liste des modules (contrat PRD §12.2)
├── modules/               # Un dossier = un module indépendant
│   ├── clipboard/
│   ├── password/
│   ├── history/
│   └── files/             # "Secure Drop" — upload vers Supabase Storage
├── shared/                 # UI réutilisable (Button, Card, Input, Badge...)
└── lib/supabase/            # Clients Supabase (browser / server / proxy)

src/proxy.ts              # Protection des routes (redirige vers /login si non connecté)
supabase/schema.sql        # Schéma DB + Storage + RLS + triggers
```

## Sécurité — état des lieux

Vérifié via les *Security Advisors* Supabase (MCP `get_advisors`) :

| Point | État |
| :--- | :--- |
| RLS activé sur `clipboard_items`, `shared_files`, `storage.objects` | ✅ |
| Fonctions `SECURITY DEFINER` non exposées publiquement (`enforce_clipboard_history_limit`, `redact_expired_passwords`) | ✅ |
| Bucket `shared-files` privé (pas d'URL publique, téléchargement via lien signé 60s) | ✅ |
| Un seul compte existe (`auth.users`), pas d'inscription publique | ✅ vérifié le 14.08 |
| Leaked Password Protection | ⚠️ à activer manuellement (dashboard, nécessite plan Pro+) |
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
