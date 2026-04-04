# CLAUDE.md — Plateforme XXL Agency

> Ce fichier est lu par Claude Code à chaque session. Il contient tout le contexte métier et technique nécessaire pour travailler sur ce projet.

---

## 1. Contexte métier

**XXL Communication** est une agence de marketing digital basée à Évry-Courcouronnes, spécialisée dans la commercialisation de programmes immobiliers neufs via Google Ads et Meta Ads.

**Contacts clés :**
- Marine Martin — Directrice
- Emmanuel Utard (Mehdi) — Expert Growth Marketing / développeur de cette plateforme

**Clients promoteurs actuels :**
- Foncière Siba (Résidence Galliéni — Nanterre)
- Corem Promotion (Promenade Nodier — Pantin, inclut des lots BRS)
- Bati-Paris (Bricklane — Bagneux, inclut des lots BRS, CRM Unlatch)
- AIC (Les Terrasses Mummoli — Villemomble, en attente)

**Vocabulaire métier à respecter dans TOUT le code et les prompts IA :**
- "contacts reçus" ou "formulaires" → jamais "taux de conversion" ni "leads" seul
- "programme immobilier" ou "programme XXL" → entité centrale de la plateforme
- "plan média" → document généré par l'IA à partir du brief
- "brief" → formulaire de démarrage rempli par l'agence
- CPL = Coût Par Lead (contact reçu)
- BRS = Bail Réel Solidaire (dispositif d'accession aidée)
- MQL = contact qualifié par le commercial

---

## 2. Objectif de la plateforme

Centraliser la gestion des campagnes publicitaires immobilier neuf pour l'agence XXL, ses experts et ses clients promoteurs.

**Features cibles (par ordre de priorité) :**

### Sprint 1 — Fondations ✅ (en cours)
- [ ] Schéma Supabase complet (voir `/supabase/migrations/`)
- [ ] Auth multi-rôles : `expert` / `agency` / `client`
- [ ] Formulaire de brief programme (création d'un Programme XXL avec ID unique)
- [ ] Génération IA du plan média + checklist de tâches via Anthropic API

### Sprint 2 — Dashboard performances
- [ ] Connexion Google Ads API (OAuth déjà validé — voir section 5)
- [ ] Connexion Meta Marketing API
- [ ] Dashboard par programme : budget investi, contacts reçus, CPL
- [ ] Vue détail campagnes (expert + agence uniquement)
- [ ] Vue client : dashboard simplifié agrégé

### Sprint 3 — Génération contenu publicitaire IA
- [ ] Google Ads : 15 titres RSA + 4 descriptions + mots-clés + exclusions → export CSV
- [ ] Meta Ads : accroches, questions formulaire qualifiant, recommandations ciblage
- [ ] Brief créa visuel généré automatiquement

### Sprint 4 — Google Slides automatisés
- [ ] Slide Kick-off (à partir du brief validé)
- [ ] Slide Bilan (à partir des données de performance)
- [ ] Template XXL verrouillé (charte bleue/jaune)

---

## 3. Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14+ (App Router, Server Actions) |
| Styling | Tailwind CSS + shadcn/ui |
| Base de données | Supabase (PostgreSQL) |
| Auth utilisateurs | Supabase Auth |
| IA | Anthropic API — modèle : `claude-sonnet-4-20250514` |
| API Google Ads | Google Ads API v19+ (OAuth 2.0 déjà validé) |
| API Meta | Meta Marketing API v19+ |
| Slides | Google Slides API |
| Hébergement | Vercel |
| IDE | Antigravity + Claude Code Terminal |

---

## 4. Structure du projet

```
/
├── CLAUDE.md                  ← ce fichier
├── app/
│   ├── (auth)/                ← pages login/signup
│   ├── (dashboard)/
│   │   ├── programmes/        ← liste + détail programmes
│   │   ├── brief/             ← formulaire de brief
│   │   └── campagnes/         ← détail campagnes (expert/agence)
│   └── api/
│       ├── auth/              ← OAuth Google Ads (déjà implémenté)
│       ├── ai/                ← endpoints Anthropic API
│       └── sync/              ← jobs de sync Google Ads + Meta
├── components/
│   ├── ui/                    ← shadcn/ui components
│   ├── programmes/
│   ├── brief/
│   └── dashboard/
├── lib/
│   ├── supabase/              ← client Supabase + types générés
│   ├── anthropic/             ← wrappers Anthropic API
│   ├── google-ads/            ← auth + appels API (déjà implémenté)
│   └── meta/                  ← auth + appels API
├── supabase/
│   └── migrations/            ← fichiers SQL versionnés
└── utils/
    ├── googleAuth.ts          ← refresh token (déjà implémenté)
    └── prompts/               ← prompts IA versionnés
        ├── plan-media.ts
        ├── google-ads-content.ts
        └── meta-content.ts
```

---

## 5. Google Ads API — ce qui est déjà fonctionnel

**Ne pas retoucher sans raison le flux OAuth — il fonctionne.**

- Flux OAuth 2.0 "Offline" opérationnel
- Initiation : `/api/auth/signin/google`
- Callback : `/api/auth/callback/google_ads`
- Refresh token stocké dans Supabase table `integration_settings`
- Utilitaire : `utils/googleAuth.ts` → `getValidAccessToken()`
- Appel test validé : `customers:listAccessibleCustomers`

**Pièges connus à ne jamais reproduire :**
1. Toujours utiliser `new URLSearchParams({...}).toString()` pour les requêtes token (pas d'objet brut)
2. Toujours `.trim()` sur `client_id`, `client_secret`, `developer_token` avant envoi
3. Toujours utiliser la version API la plus récente (v19+) — une version obsolète renvoie du HTML, pas du JSON
4. Vérifier la version courante : `curl -s "https://www.googleapis.com/discovery/v1/apis?name=googleads"`

---

## 6. Anthropic API — conventions

- Modèle à utiliser : **`claude-sonnet-4-20250514`** (toujours ce modèle, ne pas changer)
- `max_tokens` : 2000 pour le plan média, 1000 pour les contenus courts
- Les prompts sont versionnés dans `/utils/prompts/`
- Toujours streamer la réponse pour les générations longues (plan média)
- Format de sortie : demander du JSON structuré avec instructions explicites dans le prompt système

**Exemple de structure d'appel :**
```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 2000,
  system: "Tu es un expert en campagnes immobilier neuf...",
  messages: [{ role: "user", content: briefJson }]
});
```

---

## 7. Règles métier campagnes — à injecter dans les prompts IA

Ces règles sont NON-NÉGOCIABLES dans toute génération de contenu publicitaire :

**Google Ads :**
- Correspondance : Exact + Expression exacte UNIQUEMENT (jamais requête large)
- PMax uniquement après 2 mois de data
- Mots-clés négatifs obligatoires : `louer, location, loyer, hlm, logement social, 3F, erilia, batigère, colocation, meublé`
- Toujours 2 campagnes distinctes si BRS + accession classique

**Meta Ads :**
- Formats créas : 1:1 ou 9:16 UNIQUEMENT (jamais paysage)
- Lead Gen "Intention élevée" pour accession classique
- Lead Gen "Volume" pour BRS en phase amorçage
- Formulaire : 2-3 questions qualifiantes minimum
- Exclure < 35 ans pour T3/T4 marché libre
- Rayon géo : 17 km (imposé par Meta pour l'immobilier)

**Benchmarks CPL de référence (Gentilly Nov25–Fév26) :**
- Meta Reels : 10,88€ 🏆
- Meta Stories : 13,57€
- Google Search mois 1 : ~25€ (apprentissage)
- Google Search mois 2+ : 8–18€
- Cible globale : < 20€

---

## 8. Statuts d'un programme (`real_estate_programs.status`)

Les valeurs autorisées dans la contrainte CHECK Supabase sont, dans l'ordre du cycle de vie :

| Statut | Signification | Page Pipeline |
|---|---|---|
| `brief` | Programme créé, brief en cours de remplissage | Colonne "Brief en cours" |
| `validated` | Plan média validé par l'agence | Colonne "Plan validé" |
| `active` | Assets créatifs en cours de préparation | Colonne "Assets en cours" |
| `live` | Campagnes publicitaires actives | Colonne "Campagne active" |
| `paused` | Campagnes pausées temporairement | (hors pipeline) |
| `archived` | Programme terminé | Colonne "Terminé" |

**Cycle standard :** `brief` → `validated` → `active` → `live` → `archived`

**Règle importante :** ne jamais utiliser une valeur hors de cette liste — la contrainte Supabase rejettera l'update silencieusement si le statut est mal orthographié (ex. `"validate"` au lieu de `"validated"`).

**Page Pipeline :** `/agency/programs` — Kanban 5 colonnes, accessible aux rôles `expert` et `agency`. Server Action : `app/actions/updateProgramStatus.ts`.

---

## 9. Gestion des rôles utilisateurs

| Rôle | Accès |
|---|---|
| `expert` | Tout — paramétrage, connecteurs, détail créas, données brutes |
| `agency` | Tout sauf facturation — brief, dashboard complet, contenu généré |
| `client` | Dashboard simplifié par programme (dépenses, contacts reçus, CPL) — pas de détail créas |

Implémenté via Supabase Auth + RLS (Row Level Security) sur chaque table.

---

## 9. Variables d'environnement requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Google Ads OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_DEVELOPER_TOKEN=
NEXT_PUBLIC_BASE_URL=

# Meta
META_APP_ID=
META_APP_SECRET=
META_ACCESS_TOKEN=

# Google Slides (Sprint 4)
GOOGLE_SLIDES_SERVICE_ACCOUNT_KEY=
```

---

## 10. Conventions de code

- **TypeScript strict** — pas de `any`
- **Server Actions** pour toutes les mutations (pas d'API routes pour le CRUD)
- **API Routes** uniquement pour les webhooks et les OAuth callbacks
- Nommage des fichiers : kebab-case
- Nommage des composants : PascalCase
- Toujours typer les réponses Supabase avec les types générés (`supabase gen types typescript`)
- Commentaires en français pour la logique métier, anglais pour le code générique