-- SwissTool — schéma V2 (multi-tenant)
-- À exécuter dans Supabase Studio > SQL Editor sur un projet neuf.
--
-- Historique : passé de "verrou d'accès simple" (V1, un seul compte, RLS
-- `using (true)`) à un vrai multi-tenant le 2026-08-20 (voir migration
-- `multi_tenant_isolation`). Ce fichier reflète l'état CIBLE pour un
-- déploiement neuf — écrit directement avec `user_id`, contrairement à la
-- migration réelle qui a dû l'ajouter via ALTER TABLE + backfill sur une
-- base déjà peuplée.

create extension if not exists pgcrypto;

create table if not exists public.clipboard_items (
  id uuid primary key default gen_random_uuid(),
  -- Chaque ligne appartient à un seul compte. `default auth.uid()` : à
  -- l'insertion depuis le client, pas besoin de le préciser — Postgres
  -- récupère l'identité du compte connecté depuis le JWT de la requête.
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  content text not null,
  type text not null default 'text' check (type in ('text', 'password', 'link')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists idx_clipboard_expires_at on public.clipboard_items (expires_at);
create index if not exists idx_clipboard_created_at on public.clipboard_items (created_at desc);
create index if not exists idx_clipboard_items_user_id on public.clipboard_items (user_id);

-- ⚠️ PAS `replica identity full` ici, volontairement. Realtime n'applique
-- PAS RLS aux événements DELETE (contrairement à INSERT/UPDATE, vérifiés
-- par abonné) — avec `full`, le payload `old` d'un DELETE contiendrait la
-- ligne ENTIÈRE (mot de passe en clair inclus) et partirait vers TOUS les
-- clients connectés, pas seulement le propriétaire. L'identité par défaut
-- (clé primaire seule dans `old`) suffit : aucun code de l'app ne lit
-- autre chose que `.id` sur un DELETE (voir hooks.ts des 3 modules).

-- Realtime : sans cette ligne, aucun événement WebSocket n'est envoyé
-- même si RLS autorise la lecture. C'est ce qui fait fonctionner le
-- "push instantané" entre appareils du PRD §5.1.
alter publication supabase_realtime add table public.clipboard_items;

alter table public.clipboard_items enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS multi-tenant : chaque compte ne voit/modifie que ses propres lignes.
-- `(select auth.uid())` plutôt que `auth.uid()` nu : enveloppé dans un
-- sous-select, Postgres l'évalue une seule fois par requête (initplan) au
-- lieu d'une fois par ligne — recommandation officielle Supabase pour les
-- policies RLS à fort volume.
-- ─────────────────────────────────────────────────────────────────────────
create policy "users can read own clipboard_items"
  on public.clipboard_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can insert own clipboard_items"
  on public.clipboard_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can update own clipboard_items"
  on public.clipboard_items for update
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can delete own clipboard_items"
  on public.clipboard_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Historique borné à 50 entrées PAR COMPTE (décision utilisateur, PRD §13).
-- Trigger ROW-level (pas statement) : il a besoin de NEW.user_id pour ne
-- purger que l'historique du compte qui vient d'insérer, sinon un compte
-- très actif finirait par éjecter l'historique de tous les autres.
-- Les entrées expirées restent dans ces 50 lignes avec leur contenu
-- intact — l'expiration n'est qu'un badge calculé côté client à partir de
-- `expires_at` (voir CountdownTimer.tsx), pas une suppression.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.enforce_clipboard_history_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.clipboard_items
  where user_id = new.user_id
    and id in (
      select id from public.clipboard_items
      where user_id = new.user_id
      order by created_at desc
      offset 50
    );
  return null;
end;
$$;

drop trigger if exists trg_enforce_clipboard_history_limit on public.clipboard_items;
create trigger trg_enforce_clipboard_history_limit
  after insert on public.clipboard_items
  for each row
  execute function public.enforce_clipboard_history_limit();

-- ─────────────────────────────────────────────────────────────────────────
-- Purge de sécurité spécifique aux mots de passe (PRD §7 : "aucun stockage
-- permanent de données sensibles"). Contrairement au texte/lien qui peut
-- rester lisible dans l'historique après expiration, le CONTENU d'un mot
-- de passe expiré est remplacé par un marqueur — la ligne (type, date)
-- reste visible dans l'historique, mais le secret lui-même disparaît.
-- Global (pas de filtre user_id) : elle ne fait que rédiger du contenu
-- déjà expiré, aucune fuite entre comptes possible.
--
-- Cette fonction ne tourne pas seule : programme-la avec pg_cron
-- (Database > Extensions > pg_cron dans Supabase) ou un Vercel Cron qui
-- appelle une route API dédiée, ex. toutes les 15 minutes :
--   select cron.schedule('redact-expired-passwords', '*/15 * * * *',
--     $$ select public.redact_expired_passwords(); $$);
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.redact_expired_passwords()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clipboard_items
  set content = '[expiré]'
  where type = 'password'
    and expires_at < now()
    and content <> '[expiré]';
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 🔒 Verrouillage post-déploiement (trouvé par les Security Advisors
-- Supabase après la première migration) : PostgREST expose AUTOMATIQUEMENT
-- toute fonction du schéma `public` comme endpoint RPC public
-- (/rest/v1/rpc/<nom>). Comme ces deux fonctions sont `SECURITY DEFINER`
-- (elles tournent avec des privilèges élevés, RLS contournée), n'importe
-- qui muni de la clé anon — publique, embarquée dans le bundle client —
-- pouvait les appeler directement depuis l'extérieur.
--
-- Aucune des deux n'a besoin d'être appelable via l'API : la première est
-- déclenchée par un trigger, la seconde par un cron. Ni les triggers ni
-- pg_cron ne passent par l'API REST, donc retirer ce privilège ne casse
-- rien.
-- ─────────────────────────────────────────────────────────────────────────
revoke execute on function public.enforce_clipboard_history_limit() from public, anon, authenticated;
revoke execute on function public.redact_expired_passwords() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Module Fichiers ("Secure Drop") — même philosophie multi-tenant que
-- clipboard_items : user_id + RLS scopée. Expiration à 1h affichée côté
-- client (voir modules/files/index.tsx).
--
-- ⚠️ Contrairement au presse-papier, il n'y a PAS de trigger de purge
-- automatique par nombre d'entrées ici : supprimer une ligne de
-- métadonnées sans supprimer le blob Storage correspondant laisserait un
-- fichier orphelin, invisible dans l'UI, qui continue à consommer du
-- quota. Toute suppression (bouton, "Tout effacer") passe donc par
-- core/services/filesApi.ts qui supprime TOUJOURS le blob puis la ligne,
-- jamais l'un sans l'autre.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.shared_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists idx_shared_files_created_at on public.shared_files (created_at desc);
create index if not exists idx_shared_files_user_id on public.shared_files (user_id);

alter table public.shared_files enable row level security;
-- Pas `replica identity full` — même raisonnement que clipboard_items.
alter publication supabase_realtime add table public.shared_files;

create policy "users can read own shared_files"
  on public.shared_files for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can insert own shared_files"
  on public.shared_files for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "users can delete own shared_files"
  on public.shared_files for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Bucket privé (pas d'accès public direct — uniquement via session
-- authentifiée, ou URL signée à courte durée de vie générée à la demande
-- pour le téléchargement). Limite 20 Mo/fichier.
insert into storage.buckets (id, name, public, file_size_limit)
values ('shared-files', 'shared-files', false, 20971520)
on conflict (id) do nothing;

-- Isolation par propriétaire via la colonne `owner_id` que Supabase
-- Storage remplit LUI-MÊME (auth.uid() de l'uploadeur) à chaque upload —
-- pas besoin de préfixer les chemins par un dossier `{user_id}/...` ni de
-- toucher au code d'upload. L'INSERT reste ouvert à tout compte
-- authentifié (owner_id n'est pas garanti disponible à l'évaluation du
-- WITH CHECK d'un INSERT) ; c'est en lecture/suppression que la propriété
-- est vérifiée, ce qui suffit à empêcher un compte de lire/supprimer le
-- fichier d'un autre.
create policy "authenticated can upload shared-files objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shared-files');

create policy "users can read own shared-files objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shared-files' and owner_id = (select auth.uid())::text);

create policy "users can delete own shared-files objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shared-files' and owner_id = (select auth.uid())::text);
