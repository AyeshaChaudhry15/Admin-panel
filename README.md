# EVINN Admin Panel

Admin panel for the EVINN electric bike shop. It manages the catalog (brands, models, accessories, spare parts) and customer requests (orders, test rides, contact messages) through the Evinn Server API described in [`docs/API.md`](docs/API.md).

Built with Next.js 16 (App Router, Turbopack, React Compiler), React 19, Tailwind CSS v4 and Framer Motion.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set API_URL
npm run dev                  # http://localhost:3000
```

Sign in with an admin account created by the API's `npm run seed:admin`.

| Variable   | Required | Description                                                                                  |
| ---------- | -------- | -------------------------------------------------------------------------------------------- |
| `API_URL`  | No       | API base URL including `/api`. Defaults to `https://evinn.evermontech.com/api`.              |
| `SITE_URL` | No       | Public website URL for the sidebar's "View Website" link. Hidden when unset.                 |

| Script          | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Development server           |
| `npm run build` | Production build             |
| `npm start`     | Serve the production build   |
| `npm run lint`  | ESLint                       |

## How it talks to the API

The browser never calls the API directly. Pages are Server Components that fetch from the API on the server, and every change goes through a Server Action. Both forward the admin's session cookie, so there are no CORS or cross-site cookie issues and the JWT never reaches client-side JavaScript.

- **Login** (`src/lib/actions/auth.ts`) calls `POST /admin/auth/login` and copies the API's httpOnly `accessToken` cookie onto this app's domain.
- **`src/proxy.ts`** redirects visitors without a session cookie to `/login`, before any admin page renders.
- **`requireAdmin()`** (`src/lib/server/session.ts`) verifies the session with `GET /admin/auth/me`. Any `401` from the API sends the admin back to `/login?session=expired`.
- **Uploads** are sent as `multipart/form-data` when a new image is chosen, and as JSON otherwise. Server Actions accept bodies up to 6 MB (`next.config.ts`).
- **Images** are resized by Cloudinary's CDN through a custom `next/image` loader (`src/lib/image-loader.ts`).

## Project structure

```
src/
  app/
    login/, forgot-password/, reset-password/   Auth screens
    admin/                                      Everything behind the login
      layout.tsx                                Sidebar + top bar shell, session check
      page.tsx                                  Dashboard
      brands/ models/ accessories/ spare-parts/ Catalog CRUD
      orders/ test-rides/ messages/             Customer requests
      profile/                                  Account details, change password
  components/
    ui/                  Tailwind UI primitives (dialog, toast, table, filters, …)
    layout/              Sidebar, top bar, navigation
    store-items/         Shared accessories / spare parts screens
  lib/
    server/              Server-only API client, session and queries
    actions/             Server Actions (mutations)
  proxy.ts               Optimistic auth redirect
  types/                 API and app types
```

List pages keep their filters and page number in the URL (`?status=pending&page=2`), so views can be bookmarked and shared.
