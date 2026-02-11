# ZuriDrop

Plateforme de livraison et gestion marchande — Monorepo pnpm.

---

## Architecture

```
zuridrop/
├── apps/
│   ├── api/              # NestJS + TypeScript (port 3001)
│   ├── merchant-web/     # Next.js 14 – Dashboard marchand (port 3002)
│   ├── admin-web/        # Next.js 14 – Panneau admin (port 3003)
│   └── mobile/           # Expo React Native – App client
├── packages/
│   ├── shared/           # Types, enums, DTOs partagés
│   └── ui/               # Composants UI réutilisables
├── docker-compose.yml    # PostgreSQL 16 + Redis 7
├── tsconfig.base.json    # Config TypeScript partagée
└── pnpm-workspace.yaml   # Configuration du monorepo
```

---

## Prérequis

| Outil       | Version minimale |
|-------------|-----------------|
| Node.js     | >= 20.0.0       |
| pnpm        | >= 9.0.0        |
| Docker      | >= 24.0         |
| Docker Compose | >= 2.0       |

### Installation de pnpm (si nécessaire)

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

---

## Installation

```bash
# 1. Cloner le repo
git clone <repo-url> zuridrop
cd zuridrop

# 2. Copier les fichiers d'environnement
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/merchant-web/.env.example apps/merchant-web/.env
cp apps/admin-web/.env.example apps/admin-web/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. Installer les dépendances
pnpm install

# 4. Démarrer l'infrastructure locale
pnpm docker:up

# 5. Générer le client Prisma & pousser le schema
pnpm db:generate
pnpm db:push
```

---

## Démarrage

### Tout démarrer en parallèle

```bash
pnpm dev
```

### Démarrer individuellement

```bash
# API NestJS (http://localhost:3001)
pnpm --filter @zuridrop/api dev

# Dashboard marchand (http://localhost:3002)
pnpm --filter @zuridrop/merchant-web dev

# Panneau admin (http://localhost:3003)
pnpm --filter @zuridrop/admin-web dev

# App mobile (Expo)
pnpm --filter @zuridrop/mobile dev
```

---

## Scripts disponibles

| Script              | Description                                  |
|---------------------|----------------------------------------------|
| `pnpm dev`          | Démarre toutes les apps en mode développement |
| `pnpm build`        | Build toutes les apps                         |
| `pnpm lint`         | Lint tout le monorepo                         |
| `pnpm format`       | Formate le code avec Prettier                 |
| `pnpm format:check` | Vérifie le formatage                          |
| `pnpm docker:up`    | Démarre PostgreSQL + Redis                    |
| `pnpm docker:down`  | Arrête les containers Docker                  |
| `pnpm db:generate`  | Génère le client Prisma                       |
| `pnpm db:migrate`   | Exécute les migrations Prisma                 |
| `pnpm db:push`      | Pousse le schema vers la DB                   |
| `pnpm db:studio`    | Ouvre Prisma Studio                           |

---

## Infrastructure locale

| Service    | Port  | Credentials                        |
|------------|-------|------------------------------------|
| PostgreSQL | 5432  | `zuridrop` / `zuridrop_secret`     |
| Redis      | 6379  | (pas de mot de passe par défaut)   |

---

## Conventions

### Nommage des packages

- Apps : `@zuridrop/api`, `@zuridrop/merchant-web`, `@zuridrop/admin-web`, `@zuridrop/mobile`
- Packages : `@zuridrop/shared`, `@zuridrop/ui`

### Code style

- **TypeScript strict** activé partout
- **Prettier** pour le formatage automatique
- **ESLint** pour le linting
- **EditorConfig** pour la cohérence IDE
- Fin de ligne : LF (Unix)
- Indentation : 2 espaces
- Guillemets simples (`'`) en TypeScript/JavaScript

### Branches Git (recommandé)

```
main            → production
develop         → branche de développement
feature/*       → nouvelles features
fix/*           → corrections de bugs
hotfix/*        → corrections urgentes en production
```

---

## Licence

Projet privé – Tous droits réservés.
