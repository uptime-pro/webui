# Uptime Pro — WebUI

The frontend for **Uptime Pro**, a self-hosted uptime and infrastructure monitoring platform. Built with [Next.js 16](https://nextjs.org) (App Router) and [shadcn/ui](https://ui.shadcn.com), it provides a real-time dashboard for monitoring, alerting, and status page management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| UI Components | shadcn/ui + Base UI (Radix alternative) |
| Styling | Tailwind CSS v4 |
| State / Data | TanStack Query v5 |
| Charts | Recharts |
| Icons | Lucide React |
| Theme | next-themes (dark mode default) |
| Global State | Zustand |

---

## Features

### Pages & Routes

| Route | Description |
|---|---|
| `/login` | Authentication (also opens as modal over any page) |
| `/setup` | First-run wizard to create the initial admin account |
| `/status/:slug` | **Public** status page (no login required) |
| `/dashboard` | Real-time monitor overview with live heartbeat stream |
| `/dashboard` → detail pane | Per-monitor status, response time chart, heartbeat history |
| `/monitors` | Full monitor list with search and filtering |
| `/monitors/add` | Create a new monitor |
| `/monitors/:id/edit` | Edit monitor configuration |
| `/monitors/import-export` | Bulk JSON import / export |
| `/notifications` | Manage notification channels |
| `/status-pages` | Create and manage public status pages |
| `/status-pages/:id/incidents` | Incident management for a status page |
| `/maintenance` | Schedule maintenance windows |
| `/tags` | Manage monitor tags |
| `/infrastructure` | Queue health, DragonflyDB stats, PostgreSQL stats |
| `/settings` | Application and account settings |
| `/settings/api-keys` | Create and revoke personal API keys |
| `/settings/reports` | Configure scheduled email reports |
| `/admin/users` | User management (ADMIN only) |

### UI Capabilities

- **Dark mode by default** — system-aware theme switching via next-themes
- **Real-time updates** — WebSocket connection streams heartbeat events live to the dashboard
- **Response time charts** — Line charts (Recharts) showing ping history per monitor
- **Heartbeat history** — Paginated heartbeat log with status and response time
- **Uptime badges** — Copy-paste SVG badge snippets for READMEs
- **Monitor import/export** — Drag-and-drop JSON import
- **Responsive layout** — Sidebar collapses on mobile; horizontal monitor list on wider screens
- **Toast notifications** — Success/error feedback via Sonner

---

## Project Structure

```
app/
├── (app)/                  # Authenticated shell (sidebar + header layout)
│   ├── dashboard/          # Main monitoring dashboard
│   │   └── @detail/[id]/   # Parallel route: monitor detail pane
│   │       ├── chart/      # Response time chart tab
│   │       └── heartbeats/ # Heartbeat history tab
│   ├── monitors/           # Monitor list, create, edit, import/export
│   ├── notifications/      # Notification channel management
│   ├── status-pages/       # Status page + incident management
│   ├── maintenance/        # Maintenance window management
│   ├── tags/               # Tag management
│   ├── infrastructure/     # Infrastructure health dashboard
│   ├── settings/           # Settings, API keys, reports
│   └── admin/users/        # Admin-only user management
├── (public)/               # Unauthenticated shell
├── status/[slug]/          # Public status page
├── login/                  # Login page
└── setup/                  # First-run setup wizard
components/
├── shell/                  # App layout: sidebar, header, page-header
├── monitor/                # Monitor cards, forms, heartbeat display
├── notification/           # Notification channel form
├── status-page/            # Status page builder and public view
├── ui/                     # shadcn/ui primitives (button, card, table, etc.)
└── providers/              # Query client, theme, WebSocket providers
hooks/
├── use-monitors.ts         # Monitor CRUD + heartbeat queries
├── use-notifications.ts    # Notification channel queries
├── use-infrastructure.ts   # Queue, Dragonfly, PostgreSQL stat queries
├── use-auth.ts             # Auth state and session management
└── ...                     # Other domain-specific hooks
lib/
├── api.ts                  # Typed API request helper (wraps fetch)
└── utils.ts                # cn() and shared utilities
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 20+
- pnpm
- The [API](../api/README.md) running at `http://localhost:3001`

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

> **Important:** `NEXT_PUBLIC_*` variables are baked in at build time by Next.js. If you change them after building, you must rebuild.

### 3. Start the dev server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app will hot-reload on changes.

---

## Scripts

```bash
pnpm run dev      # Start development server with hot reload
pnpm run build    # Production build
pnpm run start    # Serve the production build
pnpm run lint     # ESLint
pnpm run format   # Prettier
```

---

## Environment Variables

| Variable | Build-time | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Base URL of the Uptime Pro API |
| `NEXT_PUBLIC_WS_URL` | ✅ Yes | WebSocket URL for real-time heartbeat events |

Both variables are `NEXT_PUBLIC_` — they are embedded into the JavaScript bundle at build time. For Docker deployments, set them as build args in `compose.yaml`:

```yaml
build:
  args:
    NEXT_PUBLIC_API_URL: http://your-server:3001
    NEXT_PUBLIC_WS_URL: ws://your-server:3001
```

---

## Theme & Styling

The app uses **dark mode by default**, configured via `next-themes` with a `ThemeProvider` in the root layout. Theme preference is stored in `localStorage` and respects the OS setting on first load.

Styles are built with **Tailwind CSS v4** using semantic CSS variables (defined in `app/globals.css`). All colors use shadcn's token system (`bg-background`, `text-muted-foreground`, etc.) — avoid one-off `dark:` overrides.

To customise the color theme, edit the CSS variables in `app/globals.css` under `:root` (light) and `.dark` (dark).

---

## Data Fetching

All server communication goes through the typed `apiRequest` helper in `lib/api.ts`, which handles auth cookies, error parsing, and base URL resolution.

TanStack Query is used for all data fetching and caching. Hooks are co-located by domain in `hooks/`:

```ts
// Example
const { data: monitors, isLoading } = useMonitors();
const { mutate: createMonitor } = useCreateMonitor();
```

Real-time heartbeat events are delivered via WebSocket and merged into the TanStack Query cache, so the dashboard updates live without polling.

---

## Docker

The WebUI is deployed as part of the multi-container stack defined in `../compose.yaml`. The API URL is baked in at image build time via `--build-arg`.

To build the WebUI image standalone:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://your-api:3001 \
  --build-arg NEXT_PUBLIC_WS_URL=ws://your-api:3001 \
  -t uptimepro-webui .
```
