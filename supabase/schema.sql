-- SwissTool — schéma V1 (presse-papier partagé)
-- À exécuter dans Supabase Studio > SQL Editor sur un projet neuf.

create extension if not exists pgcrypto;

create table if not exists public.clipboard_items (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  type text not null default 'text' check (type in ('text', 'password', 'link')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists idx_clipboard_expires_at on public.clipboard_items (expires_at);
create index if not exists idx_clipboard_created_at on public.clipboard_items (created_at desc);

-- Réplique la ligne complète (pas juste l'id) sur UPDATE/DELETE, pour que
-- Realtime puisse notifier les autres modules (ex: Historique) de ce qui
-- a été supprimé, pas juste "quelque chose a changé".
alter table public.clipboard_items replica identity full;

-- Realtime : sans cette ligne, aucun événement WebSocket n'est envoyé
-- même si RLS autorise la lecture. C'est ce qui fait fonctionner le
-- "push instantané" entre appareils du PRD §5.1.
alter publication supabase_realtime add table public.clipboard_items;

alter table public.clipboard_items enable row level security;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — V1 "verrou d'accès simple" (décision prise avec l'utilisateur) :
-- un seul compte existe, donc pas de colonne user_id ni de filtrage par
-- propriétaire. Toute personne authentifiée (= qui a réussi le login) voit
-- et modifie tout. Les visiteurs anonymes n'ont AUCUN accès — la sécurité
-- repose sur "il faut un compte", pas sur "l'URL est secrète".
--
-- Passage futur au multi-comptes : ajouter une colonne
-- `user_id uuid references auth.users default auth.uid()`, puis remplacer
-- `using (true)` par `using (auth.uid() = user_id)` dans chaque policy.
-- ─────────────────────────────────────────────────────────────────────────
create policy "authenticated can read clipboard_items"
  on public.clipboard_items for select
  to authenticated
  using (true);

create policy "authenticated can insert clipboard_items"
  on public.clipboard_items for insert
  to authenticated
  with check (true);

create policy "authenticated can update clipboard_items"
  on public.clipboard_items for update
  to authenticated
  using (true);

create policy "authenticated can delete clipboard_items"
  on public.clipboard_items for delete
  to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Historique borné à 50 entrées (décision utilisateur, PRD §13).
-- Trigger déclenché après chaque insertion : supprime tout ce qui dépasse
-- les 50 lignes les plus récentes. Les entrées expirées restent dans ces
-- 50 lignes avec leur contenu intact — l'expiration n'est qu'un badge
-- calculé côté client à partir de `expires_at` (voir CountdownTimer.tsx),
-- pas une suppression.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.enforce_clipboard_history_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.clipboard_items
  where id in (
    select id from public.clipboard_items
    order by created_at desc
    offset 50
  );
  return null; -- trigger AFTER, statement-level : la valeur de retour est ignorée
end;
$$;

drop trigger if exists trg_enforce_clipboard_history_limit on public.clipboard_items;
create trigger trg_enforce_clipboard_history_limit
  after insert on public.clipboard_items
  for each statement
  execute function public.enforce_clipboard_history_limit();

-- ─────────────────────────────────────────────────────────────────────────
-- Purge de sécurité spécifique aux mots de passe (PRD §7 : "aucun stockage
-- permanent de données sensibles"). Contrairement au texte/lien qui peut
-- rester lisible dans l'historique après expiration, le CONTENU d'un mot
-- de passe expiré est remplacé par un marqueur — la ligne (type, date)
-- reste visible dans l'historique, mais le secret lui-même disparaît.
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
-- Module Fichiers ("Secure Drop") — même philosophie que clipboard_items :
-- verrou "un seul compte", pas de colonne user_id, expiration à 1h
-- affichée côté client (voir modules/files/index.tsx).
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
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour')
);

create index if not exists idx_shared_files_created_at on public.shared_files (created_at desc);

alter table public.shared_files enable row level security;
alter table public.shared_files replica identity full;
alter publication supabase_realtime add table public.shared_files;

create policy "authenticated can read shared_files"
  on public.shared_files for select
  to authenticated
  using (true);

create policy "authenticated can insert shared_files"
  on public.shared_files for insert
  to authenticated
  with check (true);

create policy "authenticated can delete shared_files"
  on public.shared_files for delete
  to authenticated
  using (true);

-- Bucket privé (pas d'accès public direct — uniquement via session
-- authentifiée, ou URL signée à courte durée de vie générée à la demande
-- pour le téléchargement). Limite 20 Mo/fichier.
insert into storage.buckets (id, name, public, file_size_limit)
values ('shared-files', 'shared-files', false, 20971520)
on conflict (id) do nothing;

create policy "authenticated can read shared-files objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shared-files');

create policy "authenticated can upload shared-files objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shared-files');

create policy "authenticated can delete shared-files objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shared-files');
