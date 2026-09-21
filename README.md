# Cartly

A full-stack, multi-tenant e-commerce platform — sellers create their own stores, customers browse and buy across the platform, and admins manage everything from a dedicated dashboard. Built across web and native mobile with a shared Go/GraphQL backend.

## Tech Stack
- **Backend:** Go · GraphQL (gqlgen) · PostgreSQL · JWT Auth · bcrypt
- **Web Frontend:** React · TypeScript · Vite · Apollo Client
- **Mobile:** React Native (Expo) · TypeScript · Expo Router · Apollo Client
- **AI:** Groq (Llama 3.1) for AI-generated product descriptions
- **Testing:** Go testing (backend) · Vitest + React Testing Library (frontend)
- **CI:** GitHub Actions — runs backend, frontend, and mobile tests/builds on every push

## Deployment
Not yet deployed. Runs locally (see below); a Docker/cloud deployment step is not yet configured.

## Architecture

CARTLY/
├── backend/ # Go GraphQL API + PostgreSQL
├── frontend/ # React web app
├── mobile/ # Expo React Native app
└── .github/ # CI workflows


All three clients (web, mobile) talk to the same backend API, ensuring feature parity and a single source of truth for business logic.

### Backend structure

backend/
├── cmd/server/ # Entry point, HTTP server, CORS, middleware wiring
├── graph/ # GraphQL schema + resolvers
├── internal/
│ ├── auth/ # JWT, password hashing, refresh/reset tokens
│ ├── ai/ # Groq AI integration
│ ├── email/ # Transactional email (welcome, order confirmation, password reset)
│ ├── ratelimit/ # IP-based rate limiting
│ ├── shipping/ # Package-size suggestion logic
│ ├── storage/ # Image upload handling
│ ├── config/ # Environment configuration
│ └── db/ # Database connection


## Key Features

**Multi-role authentication**
Three completely separate account types — Owner (sellers), Customer (buyers), and Admin (platform management) — each with their own table, JWT role claim, and permissions. Includes refresh tokens and a full forgot/reset-password flow (with email-enumeration protection) for all three roles.

**Store & product management**
Sellers create a store, manage categories, and run full CRUD on products — including image upload and AI-generated product descriptions (Groq/Llama 3.1).

**Customer shopping flow**
Browse stores → view product details → add to cart → checkout (with inline account creation/login) → place order. Orders are idempotent — accidental double-submission never creates duplicate orders. Stock is checked and updated atomically at order time.

**Admin dashboard**
Platform-wide stats with clickable drill-down views into all stores, owners, customers, and orders. Cascading delete for stores (removes all associated products, categories, and orders).

## Security
- Parameterized SQL throughout — no string-concatenated queries
- Every write is scoped to the authenticated user's own store, verified server-side against the database, not just their role
- Order placement validates and updates stock atomically within a single database transaction, so concurrent orders can't oversell inventory
- Account creation and session-token issuance run as a single atomic operation
- IP-based rate limiting (100 req/min, burst 20)
- Bcrypt password hashing, JWT with short-lived access tokens + refresh token rotation
- Input length validation, client and server side

## Running Locally

**Prerequisites**
- Go 1.22+
- Node.js 20+
- PostgreSQL (with `pgcrypto` extension available)
- Expo Go app (for mobile testing)

### 1. Database setup
Create a PostgreSQL database and run the schema:
```bash
psql -U postgres -d cartly -f backend/migrations/001_init.sql
```

### 2. Backend
Create `backend/.env` with your database credentials, a JWT secret, and (optionally) Groq and SMTP keys. See `internal/config/config.go` for the full list of expected variables.

Then:
```bash
cd backend
go run cmd/server/main.go
```
Runs on http://localhost:8080 — GraphQL Playground available at the root.

Admin accounts have no self-serve signup by design. Create one directly in the database:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO admins (email, password_hash)
VALUES ('you@example.com', crypt('yourpassword', gen_salt('bf')));
```

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
CI runs all three test suites (backend, frontend, mobile) automatically on every push via GitHub Actions. Backend tests run against a disposable Postgres service container spun up inside the CI job itself, so no real credentials are needed there.

## Known Limitations (by design)
- **No payment processing** — order placement is fully functional, but no real payment gateway (e.g., Stripe) is integrated yet.
- **Single-currency** — no multi-currency support.
- **Not yet deployed** — runs locally; cloud deployment is planned but not configured.

## Why This Project
Built as a portfolio piece demonstrating full-stack, multi-client architecture: a single backend serving both a web and native mobile client, with real security practices (not just CRUD) and automated testing — the kind of engineering discipline expected in a production environment, not just a tutorial project.