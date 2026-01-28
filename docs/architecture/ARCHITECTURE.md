# Architecture MOUSSY

## Vue d'Ensemble

MOUSSY est une application cloud-native construite entierement sur l'infrastructure Cloudflare, optimisee pour la performance edge et la conformite RGPD europeenne.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────┐    │
│   │   Tablette   │   │  Smartphone  │   │        Navigateur Web        │    │
│   │   (Creche)   │   │   (Parent)   │   │      (Administration)        │    │
│   └──────┬───────┘   └──────┬───────┘   └──────────────┬───────────────┘    │
│          │                  │                          │                     │
│          └──────────────────┼──────────────────────────┘                     │
│                             │                                                │
│                             ▼                                                │
│                    ┌────────────────┐                                        │
│                    │  PWA / Next.js │                                        │
│                    │ (Installable)  │                                        │
│                    └────────┬───────┘                                        │
│                             │                                                │
└─────────────────────────────┼────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE NETWORK                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                     CLOUDFLARE PAGES                              │      │
│   │                 (Frontend Hosting + CDN)                          │      │
│   │   • Next.js SSR/SSG                                               │      │
│   │   • Assets statiques                                              │      │
│   │   • Edge Functions                                                │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                    │                                         │
│                                    ▼                                         │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                    CLOUDFLARE TURNSTILE                           │      │
│   │                    (Protection Anti-Bot)                          │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                    │                                         │
│                                    ▼                                         │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                    CLOUDFLARE WORKERS                             │      │
│   │                      (API Backend)                                │      │
│   │                                                                   │      │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │      │
│   │   │    Auth     │ │   Enfants   │ │  Activites  │ │ Facturation│  │      │
│   │   │   Worker    │ │   Worker    │ │   Worker    │ │   Worker  │  │      │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │      │
│   │                                                                   │      │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐│      │
│   │   │  Pointage   │ │   Parents   │ │        IA Worker            ││      │
│   │   │   Worker    │ │   Worker    │ │  (Synthese/Traduction)      ││      │
│   │   └─────────────┘ └─────────────┘ └─────────────────────────────┘│      │
│   │                                                                   │      │
│   └───────────────────────────┬──────────────────────────────────────┘      │
│                               │                                              │
│          ┌────────────────────┼────────────────────┐                         │
│          ▼                    ▼                    ▼                         │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                 │
│   │     D1      │      │     R2      │      │ Workers AI  │                 │
│   │  (SQLite)   │      │  (Storage)  │      │  (Llama 3)  │                 │
│   │             │      │             │      │             │                 │
│   │ • Creches   │      │ • Photos    │      │ • Synthese  │                 │
│   │ • Enfants   │      │ • Documents │      │ • Traduction│                 │
│   │ • Activites │      │ • Factures  │      │ • Analyse   │                 │
│   │ • Pointages │      │   PDF       │      │             │                 │
│   └─────────────┘      └─────────────┘      └─────────────┘                 │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │              CLOUDFLARE DATA LOCALIZATION SUITE                   │      │
│   │          (Donnees stockees uniquement en Europe - RGPD)           │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Composants Detailles

### 1. Frontend (Cloudflare Pages + Next.js)

```
src/frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── creche/
│   │   │   ├── employes/
│   │   │   ├── facturation/
│   │   │   └── planning/
│   │   ├── auxiliaire/
│   │   │   ├── pointage/
│   │   │   ├── journal/
│   │   │   └── transmissions/
│   │   └── parent/
│   │       ├── enfant/
│   │       └── historique/
│   └── api/
│       └── [...route]/
├── components/
│   ├── ui/           # Composants Shadcn/UI
│   ├── forms/        # Formulaires
│   └── charts/       # Graphiques
├── lib/
│   ├── api.ts        # Client API
│   ├── auth.ts       # Authentification
│   └── utils.ts
└── public/
    ├── icons/
    └── manifest.json  # PWA
```

**Technologies Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TailwindCSS
- Shadcn/UI
- React Query (tanstack)
- Zustand (state management)

### 2. Backend (Cloudflare Workers)

```
src/workers/
├── src/
│   ├── index.ts           # Router principal
│   ├── routes/
│   │   ├── auth.ts        # Authentification
│   │   ├── creches.ts     # CRUD Creches
│   │   ├── enfants.ts     # CRUD Enfants
│   │   ├── parents.ts     # CRUD Parents
│   │   ├── pointages.ts   # Pointage
│   │   ├── activites.ts   # Journal de vie
│   │   ├── transmissions.ts # Transmissions IA
│   │   ├── facturation.ts # Factures
│   │   └── planning.ts    # Planning
│   ├── middleware/
│   │   ├── auth.ts        # Verification JWT
│   │   ├── rbac.ts        # Controle roles
│   │   └── audit.ts       # Logging
│   ├── services/
│   │   ├── ai.ts          # Workers AI
│   │   ├── email.ts       # Notifications
│   │   └── pdf.ts         # Generation PDF
│   └── utils/
│       ├── db.ts          # Helpers D1
│       ├── storage.ts     # Helpers R2
│       └── validation.ts  # Zod schemas
├── wrangler.toml
└── package.json
```

**Stack Backend:**
- Hono.js (framework Workers)
- Zod (validation)
- Jose (JWT)
- Workers AI SDK

### 3. Base de Donnees (Cloudflare D1)

Voir [SCHEMA.md](../database/SCHEMA.md) pour le detail des tables.

**Caracteristiques:**
- SQLite distribue globalement
- Replique automatique
- Latence < 10ms depuis l'edge
- Compatible SQL standard

### 4. Stockage (Cloudflare R2)

```
moussy-files/
├── photos/
│   ├── enfants/
│   │   └── {enfant_id}/
│   │       └── profile.jpg
│   ├── employes/
│   │   └── {employe_id}/
│   │       └── profile.jpg
│   └── personnes-autorisees/
│       └── {personne_id}/
│           ├── photo.jpg
│           └── identite.jpg
├── documents/
│   ├── contrats/
│   └── autorisations/
└── factures/
    └── {annee}/
        └── {mois}/
            └── facture_{enfant_id}.pdf
```

### 5. Intelligence Artificielle (Workers AI)

```typescript
// Modeles utilises
const MODELS = {
  synthese: '@cf/meta/llama-3.1-8b-instruct',
  traduction: '@cf/meta/m2m100-1.2b',
  analyse: '@cf/meta/llama-3.1-8b-instruct'
};

// Exemple: Generation de transmission
async function genererTransmission(activites: Activite[]): Promise<string> {
  const prompt = `
    Tu es une auxiliaire de creche bienveillante.
    Genere un message court et chaleureux pour les parents
    resumant la journee de leur enfant.

    Activites du jour: ${JSON.stringify(activites)}
  `;

  const response = await env.AI.run(MODELS.synthese, {
    messages: [{ role: 'user', content: prompt }]
  });

  return response.response;
}
```

## Flux de Donnees

### 1. Pointage d'Arrivee

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Tablette│───►│ Worker  │───►│   D1    │───►│ Parent  │
│ (scan)  │    │ Pointage│    │ INSERT  │    │ Notif   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 2. Generation Transmission IA

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│Auxiliaire│───►│ Worker  │───►│   D1    │───►│   AI    │───►│ Parent  │
│ (saisie)│    │Activites│    │ SELECT  │    │ Llama 3 │    │ App     │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 3. Detection Anomalie Sante

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Cron   │───►│ Worker  │───►│   AI    │───►│ Alerte  │
│ (daily) │    │ Analyse │    │ Llama 3 │    │ Email   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

## Securite

### Authentification Multi-Niveaux

```
┌────────────────────────────────────────────────────┐
│                   METHODES AUTH                     │
├────────────────────────────────────────────────────┤
│                                                     │
│   TABLETTE CRECHE          WEB/MOBILE              │
│   ┌────────────┐          ┌────────────┐           │
│   │    PIN     │          │   Email +  │           │
│   │  4 chiffres│          │  Password  │           │
│   └─────┬──────┘          └─────┬──────┘           │
│         │                       │                   │
│         ▼                       ▼                   │
│   ┌────────────┐          ┌────────────┐           │
│   │  Biometrie │          │  Turnstile │           │
│   │ (optionnel)│          │ (anti-bot) │           │
│   └─────┬──────┘          └─────┬──────┘           │
│         │                       │                   │
│         └───────────┬───────────┘                   │
│                     ▼                               │
│              ┌────────────┐                         │
│              │    JWT     │                         │
│              │  (1h exp)  │                         │
│              └────────────┘                         │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Controle d'Acces (RBAC)

| Role | Creches | Enfants | Pointage | Journal | Transmissions | Facturation |
|------|---------|---------|----------|---------|---------------|-------------|
| Directeur | CRUD | CRUD | RU | CRUD | CRUD | CRUD |
| Auxiliaire | R | R | CRU | CRU | CR | - |
| Parent | - | R (sien) | R | R | R | R |

### RGPD Compliance

1. **Data Localization**: Cloudflare Data Localization Suite (EU only)
2. **Encryption**: TLS 1.3 (transit) + Encryption at rest
3. **Audit Logs**: Toutes actions tracees
4. **Right to Erasure**: API de suppression GDPR
5. **Data Portability**: Export JSON/CSV

## Performance

### Objectifs SLA

| Metrique | Cible |
|----------|-------|
| Latence API (p50) | < 50ms |
| Latence API (p99) | < 200ms |
| Disponibilite | 99.9% |
| Time to First Byte | < 100ms |

### Optimisations

1. **Edge Computing**: Code execute au plus pres de l'utilisateur
2. **Caching**: KV pour sessions, Cache API pour assets
3. **Lazy Loading**: Composants charges a la demande
4. **Image Optimization**: Cloudflare Images
5. **Database**: Indexes optimises, requetes preparees

## Deploiement

### Pipeline CI/CD

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Push   │───►│  Tests  │───►│  Build  │───►│ Deploy  │
│  main   │    │  Lint   │    │ Next.js │    │ Preview │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  │
                                                  ▼
                                           ┌─────────┐
                                           │ Promote │
                                           │  Prod   │
                                           └─────────┘
```

### Environnements

| Environnement | URL | Branch |
|---------------|-----|--------|
| Development | moussy-dev.pages.dev | develop |
| Staging | moussy-staging.pages.dev | staging |
| Production | app.moussy.fr | main |

## Monitoring

### Metriques Collectees

- **Workers Analytics**: Requetes, latence, erreurs
- **D1 Analytics**: Queries, rows read/written
- **R2 Analytics**: Operations, storage
- **Real User Monitoring**: Core Web Vitals

### Alertes

- Latence p99 > 500ms
- Taux d'erreur > 1%
- D1 queries > 10ms
- Stockage R2 > 80%
