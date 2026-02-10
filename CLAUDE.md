# CLAUDE.md - AI Assistant Guide for ONYX (Community Connect)

## Project Overview

ONYX is an exclusive community matching web application for professionals (ages 18-35). Users create anonymous profiles with aliases and get matched based on shared goals (mentor/mentee/networking/activity partner). Contact information is only revealed after both parties accept a connection. The app also supports community events and interest groups with admin approval workflows.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 7, TanStack Query, Wouter (router), shadcn/ui + Radix UI, Tailwind CSS, Framer Motion, React Hook Form + Zod
- **Backend:** Express.js 5, TypeScript, Drizzle ORM, PostgreSQL 16
- **Auth:** Auth0 / OpenID Connect via `express-openid-connect`
- **Build:** Vite (client), esbuild (server), tsx (dev runner)

## Project Structure

```
community-connect/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components + ui/ (shadcn)
│   │   ├── pages/              # Page components (Landing, Onboarding, Discover, etc.)
│   │   ├── hooks/              # Custom hooks (use-auth, use-profiles, use-matches, etc.)
│   │   ├── lib/                # Utilities (queryClient, auth-utils, i18n, utils)
│   │   ├── App.tsx             # Root component with routing
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles + Tailwind + CSS variables
│   └── index.html
├── server/                     # Express backend
│   ├── main.ts                 # Entry point (loads .env)
│   ├── index.ts                # Express app setup + middleware
│   ├── routes.ts               # API route handlers
│   ├── storage.ts              # IStorage interface + DatabaseStorage implementation
│   ├── db.ts                   # Drizzle ORM + PostgreSQL pool
│   ├── auth0.ts                # Auth0/OIDC configuration
│   ├── vite.ts                 # Vite dev server integration
│   └── static.ts               # Static file serving (production)
├── shared/                     # Shared types and schemas
│   ├── schema.ts               # Drizzle table definitions, Zod schemas, TypeScript types
│   ├── routes.ts               # API contract definitions with Zod validation
│   └── models/auth.ts          # Auth-related tables (users, sessions)
├── script/
│   └── build.ts                # Production build script
├── docker-compose.yaml         # PostgreSQL setup
├── drizzle.config.ts           # Drizzle ORM config
├── vite.config.ts              # Vite config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── translation.json            # i18n translations (EN/JP)
```

## Commands

```bash
npm run dev          # Start dev server (Express + Vite HMR) on port 5173
npm run build        # Production build (Vite client + esbuild server)
npm run start        # Run production build (node dist/index.cjs)
npm run check        # TypeScript type checking (tsc --noEmit)
npm run db:push      # Push Drizzle schema changes to PostgreSQL
```

Database requires PostgreSQL running. Use `docker-compose up -d` to start it locally.

## Architecture Patterns

### Path Aliases

- `@/*` maps to `client/src/*`
- `@shared/*` maps to `shared/*`

### Data Flow

1. **Shared schemas** (`shared/schema.ts`) define Drizzle tables and export Zod insert schemas + TypeScript types
2. **Shared routes** (`shared/routes.ts`) define API contracts with paths and Zod input validators
3. **Server routes** (`server/routes.ts`) implement handlers using the contracts, calling `storage` methods
4. **Storage layer** (`server/storage.ts`) implements `IStorage` interface with `DatabaseStorage` class using Drizzle queries
5. **Client hooks** (`client/src/hooks/`) use TanStack Query to call API endpoints and manage cache

### State Management

- Server state managed via TanStack Query (React Query) with `staleTime: Infinity` and manual invalidation
- No Redux or Context-based global state
- Query keys follow the API path pattern (e.g., `/api/profiles/me`)
- Custom `apiRequest` helper in `lib/queryClient.ts` handles fetch + error responses
- Auth errors trigger automatic redirect to login via `throwIfResNotOk`

### Routing

- Wouter (lightweight router) with `Switch`/`Route` components in `App.tsx`
- `ProtectedRoute` wrapper checks auth status and profile existence
- Unauthenticated users redirect to `/` (Landing)
- Authenticated users without profiles redirect to `/onboarding`

### Authentication

- Auth0 via `express-openid-connect` middleware
- OIDC user ID accessed via `req.oidc.user.sub`
- Session-based auth (express-session)
- Client checks auth via `GET /api/auth/user`

### Styling

- Tailwind CSS with CSS custom properties (HSL) defined in `client/src/index.css`
- shadcn/ui components in `client/src/components/ui/` (new-york style variant)
- Theme: dark navy background (#0f172a), gold/amber primary (#f59e0b)
- Fonts: DM Sans (body), Outfit (display)

### Form Handling

- React Hook Form with `@hookform/resolvers` for Zod schema validation
- Zod schemas shared between client validation and server validation

### Internationalization

- Simple key-value i18n in `client/src/lib/i18n.ts`
- Translations stored in `translation.json` (English + Japanese)
- Usage: `t(file, key)` or `tWithVars(file, key, variables)`

## Database Schema

Six tables defined in `shared/schema.ts` and `shared/models/auth.ts`:

- **users** - Auth users (id, email, firstName, lastName)
- **profiles** - Anonymous user profiles (alias, bio, profession[], interests[], hobbies[], goal[], ageRange, contactMethod, contactValue, isAdmin)
- **matches** - Connection requests (initiatorId, receiverId, status: pending/accepted/rejected)
- **notifications** - User notifications (userId, content, isRead)
- **events** - Community events (title, description, date/time/location, status: draft/pending_approval/published/denied)
- **groups** - Interest groups (title, description, lineGroupLink, status: pending_approval/published/denied)

Array fields (profession, interests, hobbies, goal) use PostgreSQL text arrays.

## API Routes

All routes require authentication unless noted. Prefix: `/api/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/user` | Get current authenticated user |
| GET | `/api/profiles/me` | Get current user's profile |
| POST | `/api/profiles` | Create/update profile |
| GET | `/api/profiles/:id` | Get profile by ID |
| GET | `/api/matches/potential` | Get potential matches |
| GET | `/api/matches/suggested` | Get suggested matches (same profession) |
| GET | `/api/matches` | Get user's connections |
| POST | `/api/matches` | Send connection request |
| PATCH | `/api/matches/:id` | Accept/reject connection |
| GET | `/api/notifications` | Get user notifications |
| PATCH | `/api/notifications/:id` | Mark notification read |
| GET | `/api/events` | Get published events |
| POST | `/api/events` | Create event |
| GET | `/api/events/:id` | Get event details |
| GET | `/api/admin/profiles` | Admin: all profiles |
| PATCH | `/api/admin/profiles/:id` | Admin: update profile |
| GET | `/api/admin/events` | Admin: all events |
| POST | `/api/admin/events/:id/approve` | Admin: approve event |
| POST | `/api/admin/events/:id/deny` | Admin: deny event |
| DELETE | `/api/admin/events/:id` | Admin: delete event |
| GET | `/api/admin/groups` | Admin: all groups |
| POST | `/api/admin/groups/:id/approve` | Admin: approve group |
| POST | `/api/admin/groups/:id/deny` | Admin: deny group |
| DELETE | `/api/admin/groups/:id` | Admin: delete group |

Admin routes check `isAdmin` flag on the requesting user's profile.

## Key Conventions

### Adding a New Feature

1. Define any new tables/columns in `shared/schema.ts` with Drizzle and export Zod schemas + types
2. Add API contract in `shared/routes.ts` with path and Zod input schema
3. Add storage methods in `server/storage.ts` (interface + implementation)
4. Add route handlers in `server/routes.ts` using the storage layer
5. Create React hook in `client/src/hooks/` using TanStack Query
6. Build page/component in `client/src/pages/` or `client/src/components/`
7. Add route in `client/src/App.tsx` if it's a new page
8. Run `npm run db:push` to sync schema, then `npm run check` to verify types

### Adding UI Components

- Use `npx shadcn@latest add <component>` to add new shadcn/ui components
- Components go in `client/src/components/ui/`
- Use existing Tailwind theme variables for colors/spacing

### Code Style

- TypeScript strict mode enabled
- ESM modules (`"type": "module"` in package.json)
- Zod for all runtime validation (API inputs, form data)
- Drizzle ORM for all database queries (no raw SQL)
- API errors return `{ message: string }` JSON responses
- Mutations invalidate related query keys via `queryClient.invalidateQueries`

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/onyx
AUTH0_CLIENT_ID=<auth0-client-id>
AUTH0_ISSUER_BASE_URL=<auth0-issuer-url>
AUTH0_CLIENT_SECRET=<auth0-client-secret>
SESSION_SECRET=<random-secret>
BASE_URL=http://localhost:5173    # optional, defaults based on PORT
PORT=5173                         # optional
```

## Testing

No test framework is currently configured. There are no test files in the codebase. When adding tests, consider Vitest (already compatible with Vite config) for unit/integration tests.

## Common Gotchas

- The `profiles` table uses `userId` (varchar, references `users.id` from Auth0) not an integer FK. Match tables use `profiles.id` (serial integer) for initiatorId/receiverId.
- Array fields (profession, interests, hobbies, goal) are PostgreSQL text arrays -- use `.array()` in Drizzle schema and pass arrays in JSON.
- Admin routes are under `/api/admin/*` and are not defined via the shared `api` contract object in `shared/routes.ts` -- they are defined directly as string paths in `server/routes.ts`.
- Events created by admins are auto-published; events created by regular users start as `pending_approval`.
- The server seeds demo data on startup if the profiles table is empty (see `seedDatabase()` in `server/routes.ts`).
- Vite dev server is integrated into Express in development mode (`server/vite.ts`), so the entire app runs on a single port.
