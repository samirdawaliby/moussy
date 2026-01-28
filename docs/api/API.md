# API Reference MOUSSY

## Vue d'Ensemble

L'API MOUSSY est construite sur Cloudflare Workers avec le framework Hono.js. Elle suit les principes REST et retourne du JSON.

**Base URL:** `https://api.moussy.fr` (production)

## Authentification

### Obtenir un Token JWT

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret",
  "turnstile_token": "xxx"  // Token Cloudflare Turnstile
}
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2024-01-15T12:00:00Z",
    "user": {
      "id": "abc123",
      "type": "employe",
      "role": "auxiliaire",
      "nom": "Dupont",
      "prenom": "Marie"
    }
  }
}
```

### Authentification PIN (Tablette)

```http
POST /auth/pin
Content-Type: application/json

{
  "creche_id": "xxx",
  "pin": "1234"
}
```

### Headers Requis

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Endpoints

### Creches

#### Lister les Creches
```http
GET /creches
Authorization: Bearer <token>
```

#### Creer une Creche
```http
POST /creches
Authorization: Bearer <token>
Content-Type: application/json

{
  "nom": "La Souris Verte",
  "adresse": "12 rue des Lilas",
  "code_postal": "75012",
  "ville": "Paris",
  "telephone": "0123456789",
  "email": "contact@sourisverte.fr",
  "capacite_max": 12,
  "type_structure": "micro_creche"
}
```

#### Obtenir une Creche
```http
GET /creches/:id
```

#### Mettre a jour une Creche
```http
PUT /creches/:id
```

#### Supprimer une Creche
```http
DELETE /creches/:id
```

---

### Enfants

#### Lister les Enfants d'une Creche
```http
GET /creches/:creche_id/enfants
Authorization: Bearer <token>
```

**Query Parameters:**
- `actif` (boolean): Filtrer par statut actif
- `date_presence` (date): Filtrer par date de presence prevue

**Reponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": "enf_123",
      "prenom": "Leo",
      "nom": "Martin",
      "date_naissance": "2022-03-15",
      "photo_url": "https://...",
      "allergies": ["arachides"],
      "present_aujourd_hui": true,
      "heure_arrivee": "08:30"
    }
  ]
}
```

#### Creer un Enfant
```http
POST /creches/:creche_id/enfants
Content-Type: application/json

{
  "prenom": "Leo",
  "nom": "Martin",
  "date_naissance": "2022-03-15",
  "sexe": "M",
  "allergies": ["arachides"],
  "regime_alimentaire": "normal",
  "type_contrat": "regulier",
  "heures_contrat_semaine": 40
}
```

#### Obtenir un Enfant avec Details
```http
GET /enfants/:id
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "id": "enf_123",
    "prenom": "Leo",
    "nom": "Martin",
    "date_naissance": "2022-03-15",
    "photo_url": "https://...",
    "allergies": ["arachides"],
    "medicaments": [],
    "parents": [
      {
        "id": "par_456",
        "type_parent": "mere",
        "nom": "Martin",
        "prenom": "Sophie",
        "telephone": "0612345678"
      }
    ],
    "personnes_autorisees": [
      {
        "id": "pers_789",
        "nom": "Martin",
        "prenom": "Jean",
        "lien": "grand-pere",
        "photo_url": "https://..."
      }
    ]
  }
}
```

#### Uploader une Photo d'Enfant
```http
POST /enfants/:id/photo
Content-Type: multipart/form-data

photo: <file>
```

---

### Pointages

#### Pointer l'Arrivee
```http
POST /pointages/arrivee
Content-Type: application/json

{
  "enfant_id": "enf_123",
  "methode": "qr_code",
  "commentaire": "Petit rhume ce matin"
}
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "id": "poi_abc",
    "enfant_id": "enf_123",
    "date": "2024-01-15",
    "heure_arrivee": "08:32:15",
    "employe": "Marie Dupont"
  }
}
```

#### Pointer le Depart
```http
POST /pointages/depart
Content-Type: application/json

{
  "enfant_id": "enf_123",
  "personne_depart": "Sophie Martin (mere)"
}
```

#### Liste des Presences du Jour
```http
GET /pointages/aujourd-hui
Authorization: Bearer <token>
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "total_presents": 8,
    "total_capacite": 12,
    "enfants": [
      {
        "id": "enf_123",
        "prenom": "Leo",
        "nom": "Martin",
        "photo_url": "https://...",
        "heure_arrivee": "08:32",
        "heure_depart": null,
        "statut": "present"
      }
    ]
  }
}
```

#### Historique Pointages d'un Enfant
```http
GET /enfants/:id/pointages?mois=2024-01
```

---

### Activites (Journal de Vie)

#### Enregistrer une Activite
```http
POST /activites
Content-Type: application/json

{
  "enfant_id": "enf_123",
  "type_activite": "repas",
  "details": {
    "type": "dejeuner",
    "quantite": "bien",
    "menu": "puree de carottes, compote de pommes"
  }
}
```

**Types d'activites et leurs details:**

##### Repas
```json
{
  "type_activite": "repas",
  "details": {
    "type": "petit_dejeuner|dejeuner|gouter|diner",
    "quantite": "rien|peu|moyen|bien|tres_bien",
    "menu": "description du menu",
    "biberon_ml": 180  // optionnel
  }
}
```

##### Sommeil
```json
{
  "type_activite": "sommeil",
  "details": {
    "debut": "13:00",
    "fin": "15:30",
    "qualite": "agite|normal|bon|tres_bon"
  }
}
```

##### Change
```json
{
  "type_activite": "change",
  "details": {
    "etat": "normal|mou|liquide",
    "creme": true,
    "commentaire": "leger erytheme"
  }
}
```

##### Activite Ludique
```json
{
  "type_activite": "activite",
  "details": {
    "description": "Peinture avec les doigts",
    "participation": "observateur|timide|active|tres_active"
  }
}
```

##### Soin
```json
{
  "type_activite": "soin",
  "details": {
    "type": "medicament|temperature|soin",
    "description": "Doliprane 2.4ml - 38.5C"
  }
}
```

##### Observation
```json
{
  "type_activite": "observation",
  "details": {
    "description": "A dit son premier mot: maman!"
  }
}
```

#### Obtenir le Journal du Jour
```http
GET /enfants/:id/activites?date=2024-01-15
```

#### Obtenir toutes les Activites du Jour (Creche)
```http
GET /creches/:id/activites?date=2024-01-15
```

---

### Transmissions (IA)

#### Generer une Transmission
```http
POST /transmissions/generer
Content-Type: application/json

{
  "enfant_id": "enf_123",
  "date": "2024-01-15"
}
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "id": "tra_xyz",
    "enfant_id": "enf_123",
    "date": "2024-01-15",
    "contenu_original": "Leo a passe une super journee! Il a bien mange sa puree de carottes au dejeuner et a fait une belle sieste de 2h30. Cet apres-midi, il s'est amuse a la peinture avec ses copains. A demain!",
    "genere_par": "ia",
    "valide": false
  }
}
```

#### Valider et Envoyer une Transmission
```http
POST /transmissions/:id/envoyer
Content-Type: application/json

{
  "contenu_modifie": "texte modifie optionnel"
}
```

#### Traduire une Transmission
```http
POST /transmissions/:id/traduire
Content-Type: application/json

{
  "langue": "en"  // Code ISO
}
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "contenu_traduit": "Leo had a great day! He ate his carrot puree well at lunch and had a nice 2h30 nap...",
    "langue_traduction": "en"
  }
}
```

#### Obtenir les Transmissions d'un Parent
```http
GET /parents/:id/transmissions
```

---

### Alertes Sante (IA)

#### Lancer l'Analyse de Sante
```http
POST /alertes/analyser
Content-Type: application/json

{
  "creche_id": "cre_123",
  "date": "2024-01-15"
}
```

**Reponse:**
```json
{
  "success": true,
  "data": {
    "alertes_generees": 2,
    "alertes": [
      {
        "id": "ale_abc",
        "enfant_id": "enf_456",
        "type_alerte": "alimentation",
        "severite": "attention",
        "message": "Emma a peu mange ces 3 derniers jours. Moyenne: 30% vs 75% habituel."
      }
    ]
  }
}
```

#### Obtenir les Alertes Non Vues
```http
GET /alertes?vue=false
```

#### Marquer une Alerte comme Vue
```http
PUT /alertes/:id/vue
```

---

### Facturation

#### Generer les Factures du Mois
```http
POST /facturation/generer
Content-Type: application/json

{
  "creche_id": "cre_123",
  "mois": 1,
  "annee": 2024
}
```

#### Obtenir les Factures d'un Enfant
```http
GET /enfants/:id/factures
```

#### Telecharger une Facture PDF
```http
GET /factures/:id/pdf
```

#### Exporter pour CAF/PSU
```http
GET /facturation/export-caf?creche_id=xxx&mois=1&annee=2024
```

---

### Planning

#### Planning des Employes
```http
GET /creches/:id/planning/employes?semaine=2024-W03
```

#### Planning des Enfants
```http
GET /creches/:id/planning/enfants?semaine=2024-W03
```

#### Creer/Modifier un Planning Employe
```http
POST /planning/employes
Content-Type: application/json

{
  "employe_id": "emp_123",
  "date": "2024-01-15",
  "heure_debut": "08:00",
  "heure_fin": "16:00",
  "type": "travail"
}
```

---

## Codes d'Erreur

| Code | Signification |
|------|---------------|
| 400 | Requete invalide (validation) |
| 401 | Non authentifie |
| 403 | Acces refuse (permissions) |
| 404 | Ressource non trouvee |
| 409 | Conflit (doublon) |
| 422 | Entite non traitable |
| 429 | Trop de requetes |
| 500 | Erreur serveur |

**Format d'Erreur:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ 'email' est requis",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| POST /auth/* | 10/min par IP |
| GET /* | 1000/min par token |
| POST /* | 100/min par token |
| POST /transmissions/generer | 50/heure par creche |

## Webhooks

### Configurer un Webhook
```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://votre-serveur.com/webhook",
  "events": ["pointage.arrivee", "pointage.depart", "transmission.envoyee"],
  "secret": "votre_secret"
}
```

### Evenements Disponibles

- `pointage.arrivee`
- `pointage.depart`
- `activite.creee`
- `transmission.envoyee`
- `alerte.creee`
- `facture.generee`

### Payload Webhook
```json
{
  "event": "pointage.arrivee",
  "timestamp": "2024-01-15T08:32:15Z",
  "data": {
    "pointage_id": "poi_abc",
    "enfant_id": "enf_123",
    "enfant_prenom": "Leo"
  },
  "signature": "sha256=..."
}
```

## SDK / Clients

### JavaScript/TypeScript

```typescript
import { MoussyClient } from '@moussy/sdk';

const client = new MoussyClient({
  baseUrl: 'https://api.moussy.fr',
  token: 'votre_jwt_token'
});

// Pointer un enfant
await client.pointages.arrivee({
  enfantId: 'enf_123',
  methode: 'manuel'
});

// Generer une transmission
const transmission = await client.transmissions.generer({
  enfantId: 'enf_123',
  date: new Date()
});
```

### cURL Examples

```bash
# Login
curl -X POST https://api.moussy.fr/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# Lister les enfants presents
curl https://api.moussy.fr/pointages/aujourd-hui \
  -H "Authorization: Bearer <token>"

# Enregistrer un repas
curl -X POST https://api.moussy.fr/activites \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "enfant_id": "enf_123",
    "type_activite": "repas",
    "details": {"type": "dejeuner", "quantite": "bien", "menu": "puree"}
  }'
```
