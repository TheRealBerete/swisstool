# SwissTool – Product Requirements Document (PRD)

---

## 📋 1. Présentation du produit

| Champ | Détail |
| :--- | :--- |
| **Nom** | SwissTool |
| **Tagline** | *Le couteau suisse numérique.* |
| **Vision** | Une toolbox personnelle, modulaire et élégante qui résout les petits problèmes du quotidien numérique. |
| **Positionnement** | Application web personnelle (pas de store, pas de téléchargement). Hébergée sur Vercel, backend Supabase. |
| **Utilisateur cible** | Un développeur / power user qui veut centraliser ses outils quotidiens dans une interface propre et rapide. Usage 100% personnel (dans un premier temps). |
| **Concurrents** | Aucun direct (car c'est personnel), mais des références : Raycast, Notion Quick Notes, Telegram "saved messages", outils en ligne (convertir, générer, etc.). |

---

## 🎯 2. Objectifs du produit

### Objectifs principaux (MUST HAVE)
1. **Offrir un presse-papier partagé en temps réel** entre les appareils de l'utilisateur.
2. **Proposer un générateur de mots de passe** robuste, intégrable au presse-papier.
3. **Assurer une modularité totale** : chaque outil est un module indépendant, ajoutable/supprimable sans impact sur les autres.
4. **Garantir une expérience utilisateur minimaliste et pro** : design épuré, navigation fluide, dark mode natif.
5. **Fonctionner sur tous les écrans** (mobile-first, desktop-friendly).

### Objectifs secondaires (NICE TO HAVE)
6. **Permettre le partage d'images/captures d'écran** via Supabase Storage.
7. **Offrir un historique centralisé** des partages, accessible depuis tous les appareils.
8. **Ajouter des outils complémentaires** (convertisseur, notes rapides, raccourcisseur d'URL).
9. **Permettre une authentification optionnelle** pour isoler les données.

---

## 🧩 3. Périmètre fonctionnel

### Modules V1 (core)
| Module | Description | Dépendance Supabase |
| :--- | :--- | :--- |
| **Presse-papier partagé** | Envoi de texte/liens/mots de passe avec Realtime push et expiration 1h. | Oui (table `clipboard_items`) |
| **Générateur de mots de passe** | Génération paramétrable (longueur, types de caractères). Intégration avec le presse-papier. | Non (100% local) |
| **Historique** | Liste des derniers partages avec date, possibilité de re-partager ou copier. | Oui (lecture de `clipboard_items`) |

### Modules V2 (futurs)
- **Notes rapides** (synchronisées)
- **Convertisseur** (unités, devises)
- **Raccourcisseur d'URL**
- **Capture d'écran / partage d'images**
- **Scanner QR** (depuis le téléphone)

---

## 🔧 4. Architecture technique

| Couche | Technologie | Rôle |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Rendu côté client (CSR) pour les modules interactifs |
| **Backend** | Supabase | Base de données PostgreSQL + Realtime + Storage |
| **Hébergement** | Vercel | Déploiement continu, gratuit |
| **État global** | Zustand ou Jotai | Gestion légère de l'état global (auth, thème, notifications) |
| **Services** | Services modulaires | Toast, Storage (local), Supabase client, Event Bus |
| **Modules** | Architecture plug-in | Chaque module est un dossier autonome avec son composant, sa logique, ses hooks |

### Structure modulaire
```
src/
├── core/               # Le cœur de l'application
│   ├── layout/         # Header, navigation, footer
│   ├── services/       # Toast, Storage, Supabase, EventBus
│   └── registry/       # Liste des modules disponibles
├── modules/            # Chaque module est un dossier
│   ├── clipboard/
│   │   ├── index.tsx   # Composant principal
│   │   ├── hooks.ts    # Logique métier
│   │   └── types.ts    # Types spécifiques
│   ├── password/
│   └── history/
└── shared/             # Composants UI réutilisables
    ├── Button.tsx
    ├── Card.tsx
    └── ...
```

---

## 🧠 5. Logique métier détaillée

### 5.1 Presse-papier partagé

| Fonctionnalité | Description |
| :--- | :--- |
| **Partage** | L'utilisateur écrit un texte dans un champ et clique sur "Partager". Le texte est envoyé à Supabase avec un timestamp et une expiration à +1h. |
| **Réception Realtime** | Tous les appareils connectés (via l'application ouverte) reçoivent le texte instantanément via WebSocket (Supabase Realtime). |
| **Expiration** | 1h après le partage, la donnée est automatiquement supprimée de la base (trigger PostgreSQL) ou marquée comme expirée (RLS). |
| **Historique** | Chaque partage est sauvegardé dans la base. L'historique est accessible depuis n'importe quel appareil. |
| **Copie** | Sur le récepteur, un bouton "Copier" permet de copier le texte dans le presse-papier du téléphone. |
| **Affichage** | Le texte partagé s'affiche dans une zone dédiée, avec un timer indiquant le temps restant avant expiration. |

### 5.2 Générateur de mots de passe

| Fonctionnalité | Description |
| :--- | :--- |
| **Paramètres** | Longueur (4-64), inclusion de majuscules, minuscules, chiffres, symboles. |
| **Génération** | Clique sur "Générer" → un mot de passe aléatoire est créé avec `crypto.getRandomValues()`. |
| **Copie** | Un bouton "Copier" copie le mot de passe dans le presse-papier de l'appareil. |
| **Partage** | Un bouton "Partager" envoie le mot de passe dans le module Presse-papier (via Event Bus), qui le diffuse automatiquement à tous les appareils. |
| **Historique (optionnel)** | Les mots de passe générés peuvent être sauvegardés localement (localStorage) pour référence. |

### 5.3 Historique

| Fonctionnalité | Description |
| :--- | :--- |
| **Affichage** | Liste des partages avec texte (tronqué), date/heure, et icônes d'action. |
| **Actions** | Copier le texte, re-partager le texte, supprimer l'entrée. |
| **Filtrage (futur)** | Recherche par texte, filtre par date. |
| **Nettoyage** | Bouton "Tout effacer" (avec confirmation). |

### 5.4 Gestion des expirations

| Aspect | Détail |
| :--- | :--- |
| **Durée** | 1 heure (3600 secondes) après création. |
| **Affichage** | Timer visible dans l'interface (format MM:SS). |
| **Nettoyage** | Trigger PostgreSQL qui supprime les entrées où `expires_at < now()`. |
| **RLS** | Politique de sécurité qui empêche l'accès aux entrées expirées (`expires_at > now()`). |
| **Comportement UI** | Lorsque le timer arrive à 0, le QR code disparaît ou est remplacé par un message "Expiré". |

---

## 👤 6. Gestion des utilisateurs

### Version V1 (sans authentification)
- **Modèle** : Utilisation anonyme. Tous les appareils qui ouvrent l'application voient les mêmes données.
- **Justification** : Usage personnel. Seul l'utilisateur a l'URL de l'application.
- **Risque** : Si un tiers découvre l'URL, il peut voir les partages.

### Version V2 (avec authentification) – optionnelle
- **Modèle** : Connexion avec Supabase Auth (Magic Link par email).
- **Bénéfice** : Isolation des données par utilisateur. Possibilité de partager avec d'autres comptes.
- **Migration** : Les données anonymes existantes peuvent être migrées vers le compte utilisateur.

---

## 🔐 7. Sécurité & Confidentialité

| Aspect | Détail |
| :--- | :--- |
| **Chiffrement** | Les données transitent en HTTPS (Vercel + Supabase). Les données au repos ne sont pas chiffrées (PostgreSQL). |
| **RLS (Row Level Security)** | Politiques Supabase qui limitent l'accès aux données. En V1 : pas de RLS (tout le monde voit tout). En V2 : RLS par `user_id`. |
| **Expiration automatique** | Nettoyage des données expirées (1h) pour limiter l'empreinte. |
| **Pas de stockage sensible** | Les mots de passe partagés expirent au bout d'1h. Aucun stockage permanent de données sensibles. |
| **Cookies** | Aucun cookie tiers. Uniquement le token JWT de Supabase (si auth activée). |

---

## 📱 8. Expérience utilisateur (UX)

### 8.1 Parcours principal

| Étape | Action | Feedback |
| :--- | :--- | :--- |
| 1 | L'utilisateur ouvre SwissTool sur son PC | Voir la grille des modules. |
| 2 | Il clique sur "Presse-papier" | Le module s'ouvre. |
| 3 | Il tape un texte et clique sur "Partager" | QR code généré + notification toast + timer qui démarre. |
| 4 | Il ouvre SwissTool sur son téléphone | Le texte apparaît automatiquement (Realtime). |
| 5 | Il clique sur "Copier" | Le texte est dans le presse-papier du téléphone. |
| 6 | Il retourne sur PC, le timer affiche le temps restant. | Le QR code reste visible jusqu'à expiration. |

### 8.2 Parcours secondaire

| Étape | Action | Feedback |
| :--- | :--- | :--- |
| 1 | L'utilisateur ouvre "Générateur de MDP" | Interface avec paramètres et bouton. |
| 2 | Il règle les options et clique sur "Générer" | Un mot de passe apparaît. |
| 3 | Il clique sur "Partager" | Le mot de passe est envoyé au presse-papier (via Event Bus) et diffusé à tous les appareils. |
| 4 | Il ouvre "Historique" | Il voit le mot de passe dans la liste des partages. |

### 8.3 États d'erreur

| Erreur | Message | Action |
| :--- | :--- | :--- |
| Champ vide | "⚠️ Écris un texte à partager" | Bouton "Partager" désactivé si champ vide. |
| Connexion Supabase perdue | "📡 Hors ligne. Les partages seront sauvegardés localement." | Stockage en localStorage en attendant le retour en ligne. |
| Partage expiré | "⏳ Ce partage a expiré." | QR code retiré. Possibilité de re-partager. |

---

## 📊 9. Indicateurs de performance (optionnels)

| Métrique | Pourquoi | Seuil |
| :--- | :--- | :--- |
| **Temps de chargement initial** | Perception de rapidité | < 1.5s (FCP) |
| **Temps de partage (bouton → Realtime)** | Efficacité du système | < 500ms |
| **Taux d'erreur Supabase** | Fiabilité du backend | < 1% |
| **Taille du bundle** | Rapidité de chargement | < 200kB (gzippé) |

---

## 🗓️ 10. Phases de développement (Roadmap)

### Phase 1 – MVP (2 semaines)
- Setup Next.js + Supabase
- Architecture modulaire (Core + Registry)
- Module Presse-papier (partage + Realtime + expiration + historique)
- Module Générateur de MDP
- Design system (composants UI, dark mode)
- Déploiement sur Vercel
- Tests manuels sur PC + téléphone

### Phase 2 – Améliorations (2 semaines)
- Module Historique (version finale)
- Notifications (toasts) et micro-interactions
- Gestion des erreurs et hors-ligne
- Optimisation mobile
- Refactoring et documentation

### Phase 3 – Modules additionnels (2-4 semaines)
- Module Notes rapides
- Module Convertisseur
- Module Raccourcisseur d'URL
- Module Capture d'écran (Supabase Storage)
- Scanner QR (depuis téléphone)

### Phase 4 – Authentification (optionnelle)
- Supabase Auth (Magic Link)
- RLS par utilisateur
- Migration des données anonymes
- Partage entre plusieurs comptes

---

## ✅ 11. Critères de validation

| Critère | Statut |
| :--- | :--- |
| L'utilisateur peut partager un texte et le voir apparaître immédiatement sur un autre appareil. | ✅ Doit passer |
| Le texte partagé disparaît automatiquement après 1h. | ✅ Doit passer |
| L'historique liste tous les partages effectués. | ✅ Doit passer |
| Le générateur produit des mots de passe fiables (au moins 4 types de caractères). | ✅ Doit passer |
| L'interface est utilisable à une main sur mobile. | ✅ Doit passer |
| L'application se charge en moins de 2 secondes (première visite). | ✅ Doit passer |
| Aucune donnée personnelle n'est stockée au-delà de 1h (sauf historique conservé). | ✅ Doit passer |

---

## 📎 12. Annexes

### 12.1 Schéma de base de données (V1)

```sql
CREATE TABLE clipboard_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'password', 'link'
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '1 hour')
);

-- Index pour les requêtes
CREATE INDEX idx_clipboard_expires_at ON clipboard_items(expires_at);

-- Trigger de nettoyage (appelé périodiquement)
CREATE OR REPLACE FUNCTION delete_expired_items() RETURNS void AS $$
BEGIN
  DELETE FROM clipboard_items WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

### 12.2 Définition d'un module (contrat)

```typescript
interface Module {
  id: string
  label: string
  icon: React.ReactNode
  component: React.ComponentType
  config: {
    requiresAuth?: boolean
    requiresSupabase?: boolean
  }
}
```

### 12.3 Événements de l'Event Bus

| Événement | Payload | Émetteurs | Récepteurs |
| :--- | :--- | :--- | :--- |
| `text:shared` | `{ content: string, type: string }` | Presse-papier | Historique, autres modules (optionnel) |
| `password:generated` | `{ password: string }` | Générateur MDP | Presse-papier (via bouton "Partager") |
| `note:created` | `{ note: string }` | Notes (futur) | Presse-papier (proposer de partager) |

---

## 🧠 13. Questions ouvertes (à trancher)

| Question | Propositions | Décision |
| :--- | :--- | :--- |
| **Historique conservé combien de temps ?** | Illimité, 30 jours, 50 entrées max | À trancher |
| **Les partages expirés sont-ils conservés dans l'historique ?** | Oui (marqués "expirés"), Non (supprimés) | À trancher |
| **QR code : est-ce qu'on l'affiche toujours ou seulement sur demande ?** | Toujours, Ou bouton "Afficher le QR" | À trancher |
| **Le partage est-il automatique ou faut-il cliquer sur "Partager" ?** | Clique obligatoire | À trancher |
| **Qui peut voir les partages en V1 ?** | Tout le monde (URL publique), ou limité à l'utilisateur | À trancher |

---

## 🎯 14. Conclusion

**SwissTool** est un projet ambitieux mais parfaitement réalisable. L'architecture modulaire permet une évolution sereine, et le choix de Supabase + Next.js offre une stack moderne, scalable et maintenable.

Le MVP (Presse-papier + Générateur MDP + Historique) répond déjà à 80% des besoins quotidiens de l'utilisateur. Le reste viendra enrichir la toolbox sans jamais la rendre complexe ou lourde.

**Objectif final** : Une application que tu utilises tous les jours, qui te simplifie la vie, et que tu es fier de montrer à tes pairs.

