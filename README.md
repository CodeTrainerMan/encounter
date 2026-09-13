# Encounter

**English** · [中文](./README.zh-CN.md)

A place to record every encounter — people, places, works, and those fleeting moments.

The UI ships in two languages: **English (default)** and **Chinese**.

- **Home timeline** — layout inspired by X (Twitter): one line of design notes at the top, then the composer and every record below it
- **Quick post** — write the body and publish; the title is derived from the first line, while type / date / location / tags stay tucked under "More options"
- **All records** — filter by type / tag / keyword / favorite
- **Detail page** — body, tags, rating, previous/next navigation, emoji reactions, edit and delete
- **Write a record** — type, date, location, summary, body, tags, rating, cover image, favorite
- **Sign in** — Discord OAuth (Auth.js); records carry the author's name and avatar, and **only the author can edit their own**
- **Emoji reactions** — drop an emoji on any record (👋 ❤️ 😂 👍 🎉 🔥), much like Discord reactions

The whole site is built on **Next.js (App Router + Server Components + Server Actions)**,
with data in **PostgreSQL** (Vercel Postgres / Neon), i18n via **next-intl**,
sign-in via the **Auth.js (NextAuth v5)** Discord provider,
and deployment on **Vercel**. There is no separate backend service.

---

## Quick start

Content lives entirely in the database, so start one first:

```bash
npm install
docker compose up -d            # starts a local PostgreSQL (host port 5433)
cp .env.example .env.local      # fill in the local connection string, see "Database" below
npm run db:init                 # create tables
npm run dev
```

Then open http://localhost:3000. The timeline starts out empty — write the first record right there.

> The site still loads without a database configured: the timeline just stays empty and nothing can be
> saved. No blank page.

To enable sign-in and reactions (writing your own records, reacting to other people's), add the three
required Discord OAuth variables from "Sign-in and reactions" below (plus the optional
`ADMIN_DISCORD_IDS`), then restart `npm run dev`.

## Internationalization

English is the default locale; Chinese lives under the `/zh` prefix:

| Path | Language |
| --- | --- |
| `/`, `/encounters`, `/encounters/new`, `/about` | English |
| `/zh`, `/zh/encounters`, `/zh/encounters/new`, `/zh/about` | Chinese |

How it works:

- Copy is centralized in `messages/en.json` and `messages/zh.json`, organized into namespaces such as
  `meta` / `nav` / `home` / `list` / `form` / `errors` / `about`
- The locale list is `LOCALES` in `src/lib/types.ts`, the routing strategy in `src/i18n/routing.ts`;
  `localePrefix: "as-needed"` keeps the prefix off the default locale (English)
- `src/middleware.ts` detects and redirects by locale, and the `Link` / `redirect` / `useRouter` exported
  from `src/i18n/navigation.ts` add the correct prefix automatically, so components never hand-write `/zh`
- Dates are formatted per locale with `Intl.DateTimeFormat`: `April 12, 2026` / `2026年4月12日`
- Validation and write errors **return only a message key** from the server (e.g. `errors.titleRequired`,
  `errors.databaseMissing`), which the client component translates — the server never needs to know the
  current locale
- Post-write redirects carry the current locale in a hidden form field, so you stay in the same language
  after submitting
- `sitemap.xml` emits entries for both locales with `hreflang` alternates

### Adding a locale

1. Add the language code to `LOCALES` in `src/lib/types.ts`, and the matching BCP 47 tag to `INTL_TAGS`
   in `src/lib/utils.ts` (e.g. `ja` → `ja-JP`)
2. Copy `messages/en.json` to `messages/<locale>.json` and translate it

## Sign-in and reactions (Discord OAuth)

Records have to belong to someone before "only the author can edit" means anything. Every user here comes
from the same Discord server, so Discord sign-in is the obvious fit: zero cost for them, and it solves
**record ownership, abuse prevention and avatar/nickname display** in one move.

The app requests only the `identify` scope and never reads email addresses; the `authors` table stores
nothing but a nickname and an avatar.

### Enabling it locally

1. Open https://discord.com/developers/applications → **New Application**.
2. Go to **OAuth2 → Redirects** and add `http://localhost:3000/api/auth/callback/discord`
   (add `https://your-domain/api/auth/callback/discord` for production later). Save, then copy the
   **Client ID** and **Client Secret**.
3. Put them in `.env.local`:

   ```
   AUTH_SECRET=...                    # generate with npx auth secret or openssl rand -base64 33
   AUTH_DISCORD_ID=your_client_id
   AUTH_DISCORD_SECRET=your_client_secret
   ADMIN_DISCORD_IDS=your_discord_user_id    # optional, comma-separated
   ```

4. Restart `npm run dev` and a "Sign in with Discord" button appears in the top-right of the nav.

### Degraded behaviour

If any one of `AUTH_SECRET` / `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` is missing (or there is no
database at all), the site automatically falls back to **read-only**: pages browse as usual, but the
sign-in button disappears and the home composer plus the detail-page reaction bar are replaced by a
sign-in prompt — no button that only turns into an error once you click it.

### Permission model

There is exactly one rule: **only the author can edit their own records.** On top of it sits an admin
concept (`ADMIN_DISCORD_IDS`) with two purposes:

1. Cleaning up junk other people posted;
2. Taking over historical records created before sign-in existed, whose `author_id` is null — under the
   rule above, nobody can touch those.

Permissions are enforced in the **data layer** (`assertCanManage` in `src/lib/encounters.ts`), not by
hiding buttons: a Server Action endpoint can be called with a hand-crafted request, and hidden UI is not a
permission check. Anyone, signed in or not, can react to any record — clicking while signed out first
takes you through Discord sign-in and then back to the page.

## Database

### Local development (Docker)

```bash
docker compose up -d      # start PostgreSQL, mapped to host port 5433
docker compose down       # stop (data stays in the named volume)
docker compose down -v    # stop and wipe data
```

Put the local connection string in `.env.local`:

```
DATABASE_URL=postgresql://encounter:encounter@127.0.0.1:5433/encounter
```

> Use `127.0.0.1`, not `localhost`: on Windows `localhost` may resolve to IPv6 `::1`, while Docker's
> port mapping only listens on IPv4, which produces `ETIMEDOUT`.

Then create the tables and restart `npm run dev` to start posting:

```bash
npm run db:init          # create tables and indexes from db/schema.sql
```

> Everything in `db/schema.sql` is `if not exists`, so it is safe to re-run. For an **already running old
> database**, re-running `npm run db:init` performs the migration: it adds the `authors` and
> `encounter_reactions` tables plus the `encounters.author_id` column (the column is null on old records,
> which makes them read-only until an admin takes them over).

### Production (Vercel / Neon)

1. Push to GitHub and **Import** the repository in Vercel; it is detected as Next.js with no extra build
   configuration needed.
2. Inside the project go to **Storage → Create Database → Postgres**. The connection string is injected
   as `DATABASE_URL` once created (pick the pooled string that contains `-pooler`; keep the
   `channel_binding` / `sslmode` parameters as they are).
3. Add the remaining variables under **Settings → Environment Variables** — a missing variable is not an
   error, it just degrades silently:

   | Variable | Consequence when missing |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | sitemap / robots / og:url point at localhost |
   | `AUTH_SECRET` | no sign-in button, the site degrades to read-only |
   | `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | same as above |
   | `ADMIN_DISCORD_IDS` | cannot clean up other people's content, nor take over historical records |

   `ADMIN_DISCORD_IDS` must be a **Discord user ID (a string of digits)**; an @username does not error but
   will never match.
4. Create the tables: point the command at that database once, without touching `.env.local`:

   ```bash
   DATABASE_URL='production connection string' npm run db:init
   ```

   On Windows PowerShell that is `$env:DATABASE_URL='production connection string'; npm run db:init`.
   Clear the temporary variable afterwards (`Remove-Item Env:DATABASE_URL`), otherwise it overrides the
   local connection string in `.env.local` and your local development starts writing to production.
5. Add `https://your-domain/api/auth/callback/discord` to **OAuth2 → Redirects** in the Discord developer
   portal, or production sign-in fails with an invalid `redirect_uri`.
6. Redeploy and production can write records.

### About the two drivers

The `neon()` HTTP driver only speaks Neon's own `/sql` endpoint and cannot reach a plain PostgreSQL
server. So `src/lib/db.ts` decides from the connection string: local addresses (`127.0.0.1` / `localhost` /
`db`) go through node-postgres over standard TCP, everything else (production) keeps using the Neon HTTP
driver, leaving the **production architecture unchanged**. The schema script uses node-postgres, so it can
reach both the local database and Neon.

> Records are the user's own content and do not change with the UI language; the language only affects
> interface copy and date formatting. So `/encounters/x` and `/zh/encounters/x` point at the same record,
> and switching languages never lands you on a page that does not exist.

---

## Project structure

```
compose.yaml                 PostgreSQL container for local development
messages/en.json             English copy (default locale)
messages/zh.json             Chinese copy
db/schema.sql                Table definitions
scripts/db-client.mjs        Shared database client and env loading for scripts
scripts/db-init.mjs          Schema bootstrap script
src/i18n/                    routing / navigation / request configuration
src/middleware.ts            Locale routing middleware
src/app/[locale]/            Routes and pages (locale segment)
  layout.tsx                 Root layout: html lang, header, footer
  page.tsx                   Home: design notes + composer + timeline
  encounters/page.tsx        List and filters
  encounters/[slug]/         Detail, edit
  encounters/new/            New record
  about/                     About and deployment notes
  not-found.tsx / error.tsx  404 and error boundary
  api/auth/[...nextauth]/    Auth.js Discord callback
src/app/sitemap.ts           Bilingual sitemap (with hreflang alternates)
src/app/robots.ts
src/auth.ts                  Auth.js config (Discord provider, JWT callbacks)
src/actions/encounters.ts    Server Actions (post / save / delete)
src/actions/reactions.ts     Server Actions (add / remove reaction)
src/actions/auth.ts          Server Actions (sign in / out)
src/components/              UI components (PostComposer / PostCard / LanguageSwitcher / AuthMenu / ReactionBar)
src/lib/db.ts                Database connection and "is it configured" check
src/lib/encounters.ts        Data access layer (queries, stats, CRUD, permission checks)
src/lib/reactions.ts         Reaction data access layer
src/lib/authors.ts           Author (Discord account) read / write
src/lib/permissions.ts       Pure permission helpers (owner / admin)
src/lib/session.ts           Current signed-in author (React cache wrapper)
src/lib/types.ts             Domain models and locale definitions
src/lib/form-state.ts        Form state and error-key mapping
```

## Data model

`encounters` table:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `slug` | text | URL identifier generated from the title; a random suffix is appended on conflict |
| `title` | text | Title |
| `type` | text | `person` / `place` / `work` / `moment` |
| `happened_at` | date | Date of the encounter |
| `location` | text | Location |
| `summary` | text | One-line summary |
| `content` | text | Body, paragraphs separated by blank lines |
| `tags` | text[] | Tags |
| `cover_image` | text | Cover image URL |
| `rating` | int | Rating 1–5 |
| `favorite` | boolean | Whether it is marked as worth revisiting |
| `author_id` | uuid | Author, foreign key to `authors`; null means a historical record from before sign-in (read-only) |
| `created_at` / `updated_at` | timestamptz | Timestamps |

`authors` table (one author = one Discord account, storing only what is needed for display):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `discord_id` | text | Discord user ID, unique; upserted on sign-in |
| `username` | text | Discord @handle |
| `display_name` | text | Global nickname, preferred when displaying |
| `avatar_url` | text | Avatar URL (animated avatars store the gif URL) |
| `created_at` / `updated_at` | timestamptz | Timestamps |

When an author deletes their account the records are **not** cascaded away — `author_id` is set to null
instead (`on delete set null`), because a record is a memory and should not disappear over an account
issue.

`encounter_reactions` table (emoji reactions):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `encounter_id` | uuid | Target record, `on delete cascade` |
| `author_id` | uuid | Who reacted, `on delete cascade` |
| `emoji` | text | Constrained to the fixed set in `REACTION_EMOJIS` |
| `created_at` | timestamptz | Timestamp |

The unique index `(encounter_id, author_id, emoji)` guarantees the same person counts once per emoji per
record. Adding and removing uses "delete first — if a row was removed we are done, otherwise insert",
which cannot produce duplicates under concurrency.

## Scripts

```bash
npm run dev            # local development
npm run build          # production build
npm run start          # run the production build
npm run typecheck      # TypeScript type check
npm run db:init        # initialize the database schema
docker compose up -d   # start the local PostgreSQL
docker compose down    # stop the local PostgreSQL
```

## License

Released under the [MIT License](./LICENSE).
