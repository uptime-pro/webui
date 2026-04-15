# Uptime Pro — Frontend Agent Instructions

## Project Context

This is the **`webui/`** directory of Uptime Pro, a self-hosted uptime monitoring platform.

- **Framework**: Next.js 16 App Router
- **Language**: TypeScript (strict)
- **UI**: shadcn/ui on Radix UI primitives + Tailwind CSS v4
- **Linting/Formatting**: Biome (`pnpm lint` = `biome check`, `pnpm format` = `biome format --write`)
- **State**: Zustand (client state) + TanStack Query (server/REST state)
- **Real-time**: Native WebSocket via custom hooks (`useWebSocket`, `useHeartbeats`)
- **Backend**: NestJS API at `http://localhost:3001` (or `API_URL` env var)
- **Auth**: HttpOnly JWT cookie (set by backend on login — never localStorage)

Frontend and backend are built **in tandem**. Every phase delivers both API and UI. The Swagger spec at `/api/docs` is the contract the frontend builds against.

---

## Absolute Rules

1. **Never use `"use client"` unless the component genuinely requires browser APIs, event handlers, or React hooks that do not work on the server.** Default to Server Components.
2. **Never store auth tokens in `localStorage` or `sessionStorage`.** Auth is cookie-based — the browser sends the cookie automatically.
3. **Never use `next/router` (Pages Router).** Always use `next/navigation` (App Router).
4. **Always `await` params and searchParams** — they are Promises in Next.js 16. Use `async/await` or React `use()`.
5. **Never add `<head>`, `<title>`, or `<meta>` tags manually in layouts.** Use the Metadata API (`export const metadata` or `generateMetadata()`).
6. **Use `<Link>` from `next/link` for all internal navigation.** Never use `<a href>` for internal routes.
7. **Never fetch data in Client Components via `useEffect` + `fetch`.** Use TanStack Query (`useQuery`) for REST data in Client Components. Use `async` Server Components with `fetch()` for SSR data.

---

## File Conventions (App Router)

The component hierarchy within a route segment, from outermost to innermost:

```
layout.tsx
  template.tsx        ← use only when state reset on navigation is required
    error.tsx         ← MUST be "use client"; wraps page in React Error Boundary
      loading.tsx     ← wraps page in <Suspense>; shows skeleton during load
        not-found.tsx
          page.tsx    ← leaf; unique content for this route
```

### `layout.tsx`
- Shared UI that **persists across navigations** (sidebar, header, providers)
- Does NOT re-render on navigation — never read `searchParams` in a layout
- For parallel routes, receives named slot props alongside `children`:
  ```tsx
  export default function Layout({ children, detail }: LayoutProps) {
    return <div className="flex">{children}{detail}</div>
  }
  ```
- Root layout (`app/layout.tsx`) **must** include `<html>` and `<body>` tags

### `page.tsx`
- Always the **leaf** of a route subtree
- Server Component by default
- Receives `params` (Promise) and `searchParams` (Promise) as props
- Always `async` when reading params:
  ```tsx
  export default async function Page({ params }: PageProps<'/dashboard/[id]'>) {
    const { id } = await params
  }
  ```

### `loading.tsx`
- Automatically wraps `page.tsx` in a `<Suspense>` boundary
- **Always create a `loading.tsx`** for any route that fetches data — this enables streaming and makes navigation feel instant
- Use shadcn/ui `Skeleton` components as the fallback UI
- Server Component by default (no `"use client"` needed)
- Does NOT show for layout-level data — only for page-level Suspense

### `error.tsx`
- **Must be a Client Component** (`"use client"`)
- Wraps the route in a React Error Boundary
- Receives `error: Error` and `reset: () => void` props
- Use `unstable_retry()` for server-side errors, `reset()` for client-side
- Does NOT catch errors in `layout.tsx` of the same segment — use `global-error.tsx` for root layout errors
- `global-error.tsx` must define its own `<html>` and `<body>` tags

### `template.tsx`
- Use **only** when you need effects/state to reset on every navigation (e.g., page-transition animations, resetting a form on route change)
- Unlike `layout.tsx`, templates remount on every navigation — they have a unique key per navigation
- Default to `layout.tsx`; reach for `template.tsx` only when remount-on-navigation is intentional

### `default.tsx`
- **Required for every parallel route slot** (`@slot/default.tsx`)
- Renders as the fallback when Next.js cannot match the slot on a hard reload or direct URL access
- If `default.tsx` is missing and the slot is unmatched, Next.js renders a `404`

---

## ⚠️ Parallel Routes — Use Everywhere Logical

Parallel routes render **multiple independent pages within the same layout simultaneously**. They are defined with the `@folder` naming convention and passed as props to the parent layout.

### When to use parallel routes

Use parallel routes whenever:
- Two sections of a page load data **independently** and should stream separately
- A panel/detail view should update **without unmounting the list** (inbox pattern)
- A modal needs **deep linking** (URL changes when modal opens, back button closes it)
- Tab groups within a section should maintain their own navigation state
- A live preview should remain mounted while the editor tabs change

### How slots work

```
app/
└── dashboard/
    ├── layout.tsx          ← receives { children, detail } props
    ├── page.tsx            ← implicit @children slot
    ├── default.tsx         ← fallback for children on hard reload
    └── @detail/
        ├── default.tsx     ← "Select a monitor" empty state  ← REQUIRED
        └── [id]/
            ├── layout.tsx  ← tab shell
            ├── page.tsx    ← overview tab
            └── heartbeats/
                └── page.tsx
```

The layout receives the slot:
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  detail,
}: LayoutProps) {
  return (
    <div className="flex h-full">
      <aside className="w-80 shrink-0">{children}</aside>
      <main className="flex-1">{detail}</main>
    </div>
  )
}
```

### Parallel routes in this project

| Route | Slots | Purpose |
|---|---|---|
| `(app)/dashboard/` | `@detail` | Monitor list (children) + detail panel (always visible) |
| `app/` | `@modal` | Auth modal intercepting `/login` |
| `app/status/[slug]/` | `@monitors`, `@incidents` | Independent streaming sections on public status page |
| `(app)/status-pages/[id]/edit/` | `@editor`, `@preview` | Edit form + live preview side by side |

### Intercepting routes with parallel routes (modal pattern)

Used for the login modal — soft nav shows a dialog, direct URL shows the full page:

```
app/
├── layout.tsx              ← receives { children, modal } slots
├── @modal/
│   ├── default.tsx         ← returns null (modal hidden by default)
│   └── (.)login/
│       └── page.tsx        ← intercepted: renders <LoginDialog>
└── (auth)/
    └── login/
        └── page.tsx        ← direct URL: full standalone login page
```

Intercepting route conventions:
- `(.)folder` — intercept same level
- `(..)folder` — intercept one level up
- `(..)(..)folder` — intercept two levels up
- `(...)folder` — intercept from root

### Reading active slot segment

```tsx
"use client"
import { useSelectedLayoutSegment } from 'next/navigation'

// Inside @editor slot layout to highlight active tab:
const segment = useSelectedLayoutSegment() // 'monitors' | 'incidents' | null
```

### Rules for parallel routes

1. **Always create `default.tsx`** in every `@slot` — missing `default.tsx` = 404 on hard reload
2. **Slots do not affect the URL** — `@detail` is invisible in the URL
3. **Navigating within a slot is a partial render** — other slots stay mounted
4. **On hard reload**, slots without a matching route render their `default.tsx`
5. If one slot at a segment is dynamic, all slots must be dynamic

---

## Project Directory Structure

```
webui/
├── app/
│   ├── layout.tsx                    ← root layout (Providers, theme, @modal slot)
│   ├── page.tsx                      ← redirect to /dashboard
│   ├── global-error.tsx              ← root-level error boundary (needs <html><body>)
│   │
│   ├── @modal/                       ← PARALLEL SLOT: auth modal
│   │   ├── default.tsx               ← returns null
│   │   └── (.)login/
│   │       └── page.tsx              ← intercepted login dialog
│   │
│   ├── (auth)/                       ← route group: unauthenticated pages
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── setup/
│   │       └── page.tsx              ← first-run wizard
│   │
│   ├── (app)/                        ← route group: authenticated shell
│   │   ├── layout.tsx                ← auth guard + sidebar + header
│   │   ├── loading.tsx               ← app shell skeleton
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            ← split-pane shell (children + @detail)
│   │   │   ├── page.tsx              ← monitor list
│   │   │   ├── loading.tsx           ← monitor list skeleton
│   │   │   ├── error.tsx
│   │   │   ├── default.tsx           ← fallback for children slot
│   │   │   └── @detail/              ← PARALLEL SLOT: monitor detail
│   │   │       ├── default.tsx       ← "Select a monitor" empty state
│   │   │       └── [id]/
│   │   │           ├── layout.tsx    ← detail shell + tab nav
│   │   │           ├── page.tsx      ← overview tab
│   │   │           ├── loading.tsx   ← detail skeleton
│   │   │           ├── error.tsx
│   │   │           ├── heartbeats/
│   │   │           │   ├── page.tsx
│   │   │           │   └── loading.tsx
│   │   │           └── chart/
│   │   │               ├── page.tsx
│   │   │               └── loading.tsx
│   │   │
│   │   ├── monitors/
│   │   │   ├── add/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   └── [id]/edit/
│   │   │       ├── page.tsx
│   │   │       └── loading.tsx
│   │   │
│   │   ├── maintenance/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   │
│   │   ├── status-pages/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [id]/edit/
│   │   │       ├── layout.tsx        ← side-by-side shell (@editor + @preview)
│   │   │       ├── @editor/          ← PARALLEL SLOT: edit form
│   │   │       │   ├── default.tsx
│   │   │       │   ├── page.tsx      ← general settings
│   │   │       │   ├── monitors/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── incidents/
│   │   │       │       └── page.tsx
│   │   │       └── @preview/         ← PARALLEL SLOT: live preview
│   │   │           ├── default.tsx
│   │   │           └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── [section]/
│   │           ├── page.tsx
│   │           └── loading.tsx
│   │
│   └── status/                       ← public (no auth)
│       └── [slug]/
│           ├── layout.tsx            ← status page shell (brand, footer)
│           ├── page.tsx              ← orchestration
│           ├── loading.tsx
│           ├── @monitors/            ← PARALLEL SLOT: streams independently
│           │   ├── default.tsx       ← skeleton
│           │   └── page.tsx          ← monitor grid (Server Component)
│           └── @incidents/           ← PARALLEL SLOT: streams independently
│               ├── default.tsx       ← skeleton
│               └── page.tsx          ← active incidents (Server Component)
│
├── components/
│   ├── ui/                           ← shadcn/ui components (do not edit)
│   ├── monitor/                      ← monitor-specific components
│   ├── notification/
│   ├── status-page/
│   ├── incident/
│   ├── maintenance/
│   └── shared/                       ← reusable cross-feature components
│
├── hooks/
│   ├── useAuth.ts                    ← login, logout, current user
│   ├── useMonitors.ts                ← TanStack Query for monitor list/detail
│   ├── useHeartbeats.ts              ← WebSocket subscription for live data
│   ├── useWebSocket.ts               ← connection + reconnect logic
│   └── useSettings.ts
│
├── stores/
│   ├── auth.ts                       ← Zustand: user, loggedIn, role
│   ├── monitors.ts                   ← Zustand: local monitor cache + WS updates
│   └── ui.ts                         ← Zustand: theme, sidebar state, toasts
│
├── lib/
│   ├── api.ts                        ← typed fetch wrapper (uses cookie auth)
│   └── utils.ts                      ← cn() and shared utilities
│
└── types/
    └── api.ts                        ← typed API response interfaces (from OpenAPI)
```

---

## shadcn/ui Component Usage

All UI components come from shadcn/ui. Components are copied into `components/ui/` — they are owned code, not a black-box dependency.

### Installing new components

```bash
pnpm dlx shadcn@latest add <component-name>
```

### Available components and their import paths

Always import from `@/components/ui/<component>`:

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetTrigger, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
```

### Loading states

Always use `<Skeleton>` from shadcn/ui inside `loading.tsx` files — never spinners unless animating an action:

```tsx
// app/(app)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}
```

### `cn()` utility

Always use `cn()` from `@/lib/utils` to merge Tailwind classes:

```tsx
import { cn } from "@/lib/utils"

<div className={cn("base-class", condition && "conditional-class", className)} />
```

---

## Data Fetching Patterns

### Server Components (preferred for initial data)

```tsx
// app/(app)/dashboard/page.tsx — Server Component
export default async function DashboardPage() {
  const monitors = await fetch(`${process.env.API_URL}/api/v1/monitors`, {
    credentials: 'include',
    next: { tags: ['monitors'] },
  }).then(r => r.json())

  return <MonitorList monitors={monitors.data} />
}
```

### Client Components with TanStack Query

```tsx
"use client"
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function MonitorList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => api.get('/api/v1/monitors'),
  })

  if (isLoading) return <MonitorListSkeleton />
  if (error) throw error  // let error.tsx handle it
  return <ul>{data.data.map(m => <MonitorItem key={m.id} monitor={m} />)}</ul>
}
```

### Mutations

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()
const { mutate } = useMutation({
  mutationFn: (data) => api.post('/api/v1/monitors', data),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitors'] }),
})
```

---

## Navigation

### `<Link>` for internal navigation

```tsx
import Link from 'next/link'

<Link href="/dashboard/42">Monitor Detail</Link>
<Link href="/dashboard/42/heartbeats">Heartbeats</Link>
```

### Programmatic navigation

```tsx
"use client"
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/dashboard')
router.back()   // close modal pattern
router.refresh() // re-fetch server component data
```

### Reading current route info

```tsx
"use client"
import { usePathname, useSearchParams, useSelectedLayoutSegment } from 'next/navigation'

const pathname = usePathname()                        // '/dashboard/42/heartbeats'
const params = useSearchParams()                      // URLSearchParams
const segment = useSelectedLayoutSegment('detail')    // '42' (active segment in @detail slot)
```

---

## Server vs Client Component Decision

| Scenario | Component type |
|---|---|
| Fetching data, reading DB, accessing env vars | Server Component |
| Using `useState`, `useEffect`, event handlers | Client Component (`"use client"`) |
| Accessing `cookies()`, `headers()` | Server Component |
| WebSocket subscription | Client Component |
| Static or mostly-static UI | Server Component |
| Animation, drag-and-drop, focus management | Client Component |
| Wrapping a third-party client library | Client Component |
| Can delegate `"use client"` to a child | Keep parent as Server Component |

Push `"use client"` as far down the component tree as possible. A layout can be a Server Component that renders a Client Component child.

---

## Environment Variables

Frontend env vars must be prefixed with `NEXT_PUBLIC_` to be available in the browser. Server-only vars (no prefix) are only accessible in Server Components and Route Handlers.

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001   # browser-accessible API base URL
API_URL=http://localhost:3001               # server-side only (SSR fetches)
```

Never put secrets in `NEXT_PUBLIC_` variables.

---

## `next.config.ts` Conventions

The project uses `next.config.ts` (TypeScript). Keep it minimal:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // API rewrites so browser fetches go to /api/* without CORS issues:
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig
```

---

## Routing Conventions Summary

| Pattern | Convention | Example |
|---|---|---|
| Static route | `folder/page.tsx` | `app/settings/page.tsx` |
| Dynamic segment | `[param]/page.tsx` | `app/monitors/[id]/page.tsx` |
| Catch-all | `[...params]/page.tsx` | `app/docs/[...slug]/page.tsx` |
| Optional catch-all | `[[...params]]/page.tsx` | `app/[[...slug]]/page.tsx` |
| Route group (no URL effect) | `(group)/` | `app/(app)/dashboard/` |
| Private folder (non-routable) | `_folder/` | `app/_components/` |
| Parallel slot | `@slot/` | `app/dashboard/@detail/` |
| Intercept same level | `(.)route/` | `app/@modal/(.)login/` |
| Intercept parent level | `(..)route/` | `app/(app)/(..)login/` |
| Intercept from root | `(...)route/` | `app/(app)/(...)login/` |

---

## Linting & Formatting

```bash
pnpm lint        # biome check (lint + format check)
pnpm format      # biome format --write
```

Biome is the single tool for both linting and formatting. Do not install ESLint or Prettier in `webui/`.
