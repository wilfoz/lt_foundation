# LT Foundation — CLAUDE.md

## Project
Sistema de cálculo, validação e emissão de planilhas de fundações de Torres de Linha de Transmissão (LT).

## Stack
- **Backend**: NestJS (apps/api) — Clean Architecture + DDD + Hexagonal (Ports & Adapters)
- **Frontend**: Angular v20+ (apps/web) — Standalone components, Signals, Tailwind CSS v3+
- **ORM**: Prisma + PostgreSQL 16
- **Tests**: Jest (unit + integration via Testcontainers), Playwright (e2e)
- **Container**: Docker Compose (`docker/docker-compose.yml`)

## Commands
```bash
# Start DB + services
npm run docker:up

# Backend dev
cd apps/api && npm run start:dev

# Frontend dev (proxy → localhost:3000)
cd apps/web && npm run start

# Run API unit tests
cd apps/api && npx jest

# Prisma
cd apps/api && npm run prisma:migrate   # apply migrations
cd apps/api && npm run prisma:generate  # regenerate client
cd apps/api && npm run prisma:seed      # seed catalog data

# Swagger UI
http://localhost:3000/api/docs
```

## Architecture (per bounded context)
```
modules/<context>/
├── domain/       — entities, value objects, domain services (no framework deps)
├── application/  — use cases, ports (interfaces)
├── infrastructure/ — adapters (Prisma, ExcelJS)
└── presentation/ — NestJS controllers, DTOs, mappers
```

## Code language
- Source code (classes, methods, vars, DB tables): **English**
- UI labels and specs: **Portuguese (PT-BR)**

## Key domain rules
- Self-supporting tower: exactly 4 legs (A B C D)
- Guyed tower: exactly 1 MC + 4 stays (A B C D)
- Mixed foundation types per leg/element allowed (RN-103 / RN-203)
- Calculation blocked if any required input is missing (RN-006)
- Final spreadsheet emission blocked if any BLOCKING validation is active (V-016)

## Specs location
`Docs/.specs/` — all business rules, formulas and acceptance criteria
