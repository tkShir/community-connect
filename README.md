# ONYX - Exclusive Community Matching App

An exclusive community matching application for professionals (ages 18-35) where users create anonymous profiles with aliases. The app matches users based on shared goals while maintaining anonymity until connections are accepted.

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd onyx
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages for both the frontend and backend.

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/onyx
SESSION_SECRET=your-secret-key-here
```

Replace:
- `username` with your PostgreSQL username
- `password` with your PostgreSQL password
- `onyx` with your database name
- `your-secret-key-here` with a random string for session encryption

### 4. Set Up the Database

Create a new PostgreSQL database:

```bash
createdb onyx
```

Push the database schema:

```bash
npm run db:push
```

This will create all required tables in your database.

## Running the Application

### Development Mode

Start both the frontend and backend with a single command:

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

### What This Command Does

- Starts the Express.js backend server
- Starts the Vite development server for the React frontend
- Both servers run on port 5000 (Vite proxies API requests to Express)

## Project Structure

```
onyx/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and API client
├── server/                 # Backend (Express.js)
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Database operations
│   └── auth.ts             # Authentication logic
├── shared/                 # Shared code (types, schemas)
│   └── schema.ts           # Database schema and types
└── db/                     # Database configuration
```

## Demo Walkthrough

1. **Landing Page**: Open http://localhost:5000 in your browser
2. **Login**: Click "Member Login" to authenticate
3. **Onboarding**: Create your anonymous profile with:
   - Alias (anonymous name)
   - Age range
   - Profession/Industry (multi-select)
   - Goals (mentor/mentee/networking/activity partner)
   - Bio
   - Interests and Hobbies
   - Contact information (shared only after match)
4. **Discover**: Browse other members and send connection requests
5. **Suggested**: View mentor/mentee matches in your industry
6. **Connections**: Manage pending requests and view accepted connections
7. **Profile**: View and edit your profile

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

## Tech Stack

- **Frontend**: React, Vite, TanStack Query, wouter, shadcn/ui, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (OIDC)

## Troubleshooting

### Database Connection Issues

If you see database connection errors:
1. Verify PostgreSQL is running
2. Check your `DATABASE_URL` in `.env`
3. Ensure the database exists: `psql -l`

### Port Already in Use

If port 5000 is in use:
```bash
lsof -i :5000
kill -9 <PID>
```

### Missing Dependencies

If you encounter module errors:
```bash
rm -rf node_modules
npm install
```
