# ZuriDrop

### Full-Stack Food Delivery Platform

**ZuriDrop** is a multi-application food delivery platform built with a TypeScript monorepo architecture. It brings together customers, restaurant merchants, delivery drivers, and platform administrators through dedicated applications connected to a centralized backend.

The project explores the architecture and development of a multi-role delivery system, including order management, restaurant operations, delivery workflows, promotions, and customer reviews.

## Key Features

### Customer Application
- Browse restaurants and explore available menus.
- Manage customer account information and delivery addresses.
- Place orders and access order history.
- Follow order progress through a tracking interface.
- Apply promotional codes during checkout.
- Submit restaurant and delivery reviews.

### Merchant Dashboard
- Manage restaurant information and settings.
- Manage menu items.
- Review incoming orders.
- Access a kitchen workflow and order history.
- Update restaurant availability and preparation settings.

### Driver Dashboard
- Access delivery assignments.
- View delivery details.
- Manage delivery workflow.
- Review delivery history.
- Manage driver profile information.

### Administration Dashboard
- Access platform administration views.
- Review customers, restaurants, drivers, and orders.
- Monitor platform activity through a centralized dashboard.

## Technology Stack

| Layer | Technologies |
|---|---|
| Backend | NestJS, Node.js, TypeScript |
| Web applications | Next.js 14, React, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Caching and infrastructure | Redis 7, Docker |
| Mobile application | Expo, React Native |
| Monorepo | pnpm workspaces |
| API documentation | Swagger / OpenAPI |
| Code quality | ESLint, Prettier, TypeScript |

## Architecture

```text
zuridrop/
├── apps/
│   ├── api/              # NestJS REST API
│   ├── customer-web/     # Customer application
│   ├── merchant-web/     # Merchant dashboard
│   ├── driver-web/       # Driver application
│   ├── admin-web/        # Administration dashboard
│   └── mobile/           # Expo React Native application
├── packages/
│   ├── shared/           # Shared types and utilities
│   └── ui/               # Shared UI components
├── docker-compose.yml
└── pnpm-workspace.yaml
```

The backend provides centralized business logic and data access. Each web application serves a distinct user role.

## Local Development

### Requirements

- Node.js 20+
- pnpm 9+
- Docker 24+
- Docker Compose 2+

### Clone the repository

```bash
git clone https://github.com/chris9824/zuridrop.git
cd zuridrop
pnpm install
```

### Configure environment variables

Use the provided `.env.example` files as configuration templates.

Configure the PostgreSQL connection, Redis connection, API endpoints, and any required application-specific settings.

Do not commit real credentials or production secrets.

### Start the infrastructure

```bash
pnpm docker:up
```

For a **fresh development database**, generate the Prisma client and initialize the schema according to the project's database configuration.

```bash
pnpm db:generate
```

**Important:** Do not run database synchronization or reset commands against an existing database without reviewing their effects and creating a backup.

### Run the applications

Start the services using the corresponding workspace commands:

```bash
pnpm --filter @zuridrop/api dev
pnpm --filter @zuridrop/customer-web dev
pnpm --filter @zuridrop/merchant-web dev
pnpm --filter @zuridrop/driver-web dev
pnpm --filter @zuridrop/admin-web dev
```

### Local URLs

| Service | URL |
|---|---|
| Backend API | http://localhost:3001 |
| API documentation | http://localhost:3001/api/docs |
| Customer application | http://localhost:3004 |
| Merchant dashboard | http://localhost:3002 |
| Driver dashboard | http://localhost:3005 |
| Admin dashboard | http://localhost:3003 |

## Build Verification

The backend and all four Next.js web applications have successfully completed individual production builds during local development.

```bash
pnpm --filter @zuridrop/api build
pnpm --filter @zuridrop/customer-web build
pnpm --filter @zuridrop/merchant-web build
pnpm --filter @zuridrop/driver-web build
pnpm --filter @zuridrop/admin-web build
```

Successful builds do not replace end-to-end functional testing or production deployment validation.

## Screenshots and Demo

Screenshots of the customer, merchant, driver, and administration interfaces will be added here.

A complete demonstration of the customer-to-delivery workflow is also planned.

## Engineering Focus

ZuriDrop demonstrates experience with:

- Full-stack TypeScript development.
- Modular backend architecture.
- Multi-role application design.
- REST API integration.
- Relational database modeling.
- Order and delivery workflows.
- Monorepo organization.
- Containerized development environments.

## Project Status

**Active development — portfolio project.**

The backend and four web applications have passed local production build checks. Functional verification, deployment preparation, and documentation improvements remain ongoing.

## Repository

https://github.com/chris9824/zuridrop

## License

All rights reserved. No open-source license is currently specified.