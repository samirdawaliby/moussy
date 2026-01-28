# MOUSSY - Plateforme de Gestion de Creche Intelligente

> Une solution moderne pour automatiser la gestion des creches, securiser le pointage des enfants et ameliorer la communication avec les parents grace a l'IA.

## Vision du Projet

MOUSSY revolutionne la gestion des creches en remplacant les outils obsoletes (Excel, papier) par une plateforme cloud-native construite sur **Cloudflare Workers**, offrant:

- **Pointage intelligent** des enfants (QR Code, liste rapide)
- **Journal de vie numerique** (repas, sommeil, changes)
- **IA de synthese** pour generer des transmissions bienveillantes aux parents
- **Facturation automatisee** conforme CAF/PSU
- **Conformite RGPD** avec stockage des donnees en Europe

## Architecture Technique

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Turnstile  │  │   Pages     │  │    Workers AI (Llama)   │  │
│  │  (Auth)     │  │  (Frontend) │  │  (Synthese/Traduction)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Workers   │  │     D1      │  │          R2             │  │
│  │   (API)     │  │  (Database) │  │    (File Storage)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Stack Technologique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Frontend | Next.js / React | SSR, performance, DX |
| Backend API | Cloudflare Workers | Edge computing, faible latence |
| Base de donnees | Cloudflare D1 (SQLite) | SQL relationnel, replique globalement |
| Stockage fichiers | Cloudflare R2 | Photos, documents, sans frais de sortie |
| Authentification | Cloudflare Turnstile + JWT | Anti-bot, securite moderne |
| IA | Cloudflare Workers AI (Llama 3) | Synthese, traduction, analyse |
| Hebergement | Cloudflare Pages | CDN global, deployement automatique |

## Structure du Projet

```
moussy/
├── README.md
├── docs/
│   ├── architecture/
│   │   └── ARCHITECTURE.md
│   ├── database/
│   │   └── SCHEMA.md
│   └── api/
│       └── API.md
├── src/
│   ├── workers/           # Cloudflare Workers (API Backend)
│   │   ├── wrangler.toml
│   │   └── src/
│   └── frontend/          # Next.js Application
│       ├── package.json
│       └── src/
└── public/                # Assets statiques
```

## Fonctionnalites par Role

### Administrateur / Directeur
- Tableau de bord global de la creche
- Gestion des employes et planning
- Facturation et exports CAF/PSU
- Rapports et statistiques

### Auxiliaire / Educateur
- Pointage rapide des enfants
- Saisie du journal de vie (repas, sommeil, changes)
- Generation automatique des transmissions IA
- Alertes sante et bien-etre

### Parent
- Consultation des transmissions en temps reel
- Historique de l'enfant
- Notifications push
- Traduction automatique dans leur langue

## Roadmap de Developpement

### Etape 1: Fondations (Semaines 1-2)
- [x] Documentation projet
- [ ] Schema de base de donnees D1
- [ ] Configuration authentification
- [ ] Setup Next.js + Cloudflare Pages

### Etape 2: Coeur de Metier (Semaines 3-5)
- [ ] Module de pointage intelligent
- [ ] Journal de vie numerique
- [ ] Gestion des profils enfants

### Etape 3: Intelligence Artificielle (Semaines 6-7)
- [ ] IA de synthese de transmission
- [ ] Detection d'anomalies sante
- [ ] Traduction automatique

### Etape 4: Administration (Semaines 8-9)
- [ ] Moteur de facturation
- [ ] Exports CAF/PSU
- [ ] Planning du personnel

### Etape 5: Lancement (Semaines 10-11)
- [ ] Audit RGPD
- [ ] PWA Mobile
- [ ] Tests et deploiement production

## Demarrage Rapide

### Prerequis
- Node.js 18+
- Compte Cloudflare avec Workers active
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Cloner le repository
git clone https://github.com/samirdawaliby/moussy.git
cd moussy

# Installer les dependances
npm install

# Se connecter a Cloudflare
wrangler login

# Creer la base de donnees D1
wrangler d1 create moussy-db

# Deployer les Workers
cd src/workers && wrangler deploy

# Lancer le frontend en dev
cd ../frontend && npm run dev
```

## Configuration Cloudflare

Le projet utilise les services Cloudflare suivants:

| Service | Usage | Configuration |
|---------|-------|---------------|
| Workers | API Backend | `src/workers/wrangler.toml` |
| D1 | Base de donnees SQLite | Schema dans `docs/database/` |
| R2 | Stockage photos/documents | Bucket `moussy-files` |
| Pages | Hebergement frontend | Branche `main` |
| Turnstile | Protection anti-bot | Site key dans `.env` |
| Workers AI | Modeles IA | Llama 3.1 8B |

## Securite & RGPD

- **Chiffrement**: Toutes les donnees en transit (TLS) et au repos
- **Localisation**: Donnees stockees en Europe (Cloudflare Data Localization)
- **Authentification**: JWT + biometrie/PIN pour tablettes
- **Audit**: Logs de toutes les actions sensibles
- **Consentement**: Gestion des autorisations parentales

## Contribution

1. Fork le projet
2. Creer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajouter nouvelle fonctionnalite'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de details.

## Contact

- **Projet**: MOUSSY
- **GitHub**: [samirdawaliby/moussy](https://github.com/samirdawaliby/moussy)
- **Cloudflare Account**: fombasalimata01@gmail.com

---

*Construit avec Cloudflare Workers, D1, R2, Pages et Workers AI*
