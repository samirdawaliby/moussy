# Schema de Base de Donnees MOUSSY

## Vue d'Ensemble

La base de donnees utilise **Cloudflare D1** (SQLite distribue) avec un modele relationnel optimise pour les operations de creche.

## Diagramme Entite-Relation

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   CRECHES    │       │   EMPLOYES   │       │   ENFANTS    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ creche_id    │       │ id (PK)      │
│ nom          │       │ id (PK)      │       │ creche_id    │──►
│ adresse      │       │ nom          │       │ prenom       │
│ telephone    │       │ email        │       │ nom          │
│ capacite     │       │ role         │       │ date_nais    │
│ created_at   │       │ pin_hash     │       │ photo_url    │
└──────────────┘       └──────────────┘       └──────────────┘
                                                     │
                                                     ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   PARENTS    │       │  POINTAGES   │       │  ACTIVITES   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ nom          │       │ enfant_id    │──►    │ enfant_id    │──►
│ email        │       │ date         │       │ date         │
│ telephone    │       │ heure_arrivee│       │ type         │
│ langue       │       │ heure_depart │       │ details      │
│ enfant_id    │──►    │ employe_id   │       │ employe_id   │
└──────────────┘       └──────────────┘       └──────────────┘
```

## Tables Detaillees

### 1. CRECHES
Informations sur chaque etablissement.

```sql
CREATE TABLE creches (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    code_postal TEXT NOT NULL,
    ville TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    siret TEXT UNIQUE,
    capacite_max INTEGER NOT NULL DEFAULT 20,
    type_structure TEXT CHECK(type_structure IN ('micro_creche', 'creche_collective', 'creche_familiale', 'multi_accueil')) DEFAULT 'micro_creche',
    horaires_ouverture TIME DEFAULT '07:30',
    horaires_fermeture TIME DEFAULT '18:30',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. EMPLOYES
Personnel de la creche avec roles et authentification.

```sql
CREATE TABLE employes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    creche_id TEXT NOT NULL REFERENCES creches(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telephone TEXT,
    role TEXT CHECK(role IN ('directeur', 'auxiliaire', 'educateur', 'agent_entretien', 'cuisinier')) NOT NULL,
    pin_hash TEXT, -- Pour authentification tablette
    photo_url TEXT,
    date_embauche DATE,
    contrat_heures_semaine INTEGER DEFAULT 35,
    actif BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employes_creche ON employes(creche_id);
CREATE INDEX idx_employes_email ON employes(email);
```

### 3. ENFANTS
Profils complets des enfants avec informations medicales.

```sql
CREATE TABLE enfants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    creche_id TEXT NOT NULL REFERENCES creches(id) ON DELETE CASCADE,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    date_naissance DATE NOT NULL,
    sexe TEXT CHECK(sexe IN ('M', 'F')) NOT NULL,
    photo_url TEXT,

    -- Informations medicales
    allergies TEXT, -- JSON array
    regime_alimentaire TEXT CHECK(regime_alimentaire IN ('normal', 'vegetarien', 'sans_porc', 'sans_gluten', 'autre')),
    medicaments TEXT, -- JSON array
    medecin_traitant TEXT,
    medecin_telephone TEXT,
    groupe_sanguin TEXT,

    -- Contrat
    type_contrat TEXT CHECK(type_contrat IN ('regulier', 'occasionnel', 'urgence')) DEFAULT 'regulier',
    heures_contrat_semaine REAL,
    date_debut_contrat DATE,
    date_fin_contrat DATE,

    -- Statut
    actif BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_enfants_creche ON enfants(creche_id);
CREATE INDEX idx_enfants_actif ON enfants(actif);
```

### 4. PARENTS
Responsables legaux des enfants.

```sql
CREATE TABLE parents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    type_parent TEXT CHECK(type_parent IN ('pere', 'mere', 'tuteur', 'autre')) NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT NOT NULL,
    telephone_urgence TEXT,
    adresse TEXT,
    code_postal TEXT,
    ville TEXT,
    langue_preferee TEXT DEFAULT 'fr', -- Pour traduction IA

    -- Authentification
    password_hash TEXT,

    -- Autorisations
    autorisation_photos BOOLEAN DEFAULT FALSE,
    autorisation_sortie BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parents_enfant ON parents(enfant_id);
CREATE INDEX idx_parents_email ON parents(email);
```

### 5. PERSONNES_AUTORISEES
Personnes autorisees a recuperer l'enfant.

```sql
CREATE TABLE personnes_autorisees (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    lien TEXT NOT NULL, -- 'grand-parent', 'oncle', 'nounou', etc.
    telephone TEXT NOT NULL,
    photo_url TEXT,
    piece_identite_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_personnes_autorisees_enfant ON personnes_autorisees(enfant_id);
```

### 6. POINTAGES
Arrivees et departs des enfants.

```sql
CREATE TABLE pointages (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    heure_arrivee TIME,
    heure_depart TIME,
    employe_arrivee_id TEXT REFERENCES employes(id),
    employe_depart_id TEXT REFERENCES employes(id),
    personne_depart TEXT, -- Nom de la personne qui recupere
    methode_pointage TEXT CHECK(methode_pointage IN ('manuel', 'qr_code', 'nfc')) DEFAULT 'manuel',
    commentaire TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pointages_enfant_date ON pointages(enfant_id, date);
CREATE INDEX idx_pointages_date ON pointages(date);
CREATE UNIQUE INDEX idx_pointages_unique ON pointages(enfant_id, date);
```

### 7. ACTIVITES
Journal de vie quotidien (repas, sommeil, changes).

```sql
CREATE TABLE activites (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    employe_id TEXT NOT NULL REFERENCES employes(id),
    date DATE NOT NULL,
    heure TIME NOT NULL,

    type_activite TEXT CHECK(type_activite IN ('repas', 'sommeil', 'change', 'activite', 'soin', 'observation')) NOT NULL,

    -- Details selon le type
    details JSON NOT NULL,
    /*
    Pour repas: {"type": "dejeuner", "quantite": "bien", "menu": "puree carottes", "biberon_ml": 180}
    Pour sommeil: {"debut": "13:00", "fin": "15:30", "qualite": "bon"}
    Pour change: {"etat": "normal", "creme": true}
    Pour activite: {"description": "peinture", "participation": "active"}
    Pour soin: {"type": "medicament", "description": "doliprane 2.4ml"}
    Pour observation: {"description": "A dit son premier mot: maman"}
    */

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activites_enfant_date ON activites(enfant_id, date);
CREATE INDEX idx_activites_type ON activites(type_activite);
```

### 8. TRANSMISSIONS
Messages generes par l'IA pour les parents.

```sql
CREATE TABLE transmissions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Contenu
    contenu_original TEXT NOT NULL, -- Texte genere par l'IA en francais
    contenu_traduit TEXT, -- Traduction si parent non francophone
    langue_traduction TEXT,

    -- Metadonnees
    genere_par TEXT CHECK(genere_par IN ('ia', 'manuel')) DEFAULT 'ia',
    valide_par TEXT REFERENCES employes(id),
    envoye BOOLEAN DEFAULT FALSE,
    envoye_at DATETIME,
    lu BOOLEAN DEFAULT FALSE,
    lu_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transmissions_enfant_date ON transmissions(enfant_id, date);
CREATE UNIQUE INDEX idx_transmissions_unique ON transmissions(enfant_id, date);
```

### 9. ALERTES_SANTE
Alertes generees par l'IA pour le bien-etre.

```sql
CREATE TABLE alertes_sante (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    type_alerte TEXT CHECK(type_alerte IN ('alimentation', 'sommeil', 'comportement', 'sante')) NOT NULL,
    severite TEXT CHECK(severite IN ('info', 'attention', 'urgent')) DEFAULT 'attention',
    message TEXT NOT NULL,
    donnees_analyse JSON, -- Donnees ayant declenche l'alerte

    vue BOOLEAN DEFAULT FALSE,
    vue_par TEXT REFERENCES employes(id),
    vue_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alertes_enfant ON alertes_sante(enfant_id);
CREATE INDEX idx_alertes_date ON alertes_sante(date);
CREATE INDEX idx_alertes_non_vues ON alertes_sante(vue) WHERE vue = FALSE;
```

### 10. PLANNING_EMPLOYES
Planning du personnel.

```sql
CREATE TABLE planning_employes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    employe_id TEXT NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    type TEXT CHECK(type IN ('travail', 'conge', 'maladie', 'formation')) DEFAULT 'travail',
    commentaire TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_planning_employe_date ON planning_employes(employe_id, date);
CREATE INDEX idx_planning_date ON planning_employes(date);
```

### 11. PLANNING_ENFANTS
Planning previsionnel des enfants.

```sql
CREATE TABLE planning_enfants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    jour_semaine INTEGER CHECK(jour_semaine BETWEEN 1 AND 5) NOT NULL, -- 1=Lundi
    heure_arrivee_prevue TIME NOT NULL,
    heure_depart_prevue TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(enfant_id, jour_semaine)
);

CREATE INDEX idx_planning_enfants ON planning_enfants(enfant_id);
```

### 12. FACTURES
Facturation mensuelle.

```sql
CREATE TABLE factures (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    mois INTEGER NOT NULL, -- 1-12
    annee INTEGER NOT NULL,

    -- Heures
    heures_contrat REAL NOT NULL,
    heures_reelles REAL NOT NULL,
    heures_supplementaires REAL DEFAULT 0,

    -- Montants
    tarif_horaire REAL NOT NULL,
    montant_ht REAL NOT NULL,
    montant_ttc REAL NOT NULL,

    -- Statut
    statut TEXT CHECK(statut IN ('brouillon', 'envoyee', 'payee', 'retard')) DEFAULT 'brouillon',
    date_envoi DATE,
    date_paiement DATE,

    -- CAF/PSU
    participation_famille REAL,
    participation_caf REAL,
    numero_caf TEXT,

    pdf_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_factures_enfant ON factures(enfant_id);
CREATE INDEX idx_factures_periode ON factures(annee, mois);
CREATE UNIQUE INDEX idx_factures_unique ON factures(enfant_id, annee, mois);
```

### 13. SESSIONS
Sessions d'authentification.

```sql
CREATE TABLE sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_type TEXT CHECK(user_type IN ('employe', 'parent')) NOT NULL,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    device_info TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user ON sessions(user_type, user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
```

### 14. AUDIT_LOGS
Journal d'audit pour la conformite RGPD.

```sql
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_type TEXT CHECK(user_type IN ('employe', 'parent', 'system')) NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    table_cible TEXT,
    record_id TEXT,
    details JSON,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_type, user_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

## Migrations

Les migrations sont gerees avec Wrangler CLI:

```bash
# Creer une nouvelle migration
wrangler d1 migrations create moussy-db "nom_migration"

# Appliquer les migrations
wrangler d1 migrations apply moussy-db

# Voir l'etat des migrations
wrangler d1 migrations list moussy-db
```

## Indexes et Performance

Tous les indexes sont crees pour optimiser les requetes les plus frequentes:

1. **Pointages du jour**: `idx_pointages_date`
2. **Activites par enfant**: `idx_activites_enfant_date`
3. **Alertes non vues**: `idx_alertes_non_vues`
4. **Planning**: `idx_planning_date`

## Sauvegarde et Restauration

```bash
# Exporter la base
wrangler d1 export moussy-db --output=backup.sql

# Importer
wrangler d1 execute moussy-db --file=backup.sql
```

## Conformite RGPD

- Toutes les tables ont des timestamps `created_at` et `updated_at`
- `audit_logs` trace toutes les modifications
- Les donnees sensibles peuvent etre anonymisees via `UPDATE` ou `DELETE CASCADE`
- Retention des donnees configurable par creche
