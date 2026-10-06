# Evinn Server — API Documentation

REST API for the Evinn bike shop website and its admin panel. It serves **brands**, **bikes**, **accessories** and **spare parts** to the public site and lets a logged-in **admin** create, update and delete them, including image uploads to Cloudinary. It also receives **contact form** submissions, which the admin manages from an inbox, **test ride requests**, which the admin accepts or rejects, and **bike orders** (cash on delivery), which the admin moves through their statuses.

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Conventions](#2-conventions)
3. [Authentication](#3-authentication)
4. [Errors](#4-errors)
5. [Pagination](#5-pagination)
6. [Image uploads](#6-image-uploads)
7. [Endpoints](#7-endpoints)
   - [Health](#71-health)
   - [Admin auth](#72-admin-auth)
   - [Brands](#73-brands)
   - [Bikes](#74-bikes)
   - [Accessories](#75-accessories)
   - [Spare parts](#76-spare-parts)
   - [Contact submissions](#77-contact-submissions)
   - [Test ride requests](#78-test-ride-requests)
   - [Orders](#79-orders)
8. [Data models](#8-data-models)
9. [TypeScript types](#9-typescript-types)
10. [Frontend integration examples](#10-frontend-integration-examples)
11. [Running the server](#11-running-the-server)

---

## Endpoint overview

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | Public | Server and database status |
| POST | `/api/admin/auth/login` | Public | Log in, sets auth cookie |
| POST | `/api/admin/auth/logout` | Public | Log out, clears auth cookie |
| GET | `/api/admin/auth/me` | Admin | Current admin |
| PATCH | `/api/admin/auth/change-password` | Admin | Change password while logged in |
| POST | `/api/admin/auth/forgot-password` | Public | Email a 6-digit reset code |
| POST | `/api/admin/auth/reset-password` | Public | Set a new password with the code |
| GET | `/api/brands` | Public | List all brands |
| GET | `/api/brands/:id` | Public | Get a brand by id |
| POST | `/api/brands` | Admin | Create a brand (with logo) |
| PATCH | `/api/brands/:id` | Admin | Update a brand (logo optional) |
| DELETE | `/api/brands/:id` | Admin | Delete a brand |
| GET | `/api/bikes` | Public | List bikes (paginated, filterable) |
| GET | `/api/bikes/:slug` | Public | Get a bike by slug |
| POST | `/api/bikes` | Admin | Create a bike (with image) |
| PATCH | `/api/bikes/:id` | Admin | Update a bike (image optional) |
| DELETE | `/api/bikes/:id` | Admin | Delete a bike |
| GET | `/api/accessories` | Public | List accessories (paginated, filterable) |
| GET | `/api/accessories/:slug` | Public | Get an accessory by slug |
| POST | `/api/accessories` | Admin | Create an accessory (with image) |
| PATCH | `/api/accessories/:id` | Admin | Update an accessory (image optional) |
| DELETE | `/api/accessories/:id` | Admin | Delete an accessory |
| GET | `/api/spare-parts` | Public | List spare parts (paginated, filterable) |
| GET | `/api/spare-parts/:slug` | Public | Get a spare part by slug |
| POST | `/api/spare-parts` | Admin | Create a spare part (with image) |
| PATCH | `/api/spare-parts/:id` | Admin | Update a spare part (image optional) |
| DELETE | `/api/spare-parts/:id` | Admin | Delete a spare part |
| POST | `/api/contact-submissions` | Public | Submit the contact form |
| GET | `/api/contact-submissions` | Admin | List submissions (paginated, filterable) |
| PATCH | `/api/contact-submissions/:id/status` | Admin | Update a submission's status |
| DELETE | `/api/contact-submissions/:id` | Admin | Delete a submission |
| POST | `/api/test-ride-requests` | Public | Request a test ride |
| GET | `/api/test-ride-requests` | Admin | List test ride requests (paginated, filterable) |
| PATCH | `/api/test-ride-requests/:id/accept` | Admin | Accept a pending request |
| PATCH | `/api/test-ride-requests/:id/reject` | Admin | Reject a pending request with a reason |
| POST | `/api/orders` | Public | Place an order (cash on delivery) |
| GET | `/api/orders` | Admin | List orders (paginated, filterable) |
| PATCH | `/api/orders/:id/status` | Admin | Move an order to its next status |

> **Note the lookup key:** public detail pages for bikes, accessories and spare parts use the **slug** (`/api/bikes/crown-electric-spark`), while update and delete use the **`_id`** (`/api/bikes/6abe28b41464448322d89e0e`). Brands use `_id` everywhere.

---

## 1. Quick start

**Base URL**

| Environment | Base URL |
|---|---|
| Local development | `http://localhost:5000` |
| Production | Your deployed API origin |

All endpoints are prefixed with `/api`.

**The two rules that matter most:**

1. **Send cookies with every request.** Authentication is an httpOnly cookie, so every request needs `credentials: "include"` (fetch) or `withCredentials: true` (axios). See [Authentication](#3-authentication).
2. **Create and image updates use `multipart/form-data`**, not JSON. See [Image uploads](#6-image-uploads).

```js
// Public: list bikes
const res = await fetch("http://localhost:5000/api/bikes?page=1&limit=10", {
  credentials: "include",
});
const { bikes, pagination } = await res.json();
```

---

## 2. Conventions

| Topic | Rule |
|---|---|
| Format | Requests and responses are JSON (`Content-Type: application/json`), except uploads, which are `multipart/form-data`. |
| IDs | Every record has a MongoDB `_id` (24-character hex string, e.g. `"6abe28b41464448322d89e0e"`). There is **no** `id` field — always use `_id`. |
| Dates | `createdAt` and `updatedAt` are ISO 8601 UTC strings, e.g. `"2026-10-01T09:32:36.522Z"`. |
| Money | `price` is a plain number in **PKR** (`195000`). Accessories and spare parts also return a ready-made `priceText` (`"PKR 1,200"`); for bikes, format it on the frontend. |
| Slugs | Lowercase letters, numbers and single hyphens (`crown-electric-spark`). Stored **without** a leading slash. Slug lookups are case-insensitive. |
| Response envelope | Single records are wrapped by name (`{ "bike": {...} }`), lists by plural name (`{ "bikes": [...] }`). Errors are always `{ "message": "..." }`. |
| Unknown fields | Ignored. You can't set server-managed fields (`_id`, `imageUrl`, `imagePublicId`, `logoUrl`, `logoPublicId`, timestamps) through the request body. |
| String fields | Leading/trailing whitespace is trimmed. Optional text fields default to `""` (never `null`). |
| Body size | JSON bodies up to 1 MB; image files up to 5 MB. |
| CORS | Only the origin set in the server's `CLIENT_URL` (default `http://localhost:5173`) may call the API from a browser, with credentials. |

---

## 3. Authentication

Admin-only endpoints are protected by a **JWT access token stored in an httpOnly cookie**.

### How it works

1. The admin logs in with `POST /api/admin/auth/login`.
2. The server responds with a `Set-Cookie` header:
   ```
   Set-Cookie: accessToken=<jwt>; Max-Age=3600; Path=/; HttpOnly; SameSite=Lax
   ```
   In production (`NODE_ENV=production`) the cookie is also `Secure` (HTTPS only).
3. The browser automatically sends the cookie on every later request **as long as the request includes credentials**.
4. Admin endpoints read the token from the cookie. The `Authorization` header is **not** used — sending `Authorization: Bearer ...` will not authenticate you.

### Key facts

| Item | Value |
|---|---|
| Cookie name | `accessToken` |
| Lifetime | **1 hour** (token and cookie expire together) |
| Refresh token | None. When the token expires, the admin must log in again. |
| JavaScript access | None — `HttpOnly` means `document.cookie` cannot read it. This is intentional (protects against XSS). |
| Logout | `POST /api/admin/auth/logout` clears the cookie. JavaScript cannot delete an httpOnly cookie itself. |
| Password change | Signs out every **other** session immediately. Changing the password keeps the current browser logged in (a fresh cookie is set); resetting it via the forgot-password flow signs out everywhere. |

### Checking whether the admin is logged in

Call `GET /api/admin/auth/me` when the admin panel loads:

- `200` → logged in; the response contains the admin.
- `401` → not logged in or session expired; show the login page.

### Handling session expiry

Any admin endpoint can return `401` once the hour is up. Handle it globally (for example in an axios interceptor or a fetch wrapper) by redirecting to the login page. See [section 10](#10-frontend-integration-examples).

### Possible `401` messages from admin endpoints

| Message | Meaning |
|---|---|
| `Access token is missing` | No cookie sent (not logged in, or the request was made without credentials). |
| `Access token has expired` | Logged in more than an hour ago. |
| `Access token is invalid` | Cookie was tampered with or signed with a different secret. |
| `Admin no longer exists` | The admin account was deleted after login. |
| `Password was changed, please log in again` | The password was changed or reset after this session started (e.g. from another device). |

### Cross-domain deployment

The cookie uses `SameSite=Lax`. This works when the frontend and API share a site, e.g.:

- `localhost:5173` → `localhost:5000` (local development)
- `evinn.com` → `api.evinn.com`

If the frontend and API are on **different domains** (e.g. `evinn.com` and `evinn-api.onrender.com`), the browser will not send the cookie on API calls and login will appear to do nothing. In that case, either serve both under the same domain (e.g. a reverse proxy routing `/api` to the server) or talk to the backend developer about changing the cookie settings.

---

## 4. Errors

### Error response format

Every error has the same shape:

```json
{ "message": "Human-readable description of the problem" }
```

When several fields fail validation at once, their messages are joined with `", "`:

```json
{ "message": "Type must be one of: bike, scooter, Price cannot be negative" }
```

### Status codes

| Status | When | Example message |
|---|---|---|
| `200 OK` | Successful read, update, delete, login, logout | — |
| `201 Created` | Record created | — |
| `400 Bad Request` | Missing/invalid field, malformed id, missing or invalid image | `Name is required`, `Invalid price`, `Invalid _id`, `Image is required` |
| `401 Unauthorized` | Not logged in, session expired, wrong login details | `Access token has expired`, `Invalid email or password` |
| `404 Not Found` | Record or route doesn't exist | `Bike not found`, `Not found: GET /api/bikez` |
| `409 Conflict` | Duplicate unique value, delete blocked, or a status change that isn't allowed | `slug already exists`, `displayName already exists`, `Cannot delete brand: 2 bike(s) still belong to it`, `Cannot change order status from delivered to cancelled` |
| `429 Too Many Requests` | Rate limit hit on forgot/reset password, the contact form, test ride requests or placing orders | `Too many requests, please try again later.` |
| `500 Internal Server Error` | Unexpected server problem (e.g. Cloudinary unreachable) | In production always `Internal server error` |

### Common validation messages

| Message | Cause |
|---|---|
| `<Field> is required` | Required field missing or empty (e.g. `Name is required`, `Display name is required`). |
| `Invalid <field>` | Value has the wrong type: non-numeric `price`, malformed id for `brand`, non-boolean `inStock`, malformed `_id` in the URL. |
| `Price cannot be negative` | `price` < 0. |
| `Rating must be between 0 and 5` | `rating` outside 0–5. |
| `Type must be one of: bike, scooter` | Unknown bike `type`. |
| `Slug may only contain lowercase letters, numbers and hyphens` | Slug contains spaces, slashes, etc. |
| `Path \`name\` (...) is longer than the maximum allowed length (150).` | Text exceeds its maximum length (see [Data models](#8-data-models)). |
| `<field> already exists` | Unique field taken (`slug`, `displayName`). Status `409`. |
| `Brand does not exist` | Bike's `brand` is a well-formed id with no matching brand. |
| `specs must be valid JSON` / `features must be a valid JSON array` | A JSON-string field couldn't be parsed. |
| `Only JPEG, PNG, WebP, GIF and AVIF images are allowed` | Wrong file type. |
| `File too large` | Image larger than 5 MB. |
| `Unexpected file field` | File sent under the wrong form field name (e.g. `file` instead of `image`). |

---

## 5. Pagination

`GET /api/bikes`, `GET /api/accessories`, `GET /api/spare-parts` and `GET /api/contact-submissions` are paginated. (`GET /api/brands` is **not** — it returns every brand.)

### Query parameters

| Param | Type | Default | Rules |
|---|---|---|---|
| `page` | integer | `1` | Must be a positive integer. |
| `limit` | integer | `10` | Positive integer, **max 100** (larger values are capped to 100). |

Invalid values (`page=abc`, `limit=0`, `limit=-5`, `page=1.5`) silently fall back to the defaults instead of returning an error.

### Response

The list stays under its usual key, and a `pagination` object is added next to it:

```json
{
  "bikes": [ /* up to `limit` items */ ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

| Field | Meaning |
|---|---|
| `page` | The page returned (after defaults are applied). |
| `limit` | Items per page (after defaults and the 100 cap). |
| `total` | Number of items matching the filters (not the whole collection). |
| `totalPages` | `ceil(total / limit)`. `0` when nothing matches. |
| `hasNextPage` / `hasPrevPage` | Use these to enable/disable Next/Previous buttons. |

Requesting a page past the end returns an empty list with the correct `total`. Order is newest first and is stable: no item appears on two pages or is skipped.

---

## 6. Image uploads

Brands, bikes, accessories and spare parts each have one image, stored on Cloudinary.

| Resource | Form field name | Required on create | Required on update |
|---|---|---|---|
| Brand | `logo` | Yes | No (send to replace) |
| Bike | `image` | Yes | No (send to replace) |
| Accessory | `image` | Yes | No (send to replace) |
| Spare part | `image` | Yes | No (send to replace) |

**Rules**

- Send as `multipart/form-data` with a `FormData` object. **Do not set the `Content-Type` header yourself** — the browser adds it with the correct boundary.
- Allowed types: JPEG, PNG, WebP, GIF, AVIF. Maximum size: **5 MB**.
- Text fields go in the same `FormData`. Numbers and booleans are sent as strings (`"195000"`, `"true"`) and converted by the server.
- The response contains the final Cloudinary URL in `imageUrl` / `logoUrl` (an `https://res.cloudinary.com/...` link). Use it directly in `<img src>`.
- `imagePublicId` / `logoPublicId` are also returned; they are internal Cloudinary ids. The frontend can ignore them.

**Behaviour the frontend can rely on**

- Invalid input is rejected **before** the upload, so a failed create doesn't leave stray files.
- If the save fails after uploading (e.g. duplicate slug), the new image is removed and the record keeps its current image.
- When an image is replaced, the old one is deleted only after the new one is saved, so a record is never left without an image.
- Deleting a record deletes its image.

**Update without changing the image:** `PATCH` endpoints also accept a plain JSON body when no new image is being sent.

---

## 7. Endpoints

### 7.1 Health

#### `GET /api/health`

Check that the API is up and connected to the database. Public.

**Response `200`**

```json
{ "status": "ok", "db": "connected" }
```

`db` is `"connected"` or `"disconnected"`.

---

### 7.2 Admin auth

#### `POST /api/admin/auth/login`

Log in as an admin. Public. Sets the `accessToken` cookie.

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | Case-insensitive, surrounding spaces ignored. |
| `password` | string | Yes | |

```json
{ "email": "admin@evinn.com", "password": "Str0ngPass!" }
```

**Response `200`** — plus the `Set-Cookie` header described in [Authentication](#3-authentication).

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "6abe274e496798850e0962d3",
    "fullName": "Super Admin",
    "email": "admin@evinn.com",
    "createdAt": "2026-10-01T09:26:38.371Z",
    "updatedAt": "2026-10-01T09:26:38.371Z"
  }
}
```

> **Don't store `accessToken`.** It is returned for convenience, but the cookie already handles authentication. Saving it to `localStorage` would expose it to XSS and defeats the purpose of the httpOnly cookie. Use only the `admin` object.

**Errors**

| Status | Message |
|---|---|
| `400` | `Email and password are required` |
| `401` | `Invalid email or password` (same message for unknown email and wrong password) |

---

#### `POST /api/admin/auth/logout`

Log out. Public (works even if the session already expired). Clears the cookie.

**Request body:** none.

**Response `200`**

```json
{ "message": "Logged out" }
```

---

#### `GET /api/admin/auth/me`

Get the currently logged-in admin. **Admin.**

**Response `200`**

```json
{
  "admin": {
    "_id": "6abe274e496798850e0962d3",
    "fullName": "Super Admin",
    "email": "admin@evinn.com",
    "createdAt": "2026-10-01T09:26:38.371Z",
    "updatedAt": "2026-10-01T09:26:38.371Z"
  }
}
```

**Errors:** `401` (see [messages](#possible-401-messages-from-admin-endpoints)).

---

#### `PATCH /api/admin/auth/change-password`

Change the password of the logged-in admin. **Admin.**

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `currentPassword` | string | Yes | The admin's current password. |
| `newPassword` | string | Yes | 8–72 characters. Must differ from the current password. |

```json
{ "currentPassword": "Str0ngPass!", "newPassword": "EvenStr0nger!" }
```

**Response `200`** — plus a fresh `Set-Cookie: accessToken=...` header, so this browser stays logged in.

```json
{ "message": "Password changed successfully" }
```

**What happens**

- All **other** sessions (other browsers/devices) are signed out; their next admin request gets `401 Password was changed, please log in again`.
- Any pending forgot-password code is cancelled.
- A "Your password was changed" email is sent to the admin.

**Errors**

| Status | Message |
|---|---|
| `400` | `Current password is required` |
| `400` | `Current password is incorrect` |
| `400` | `New password is required`, `New password must be at least 8 characters`, `New password must be at most 72 characters` |
| `400` | `New password must be different from the current password` |
| `401` | Not logged in (see [messages](#possible-401-messages-from-admin-endpoints)) |

> A wrong current password returns **`400`, not `401`**, so a global "401 → redirect to login" handler won't log the admin out for a typo. Show the message on the form.

---

### Password reset flow (forgot password)

For an admin who can't log in. Two public endpoints:

```
1. POST /forgot-password  { email }              → server emails a 6-digit code (valid 10 minutes)
2. POST /reset-password   { otp, newPassword }   → server verifies the code and sets the new password
3. Admin logs in with the new password
```

**Rules**

| Rule | Value |
|---|---|
| Code format | 6 digits, e.g. `048213` |
| Code lifetime | 10 minutes |
| Use | Single use. Requesting a new code replaces the previous one. |
| Wrong guesses | After **5 wrong codes**, pending codes stop working; request a new one. |
| Resend cooldown | One new code per minute per account. Requests within the minute still return `200` but don't send another email. |
| Rate limits (per IP, 15-minute window) | `forgot-password`: 5 requests. `reset-password`: 10 failed attempts. Over the limit → `429`. |
| Delivery | Email from the shop's Gmail account, subject **"Your Evinn password reset code"**. Ask admins to check spam if it doesn't arrive within a minute. |

---

#### `POST /api/admin/auth/forgot-password`

Request a password reset code. Public.

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | Case-insensitive, surrounding spaces ignored. |

```json
{ "email": "admin@evinn.com" }
```

**Response `200`** — always the same, whether or not the email belongs to an admin:

```json
{ "message": "If an admin account exists for this email, a password reset code has been sent." }
```

> The response deliberately doesn't say whether the email exists, so attackers can't use this form to discover admin emails. Show this message as-is and move the admin to the "enter code" screen.

**Errors**

| Status | Message |
|---|---|
| `400` | `Email is required` |
| `429` | `Too many requests, please try again later.` |

---

#### `POST /api/admin/auth/reset-password`

Set a new password using the emailed code. Public.

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `otp` | string | Yes | The 6-digit code. **Send as a string** (`"048213"`). Numbers are accepted and zero-padded, but strings avoid surprises. |
| `newPassword` | string | Yes | 8–72 characters. |

```json
{ "otp": "048213", "newPassword": "EvenStr0nger!" }
```

**Response `200`** — also clears the `accessToken` cookie.

```json
{ "message": "Password has been reset. Please log in with your new password." }
```

**What happens**

- The code is used up and can't be reused.
- **All** sessions are signed out. The admin must log in with the new password.
- A "Your password was changed" email is sent to the admin.

**Errors**

| Status | Message |
|---|---|
| `400` | `OTP must be a 6-digit code` |
| `400` | `New password is required`, `New password must be at least 8 characters`, `New password must be at most 72 characters` |
| `400` | `Invalid or expired OTP` (wrong code, expired, already used, or too many wrong guesses → request a new code) |
| `429` | `Too many requests, please try again later.` |

> If the new password is rejected for length, the code is **not** used up; the admin can fix the password and resubmit the same code.

---

### 7.3 Brands

#### `GET /api/brands`

List **all** brands, sorted alphabetically by `displayName`. Public. Not paginated.

**Response `200`**

```json
{
  "brands": [
    {
      "_id": "6abe2a10c3f1a2b4d5e6f701",
      "displayName": "Okla",
      "logoUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1790846844/evinn/brands/abc123.png",
      "logoPublicId": "evinn/brands/abc123",
      "origin": "Pakistani",
      "established": "",
      "headquarters": "Lahore, Pakistan",
      "about": "Okla Electric is a Pakistani EV manufacturer building affordable, eco-friendly electric bikes and scooters...",
      "websiteUrl": "#",
      "instagramUrl": "#",
      "twitterUrl": "#",
      "facebookUrl": "#",
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  ]
}
```

---

#### `GET /api/brands/:id`

Get one brand by `_id`. Public.

**Response `200`**

```json
{ "brand": { /* Brand object, same shape as above */ } }
```

**Errors:** `400 Invalid _id` (malformed id), `404 Brand not found`.

---

#### `POST /api/brands`

Create a brand. **Admin.** `multipart/form-data`.

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `logo` | file | **Yes** | Image, max 5 MB. |
| `displayName` | string | **Yes** | Max 100 chars, must be unique. |
| `origin` | string | No | e.g. `Pakistani` |
| `established` | string | No | Free text, e.g. `2021` |
| `headquarters` | string | No | e.g. `Lahore, Pakistan` |
| `about` | string | No | Max 2000 chars. |
| `websiteUrl` | string | No | Not validated as a URL. |
| `instagramUrl` | string | No | |
| `twitterUrl` | string | No | |
| `facebookUrl` | string | No | |

**Response `201`**

```json
{ "brand": { /* the created Brand */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Logo image is required`, `Display name is required`, file type/size errors |
| `401` | Not logged in |
| `409` | `displayName already exists` |

---

#### `PATCH /api/brands/:id`

Update a brand. **Admin.** Send only the fields you want to change.

- To replace the logo: `multipart/form-data` with a `logo` file (plus any other fields).
- Without a new logo: `multipart/form-data` **or** `application/json`.
- Sending an empty string clears an optional field (`"twitterUrl": ""`). An empty `displayName` is rejected.

**Body:** any subset of the [create fields](#post-apibrands).

```json
{ "headquarters": "Karachi, Pakistan", "websiteUrl": "https://okla.pk" }
```

**Response `200`**

```json
{ "brand": { /* the updated Brand */ } }
```

**Errors:** `400` validation / `Invalid _id`, `401`, `404 Brand not found`, `409 displayName already exists`.

---

#### `DELETE /api/brands/:id`

Delete a brand and its logo. **Admin.**

A brand **cannot be deleted while bikes still belong to it** — delete or reassign those bikes first.

**Response `200`**

```json
{ "message": "Brand deleted" }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Invalid _id` |
| `401` | Not logged in |
| `404` | `Brand not found` |
| `409` | `Cannot delete brand: 3 bike(s) still belong to it` |

---

### 7.4 Bikes

Every bike response includes its brand **populated** with a short summary:

```json
"brand": { "_id": "6abe2a10c3f1a2b4d5e6f701", "displayName": "Crown CMC", "logoUrl": "https://res.cloudinary.com/..." }
```

When **sending** a bike, `brand` is just the brand's `_id` string.

#### `GET /api/bikes`

List bikes, newest first. Public. [Paginated](#5-pagination).

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `1`. |
| `limit` | integer | Default `10`, max `100`. |
| `brand` | string | Brand `_id`. Malformed id → `400 Invalid brand`. |
| `type` | string | `bike` or `scooter`. Any other value returns an empty list. |

Example: `GET /api/bikes?brand=6abe2a10c3f1a2b4d5e6f701&type=scooter&page=1&limit=12`

**Response `200`**

```json
{
  "bikes": [
    {
      "_id": "6abe28b41464448322d89e0e",
      "name": "Crown Electric Spark",
      "slug": "crown-electric-spark",
      "brand": {
        "_id": "6abe2a10c3f1a2b4d5e6f701",
        "displayName": "Crown CMC",
        "logoUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1790846844/evinn/brands/xyz789.png"
      },
      "type": "bike",
      "price": 195000,
      "rating": 4.5,
      "imageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1790846900/evinn/bikes/def456.webp",
      "imagePublicId": "evinn/bikes/def456",
      "specs": {
        "range": "70 km",
        "topSpeed": "65 km/h",
        "battery": "72V 30Ah",
        "chargingTime": "4.5 hrs",
        "motorPower": "3000W",
        "weight": "115 kg",
        "warranty": "2 Years"
      },
      "createdAt": "2026-10-01T10:05:00.000Z",
      "updatedAt": "2026-10-01T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

#### `GET /api/bikes/:slug`

Get one bike by slug (case-insensitive). Public. Use for the bike detail page.

Example: `GET /api/bikes/crown-electric-spark`

**Response `200`**

```json
{ "bike": { /* Bike object, same shape as in the list, brand populated */ } }
```

**Errors:** `404 Bike not found`.

---

#### `POST /api/bikes`

Create a bike. **Admin.** `multipart/form-data`.

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `image` | file | **Yes** | Image, max 5 MB. |
| `name` | string | **Yes** | Max 150 chars. |
| `brand` | string | **Yes** | `_id` of an existing brand. |
| `type` | string | **Yes** | `bike` or `scooter`. |
| `price` | number | **Yes** | PKR, `>= 0`. |
| `rating` | number | No | `0`–`5`, default `0`. |
| `slug` | string | No | Generated from `name` if omitted (`"Crown Electric Spark"` → `crown-electric-spark`). Must be unique. |
| `specs` | object | No | See below. |

**Specs** — all optional strings, displayed as-is (include units):

| Key | Example |
|---|---|
| `range` | `70 km` |
| `topSpeed` | `65 km/h` |
| `battery` | `72V 30Ah` |
| `chargingTime` | `4.5 hrs` |
| `motorPower` | `3000W` |
| `weight` | `115 kg` |
| `warranty` | `2 Years` |

Send specs in `FormData` in **either** way:

```js
// Option A: one field per spec
fd.append("specs[range]", "70 km");
fd.append("specs[topSpeed]", "65 km/h");

// Option B: a JSON string
fd.append("specs", JSON.stringify({ range: "70 km", topSpeed: "65 km/h" }));
```

Unknown spec keys are ignored. Missing specs default to `""`.

**Response `201`**

```json
{ "bike": { /* the created Bike, brand populated */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Image is required`, `Name is required`, `Brand is required`, `Invalid brand`, `Brand does not exist`, `Type must be one of: bike, scooter`, `Invalid price`, `Price cannot be negative`, `Rating must be between 0 and 5`, `specs must be valid JSON`, file type/size errors |
| `401` | Not logged in |
| `409` | `slug already exists` (another bike has the same name/slug — send a different `slug`) |

---

#### `PATCH /api/bikes/:id`

Update a bike by `_id`. **Admin.** Send only the fields you want to change.

- To replace the image: `multipart/form-data` with an `image` file.
- Without a new image: `multipart/form-data` **or** `application/json`.
- **Specs are merged**, not replaced: sending `{ "specs": { "weight": "120 kg" } }` changes only `weight`.
- Renaming does **not** change the slug (so existing links keep working). To change the slug, send `slug` explicitly. Sending `slug: ""` regenerates it from the current name.

**Example JSON body**

```json
{
  "price": 199000,
  "rating": 4.8,
  "specs": { "weight": "120 kg" }
}
```

**Response `200`**

```json
{ "bike": { /* the updated Bike, brand populated */ } }
```

**Errors:** same as create (except the image isn't required), plus `400 Invalid _id` and `404 Bike not found`.

---

#### `DELETE /api/bikes/:id`

Delete a bike and its image. **Admin.**

**Response `200`**

```json
{ "message": "Bike deleted" }
```

**Errors:** `400 Invalid _id`, `401`, `404 Bike not found`.

---

### 7.5 Accessories

Accessory responses include a computed **`priceText`** (e.g. `"PKR 1,200"`), always in sync with `price`. It's read-only.

#### `GET /api/accessories`

List accessories, newest first. Public. [Paginated](#5-pagination).

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `1`. |
| `limit` | integer | Default `10`, max `100`. |
| `inStock` | `true` \| `false` | Optional. Any other value is ignored (returns all). |

Example: `GET /api/accessories?inStock=true&page=1&limit=8`

**Response `200`**

```json
{
  "accessories": [
    {
      "_id": "6abe2fb578eb288f5753a167",
      "name": "Charger",
      "slug": "charger",
      "price": 1200,
      "priceText": "PKR 1,200",
      "imageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1790847000/evinn/accessories/ghi012.png",
      "imagePublicId": "evinn/accessories/ghi012",
      "description": "High-speed authentic charger designed for optimal battery health and fast charging cycles. Built with overcharge protection.",
      "features": ["Fast charging support", "Overcharge protection", "Durable cable"],
      "inStock": true,
      "createdAt": "2026-10-01T10:10:00.000Z",
      "updatedAt": "2026-10-01T10:10:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

#### `GET /api/accessories/:slug`

Get one accessory by slug (case-insensitive). Public.

Example: `GET /api/accessories/charger`

**Response `200`**

```json
{ "accessory": { /* Accessory object, same shape as in the list */ } }
```

**Errors:** `404 Accessory not found`.

---

#### `POST /api/accessories`

Create an accessory. **Admin.** `multipart/form-data`.

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `image` | file | **Yes** | Image, max 5 MB. |
| `name` | string | **Yes** | Max 150 chars. |
| `price` | number | **Yes** | PKR, `>= 0`. |
| `slug` | string | No | Generated from `name` if omitted. Must be unique. |
| `description` | string | No | Max 2000 chars. |
| `features` | string[] | No | Max 20 items, each max 200 chars. Blank items are removed. |
| `inStock` | boolean | No | Default `true`. Send `"true"` / `"false"`. |

Send `features` in `FormData` in **any** of these ways:

```js
// Option A: repeat the field once per feature (recommended)
fd.append("features", "Fast charging support");
fd.append("features", "Overcharge protection");

// Option B: a JSON array string
fd.append("features", JSON.stringify(["Fast charging support", "Overcharge protection"]));

// A single plain string becomes a one-item list
fd.append("features", "Durable cable");
```

**Response `201`**

```json
{ "accessory": { /* the created Accessory */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Image is required`, `Name is required`, `Price is required`, `Invalid price`, `Price cannot be negative`, `Invalid inStock`, `At most 20 features are allowed`, `features must be a valid JSON array`, file type/size errors |
| `401` | Not logged in |
| `409` | `slug already exists` |

---

#### `PATCH /api/accessories/:id`

Update an accessory by `_id`. **Admin.** Send only the fields you want to change.

- To replace the image: `multipart/form-data` with an `image` file.
- Without a new image: `multipart/form-data` **or** `application/json`.
- `features` **replaces** the whole list. In JSON send an array; send `[]` to clear it.
- Renaming does not change the slug (same rules as bikes).

**Example JSON body**

```json
{
  "price": 1500,
  "inStock": false,
  "features": ["Fast charging support", "Overcharge protection"]
}
```

**Response `200`**

```json
{ "accessory": { /* the updated Accessory, priceText reflects the new price */ } }
```

**Errors:** same as create (except the image isn't required), plus `400 Invalid _id` and `404 Accessory not found`.

---

#### `DELETE /api/accessories/:id`

Delete an accessory and its image. **Admin.**

**Response `200`**

```json
{ "message": "Accessory deleted" }
```

**Errors:** `400 Invalid _id`, `401`, `404 Accessory not found`.

---

### 7.6 Spare parts

Spare parts work **exactly like accessories**: same fields, same rules, same `priceText`, same request formats. Only the paths, response keys and not-found message differ.

| | Accessories | Spare parts |
|---|---|---|
| Base path | `/api/accessories` | `/api/spare-parts` |
| List response key | `accessories` | `spareParts` |
| Single response key | `accessory` | `sparePart` |
| Not found message | `Accessory not found` | `Spare part not found` |
| Delete message | `Accessory deleted` | `Spare part deleted` |

#### `GET /api/spare-parts`

List spare parts, newest first. Public. [Paginated](#5-pagination).

**Query parameters:** `page`, `limit`, `inStock` (`true` \| `false`), same as [accessories](#get-apiaccessories).

Example: `GET /api/spare-parts?inStock=true&page=1&limit=8`

**Response `200`**

```json
{
  "spareParts": [
    {
      "_id": "6abf41c2d8e9f0a1b2c3d4e5",
      "name": "Battery",
      "slug": "battery",
      "price": 40000,
      "priceText": "PKR 40,000",
      "imageUrl": "https://res.cloudinary.com/<cloud>/image/upload/v1790930000/evinn/spare-parts/jkl345.png",
      "imagePublicId": "evinn/spare-parts/jkl345",
      "description": "Long-lasting lithium-ion battery replacement for extended range. Engineered for high performance and durability.",
      "features": ["High capacity", "Weather sealed", "2-year warranty"],
      "inStock": true,
      "createdAt": "2026-10-02T08:00:00.000Z",
      "updatedAt": "2026-10-02T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

#### `GET /api/spare-parts/:slug`

Get one spare part by slug (case-insensitive). Public.

Example: `GET /api/spare-parts/battery`

**Response `200`**

```json
{ "sparePart": { /* SparePart object, same shape as in the list */ } }
```

**Errors:** `404 Spare part not found`.

---

#### `POST /api/spare-parts`

Create a spare part. **Admin.** `multipart/form-data`.

**Form fields:** identical to [creating an accessory](#post-apiaccessories): `image` (file, required), `name` (required), `price` (required), `slug`, `description`, `features`, `inStock`. Send only `price`; `priceText` is computed and any value you send for it is ignored.

**Response `201`**

```json
{ "sparePart": { /* the created SparePart */ } }
```

**Errors:** same as [creating an accessory](#post-apiaccessories) (`400` validation and image errors, `401`, `409 slug already exists`).

---

#### `PATCH /api/spare-parts/:id`

Update a spare part by `_id`. **Admin.** Same rules as [updating an accessory](#patch-apiaccessoriesid): send only changed fields, `multipart/form-data` with `image` to replace the image, or JSON otherwise; `features` replaces the whole list.

```json
{ "price": 45500, "inStock": false }
```

**Response `200`**

```json
{ "sparePart": { /* the updated SparePart, priceText now "PKR 45,500" */ } }
```

**Errors:** same as create (except the image isn't required), plus `400 Invalid _id` and `404 Spare part not found`.

---

#### `DELETE /api/spare-parts/:id`

Delete a spare part and its image. **Admin.**

**Response `200`**

```json
{ "message": "Spare part deleted" }
```

**Errors:** `400 Invalid _id`, `401`, `404 Spare part not found`.

---

### 7.7 Contact submissions

Visitors submit the public contact form; the admin reviews submissions in an inbox and tracks them with a status.

**Allowed values** (exact spelling and case):

| Field | Values |
|---|---|
| `reason` | `Product Inquiry`, `Business Inquiry`, `Support`, `General Inquiry` |
| `status` | `pending` (default), `in process`, `answered` |

#### `POST /api/contact-submissions`

Submit the contact form. Public. JSON body.

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `fullName` | string | Yes | Max 100 chars. |
| `email` | string | Yes | Valid email, stored lowercase. |
| `reason` | string | Yes | One of the reasons above. Surrounding spaces are ignored, but case matters (`support` is rejected). |
| `message` | string | No | Max 5000 chars. Default `""`. |

```json
{
  "fullName": "Ahmed Khan",
  "email": "ahmed@example.com",
  "reason": "Product Inquiry",
  "message": "Is the Crown Electric Spark available in red?"
}
```

`status` can't be set by the visitor; every new submission starts as `pending`.

**Response `201`**

```json
{
  "message": "Thanks for reaching out! We'll get back to you soon.",
  "submission": {
    "_id": "6abf5a01e2f3a4b5c6d7e8f9",
    "fullName": "Ahmed Khan",
    "email": "ahmed@example.com",
    "reason": "Product Inquiry",
    "message": "Is the Crown Electric Spark available in red?",
    "status": "pending",
    "createdAt": "2026-10-02T09:15:00.000Z",
    "updatedAt": "2026-10-02T09:15:00.000Z"
  }
}
```

Show `message` as the success toast.

**Admin notification:** every new submission emails all admin accounts ("New contact form message from …"), sent in the background from the shop's Gmail. The email's Reply-To is the visitor's address, so the admin can answer by simply replying. A failed email never affects the response; the submission is saved either way.

**Errors**

| Status | Message |
|---|---|
| `400` | `Full name is required`, `Email is required`, `Reason is required` (several are joined with `", "`) |
| `400` | `Email is invalid` |
| `400` | `Reason must be one of: Product Inquiry, Business Inquiry, Support, General Inquiry` |
| `400` | Text too long (`fullName` > 100 or `message` > 5000 chars) |
| `429` | `Too many requests, please try again later.` — more than 5 successful submissions from one IP in 15 minutes. Failed (400) submissions don't count. |

---

#### `GET /api/contact-submissions`

List submissions, newest first. **Admin.** [Paginated](#5-pagination).

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `1`. |
| `limit` | integer | Default `10`, max `100`. |
| `status` | string | `pending`, `in process` or `answered`. URL-encode the space: `?status=in%20process` (axios `params` and `URLSearchParams` do this for you). |
| `reason` | string | One of the reasons above, URL-encoded (`?reason=Product%20Inquiry`). |

Unknown `status`/`reason` values return an empty list.

Example: `GET /api/contact-submissions?status=pending&page=1`

**Response `200`**

```json
{
  "submissions": [ /* ContactSubmission objects, same shape as above */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 17,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Tip: `pagination.total` with `?status=pending&limit=1` gives a cheap "unread" badge count.

**Errors:** `401`.

---

#### `PATCH /api/contact-submissions/:id/status`

Change a submission's status. **Admin.** Only `status` can be changed; other fields in the body are ignored.

**Request body** (`application/json`)

```json
{ "status": "in process" }
```

**Response `200`**

```json
{ "submission": { /* the updated ContactSubmission */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Status is required` |
| `400` | `Status must be one of: pending, in process, answered` |
| `400` | `Invalid _id` |
| `401` | Not logged in |
| `404` | `Contact submission not found` |

---

#### `DELETE /api/contact-submissions/:id`

Delete a submission permanently. **Admin.**

**Response `200`**

```json
{ "message": "Contact submission deleted" }
```

**Errors:** `400 Invalid _id`, `401`, `404 Contact submission not found`.

---

### 7.8 Test ride requests

Visitors request a test ride of a specific bike from the website; the admin accepts or rejects each request. Every request starts as `pending`. Once it is `accepted` or `rejected`, its status is final and can't be changed again.

**Allowed values** (exact spelling and case):

| Field | Values |
|---|---|
| `status` | `pending` (default), `accepted`, `rejected` |

The server doesn't email the requester when a request is accepted or rejected; contact them on WhatsApp or by email.

#### `POST /api/test-ride-requests`

Request a test ride. Public. JSON body.

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `requesterName` | string | Yes | Max 100 chars. |
| `requesterEmail` | string | Yes | Valid email, stored lowercase. |
| `requesterWhatsApp` | string | Yes | 8–15 digits with an optional leading `+`. Spaces, dashes and brackets are removed before saving (`+92 300-1234567` is stored as `+923001234567`). Ask for the country code so the admin can open a WhatsApp chat directly. |
| `brand` | string | Yes | Brand `_id`. |
| `bike` | string | Yes | Bike `_id`. Must belong to `brand`. |
| `preferredCity` | string | Yes | Max 100 chars. |
| `preferredDate` | string | Yes | `YYYY-MM-DD`, today or later (compared in UTC). |
| `preferredTime` | string | Yes | 24-hour `HH:mm`, e.g. `"14:30"`. This is exactly what `<input type="time">` gives you. |

```json
{
  "requesterName": "Ahmed Khan",
  "requesterEmail": "ahmed@example.com",
  "requesterWhatsApp": "+92 300 1234567",
  "brand": "6abe27f01464448322d89e0a",
  "bike": "6abe28b41464448322d89e0e",
  "preferredCity": "Lahore",
  "preferredDate": "2026-10-10",
  "preferredTime": "14:30"
}
```

`status` and `rejectionReason` can't be set by the visitor.

**Response `201`**

```json
{
  "message": "Your test ride request has been received! We'll contact you soon.",
  "testRideRequest": {
    "_id": "6ac0b1c2d3e4f5a6b7c8d9e0",
    "requesterName": "Ahmed Khan",
    "requesterEmail": "ahmed@example.com",
    "requesterWhatsApp": "+923001234567",
    "brand": "6abe27f01464448322d89e0a",
    "bike": "6abe28b41464448322d89e0e",
    "preferredCity": "Lahore",
    "preferredDate": "2026-10-10T00:00:00.000Z",
    "preferredTime": "14:30",
    "status": "pending",
    "rejectionReason": "",
    "createdAt": "2026-10-06T09:15:00.000Z",
    "updatedAt": "2026-10-06T09:15:00.000Z"
  }
}
```

Show `message` as the success toast. Here `brand` and `bike` are plain `_id` strings; the admin endpoints return them populated.

**Admin notification:** every new request emails all admin accounts ("New test ride request from … (bike name)") with the requester's details, the bike and the preferred date and time. It is sent in the background from the shop's Gmail. The email's Reply-To is the requester's address, and the WhatsApp number links to a chat when it includes the country code. A failed email never affects the response; the request is saved either way.

**Errors**

| Status | Message |
|---|---|
| `400` | `Name is required`, `Email is required`, `WhatsApp number is required`, `Brand is required`, `Bike is required`, `Preferred city is required`, `Preferred date is required`, `Preferred time is required` (several are joined with `", "`) |
| `400` | `Email is invalid`, `WhatsApp number is invalid` |
| `400` | `Preferred date cannot be in the past`, `Preferred time must be in HH:mm format` |
| `400` | `Invalid brand`, `Invalid bike`, `Invalid preferredDate` (not a valid `_id` or date) |
| `400` | `Brand does not exist`, `Bike does not exist for the selected brand` |
| `400` | Text too long (`requesterName` or `preferredCity` > 100 chars) |
| `429` | `Too many requests, please try again later.` — more than 5 successful requests from one IP in 15 minutes. Failed (400) requests don't count. |

---

#### `GET /api/test-ride-requests`

List test ride requests, newest first. **Admin.** [Paginated](#5-pagination).

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `1`. |
| `limit` | integer | Default `10`, max `100`. |
| `status` | string | `pending`, `accepted` or `rejected`. Unknown values return an empty list. |
| `brand` | string | Brand `_id`. |
| `bike` | string | Bike `_id`. |

Example: `GET /api/test-ride-requests?status=pending&page=1`

**Response `200`**

```json
{
  "testRideRequests": [
    {
      "_id": "6ac0b1c2d3e4f5a6b7c8d9e0",
      "requesterName": "Ahmed Khan",
      "requesterEmail": "ahmed@example.com",
      "requesterWhatsApp": "+923001234567",
      "brand": {
        "_id": "6abe27f01464448322d89e0a",
        "displayName": "Crown Electric",
        "logoUrl": "https://res.cloudinary.com/.../brands/abc.png"
      },
      "bike": {
        "_id": "6abe28b41464448322d89e0e",
        "name": "Crown Electric Spark",
        "slug": "crown-electric-spark",
        "imageUrl": "https://res.cloudinary.com/.../bikes/xyz.webp"
      },
      "preferredCity": "Lahore",
      "preferredDate": "2026-10-10T00:00:00.000Z",
      "preferredTime": "14:30",
      "status": "pending",
      "rejectionReason": "",
      "createdAt": "2026-10-06T09:15:00.000Z",
      "updatedAt": "2026-10-06T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

If the brand or bike was deleted after the request was made, `brand` or `bike` is `null`.

Tip: `pagination.total` with `?status=pending&limit=1` gives a cheap badge count.

**Errors:** `400 Invalid brand` / `Invalid bike`, `401`.

---

#### `PATCH /api/test-ride-requests/:id/accept`

Accept a pending request. **Admin.** No body.

**Response `200`**

```json
{ "testRideRequest": { /* the updated TestRideRequest, populated as in the list */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Invalid _id` |
| `401` | Not logged in |
| `404` | `Test ride request not found` |
| `409` | `Test ride request has already been accepted` / `Test ride request has already been rejected` |

---

#### `PATCH /api/test-ride-requests/:id/reject`

Reject a pending request with a reason. **Admin.**

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `rejectionReason` | string | Yes | Max 1000 chars. |

```json
{ "rejectionReason": "This bike is not available for test rides in Lahore yet." }
```

**Response `200`**

```json
{ "testRideRequest": { /* the updated TestRideRequest, with status "rejected" and the reason */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Rejection reason is required` |
| `400` | Text too long (`rejectionReason` > 1000 chars) |
| `400` | `Invalid _id` |
| `401` | Not logged in |
| `404` | `Test ride request not found` |
| `409` | `Test ride request has already been accepted` / `Test ride request has already been rejected` |

A `409` usually means another admin reviewed the request first; refresh the list.

---

### 7.9 Orders

Customers order a bike from the website and pay cash on delivery. The admin receives an email for every new order and manages it through its status.

**Statuses and allowed changes**

| Current status | Can change to | Meaning |
|---|---|---|
| `pending` (default) | `processing`, `rejected`, `cancelled` | New order, not yet confirmed. |
| `processing` | `delivered`, `cancelled` | Confirmed with the customer and being prepared or shipped. |
| `delivered` | `completed` | Handed over to the customer. |
| `completed` | — | Final. Cash collected, order closed. |
| `cancelled` | — | Final. Cancelled by the customer or the shop. |
| `rejected` | — | Final. The shop declined the order. |

Every order in a response includes `nextStatuses`, the statuses it can move to from its current one. Use it to decide which buttons to show; it is `[]` once the order is final.

#### `POST /api/orders`

Place an order. Public. JSON body.

**Request body** (`application/json`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `bike` | string | Yes | Bike `_id`. |
| `quantity` | integer | Yes | `1`–`10`. |
| `shippingAddress.fullName` | string | Yes | Max 100 chars. |
| `shippingAddress.phoneNumber` | string | Yes | 8–15 digits with an optional leading `+`. Spaces, dashes and brackets are removed before saving. |
| `shippingAddress.address` | string | Yes | Max 500 chars. Line breaks are kept. |
| `shippingAddress.postalCode` | string | Yes | Exactly 5 digits, e.g. `"54000"`. |
| `shippingAddress.city` | string | Yes | Max 100 chars. |
| `paymentMethod` | string | No | Only `"cash on delivery"` (the default) is accepted. |

```json
{
  "bike": "6abe28b41464448322d89e0e",
  "quantity": 1,
  "shippingAddress": {
    "fullName": "Ahmed Khan",
    "phoneNumber": "+92 300 1234567",
    "address": "House 12, Street 4, DHA Phase 5",
    "postalCode": "54000",
    "city": "Lahore"
  }
}
```

The price is never taken from the request. The server looks up the bike and saves its name and current price on the order (`bikeName`, `unitPrice`, `totalAmount = unitPrice × quantity`), so the order keeps the price it was placed at even if the bike's price changes or the bike is deleted later. `status` always starts as `pending`.

**Response `201`**

```json
{
  "message": "Your order has been placed! We'll call you soon to confirm it.",
  "order": {
    "_id": "6ac4fa6825dbb5aec494ad44",
    "bike": "6abe28b41464448322d89e0e",
    "bikeName": "Crown Electric Spark",
    "unitPrice": 195000,
    "quantity": 1,
    "totalAmount": 195000,
    "shippingAddress": {
      "fullName": "Ahmed Khan",
      "phoneNumber": "+923001234567",
      "address": "House 12, Street 4, DHA Phase 5",
      "postalCode": "54000",
      "city": "Lahore"
    },
    "paymentMethod": "cash on delivery",
    "status": "pending",
    "nextStatuses": ["processing", "rejected", "cancelled"],
    "createdAt": "2026-10-06T09:15:00.000Z",
    "updatedAt": "2026-10-06T09:15:00.000Z"
  }
}
```

Show `message` on the confirmation screen. Here `bike` is a plain `_id` string; the admin endpoints return it populated.

**Admin notification:** every new order emails all admin accounts ("New order from Ahmed Khan: 1 × Crown Electric Spark (PKR 195,000)") with the customer, phone (tap to call, plus a WhatsApp link when the number has a country code), address, bike, quantity, prices and order ID. It is sent in the background; a failed email never affects the response, and the order is saved either way.

**Errors**

| Status | Message |
|---|---|
| `400` | `Bike is required`, `Quantity is required`, `Shipping address is required`, `Full name is required`, `Phone number is required`, `Address is required`, `Postal code is required`, `City is required` (several are joined with `", "`) |
| `400` | `Quantity must be at least 1`, `Quantity cannot be more than 10`, `Quantity must be a whole number`, `Invalid quantity` |
| `400` | `Phone number is invalid`, `Postal code must be 5 digits` |
| `400` | `Payment method must be one of: cash on delivery` |
| `400` | `Invalid bike` (not a valid `_id`), `Bike does not exist` |
| `400` | Text too long (`fullName` or `city` > 100, `address` > 500 chars) |
| `429` | `Too many requests, please try again later.` — more than 3 successful orders from one IP in an hour. Failed (400) attempts don't count. |

---

#### `GET /api/orders`

List orders, newest first. **Admin.** [Paginated](#5-pagination).

**Query parameters**

| Param | Type | Notes |
|---|---|---|
| `page` | integer | Default `1`. |
| `limit` | integer | Default `10`, max `100`. |
| `status` | string | One of the statuses above. Unknown values return an empty list. |
| `bike` | string | Bike `_id`. |

Example: `GET /api/orders?status=pending&page=1`

**Response `200`**

```json
{
  "orders": [
    {
      "_id": "6ac4fa6825dbb5aec494ad44",
      "bike": {
        "_id": "6abe28b41464448322d89e0e",
        "name": "Crown Electric Spark",
        "slug": "crown-electric-spark",
        "imageUrl": "https://res.cloudinary.com/.../bikes/xyz.webp"
      },
      "bikeName": "Crown Electric Spark",
      "unitPrice": 195000,
      "quantity": 1,
      "totalAmount": 195000,
      "shippingAddress": { "fullName": "Ahmed Khan", "phoneNumber": "+923001234567", "address": "House 12, Street 4, DHA Phase 5", "postalCode": "54000", "city": "Lahore" },
      "paymentMethod": "cash on delivery",
      "status": "pending",
      "nextStatuses": ["processing", "rejected", "cancelled"],
      "createdAt": "2026-10-06T09:15:00.000Z",
      "updatedAt": "2026-10-06T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

If the bike was deleted after the order was placed, `bike` is `null`. Use `bikeName` and `unitPrice` for display; they never change.

Tip: `pagination.total` with `?status=pending&limit=1` gives a cheap "new orders" badge count.

**Errors:** `400 Invalid bike`, `401`.

---

#### `PATCH /api/orders/:id/status`

Move an order to another status. **Admin.** Only `status` can be changed, and only along the allowed changes in the table above.

**Request body** (`application/json`)

```json
{ "status": "processing" }
```

**Response `200`**

```json
{ "order": { /* the updated Order, populated as in the list */ } }
```

**Errors**

| Status | Message |
|---|---|
| `400` | `Status is required` |
| `400` | `Status must be one of: pending, processing, delivered, completed, cancelled, rejected` |
| `400` | `Invalid _id` |
| `401` | Not logged in |
| `404` | `Order not found` |
| `409` | `Order is already processing` (same status sent again) |
| `409` | `Cannot change order status from delivered to cancelled` (change not allowed; also returned if another admin changed the order first) |

---

## 8. Data models

Fields marked *server* are set by the server and ignored if sent.

### Admin

| Field | Type | Notes |
|---|---|---|
| `_id` | string | *server* |
| `fullName` | string | Max 100. |
| `email` | string | Unique, lowercase. |
| `createdAt` / `updatedAt` | string (ISO date) | *server* |

The password and password-reset data are never returned. Admins are created with the seed script (see [section 11](#11-running-the-server)); there is no sign-up endpoint.

### Brand

| Field | Type | Required | Default | Limits |
|---|---|---|---|---|
| `_id` | string | *server* | | |
| `displayName` | string | Yes | | Max 100, unique |
| `logoUrl` | string | *server* (from upload) | | |
| `logoPublicId` | string | *server* | `""` | |
| `origin` | string | No | `""` | |
| `established` | string | No | `""` | |
| `headquarters` | string | No | `""` | |
| `about` | string | No | `""` | Max 2000 |
| `websiteUrl` | string | No | `""` | |
| `instagramUrl` | string | No | `""` | |
| `twitterUrl` | string | No | `""` | |
| `facebookUrl` | string | No | `""` | |
| `createdAt` / `updatedAt` | string (ISO date) | *server* | | |

### Bike

| Field | Type | Required | Default | Limits |
|---|---|---|---|---|
| `_id` | string | *server* | | |
| `name` | string | Yes | | Max 150 |
| `slug` | string | No (auto) | from `name` | Unique, `a-z 0-9 -` |
| `brand` | string (send) / object (receive) | Yes | | Existing brand `_id` |
| `type` | `"bike"` \| `"scooter"` | Yes | | |
| `price` | number | Yes | | `>= 0`, PKR |
| `rating` | number | No | `0` | `0`–`5` |
| `imageUrl` | string | *server* (from upload) | | |
| `imagePublicId` | string | *server* | `""` | |
| `specs` | object | No | all `""` | Keys: `range`, `topSpeed`, `battery`, `chargingTime`, `motorPower`, `weight`, `warranty` |
| `createdAt` / `updatedAt` | string (ISO date) | *server* | | |

### Accessory

| Field | Type | Required | Default | Limits |
|---|---|---|---|---|
| `_id` | string | *server* | | |
| `name` | string | Yes | | Max 150 |
| `slug` | string | No (auto) | from `name` | Unique, `a-z 0-9 -` |
| `price` | number | Yes | | `>= 0`, PKR |
| `priceText` | string | *server* (computed) | | e.g. `"PKR 1,200"` |
| `imageUrl` | string | *server* (from upload) | | |
| `imagePublicId` | string | *server* | `""` | |
| `description` | string | No | `""` | Max 2000 |
| `features` | string[] | No | `[]` | Max 20 items × 200 chars |
| `inStock` | boolean | No | `true` | |
| `createdAt` / `updatedAt` | string (ISO date) | *server* | | |

### Spare part

Same fields, defaults and limits as [Accessory](#accessory).

### Contact submission

| Field | Type | Required | Default | Limits |
|---|---|---|---|---|
| `_id` | string | *server* | | |
| `fullName` | string | Yes | | Max 100 |
| `email` | string | Yes | | Valid email, lowercase |
| `reason` | string | Yes | | `Product Inquiry` \| `Business Inquiry` \| `Support` \| `General Inquiry` |
| `message` | string | No | `""` | Max 5000 |
| `status` | string | *admin only* | `pending` | `pending` \| `in process` \| `answered` |
| `createdAt` / `updatedAt` | string (ISO date) | *server* | | |

### Test ride request

| Field | Type | Required | Default | Limits |
|---|---|---|---|---|
| `_id` | string | *server* | | |
| `requesterName` | string | Yes | | Max 100 |
| `requesterEmail` | string | Yes | | Valid email, lowercase |
| `requesterWhatsApp` | string | Yes | | `+` optional, then 8–15 digits; spaces, dashes and brackets removed |
| `brand` | string (send) / object (receive) | Yes | | Existing brand `_id` |
| `bike` | string (send) / object (receive) | Yes | | Existing bike `_id` of that brand |
| `preferredCity` | string | Yes | | Max 100 |
| `preferredDate` | string (send `YYYY-MM-DD`) / ISO date (receive) | Yes | | Today or later |
| `preferredTime` | string | Yes | | `HH:mm`, 24-hour |
| `status` | string | *admin only* | `pending` | `pending` \| `accepted` \| `rejected`; final once not `pending` |
| `rejectionReason` | string | *admin only* | `""` | Max 1000; set when rejecting |
| `createdAt` / `updatedAt` | string (ISO date) | *server* | | |

### Order

| Field | Type | Required | Default | Limits |
|---|---|---|---|---|
| `_id` | string | *server* | | |
| `bike` | string (send) / object (receive) | Yes | | Existing bike `_id` |
| `bikeName` | string | *server* (copied from the bike) | | |
| `unitPrice` | number | *server* (copied from the bike) | | PKR |
| `quantity` | integer | Yes | | `1`–`10` |
| `totalAmount` | number | *server* | | `unitPrice × quantity`, PKR |
| `shippingAddress` | object | Yes | | `fullName` (max 100), `phoneNumber` (`+` optional, 8–15 digits), `address` (max 500), `postalCode` (5 digits), `city` (max 100), all required |
| `paymentMethod` | string | No | `cash on delivery` | `cash on delivery` |
| `status` | string | *admin only* | `pending` | `pending` \| `processing` \| `delivered` \| `completed` \| `cancelled` \| `rejected` |
| `nextStatuses` | string[] | *server* (computed) | | Statuses the order can move to next |
| `createdAt` / `updatedAt` | string (ISO date) | *server* | | |

---

## 9. TypeScript types

Copy into your frontend (e.g. `src/types/api.ts`).

```ts
export type ObjectId = string;
export type ISODate = string;

export interface ApiError {
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Admin {
  _id: ObjectId;
  fullName: string;
  email: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Brand {
  _id: ObjectId;
  displayName: string;
  logoUrl: string;
  logoPublicId: string;
  origin: string;
  established: string;
  headquarters: string;
  about: string;
  websiteUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type BrandSummary = Pick<Brand, "_id" | "displayName" | "logoUrl">;

export type BikeType = "bike" | "scooter";

export interface BikeSpecs {
  range: string;
  topSpeed: string;
  battery: string;
  chargingTime: string;
  motorPower: string;
  weight: string;
  warranty: string;
}

export interface Bike {
  _id: ObjectId;
  name: string;
  slug: string;
  brand: BrandSummary;
  type: BikeType;
  price: number;
  rating: number;
  imageUrl: string;
  imagePublicId: string;
  specs: BikeSpecs;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Accessory {
  _id: ObjectId;
  name: string;
  slug: string;
  price: number;
  priceText: string;
  imageUrl: string;
  imagePublicId: string;
  description: string;
  features: string[];
  inStock: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type SparePart = Accessory;

export type ContactReason = "Product Inquiry" | "Business Inquiry" | "Support" | "General Inquiry";
export type ContactStatus = "pending" | "in process" | "answered";

export interface ContactSubmission {
  _id: ObjectId;
  fullName: string;
  email: string;
  reason: ContactReason;
  message: string;
  status: ContactStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type TestRideStatus = "pending" | "accepted" | "rejected";
export type BikeSummary = Pick<Bike, "_id" | "name" | "slug" | "imageUrl">;

export interface TestRideRequest {
  _id: ObjectId;
  requesterName: string;
  requesterEmail: string;
  requesterWhatsApp: string;
  brand: BrandSummary | null;
  bike: BikeSummary | null;
  preferredCity: string;
  preferredDate: ISODate;
  preferredTime: string;
  status: TestRideStatus;
  rejectionReason: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type OrderStatus = "pending" | "processing" | "delivered" | "completed" | "cancelled" | "rejected";
export type PaymentMethod = "cash on delivery";

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  address: string;
  postalCode: string;
  city: string;
}

export interface Order {
  _id: ObjectId;
  bike: BikeSummary | null;
  bikeName: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  nextStatuses: OrderStatus[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

// Responses
export interface LoginResponse { accessToken: string; admin: Admin }
export interface MeResponse { admin: Admin }
export interface MessageResponse { message: string }

// Password requests
export interface ChangePasswordInput { currentPassword: string; newPassword: string }
export interface ForgotPasswordInput { email: string }
export interface ResetPasswordInput { otp: string; newPassword: string }

export interface BrandListResponse { brands: Brand[] }
export interface BrandResponse { brand: Brand }

export interface BikeListResponse { bikes: Bike[]; pagination: Pagination }
export interface BikeResponse { bike: Bike }

export interface AccessoryListResponse { accessories: Accessory[]; pagination: Pagination }
export interface AccessoryResponse { accessory: Accessory }

export interface SparePartListResponse { spareParts: SparePart[]; pagination: Pagination }
export interface SparePartResponse { sparePart: SparePart }

export interface ContactSubmitResponse { message: string; submission: ContactSubmission }
export interface ContactSubmissionListResponse { submissions: ContactSubmission[]; pagination: Pagination }
export interface ContactSubmissionResponse { submission: ContactSubmission }

export interface TestRideSubmitResponse {
  message: string;
  testRideRequest: Omit<TestRideRequest, "brand" | "bike"> & { brand: ObjectId; bike: ObjectId };
}
export interface TestRideRequestListResponse { testRideRequests: TestRideRequest[]; pagination: Pagination }
export interface TestRideRequestResponse { testRideRequest: TestRideRequest }

export interface PlaceOrderResponse { message: string; order: Omit<Order, "bike"> & { bike: ObjectId } }
export interface OrderListResponse { orders: Order[]; pagination: Pagination }
export interface OrderResponse { order: Order }

// Query params
export interface PageQuery { page?: number; limit?: number }
export interface BikeListQuery extends PageQuery { brand?: ObjectId; type?: BikeType }
export interface AccessoryListQuery extends PageQuery { inStock?: boolean }
export type SparePartListQuery = AccessoryListQuery;
export interface ContactSubmissionListQuery extends PageQuery { status?: ContactStatus; reason?: ContactReason }
export interface TestRideRequestListQuery extends PageQuery { status?: TestRideStatus; brand?: ObjectId; bike?: ObjectId }
export interface OrderListQuery extends PageQuery { status?: OrderStatus; bike?: ObjectId }

// Request bodies (JSON PATCH; for multipart, send the same keys in FormData)
export type BrandInput = Partial<
  Pick<Brand, "displayName" | "origin" | "established" | "headquarters" | "about" |
    "websiteUrl" | "instagramUrl" | "twitterUrl" | "facebookUrl">
>;

export interface BikeInput {
  name?: string;
  slug?: string;
  brand?: ObjectId;
  type?: BikeType;
  price?: number;
  rating?: number;
  specs?: Partial<BikeSpecs>;
}

export interface AccessoryInput {
  name?: string;
  slug?: string;
  price?: number;
  description?: string;
  features?: string[];
  inStock?: boolean;
}

export type SparePartInput = AccessoryInput;

export interface ContactFormInput {
  fullName: string;
  email: string;
  reason: ContactReason;
  message?: string;
}

export interface TestRideRequestInput {
  requesterName: string;
  requesterEmail: string;
  requesterWhatsApp: string;
  brand: ObjectId;
  bike: ObjectId;
  preferredCity: string;
  preferredDate: string; // "YYYY-MM-DD"
  preferredTime: string; // "HH:mm"
}

export interface RejectTestRideInput { rejectionReason: string }

export interface PlaceOrderInput {
  bike: ObjectId;
  quantity: number;
  shippingAddress: ShippingAddress;
  paymentMethod?: PaymentMethod;
}

export interface UpdateOrderStatusInput { status: OrderStatus }
```

---

## 10. Frontend integration examples

### Option A: axios

```js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true, // required: sends the auth cookie
});

// Send expired/missing sessions back to the login page
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isPublicAuthCall = ["/login", "/forgot-password", "/reset-password"].some((p) =>
      url.includes(`/admin/auth${p}`),
    );
    if (status === 401 && !isPublicAuthCall) {
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  },
);

// Readable error text for toasts/forms
export function errorMessage(error) {
  return error.response?.data?.message ?? "Something went wrong. Please try again.";
}
```

Only redirect on `401` inside the admin panel; public pages never receive it.

### Option B: fetch wrapper

```js
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export async function request(path, { method = "GET", body, query } = {}) {
  const url = new URL(API_URL + path);
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: "include", // required: sends the auth cookie
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message ?? `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return data;
}
```

### Admin login flow

```js
// Login
await api.post("/admin/auth/login", { email, password });

// On admin app load: restore session
try {
  const { data } = await api.get("/admin/auth/me");
  setAdmin(data.admin);
} catch {
  navigate("/admin/login");
}

// Logout
await api.post("/admin/auth/logout");
setAdmin(null);
navigate("/admin/login");
```

### Change password (logged in)

```js
try {
  await api.patch("/admin/auth/change-password", { currentPassword, newPassword });
  toast.success("Password changed");
  // Still logged in here: the server set a fresh cookie. Other devices are signed out.
} catch (error) {
  setFormError(errorMessage(error)); // e.g. "Current password is incorrect" (400)
}
```

### Forgot / reset password (logged out)

Exclude these two endpoints from any global "401 → login" redirect, the same as `/login`.

```js
// Step 1: "Forgot password?" form
async function requestCode(email) {
  const { data } = await api.post("/admin/auth/forgot-password", { email });
  toast.info(data.message); // generic message, shown even if the email isn't an admin
  navigate("/admin/reset-password", { state: { email } }); // email only for display ("code sent to ...")
}

// Step 2: "Enter code + new password" form
async function resetPassword(otp, newPassword) {
  try {
    const { data } = await api.post("/admin/auth/reset-password", {
      otp: otp.trim(), // keep it a string so "048213" keeps its leading zero
      newPassword,
    });
    toast.success(data.message);
    navigate("/admin/login");
  } catch (error) {
    const status = error.response?.status;
    if (status === 429) toast.error("Too many attempts. Please wait a few minutes and try again.");
    else setFormError(errorMessage(error)); // e.g. "Invalid or expired OTP"
  }
}
```

UI tips:

- Use `<input inputMode="numeric" autoComplete="one-time-code" maxLength={6}>` for the code (not `type="number"`, which drops leading zeros).
- Offer a "Resend code" button that calls `forgot-password` again, disabled for 60 seconds after each send (the server ignores repeat requests within a minute anyway).
- On `Invalid or expired OTP`, offer "Request a new code".

### Public pages

```js
// Bikes listing with filters and pagination
const { data } = await api.get("/bikes", {
  params: { page, limit: 12, brand: brandId || undefined, type: type || undefined },
});
// data.bikes, data.pagination

// Bike detail page: /bikes/:slug
const { data: { bike } } = await api.get(`/bikes/${slug}`);

// Brands (e.g. for a filter dropdown or brands page)
const { data: { brands } } = await api.get("/brands");

// In-stock accessories
const { data: { accessories, pagination } } = await api.get("/accessories", {
  params: { inStock: true, page },
});

// Spare parts listing and detail page (/spare-parts/:slug)
const { data: { spareParts } } = await api.get("/spare-parts", { params: { page } });
const { data: { sparePart } } = await api.get(`/spare-parts/${slug}`);
```

Format bike prices on the frontend (accessories and spare parts already include `priceText`):

```js
const formatPKR = (n) => `PKR ${n.toLocaleString("en-US")}`; // 195000 -> "PKR 195,000"
```

### Admin: create a bike

```js
const fd = new FormData();
fd.append("image", fileInput.files[0]);
fd.append("name", "Crown Electric Spark");
fd.append("brand", brandId);
fd.append("type", "bike");
fd.append("price", "195000");
fd.append("rating", "4.5");
fd.append("specs", JSON.stringify({
  range: "70 km",
  topSpeed: "65 km/h",
  battery: "72V 30Ah",
  chargingTime: "4.5 hrs",
  motorPower: "3000W",
  weight: "115 kg",
  warranty: "2 Years",
}));

// Don't set Content-Type; the browser sets the multipart boundary
const { data: { bike } } = await api.post("/bikes", fd);
```

### Admin: update a bike

```js
// Without a new image: JSON
await api.patch(`/bikes/${bike._id}`, { price: 199000, specs: { weight: "120 kg" } });

// With a new image: FormData
const fd = new FormData();
fd.append("image", newFile);
fd.append("rating", "4.8");
await api.patch(`/bikes/${bike._id}`, fd);
```

### Admin: create a brand

```js
const fd = new FormData();
fd.append("logo", logoFile); // note: the field is "logo", not "image"
fd.append("displayName", "Okla");
fd.append("origin", "Pakistani");
fd.append("headquarters", "Lahore, Pakistan");
fd.append("about", "Okla Electric is a Pakistani EV manufacturer...");
const { data: { brand } } = await api.post("/brands", fd);
```

### Admin: create an accessory

```js
const fd = new FormData();
fd.append("image", file);
fd.append("name", "Charger");
fd.append("price", "1200");
fd.append("description", "High-speed authentic charger...");
["Fast charging support", "Overcharge protection", "Durable cable"]
  .forEach((f) => fd.append("features", f));
fd.append("inStock", "true");
const { data: { accessory } } = await api.post("/accessories", fd);
```

### Admin: create a spare part

Identical form to accessories; only the path and response key change:

```js
const fd = new FormData();
fd.append("image", file);
fd.append("name", "Battery");
fd.append("price", "40000"); // priceText is computed by the server
fd.append("description", "Long-lasting lithium-ion battery replacement...");
["High capacity", "Weather sealed", "2-year warranty"].forEach((f) => fd.append("features", f));
const { data: { sparePart } } = await api.post("/spare-parts", fd);
```

### Public: contact form

```js
async function submitContact({ fullName, email, reason, message }) {
  try {
    const { data } = await api.post("/contact-submissions", { fullName, email, reason, message });
    toast.success(data.message); // "Thanks for reaching out! We'll get back to you soon."
    resetForm();
  } catch (error) {
    if (error.response?.status === 429) toast.error("You've sent several messages already. Please try again later.");
    else setFormError(errorMessage(error));
  }
}

// Use the exact values for the reason dropdown
const CONTACT_REASONS = ["Product Inquiry", "Business Inquiry", "Support", "General Inquiry"];
```

### Admin: contact inbox

```js
// List, optionally filtered (axios encodes "in process" for you)
const { data: { submissions, pagination } } = await api.get("/contact-submissions", {
  params: { page, status: statusFilter || undefined, reason: reasonFilter || undefined },
});

// Pending badge count
const { data: { pagination: { total: pendingCount } } } = await api.get("/contact-submissions", {
  params: { status: "pending", limit: 1 },
});

// Change status
await api.patch(`/contact-submissions/${submission._id}/status`, { status: "answered" });

// Delete
await api.delete(`/contact-submissions/${submission._id}`);
```

Replying happens outside the app: reply to the notification email (its Reply-To is the visitor) or use a `mailto:` link built from `submission.email`, then mark the submission `answered`.

### Public: test ride form

```js
// Brand dropdown, then a bike dropdown filtered by the chosen brand
const { data: { brands } } = await api.get("/brands");
const { data: { bikes } } = await api.get("/bikes", { params: { brand: brandId, limit: 100 } });

async function requestTestRide(form) {
  try {
    const { data } = await api.post("/test-ride-requests", form);
    toast.success(data.message); // "Your test ride request has been received! We'll contact you soon."
    resetForm();
  } catch (error) {
    if (error.response?.status === 429) toast.error("You've sent several requests already. Please try again later.");
    else setFormError(errorMessage(error));
  }
}
```

`<input type="date" min={today}>` and `<input type="time">` already produce the `YYYY-MM-DD` and `HH:mm` values the API expects.

### Admin: test ride requests

```js
const { data: { testRideRequests, pagination } } = await api.get("/test-ride-requests", {
  params: { page, status: statusFilter || undefined },
});

// Accept
await api.patch(`/test-ride-requests/${request._id}/accept`);

// Reject (reason is required)
await api.patch(`/test-ride-requests/${request._id}/reject`, { rejectionReason });

// Show the date without a timezone shift
const date = request.preferredDate.slice(0, 10); // "2026-10-10"

// WhatsApp chat link (works when the number includes the country code)
const whatsAppUrl = `https://wa.me/${request.requesterWhatsApp.replace(/^\+/, "")}`;
```

Only show the Accept and Reject buttons while `status === "pending"`. A `409` means the request was already reviewed; refresh the list.

### Public: checkout

```js
async function placeOrder({ bikeId, quantity, shippingAddress }) {
  try {
    const { data } = await api.post("/orders", { bike: bikeId, quantity, shippingAddress });
    showConfirmation(data.message, data.order); // e.g. show data.order.totalAmount and data.order._id
  } catch (error) {
    if (error.response?.status === 429) toast.error("You've placed several orders already. Please try again in an hour.");
    else setFormError(errorMessage(error));
  }
}
```

Show the price from the bike page while the customer fills in the form, but treat `order.totalAmount` in the response as the final amount.

### Admin: orders

```js
const { data: { orders, pagination } } = await api.get("/orders", {
  params: { page, status: statusFilter || undefined },
});

// One button per allowed next status
order.nextStatuses.map((status) => (
  <button key={status} onClick={() => api.patch(`/orders/${order._id}/status`, { status })}>{status}</button>
));
```

A `409` means the change isn't allowed from the order's current status, usually because another admin already updated it; refresh the list.

### Admin: delete with a blocked-brand message

```js
try {
  await api.delete(`/brands/${brand._id}`);
} catch (error) {
  if (error.response?.status === 409) {
    toast.error(errorMessage(error)); // "Cannot delete brand: 3 bike(s) still belong to it"
  }
}
```

### Showing validation errors

All errors share `{ message }`. Show it directly in a toast or above the form:

```js
try {
  await api.post("/bikes", fd);
} catch (error) {
  setFormError(errorMessage(error)); // e.g. "Name is required, Invalid price"
}
```

### Client-side checks that save a round trip

| Check | Rule |
|---|---|
| Image type | `["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)` |
| Image size | `file.size <= 5 * 1024 * 1024` |
| Required fields | Brand: `displayName`, `logo`. Bike: `name`, `brand`, `type`, `price`, `image`. Accessory / spare part: `name`, `price`, `image`. Test ride: every field. Order: `bike`, `quantity` and every `shippingAddress` field. |
| Order quantity | `Number.isInteger(quantity) && quantity >= 1 && quantity <= 10` |
| Postal code | `/^\d{5}$/` |
| Rating | `0 <= rating <= 5` |
| Slug | `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` |
| WhatsApp / phone number | `/^\+?\d{8,15}$/.test(value.replace(/[\s()-]/g, ""))` |
| Preferred time | `/^([01]\d\|2[0-3]):[0-5]\d$/` |

### Local development with Vite

The default setup (frontend on `http://localhost:5173`, API on `http://localhost:5000`) works out of the box: CORS allows `CLIENT_URL` and the cookie is sent because both are on `localhost`. If your frontend runs on a different port, ask for `CLIENT_URL` to be updated in the server's `.env`.

Alternatively, proxy the API through Vite so everything is same-origin:

```js
// vite.config.js
export default {
  server: {
    proxy: { "/api": "http://localhost:5000" },
  },
};
// then use baseURL: "/api"
```

---

## 11. Running the server

### Requirements

- Node.js 22 or newer (24 recommended)
- A MongoDB database (MongoDB Atlas)
- A Cloudinary account
- A Gmail account with 2-Step Verification, for sending password emails

### Setup

```bash
npm install
cp .env.example .env    # then fill in the values
npm run seed:admin      # creates the admin from ADMIN_* in .env
npm run dev             # starts on http://localhost:5000 and restarts on file changes
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Port to listen on. Default `5000`. |
| `NODE_ENV` | No | `development` or `production`. In production the auth cookie is HTTPS-only and 500 errors hide details. |
| `CLIENT_URL` | No | Frontend origin allowed by CORS. Default `http://localhost:5173`. |
| `TRUST_PROXY` | No | Number of reverse proxies in front of the server. Default `0`. **Set it to `1` in production behind nginx/Caddy** (the Docker setup only listens on `127.0.0.1`, so a proxy is expected), or `2` if Cloudflare is in front of that proxy. Without it, every visitor appears to have the proxy's IP, so rate limits are shared by all customers, e.g. only 3 orders per hour for the whole shop. Don't set it when nothing sits in front of the server, or clients could fake their IP. |
| `MONGODB_URI` | **Yes** | MongoDB connection string. |
| `DNS_SERVERS` | No | e.g. `8.8.8.8,1.1.1.1`. Set this if a `mongodb+srv://` URI fails with `querySrv ECONNREFUSED`. |
| `JWT_SECRET` | **Yes** | Long random string used to sign tokens. Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | From the Cloudinary console. |
| `CLOUDINARY_API_KEY` | **Yes** | From the Cloudinary console. |
| `CLOUDINARY_API_SECRET` | **Yes** | From the Cloudinary console. |
| `GMAIL_USER` | **Yes** | Gmail address that sends emails, e.g. `evinn.shop@gmail.com`. |
| `GMAIL_APP_PASSWORD` | **Yes** | 16-character Gmail **App Password** (not the normal password). Spaces are ignored. See below. |
| `MAIL_FROM_NAME` | No | Sender name shown in inboxes. Default `Evinn`. |
| `ADMIN_FULL_NAME` | Seed only | Name for the seeded admin. |
| `ADMIN_EMAIL` | Seed only | Email for the seeded admin. |
| `ADMIN_PASSWORD` | Seed only | Password for the seeded admin (min 8 chars). Can be removed after seeding. |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with auto-restart on file changes. |
| `npm start` | Start normally. |
| `npm run seed:admin` | Create the admin account. Safe to run again (skips if the email exists). |

### Gmail setup

Gmail no longer accepts the account's normal password from apps, so the server uses an App Password:

1. Sign in to the Gmail account that will send emails.
2. Turn on **2-Step Verification**: Google Account → Security.
3. Open <https://myaccount.google.com/apppasswords>, create an app password (name it e.g. `Evinn server`), and copy the 16-character code.
4. Put the address in `GMAIL_USER` and the code in `GMAIL_APP_PASSWORD`, then restart the server.

On startup the server logs `Mailer connected: <address>` if the login works, or `Mailer check failed: ...` with the reason. Email sending runs in the background, so a failed send never shows up in the API response. Check the server logs if a reset code doesn't arrive.

Limits and gotchas:

- A personal Gmail account can send roughly 500 emails a day, which is plenty for admin password emails.
- Some hosts block outgoing email ports (SMTP 465/587), often on free plans. If emails work locally but not after deploying, check your host's SMTP policy.
- Changing the Gmail account's password revokes its App Passwords; create a new one afterwards.

### Docker

```bash
docker compose up -d --build                         # build and start on 127.0.0.1:5000
docker compose logs -f api                           # follow logs
docker compose exec api node scripts/seed-admin.js   # seed the admin inside the container
docker compose down                                  # stop
```

Settings are read from `.env`; it is not copied into the image.

### Project structure

```
src/
  main.js              Entry point: connects to MongoDB, starts the server
  app.js               Express app, middleware and route mounting
  config/              Environment, database, Cloudinary and Gmail (Nodemailer) setup
  controllers/         Request handlers per resource
  emails/              HTML email templates (shared layout, reset code, password changed, new contact message, new test ride request, new order)
  middlewares/         Auth (cookie JWT), image upload, rate limiting, error handling
  models/              Mongoose schemas: Admin, Brand, Bike, Accessory, SparePart, ContactSubmission, TestRideRequest, Order
  routes/              Route definitions per resource
  utils/               Cloudinary, email, OTP, pagination, price/slug/features/phone helpers, auth cookie, errors
scripts/
  seed-admin.js        Creates the admin account
```
