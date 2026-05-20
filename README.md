# Reservations

A lightweight web app for claiming and releasing shared test environments. 
Team members can see which environments are free or reserved, reserve one for a set duration, and end their reservation early when they're done.
Environments tracked: **DEV**, **SCRATCH**, **TEST**, **DEMO**, **ACC**.

## Tech stack
- [Astro](https://astro.build) (SSR) deployed on **Cloudflare Workers**
- [Supabase](https://supabase.com) for the reservations database and real-time updates

## Prerequisites
- Node.js >= 22.12.0
- A Supabase project with a `reservations` table
- A Cloudflare account (for production deploys)

## Environment variables
Create a `.env` file at the project root (or set these in your Cloudflare Worker secrets for production):
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Commands
All commands are run from the root of the project:

| Command                  | Action                                        |
| :----------------------- | :-------------------------------------------- |
| `npm install`            | Install dependencies                          |
| `npm run dev`            | Start local dev server at `localhost:4321`    |
| `npm run build`          | Build for production to `./dist/`             |
| `npm run preview`        | Preview the production build locally          |
