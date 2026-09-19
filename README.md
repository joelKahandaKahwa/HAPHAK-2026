# HAPHAK 2026

**« Marche devant ma face »**

Plateforme web d'inscription, de gestion des participants et de contrôle des entrées pour la retraite chrétienne HAPHAK 2026. *HAPHAK* signifie **transforme**.

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Technologies](#2-technologies)
3. [Prérequis](#3-prérequis)
4. [Installation](#4-installation)
5. [Configuration `.env`](#5-configuration-env)
6. [Création du projet Neon](#6-création-du-projet-neon)
7. [Connexion PostgreSQL](#7-connexion-postgresql)
8. [Migration Prisma](#8-migration-prisma)
9. [Création de l'administrateur](#9-création-de-ladministrateur)
10. [Lancement local](#10-lancement-local)
11. [Production](#11-production)
12. [Déploiement](#12-déploiement)
13. [Sécurité](#13-sécurité)
14. [Sauvegardes](#14-sauvegardes)
15. [Exportation](#15-exportation)
16. [Gestion des inscriptions](#16-gestion-des-inscriptions)
17. [Scanner QR](#17-scanner-qr)
18. [Configuration de l'e-mail](#18-configuration-de-le-mail)
19. [Maintenance](#19-maintenance)

---

## 1. Présentation

### Informations officielles

| | |
|---|---|
| Nom | HAPHAK 2026 |
| Signification | transforme |
| Thème | Marche devant ma face |
| Dates | du 27 au 30 septembre 2026 |
| Rassemblement | dimanche 27 septembre à 17h00 |
| Lieu | Q. Kyeshero, Av. Topographe N°1 — réf. Entrée Tshengerero |
| Contact & assistance | +243 816 366 894 |

**Sessions quotidiennes**

| Session | Horaire | Contenu |
|---|---|---|
| Matin | 09h00 – 11h30 | Enseignement et adoration |
| Midi | 14h00 – 16h00 | Étude biblique approfondie (Centre Bérée) |
| Soir | 20h30 – 01h00 | Intercession, adoration et ateliers |

> Ces valeurs sont les défauts de la base. Toute information restant à arrêter (durée de conservation des données, e-mail de contact, WhatsApp) est marquée **À CONFIGURER** et se modifie depuis `/admin/settings` **sans toucher au code source**.

### Parcours participant

```
ACCUEIL → JE M'INSCRIS → FORMULAIRE (7 étapes) → RÉCAPITULATIF → CONFIRMATION
   → NUMÉRO D'INSCRIPTION → QR CODE → E-MAIL → ARRIVÉE → SCAN → PRÉSENCE VALIDÉE
```

Le participant ne crée **aucun compte**.

### Parcours administrateur

```
Connexion → Tableau de bord → Participants → Recherche / filtres → Fiche participant
   → Scanner QR → Présences → Statistiques → Exports → Paramètres
```

### Architecture

```
Navigateur → Application web → Node.js / Express → Prisma → PostgreSQL (Neon)
```

Le frontend ne parle **jamais** directement à la base. `DATABASE_URL` reste exclusivement côté serveur.

---

## 2. Technologies

**Frontend** — HTML5, CSS3, JavaScript moderne, mobile first, aucune dépendance de build. Seule bibliothèque externe : `jsQR` (décodage du QR dans le scanner), chargée par CDN.

**Backend** — Node.js, Express.js, architecture séparée (routes / contrôleurs / services / validateurs / middleware).

**Base de données** — PostgreSQL hébergé sur **Neon**, accédé via **Prisma**. *SQLite n'est pas utilisé.*

**Principales dépendances** : `express`, `@prisma/client`, `bcrypt`, `express-session`, `helmet`, `cors`, `express-rate-limit`, `zod`, `qrcode`, `nodemailer`, `dotenv`, `json2csv`, `xlsx`, `pdfkit`.

---

## 3. Prérequis

- Node.js **18 ou plus** (`node -v`)
- npm
- Un compte [Neon](https://neon.tech) (offre gratuite suffisante pour démarrer)
- Un accès SMTP pour l'envoi des e-mails de confirmation

---

## 4. Installation

```bash
git clone <URL_DU_DEPOT>
cd haphak
npm install
```

`npm install` déclenche automatiquement `prisma generate`.

---

## 5. Configuration `.env`

```bash
cp .env.example .env
```

Puis remplissez `.env` :

| Variable | Rôle |
|---|---|
| `PORT` | Port d'écoute (défaut `3000`) |
| `NODE_ENV` | `development` ou `production` |
| `APP_URL` | URL publique de l'application |
| `DATABASE_URL` | Chaîne de connexion Neon (§6) |
| `SESSION_SECRET` | Secret des sessions — générez-le : `openssl rand -hex 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Identifiants du **premier** administrateur (§9) |
| `SMTP_HOST` `SMTP_PORT` `SMTP_SECURE` `SMTP_USER` `SMTP_PASSWORD` | Serveur d'envoi (§18) |
| `MAIL_FROM` | Expéditeur affiché des e-mails |

**Règles absolues**

- `.env` est déjà dans `.gitignore` — ne le committez jamais.
- Seul `.env.example` est versionné.
- `DATABASE_URL` n'est jamais exposée au frontend.

---

## 6. Création du projet Neon

1. Créez un compte sur [neon.tech](https://neon.tech).
2. **Create project** → nommez-le par exemple `haphak-2026`, choisissez la région la plus proche de vos participants.
3. Neon crée automatiquement une base PostgreSQL (par défaut `neondb`).
4. Ouvrez **Connection string** et copiez la chaîne au format *Prisma / Node*. Elle ressemble à :

```
postgresql://UTILISATEUR:MOT_DE_PASSE@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

5. Collez-la dans `.env` :

```env
DATABASE_URL="postgresql://...?sslmode=require"
```

> `?sslmode=require` est **obligatoire** avec Neon.

---

## 7. Connexion PostgreSQL

Testez la connexion :

```bash
npx prisma db pull
```

Une erreur d'authentification signale une chaîne mal copiée. Au démarrage, le serveur affiche également :

```
✅ Connexion PostgreSQL (Neon) établie.
```

---

## 8. Migration Prisma

Créez les tables :

```bash
npm run db:migrate
```

Tables créées : `admins`, `registrations`, `attendance`, `retreat_settings`, `retreat_sessions`.

Autres commandes :

```bash
npm run db:generate        # régénère le client Prisma
npm run db:studio          # explorateur visuel de la base
npm run db:migrate:deploy  # applique les migrations en production
```

---

## 9. Création de l'administrateur

Renseignez `ADMIN_USERNAME` et `ADMIN_PASSWORD` dans `.env`, puis :

```bash
npm run create-admin
```

Le mot de passe est haché avec **bcrypt** (12 tours) — jamais stocké en clair. Le script crée aussi la ligne de paramètres par défaut.

Données de test facultatives, toutes préfixées `[TEST]` :

```bash
npm run seed
```

---

## 10. Lancement local

```bash
npm run dev
```

| | |
|---|---|
| Site public | http://localhost:3000 |
| Formulaire | http://localhost:3000/registration.html |
| Administration | http://localhost:3000/admin/login |

---

## 11. Production

```bash
npm run build   # prisma generate
npm start
```

Avec `NODE_ENV=production` : cookies `Secure`, logs réduits, aucun détail interne renvoyé au client.

---

## 12. Déploiement

Toute plateforme compatible Node.js convient (Render, Railway, Fly.io, VPS…).

```
Installation → Configuration .env → Connexion Neon → Migration PostgreSQL → Build → Démarrage
```

1. **Build command** : `npm install && npm run build`
2. **Start command** : `npm start`
3. **Variables d'environnement** à définir dans le tableau de bord de la plateforme :
   `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `APP_URL`,
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`
4. Après le premier déploiement, appliquez les migrations :
   ```bash
   npm run db:migrate:deploy
   ```
5. Créez l'administrateur : `npm run create-admin`

L'application fait confiance au proxy (`trust proxy`) pour que les cookies sécurisés fonctionnent derrière HTTPS.

---

## 13. Sécurité

- **Helmet** avec politique de sécurité de contenu (CSP)
- **CORS** restreint à `APP_URL`
- **Rate limiting** : API publique, création d'inscription, et connexion admin (anti brute-force)
- **Validation Zod côté serveur** sur chaque inscription — la validation frontend n'est jamais suffisante
- **Prisma** : requêtes paramétrées, aucune concaténation SQL
- **bcrypt** pour les mots de passe
- **Sessions** : cookies `HttpOnly`, `SameSite=lax`, `Secure` en production, expiration 8 h
- **Routes `/admin` protégées** — côté API et côté pages
- **Échappement** de toute donnée insérée dans le DOM (protection XSS)
- **Erreurs** : aucune stack trace, requête SQL ou secret renvoyé au client
- Le **QR Code ne contient aucune donnée personnelle** — seulement un token aléatoire (`HAPHAK-<hex>`) qui permet au serveur de retrouver l'inscription
- Un **QR invalide ne révèle rien** : le message est identique quel que soit le code

---

## 14. Sauvegardes

Neon assure des sauvegardes automatiques et un *point-in-time restore* (console Neon → **Branches** / **History**).

Sauvegarde manuelle :

```bash
pg_dump "$DATABASE_URL" > sauvegarde-$(date +%F).sql
```

Restauration :

```bash
psql "$DATABASE_URL" < sauvegarde-2026-01-15.sql
```

Faites également un export CSV avant tout événement important (§15).

---

## 15. Exportation

Depuis `/admin/registrations` : **CSV**, **Excel**, **PDF**, ou impression directe.

Les exports **respectent les filtres appliqués à l'écran**. Exemple : Ville = Goma, Sexe = Femme, Hébergement = Oui → l'export ne contient que ces participants.

---

## 16. Gestion des inscriptions

| Page | Rôle |
|---|---|
| `/admin` | Statistiques : total, hommes, femmes, membres, hébergement, présents, absents, inscriptions du jour et de la semaine, répartition par ville |
| `/admin/registrations` | Liste complète : recherche, filtres (ville, sexe, membre, hébergement, présence, dates), tri, pagination. Sur smartphone, le tableau devient des cartes. |
| `/admin/participant?id=…` | Fiche complète : modifier, supprimer (avec confirmation), imprimer, exporter |
| `/admin/attendance` | Historique des passages à l'entrée |
| `/admin/settings` | Nom, signification, thème, dates, heure, lieu, description, contacts, période d'inscription, sessions |

Statuts d'inscription : `REGISTERED`, `CONFIRMED`, `CANCELLED`. Présence : absent / présent.

La pagination est faite **côté serveur** : la liste complète n'est jamais chargée d'un bloc.

---

## 17. Scanner QR

Page `/admin/scanner`, pensée pour un téléphone tenu à l'entrée.

1. **Démarrer la caméra** — autorisez l'accès quand le navigateur le demande.
2. Présentez le QR du participant devant le viseur.
3. Résultat immédiat :

| Cas | Affichage |
|---|---|
| Valide | **Inscription valide** + nom, prénom, numéro, ville, hébergement → **PRÉSENCE VALIDÉE** |
| Déjà scanné | **Participant déjà enregistré** + date et heure du premier passage |
| Invalide | **QR CODE INVALIDE** — aucune information personnelle affichée |

Un champ de **saisie manuelle** permet d'entrer le code si la caméra ne fonctionne pas.

> La caméra exige **HTTPS** (ou `localhost`). En production, servez le site en HTTPS.

---

## 18. Configuration de l'e-mail

Renseignez les variables `SMTP_*` dans `.env`. Exemple pour un fournisseur en TLS :

```env
SMTP_HOST=smtp.votre-fournisseur.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur
SMTP_PASSWORD=votre-mot-de-passe
MAIL_FROM="HAPHAK 2026 <no-reply@votre-domaine.com>"
```

L'e-mail envoyé contient le nom de la retraite, le thème, le nom du participant, son numéro d'inscription, les dates, le lieu s'il est configuré, et **son QR Code personnel**.

Chaque inscription porte un statut d'envoi visible dans l'administration :

- `EMAIL_PENDING` — en attente
- `EMAIL_SENT` — envoyé
- `EMAIL_FAILED` — échec

**Une erreur d'envoi ne détruit jamais l'inscription** : elle est enregistrée d'abord, l'e-mail ensuite. Si SMTP n'est pas configuré, l'application fonctionne et signale simplement que l'e-mail n'a pas été envoyé.

---

## 19. Maintenance

**Avant l'événement**

- Vérifiez lieu, dates et horaires dans `/admin/settings`, et complétez les champs restés **À CONFIGURER** (e-mail de contact, WhatsApp)
- Vérifiez les horaires des sessions
- Faites une inscription de test de bout en bout : formulaire → e-mail → scan
- Vérifiez que le scanner fonctionne sur les téléphones qui seront utilisés à l'entrée
- Supprimez les données `[TEST]` du seed

**Pendant**

- Un ou deux téléphones sur `/admin/scanner`, connectés au même compte ou à des comptes distincts (le scanneur est enregistré dans l'historique)
- Surveillez le tableau de bord pour le compte des présents

**Après**

- Exportez les participants et les présences
- Sauvegardez la base (§14)
- Appliquez la politique de conservation annoncée sur `/confidentialite.html`

---

## Structure du projet

```
haphak/
├── server/
│   ├── app.js                  Configuration Express, sécurité, routes
│   ├── server.js               Point d'entrée
│   ├── config/                 env.js, database.js
│   ├── controllers/            registration, admin, attendance, settings, export
│   ├── routes/                 registration, admin, attendance, settings
│   ├── middleware/             auth, errorHandler, rateLimiter
│   ├── services/               emailService, qrService, registrationService
│   ├── validators/             registrationValidator (Zod)
│   └── database/               createAdmin.js, seed.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/                     Site participant (index, registration, success, confidentialité)
├── admin/                      Pages d'administration
├── exports/
├── .env.example
└── package.json
```

## API REST

**Public**

| Méthode | Route |
|---|---|
| GET | `/api/retreat` |
| POST | `/api/registrations` |
| GET | `/api/registrations/confirmation/:registrationNumber` |

**Administration** — toutes protégées par session

| Méthode | Route |
|---|---|
| POST | `/api/admin/login` · `/api/admin/logout` |
| GET | `/api/admin/dashboard` |
| GET | `/api/admin/registrations` · `/api/admin/registrations/:id` |
| PUT / DELETE | `/api/admin/registrations/:id` |
| POST | `/api/admin/scanner` |
| GET | `/api/admin/attendance` |
| GET | `/api/admin/export/csv` · `/excel` · `/pdf` |
| GET / PUT | `/api/admin/settings` |
| PUT | `/api/admin/settings/sessions` |

---

## Protection des données

Seules les informations nécessaires à l'organisation de la retraite sont collectées. Elles ne sont accessibles qu'aux administrateurs authentifiés et ne sont pas partagées avec des tiers sans autorisation appropriée. La page publique `/confidentialite.html` explique au participant pourquoi ses données sont collectées, comment elles sont utilisées, qui y accède et comment en demander la suppression.
