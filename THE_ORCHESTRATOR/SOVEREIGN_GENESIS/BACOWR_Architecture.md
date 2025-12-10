# BACOWR Frontend Architecture

Complete technical architecture documentation.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              NEXT.JS 14 APP ROUTER                    │ │
│  │                                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │  Dashboard   │  │  Job Wizard  │  │  Settings  │ │ │
│  │  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  │                                                       │ │
│  │  ┌──────────────┐  ┌──────────────┐                 │ │
│  │  │ Job Details  │  │  Backlinks   │                 │ │
│  │  └──────────────┘  └──────────────┘                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                  STATE LAYER                          │ │
│  │                                                       │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │ │
│  │  │  Zustand    │  │ TanStack     │  │ WebSocket  │  │ │
│  │  │  Stores     │  │ Query Cache  │  │ Connection │  │ │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                   API LAYER                           │ │
│  │                                                       │ │
│  │  ┌─────────────┐  ┌──────────────┐                  │ │
│  │  │ REST Client │  │ Socket.io    │                  │ │
│  │  └─────────────┘  └──────────────┘                  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACOWR BACKEND                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ FastAPI REST │  │ WebSocket    │  │ PostgreSQL DB  │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Dashboard (/)
│   │   ├── providers.tsx             # Context providers
│   │   ├── jobs/
│   │   │   ├── new/
│   │   │   │   └── page.tsx         # Job wizard (/jobs/new)
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Job details (/jobs/:id)
│   │   ├── backlinks/
│   │   │   └── page.tsx             # Backlinks (/backlinks)
│   │   └── settings/
│   │       └── page.tsx             # Settings (/settings)
│   │
│   ├── components/
│   │   ├── ui/                      # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   └── tabs.tsx
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   │
│   │   ├── dashboard/               # Dashboard components
│   │   │   ├── QuickStartWidget.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── LiveJobsMonitor.tsx
│   │   │   └── CostChart.tsx
│   │   │
│   │   ├── jobs/                    # Job components
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobProgressBar.tsx
│   │   │   └── QCBadge.tsx
│   │   │
│   │   ├── backlinks/               # Backlinks components
│   │   └── settings/                # Settings components
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts           # REST API client
│   │   │   └── websocket.ts        # WebSocket client
│   │   │
│   │   ├── store/
│   │   │   └── index.ts            # Zustand stores
│   │   │
│   │   └── utils/
│   │       ├── cn.ts               # Class name utility
│   │       ├── format.ts           # Formatting utilities
│   │       └── index.ts            # Utils export
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   │
│   └── styles/
│       └── globals.css             # Global styles
│
├── public/                          # Static assets
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts              # Tailwind config
├── next.config.js                  # Next.js config
├── postcss.config.js               # PostCSS config
├── .gitignore
├── .env.example
├── README.md                        # Main docs
├── DESIGN.md                        # Design system
├── QUICKSTART.md                   # Quick start guide
└── ARCHITECTURE.md                 # This file
```

## Data Flow

### Job Creation Flow

```
User Input (QuickStartWidget)
    │
    ▼
Zustand Store (useCreateJobWizard)
    │
    ▼
API Client (jobsAPI.create)
    │
    ▼
Backend REST API
    │
    ▼
Response (JobPackage)
    │
    ▼
TanStack Query Cache
    │
    ▼
Zustand Store (useJobsStore)
    │
    ▼
Component Re-render
    │
    ▼
Router Navigation (to Job Details)
```

### Real-Time Updates Flow

```
Backend Job Progress
    │
    ▼
WebSocket Emit (job:update)
    │
    ▼
Socket.io Client
    │
    ▼
WebSocket Event Listeners
    │
    ▼
Zustand Store Update
    │
    ▼
React Component Re-render
    │
    ▼
Live Progress Bar Updates
```

## State Management

### Zustand Stores

**Purpose**: Global client state

**Stores**:

1. **useJobsStore**
   - Recent jobs list
   - Active jobs map
   - Job CRUD operations

2. **useToastStore**
   - Toast notifications queue
   - Auto-dismiss timers

3. **useSettingsStore** (persisted)
   - User settings
   - API keys (encrypted)
   - Defaults

4. **useUIStore** (persisted)
   - Sidebar collapsed state
   - Dark mode preference
   - Command palette state

5. **useCreateJobWizard**
   - Wizard step tracking
   - Form input state
   - Validation state

### TanStack Query

**Purpose**: Server state management

**Features**:
- Automatic caching (1 minute stale time)
- Background refetching
- Optimistic updates
- Error retry logic

**Query Keys**:
```typescript
['dashboard-stats']              // Dashboard statistics
['job', jobId]                  // Single job
['jobs', page, filters]         // Job list
['backlinks', page, search]     // Backlinks list
['backlinks-analytics']         // Backlinks analytics
['settings']                    // User settings
['cost-trends', params]         // Cost data
```

## API Integration

### REST API Client

**Location**: `src/lib/api/client.ts`

**Features**:
- Centralized fetch wrapper
- Automatic error handling
- Type-safe responses
- Request/response interceptors

**APIs**:
- `jobsAPI`: Job CRUD operations
- `batchAPI`: Batch job management
- `backlinksAPI`: Backlinks library
- `settingsAPI`: User settings
- `statsAPI`: Analytics and metrics

**Error Handling**:
```typescript
class APIError extends Error {
  status: number
  details?: any
}

// Usage
try {
  await jobsAPI.create(input)
} catch (error) {
  if (error instanceof APIError) {
    // Handle specific status codes
    if (error.status === 429) {
      // Rate limit
    }
  }
}
```

### WebSocket Client

**Location**: `src/lib/api/websocket.ts`

**Features**:
- Singleton connection
- Auto-reconnect (max 5 attempts)
- Event subscription system
- Job-specific subscriptions

**Events**:
- `job:update`: Job progress updates
- `job:completed`: Job completion
- `job:error`: Job errors
- `batch:update`: Batch progress

**Usage**:
```typescript
const ws = useWebSocket()

ws.subscribeToJob(jobId)
ws.on('job:update', (update) => {
  // Handle update
})
```

## Component Architecture

### Base Components (ui/)

**Purpose**: Reusable, unstyled primitives

**Characteristics**:
- No business logic
- Prop-based customization
- Accessible by default
- Composable

**Examples**:
- Button, Card, Badge, Input, Progress, Tabs

### Feature Components (dashboard/, jobs/, etc.)

**Purpose**: Business logic components

**Characteristics**:
- Connect to stores/queries
- Handle user interactions
- Complex state management
- Domain-specific

**Examples**:
- QuickStartWidget, JobCard, LiveJobsMonitor

### Layout Components (layout/)

**Purpose**: Page structure

**Characteristics**:
- Fixed positioning
- Responsive behavior
- Global navigation

**Examples**:
- Sidebar, Header

### Page Components (app/)

**Purpose**: Route-level components

**Characteristics**:
- Data fetching
- Page-level state
- SEO metadata
- Loading states

**Examples**:
- Dashboard, JobDetails, Settings

## Routing

### Next.js App Router

**File-based routing**:
```
app/
├── page.tsx              → /
├── jobs/
│   ├── new/
│   │   └── page.tsx     → /jobs/new
│   └── [id]/
│       └── page.tsx     → /jobs/:id
├── backlinks/
│   └── page.tsx         → /backlinks
└── settings/
    └── page.tsx         → /settings
```

**Navigation**:
```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()
router.push('/jobs/123')
```

**Dynamic Routes**:
```typescript
// app/jobs/[id]/page.tsx
import { useParams } from 'next/navigation'

export default function JobPage() {
  const params = useParams()
  const jobId = params.id // URL parameter
}
```

## Styling

### Tailwind CSS

**Utility-first approach**:
```tsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">
```

**Design Tokens**:
```css
/* Uses CSS variables */
bg-primary    → hsl(var(--primary))
text-muted    → hsl(var(--muted-foreground))
```

**Responsive**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**Dark Mode**:
```tsx
// Automatic based on .dark class on <html>
<div className="bg-background text-foreground">
```

### Custom Components

**Compound Pattern**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

## Performance Optimizations

### Code Splitting

- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading for below-fold content

### Caching Strategy

**TanStack Query**:
- 1 minute stale time
- Background refetch
- Cache invalidation on mutations

**Browser Caching**:
- Static assets: 1 year
- API responses: No-cache
- Images: Optimized with Next.js

### Bundle Optimization

- Tree shaking with ES modules
- Minification with SWC
- Gzip compression
- CSS purging with Tailwind

## Security

### API Keys

- Never committed to git
- Environment variables only
- Encrypted in localStorage (settings)

### CSRF Protection

- Same-origin policy
- Token-based auth (future)

### XSS Prevention

- React auto-escaping
- Sanitized markdown rendering
- No dangerouslySetInnerHTML

## Testing Strategy (Future)

### Unit Tests

- Component rendering
- Utility functions
- Store logic

### Integration Tests

- API client
- WebSocket connection
- Form submissions

### E2E Tests

- Critical user flows
- Job creation
- Settings updates

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

**Features**:
- Edge network
- Automatic SSL
- Preview deployments
- Environment variables

### Custom Server

```bash
npm run build
npm start
```

**Requirements**:
- Node.js 18+
- Reverse proxy (nginx)
- SSL certificate
- PM2 or similar

## Monitoring (Future)

### Error Tracking

- Sentry integration
- Error boundaries
- API error logging

### Analytics

- Page views
- User interactions
- Performance metrics

### Performance

- Core Web Vitals
- Lighthouse scores
- Bundle analysis

## Extension Points

### Plugin Architecture (Future)

**Purpose**: Add new tools without modifying core

**Pattern**:
```typescript
interface Plugin {
  id: string
  name: string
  icon: ReactNode
  route: string
  component: React.ComponentType
}

// Register plugin
registerPlugin({
  id: 'scraper',
  name: 'Scraper',
  icon: <Globe />,
  route: '/scraper',
  component: ScraperPage
})
```

### Custom Components

Easy to add new components:
1. Create in `src/components/`
2. Export from index
3. Use in pages

### API Endpoints

Add new APIs:
1. Add to `src/lib/api/client.ts`
2. Create TypeScript types
3. Use with TanStack Query

## Best Practices

### Component Development

1. Start with design
2. Build UI component first
3. Add business logic
4. Connect to stores/queries
5. Handle loading/error states
6. Add accessibility

### State Management

1. Use Zustand for UI state
2. Use TanStack Query for server state
3. Keep stores minimal
4. Avoid prop drilling

### Performance

1. Lazy load heavy components
2. Memoize expensive calculations
3. Debounce user inputs
4. Use optimistic updates

### Type Safety

1. Define types first
2. Use strict TypeScript
3. Avoid `any` type
4. Export types for reuse

---

**Architecture Version**: 1.0.0
**Last Updated**: 2025-11-07
**Status**: Production Ready
