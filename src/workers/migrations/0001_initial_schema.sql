-- MOUSSY Database Schema
-- Initial migration

-- Creches table
CREATE TABLE IF NOT EXISTS creches (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    code_postal TEXT NOT NULL,
    ville TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    siret TEXT UNIQUE,
    capacite_max INTEGER NOT NULL DEFAULT 20,
    type_structure TEXT CHECK(type_structure IN ('micro_creche', 'creche_collective', 'creche_familiale', 'multi_accueil')) DEFAULT 'micro_creche',
    horaires_ouverture TEXT DEFAULT '07:30',
    horaires_fermeture TEXT DEFAULT '18:30',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Employes table
CREATE TABLE IF NOT EXISTS employes (
    id TEXT PRIMARY KEY,
    creche_id TEXT NOT NULL REFERENCES creches(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telephone TEXT,
    role TEXT CHECK(role IN ('directeur', 'auxiliaire', 'educateur', 'agent_entretien', 'cuisinier')) NOT NULL,
    pin_hash TEXT,
    photo_url TEXT,
    date_embauche TEXT,
    contrat_heures_semaine INTEGER DEFAULT 35,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_employes_creche ON employes(creche_id);
CREATE INDEX IF NOT EXISTS idx_employes_email ON employes(email);

-- Enfants table
CREATE TABLE IF NOT EXISTS enfants (
    id TEXT PRIMARY KEY,
    creche_id TEXT NOT NULL REFERENCES creches(id) ON DELETE CASCADE,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    date_naissance TEXT NOT NULL,
    sexe TEXT CHECK(sexe IN ('M', 'F')) NOT NULL,
    photo_url TEXT,
    allergies TEXT,
    regime_alimentaire TEXT CHECK(regime_alimentaire IN ('normal', 'vegetarien', 'sans_porc', 'sans_gluten', 'autre')) DEFAULT 'normal',
    medicaments TEXT,
    medecin_traitant TEXT,
    medecin_telephone TEXT,
    groupe_sanguin TEXT,
    type_contrat TEXT CHECK(type_contrat IN ('regulier', 'occasionnel', 'urgence')) DEFAULT 'regulier',
    heures_contrat_semaine REAL,
    date_debut_contrat TEXT,
    date_fin_contrat TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_enfants_creche ON enfants(creche_id);
CREATE INDEX IF NOT EXISTS idx_enfants_actif ON enfants(actif);

-- Parents table
CREATE TABLE IF NOT EXISTS parents (
    id TEXT PRIMARY KEY,
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
    langue_preferee TEXT DEFAULT 'fr',
    password_hash TEXT,
    autorisation_photos INTEGER DEFAULT 0,
    autorisation_sortie INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_parents_enfant ON parents(enfant_id);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);

-- Personnes autorisees table
CREATE TABLE IF NOT EXISTS personnes_autorisees (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    lien TEXT NOT NULL,
    telephone TEXT NOT NULL,
    photo_url TEXT,
    piece_identite_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_personnes_autorisees_enfant ON personnes_autorisees(enfant_id);

-- Pointages table
CREATE TABLE IF NOT EXISTS pointages (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    heure_arrivee TEXT,
    heure_depart TEXT,
    employe_arrivee_id TEXT REFERENCES employes(id),
    employe_depart_id TEXT REFERENCES employes(id),
    personne_depart TEXT,
    methode_pointage TEXT CHECK(methode_pointage IN ('manuel', 'qr_code', 'nfc')) DEFAULT 'manuel',
    commentaire TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pointages_enfant_date ON pointages(enfant_id, date);
CREATE INDEX IF NOT EXISTS idx_pointages_date ON pointages(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pointages_unique ON pointages(enfant_id, date);

-- Activites table
CREATE TABLE IF NOT EXISTS activites (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    employe_id TEXT REFERENCES employes(id),
    date TEXT NOT NULL,
    heure TEXT NOT NULL,
    type_activite TEXT CHECK(type_activite IN ('repas', 'sommeil', 'change', 'activite', 'soin', 'observation')) NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activites_enfant_date ON activites(enfant_id, date);
CREATE INDEX IF NOT EXISTS idx_activites_type ON activites(type_activite);

-- Transmissions table
CREATE TABLE IF NOT EXISTS transmissions (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    contenu_original TEXT NOT NULL,
    contenu_traduit TEXT,
    langue_traduction TEXT,
    genere_par TEXT CHECK(genere_par IN ('ia', 'manuel')) DEFAULT 'ia',
    valide_par TEXT REFERENCES employes(id),
    envoye INTEGER DEFAULT 0,
    envoye_at TEXT,
    lu INTEGER DEFAULT 0,
    lu_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transmissions_enfant_date ON transmissions(enfant_id, date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_transmissions_unique ON transmissions(enfant_id, date);

-- Alertes sante table
CREATE TABLE IF NOT EXISTS alertes_sante (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    type_alerte TEXT CHECK(type_alerte IN ('alimentation', 'sommeil', 'comportement', 'sante')) NOT NULL,
    severite TEXT CHECK(severite IN ('info', 'attention', 'urgent')) DEFAULT 'attention',
    message TEXT NOT NULL,
    donnees_analyse TEXT,
    vue INTEGER DEFAULT 0,
    vue_par TEXT REFERENCES employes(id),
    vue_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alertes_enfant ON alertes_sante(enfant_id);
CREATE INDEX IF NOT EXISTS idx_alertes_date ON alertes_sante(date);

-- Planning employes table
CREATE TABLE IF NOT EXISTS planning_employes (
    id TEXT PRIMARY KEY,
    employe_id TEXT NOT NULL REFERENCES employes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    heure_debut TEXT NOT NULL,
    heure_fin TEXT NOT NULL,
    type TEXT CHECK(type IN ('travail', 'conge', 'maladie', 'formation')) DEFAULT 'travail',
    commentaire TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_planning_employe_date ON planning_employes(employe_id, date);
CREATE INDEX IF NOT EXISTS idx_planning_date ON planning_employes(date);

-- Planning enfants table
CREATE TABLE IF NOT EXISTS planning_enfants (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    jour_semaine INTEGER CHECK(jour_semaine BETWEEN 1 AND 5) NOT NULL,
    heure_arrivee_prevue TEXT NOT NULL,
    heure_depart_prevue TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(enfant_id, jour_semaine)
);

CREATE INDEX IF NOT EXISTS idx_planning_enfants ON planning_enfants(enfant_id);

-- Factures table
CREATE TABLE IF NOT EXISTS factures (
    id TEXT PRIMARY KEY,
    enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
    mois INTEGER NOT NULL,
    annee INTEGER NOT NULL,
    heures_contrat REAL NOT NULL,
    heures_reelles REAL NOT NULL,
    heures_supplementaires REAL DEFAULT 0,
    tarif_horaire REAL NOT NULL,
    montant_ht REAL NOT NULL,
    montant_ttc REAL NOT NULL,
    statut TEXT CHECK(statut IN ('brouillon', 'envoyee', 'payee', 'retard')) DEFAULT 'brouillon',
    date_envoi TEXT,
    date_paiement TEXT,
    participation_famille REAL,
    participation_caf REAL,
    numero_caf TEXT,
    pdf_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_factures_enfant ON factures(enfant_id);
CREATE INDEX IF NOT EXISTS idx_factures_periode ON factures(annee, mois);
CREATE UNIQUE INDEX IF NOT EXISTS idx_factures_unique ON factures(enfant_id, annee, mois);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_type TEXT CHECK(user_type IN ('employe', 'parent')) NOT NULL,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    device_info TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_type TEXT CHECK(user_type IN ('employe', 'parent', 'system')) NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    table_cible TEXT,
    record_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);
