# Gemini Flow - Authentication & Persistence

This Next.js application provides a React Flow canvas with user authentication and flow persistence capabilities, built on top of the optimized Zustand state management architecture.

## 🚀 Features Complete

✅ **User Authentication** - GitHub OAuth via NextAuth.js  
✅ **Flow Persistence** - Save and load flow graphs to/from database  
✅ **Optimized State Management** - Zustand for performance  
✅ **Modern UI** - React Flow with interactive canvas  
✅ **Database Integration** - Prisma ORM with SQLite/PostgreSQL support  
✅ **TypeScript** - Full type safety throughout  

## 🏗️ Architecture Evolution

### Previous State (Before Authentication)
- React frontend with Zustand state management
- Vite build system
- Local-only flow state (lost on refresh)

### Current State (With Authentication & Persistence)
- **Next.js 15.5.4** - React framework with App Router
- **NextAuth.js** - Authentication with GitHub provider  
- **Prisma ORM** - Database abstraction layer
- **SQLite/PostgreSQL** - Persistent storage
- **Zustand** - Maintained for optimal performance
- **TypeScript** - Enhanced type safety

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub OAuth App (for authentication)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and configure:
   ```bash
   cp .env.example .env.local
   ```

3. **Configure GitHub OAuth:**
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create a new OAuth App with:
     - Homepage URL: `http://localhost:3000`
     - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - Copy Client ID and Client Secret to `.env.local`:
     ```
     GITHUB_CLIENT_ID=your_github_client_id
     GITHUB_CLIENT_SECRET=your_github_client_secret
     ```

4. **Initialize the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Authentication Flow
1. Click "Sign in with GitHub" in the top-left panel
2. Authorize the application via GitHub OAuth
3. Return to the application authenticated
4. Save/Load buttons become enabled

### Flow Management
- **💾 Save**: Persist current flow to database (requires authentication)
- **📂 Load**: Restore most recent saved flow (requires authentication)
- **Add Node**: Create new nodes with random positioning
- **Clear All**: Remove all nodes and edges
- **Reset Flow**: Restore to initial demo flow

### Interactive Canvas
- **Drag** nodes to reposition
- **Connect** nodes by dragging from connection handles
- **Zoom** and **Pan** using controls or mouse/trackpad
- **Mini Map** for navigation in complex flows

## 📊 Performance Benefits (Maintained from Zustand Refactor)

### State Management Optimization
```tsx
// ✅ Selective subscriptions - no unnecessary re-renders
const nodes = useNodes();           // Only re-renders when nodes change
const edges = useEdges();           // Only re-renders when edges change  
const onNodesChange = useOnNodesChange(); // Stable reference
```

### Before vs After
- **Before**: Full component tree re-renders on every state change
- **After**: Selective re-rendering + persistent authentication + database storage

## 🗄️ Database Schema

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  flows         Flow[]    // User's saved flows
}

model Flow {
  id        String   @id @default(cuid())
  name      String               // Auto-generated with timestamp
  content   Json?                // Stores { nodes: [...], edges: [...] }
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}

// NextAuth.js required models: Account, Session, VerificationToken
```

## 🔌 API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `GET /api/auth/callback/github` - GitHub OAuth callback

### Flow Management
- `POST /api/flows` - Save current flow state
  ```json
  {
    "name": "Flow 2024-01-15 10:30:15",
    "content": {
      "nodes": [{ "id": "1", "data": {...}, "position": {...} }],
      "edges": [{ "id": "e1-2", "source": "1", "target": "2" }]
    }
  }
  ```
- `GET /api/flows` - Retrieve user's saved flows (ordered by updatedAt desc)

## 🌐 Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# GitHub OAuth (Required)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth config
│   │   └── flows/route.ts              # Flow CRUD operations
│   ├── globals.css        # Global styles with @xyflow/react imports
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page with SessionProvider
├── lib/                   # Utilities
│   └── auth.ts           # NextAuth.js configuration
├── prisma/               # Database
│   └── schema.prisma     # Database schema with User/Flow models
├── src/                  # React components
│   ├── components/       
│   │   └── Flow.tsx      # Enhanced with authentication + persistence
│   └── lib/
│       └── store.ts      # Zustand store (maintained from refactor)
├── types/               # TypeScript declarations
│   └── next-auth.d.ts   # NextAuth type extensions
├── .env.example         # Environment template
├── .env.local          # Local environment (ignored)
└── next.config.js      # Next.js configuration
```

## 🚀 Deployment

### Development Database (SQLite)
Current setup uses SQLite for development:
```bash
DATABASE_URL="file:./dev.db" 
```

### Production Database (PostgreSQL)
For production deployment:
1. Update `prisma/schema.prisma` provider to `postgresql`
2. Set production `DATABASE_URL` to PostgreSQL connection string
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Update GitHub OAuth callback URL to production domain
4. Deploy automatically on git push

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start Next.js dev server
npm run build        # Build for production  
npm run start        # Start production server

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open database GUI

# Legacy (from Vite setup)
npm run preview      # Preview production build
```

## 🧪 Testing the Implementation

1. **Authentication Test:**
   - Visit http://localhost:3000
   - Verify "Sign in with GitHub" button is present
   - Verify Save/Load buttons are disabled when not authenticated

2. **Flow State Test:**
   - Click "Add Node" - should add node and update counters
   - Verify Zustand store updates nodes count in real-time
   - Verify mini-map reflects changes

3. **Persistence Test (Requires GitHub OAuth Setup):**
   - Sign in with GitHub
   - Create/modify flow
   - Click Save - should show success message
   - Refresh page and click Load - should restore flow

## 🔮 Next Steps & Future Enhancements

- **Multi-Flow Management**: List and manage multiple saved flows
- **Flow Sharing**: Share flows between users
- **Real-time Collaboration**: Multi-user editing with WebSockets
- **Advanced Node Types**: Custom domain-specific nodes
- **Export/Import**: JSON, PNG, SVG export functionality
- **Undo/Redo**: History management for user actions

---

**Implementation Status**: ✅ **Complete** - Successfully implemented user authentication and flow persistence while maintaining the performance benefits of Zustand state management.
