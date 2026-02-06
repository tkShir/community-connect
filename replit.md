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
- **Events system**: Users can view published events and propose new events; admins can create, approve, deny, and delete events

## Pages
- `/` - Landing (simple login)
- `/onboarding` - Profile creation/editing
- `/discover` - Browse all potential matches
- `/suggested` - Mentor/mentee suggestions in same industry
- `/connections` - Manage requests and view accepted connections
- `/events` - View upcoming events and submit event requests
- `/profile` - View/edit your profile
- `/groups` - View and join interest groups, suggest new groups
- `/admin` - Admin panel with Users, Events, and Groups management tabs

## Database Schema
- `profiles`: User profiles with alias, bio, profession (text[]), interests (text[]), hobbies (text[]), goal (text[]), ageRange, contactMethod, contactValue
  - profession and goal are text arrays to support multi-select
- `matches`: Connection requests between profiles (pending/accepted/rejected)
- `notifications`: Notifications for connection activity and event/group status updates
- `events`: Community events with title, description, date, time, location, schedule, status, denialReason, creatorId, createdByAdmin
- `groups`: Interest groups with title, description, lineGroupLink, status, denialReason, creatorId, createdByAdmin

## Events System
- **Event statuses**: draft, pending_approval, published, denied
- **User flow**: Users propose events (status: pending_approval) → Admin reviews → Approved (published) or Denied (with reason)
- **Admin flow**: Admin creates events → Auto-published immediately
- **Notifications**: Users receive notifications when their proposed events are approved or denied (with denial reason)

## Groups System
- **Group statuses**: pending_approval, published, denied
- **User flow**: Users suggest groups (title + description, status: pending_approval) → Admin reviews → Approved (published) or Denied (with reason)
- **Admin flow**: Admin creates groups with LINE group link → Auto-published immediately; Admin can edit/delete any group
- **LINE Group Links**: Published groups display a "Join LINE Group" button linking to the LINE group
- **Notifications**: Users receive notifications when their group suggestions are approved or denied (with denial reason)

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

## Suggested Matches Logic
The Suggested page shows matches based on your selected goals:
- **Find a Mentor / Be a Mentee**: Complementary matching - mentor seekers matched with mentee seekers in the same profession
- **Professional Networking**: Users with common profession/industry OR common professional interests
- **Friendship/Social**: Users with same age range AND (common interests OR common hobbies)
- **Activity Partner**: Users with at least one common hobby

## Recent Updates (Feb 2026)
- Changed profession and goal fields from text to text[] (arrays) to support multi-select
- Edit Profile button now works - links to /onboarding where existing data loads
- Member section in sidebar is clickable and links to profile page
- All pages (Discover, Suggested, Connections, Profile) updated to display arrays
- Suggested matches now work for all goal types (networking, friendship, activity partner)
- Discover page matching: Goal-based scoring (Professional Networking → profession/interests, Friendship/Social → age/hobbies, Activity Partner → hobbies)
- Added isAdmin field to profiles for admin users
- Created Admin page (/admin) for managing all users - only accessible to admins
- Events system: Users can view/propose events, admins can create/approve/deny
- Groups system: Users can view/join groups and suggest new ones, admins can create/approve/deny/edit/delete
- Authentication uses OAuth 2.0 + OpenID Connect via Replit Auth
- Alias validation: Required field, minimum 2 characters (client and server-side)
