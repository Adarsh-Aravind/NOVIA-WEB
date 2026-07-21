# NOVIA Web

A refined web companion interface for the NOVIA application ecosystem. Built to synchronize seamlessly with the primary mobile application, it leverages a unified Supabase architecture to ensure real-time data consistency across all platforms. Designed with a sophisticated forest and neumorphic-glass aesthetic.

## Architecture & Integration

NOVIA Web acts as an extension of the primary mobile experience, granting full access to your personalized data from any modern desktop browser. It shares the identical authentication state, database schema, and realtime infrastructure as the mobile client.

## Core Capabilities

- **Dashboard**: Advanced mood analytics, partner mood insights, and aggregated daily statistics encompassing open complaints, pending tasks, financial settlements, and cycle tracking.
- **Shared Notes**: Synchronized documentation platform with real-time updates.
- **Complaint Management**: Integrated ticketing system supporting threaded discussions and resolution workflows.
- **Task Management**: Shared recurring and one-off task scheduling.
- **Brainstorming**: Categorized ideation for objectives, studies, and future planning.
- **Financial Tracking**: Comprehensive expense and borrowing ledger, featuring automated settlement calculations and monthly subscription forecasting.
- **Bucket List**: Shared aspiration tracking structured by category.
- **Cycle Analytics**: Advanced physiological tracking with predictive modeling for phases and fertile windows.
- **Health Logs**: Personalized dietary and sleep pattern recording.
- **System Updates**: Centralized changelog for shared environments.
- **Profile Management**: Complete control over display settings, pairing configurations, and authentication.

## Security & Access Control

Access is strictly governed by Supabase Row Level Security (RLS) policies. The web client utilizes the public publishable key, enforcing that all data retrieval and mutation operations are restricted strictly to the authenticated couple's dataset. Session management is handled securely via standard web storage protocols.

## Technical Stack

- React 18
- Vite
- TypeScript
- Supabase (PostgreSQL & Realtime)
- Lucide Icons

## Local Development

Ensure Node.js is installed on your environment before proceeding.

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Initialize the development server
npm run dev
```

The application will be accessible at `http://localhost:5273`.

## Deployment

The application is structured as a static Single Page Application (SPA).

1. Execute the build process:
   ```bash
   npm run build
   ```
2. Deploy the resulting `dist/` directory to any static hosting provider.
3. Ensure the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) are configured in your hosting provider's settings.
4. Configure fallback routing to `index.html` to support SPA navigation.

## Project Architecture

- `src/context/`: Authentication, session, and pairing state management.
- `src/lib/`: Database clients, realtime hooks, calculation utilities, and formatters.
- `src/components/`: Layout structures, modals, and reusable interface primitives.
- `src/pages/`: Feature-specific route components.
- `src/`: Root style definitions, including design system tokens and layout utilities.
