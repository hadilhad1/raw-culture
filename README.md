# RAW-CULTURE

A premium streetwear e-commerce monorepo for the RAW-CULTURE brand.

## Structure

- frontend: customer storefront
- admin: administrator dashboard
- backend: Express + Prisma API and data layer

## Quick start

1. Install dependencies:
   npm install
2. Copy environment variables:
   cp .env.example .env
3. Prepare the database:
   npm run db:generate --workspace backend
   npm run db:migrate --workspace backend
   npm run db:seed --workspace backend
4. Start all apps:
   npm run dev

## Local URLs

- Frontend: http://localhost:3000
- Admin: http://localhost:3001
- Backend: http://localhost:4000/api

## Notes

This project is structured to demonstrate a production-ready monorepo with connected frontend, admin, and backend logic. The dashboard and storefront are intentionally designed around a shared backend API and seed data.

## Cloudflare Worker paths

- `/`: storefront assets from `frontend/dist`
- `/admin`: admin assets from `admin/dist`
- `/api` and `/backend`: proxied to the backend URL configured as the Cloudflare `BACKEND_URL` variable

The Express backend must be deployed separately. Set its `CORS_ORIGIN` to the public Worker origin, then set `BACKEND_URL` in the Cloudflare Worker environment.
