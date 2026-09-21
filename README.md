# Cartly

A full-stack, multi-tenant e-commerce platform — sellers create their own stores, customers browse and buy across the platform, and admins manage everything from a dedicated dashboard. Built across web and native mobile with a shared Go/GraphQL backend.

## Tech Stack
- **Backend:** Go · GraphQL (gqlgen) · PostgreSQL · JWT Auth · bcrypt
- **Web Frontend:** React · TypeScript · Vite · Apollo Client
- **Mobile:** React Native (Expo) · TypeScript · Expo Router · Apollo Client
- **AI:** Groq (Llama 3.1) for AI-generated product descriptions
- **Testing:** Go testing (backend) · Vitest + React Testing Library (frontend)
- **Cloud/DevOps:** Google Cloud Platform (Cloud Run, Cloud SQL, Artifact Registry, IAM) · Docker (multi-stage builds) · GitHub Actions (CI/CD)

## Deployment
Production runs on GCP Cloud Run (backend + frontend, containerized via Docker multi-stage builds) with Cloud SQL for PostgreSQL. Artifact Registry stores container images; GitHub Actions builds, tests, and deploys on every push to main. See `.github/workflows` for the full pipeline.

**Live:** https://cartly-frontend-684259393008.us-central1.run.app

## Architecture
```
CARTLY/
├── backend/    # Go GraphQL API + PostgreSQL
├── frontend/   # React web app
├── mobile/     # Expo React Native app
└── .github/    # CI/CD workflows
```

All three clients (web, mobile) talk to the same backend API, ensuring feature parity and a single source of truth for business logic.

### Backend structure
```
backend/
├── cmd/server/      # Entry point, HTTP server, CORS, middleware wiring
├── graph/           # GraphQL schema + resolvers
├── internal/
│   ├── auth/        # JWT, password hashing, refresh/reset tokens
│   ├── ai/          # Groq AI integration
│   ├── email/       # Transactional email (welcome, order confirmation, password reset)
│   ├── ratelimit/   # IP-based rate limiting
│   ├── shipping/    # Package-size suggestion logic
│   ├── storage/     # Image upload handling
│   ├── config/      # Environment configuration
│   └── db/          # Database connection
```

## Key Features

**Multi-role authentication**
Three completely separate account types — Owner (sellers), Customer (buyers), and Admin (platform management) — each with their own table, JWT role claim, and permissions. Includes refresh tokens and a full forgot/reset-password flow (with email-enumeration protection) for all three roles.

**Store & product management**
Sellers create a store, manage categories, and run full CRUD on products — including image upload and AI-generated product descriptions (Groq/Llama 3.1).

**Customer shopping flow**
Browse stores → view product details → add to cart → checkout (with inline account creation/login) → place order. Orders are idempotent — accidental double-submission never creates duplicate orders.

**Admin dashboard**
Platform-wide stats with clickable drill-down views into all stores, owners, customers, and orders. Cascading delete for stores (removes all associated products, categories, and orders).

## Security
- Parameterized SQL throughout (verified safe against injection via manual testing)
- XSS safety verified via direct testing
- IP-based rate limiting (100 req/min, burst 20)
- Bcrypt password hashing, JWT with short-lived access tokens + refresh token rotation
- Input length validation, client and server side

## Running Locally

**Prerequisites**
- Go 1.22+
- Node.js 20+
- PostgreSQL
- Expo Go app (for mobile testing)

### 1. Database setup
Create a PostgreSQL database and run the schema (see `backend/` for table definitions).

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in your own DB credentials, JWT secret, etc.
go run cmd/server/main.go
```
Runs on http://localhost:8080 — GraphQL Playground available at the root.

### 3. Web frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173.

### 4. Mobile app
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with the Expo Go app on your phone. Update `mobile/config.ts` with your machine's local network IP so your phone can reach the backend.

## Testing
```bash
# Backend
cd backend
go test ./...

# Web frontend
cd frontend
npm run test
```
CI runs both automatically on every push via GitHub Actions.

## Known Limitations (by design)
- **No payment processing** — order placement is fully functional, but no real payment gateway (e.g., Stripe) is integrated yet. This was a deliberate scope decision for this stage of the project.
- **Single-currency** — no multi-currency support.
- **Local network only for mobile testing** — the mobile app currently points to a local IP for development; production deployment would use a real domain.

## Why This Project
Built as a portfolio piece demonstrating full-stack, multi-client architecture: a single backend serving both a web and native mobile client, with real security practices (not just CRUD), automated testing, CI/CD, and a production cloud deployment — the kind of engineering discipline expected in a production environment, not just a tutorial project.
