# ONYX - Exclusive Community Matching App

## Overview
An exclusive community matching application for professionals (ages 18-35) where users create anonymous profiles with aliases. The app matches users based on shared goals (mentor/mentee/networking/activity partner) while maintaining anonymity until connections are accepted.

## Tech Stack
- **Frontend**: React + Vite, TanStack Query, wouter routing, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OIDC)

## Key Features
- Anonymous profiles using aliases (real identity hidden until match)
- Profile fields: alias, bio, profession, interests, hobbies, goal, age range, contact info
- Discover page for browsing potential matches
- Suggested page for mentor/mentee matches in same industry
- Connections page showing accepted matches with contact info
- Notifications for connection requests

## Pages
- `/` - Landing (simple login)
- `/onboarding` - Profile creation/editing
- `/discover` - Browse all potential matches
- `/suggested` - Mentor/mentee suggestions in same industry
- `/connections` - Manage requests and view accepted connections
- `/profile` - View/edit your profile

## Database Schema
- `profiles`: User profiles with alias, bio, profession (text[]), interests (text[]), hobbies (text[]), goal (text[]), ageRange, contactMethod, contactValue
  - profession and goal are text arrays to support multi-select
- `matches`: Connection requests between profiles (pending/accepted/rejected)
- `notifications`: Notifications for connection activity

## Design
- Dark navy (#0f172a) and gold (#f59e0b) color scheme for exclusive feel
- Outfit font for headings, DM Sans for body text

## User Preferences
- No flashy landing page - simple login only
- Profession/industry and goals support multi-select with dropdown suggestions + custom input
- All multi-select fields (profession, goal, interests, hobbies) require at least 1 selection
- No messaging feature - just share contact info after match acceptance
- Age ranges: below 18, 18-22, 23-26, 27-30, 30-34, above 34
- Contact methods: Phone, Email, LINE

## Recent Updates (Feb 2026)
- Changed profession and goal fields from text to text[] (arrays) to support multi-select
- Edit Profile button now works - links to /onboarding where existing data loads
- Member section in sidebar is clickable and links to profile page
- All pages (Discover, Suggested, Connections, Profile) updated to display arrays
- Suggested matches logic: Mentor seekers match with Mentee seekers (complementary matching)
- Discover page matching: Goal-based scoring (Professional Networking → profession/interests, Friendship/Social → age/hobbies, Activity Partner → hobbies)
- Added isAdmin field to profiles for admin users
- Created Admin page (/admin) for managing all users - only accessible to admins
- Authentication uses OAuth 2.0 + OpenID Connect via Replit Auth
- Alias validation: Required field, minimum 2 characters (client and server-side)
