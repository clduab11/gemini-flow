# System Architecture Diagrams - Google Tier System

## C4 Model Architecture Overview

### Level 1: System Context Diagram

```mermaid
C4Context
    title System Context Diagram - Gemini-Flow Platform

    Person(user, "User", "Developer, Business User, or Enterprise Customer")
    
    System(geminiFlow, "Gemini-Flow Platform", "AI orchestration platform with Google-centric tiers")
    
    System_Ext(googleServices, "Google Services", "Gemini API, Workspace, Vertex AI, Jules")
    System_Ext(database, "SQLite Database", "Persistent storage for tiers, users, and metrics")
    System_Ext(cache, "Context Cache", "In-memory caching for performance optimization")
    
    Rel(user, geminiFlow, "Uses", "CLI, API, MCP")
    Rel(geminiFlow, googleServices, "Integrates with", "OAuth2, REST APIs")
    Rel(geminiFlow, database, "Stores data", "SQLite operations")
    Rel(geminiFlow, cache, "Caches context", "In-memory operations")
```

### Level 2: Container Diagram

```mermaid
C4Container
    title Container Diagram - Gemini-Flow Platform

    Person(user, "User")

    Container_Boundary(platform, "Gemini-Flow Platform") {
        Container(cli, "CLI Interface", "Node.js", "Command-line interface for developers")
        Container(api, "REST API", "Express.js", "RESTful API for programmatic access")
        Container(mcp, "MCP Server", "Node.js", "Model Context Protocol server")
        
        Container(auth, "Authentication Service", "Node.js", "Google OAuth2 and tier detection")
        Container(router, "Model Router", "Node.js", "Intelligent request routing and load balancing")
        Container(cache, "Cache Manager", "Node.js", "Context caching and performance optimization")
        
        Container(workspace, "Workspace Integration", "Node.js", "Google Workspace API integration")
        Container(vertex, "Vertex AI Adapter", "Node.js", "MCP adapter for Vertex AI")
        Container(jules, "Jules Adapter", "Node.js", "MCP adapter for Jules AI")
    }

    ContainerDb(db, "SQLite Database", "SQLite", "User tiers, metrics, and persistent storage")
    ContainerDb(memory, "Memory Cache", "In-Memory", "Fast access cache for contexts and tokens")

    System_Ext(google, "Google Services", "External APIs")

    Rel(user, cli, "Uses", "Commands")
    Rel(user, api, "Calls", "HTTPS")
    Rel(user, mcp, "Connects", "MCP Protocol")

    Rel(cli, auth, "Authenticates", "Internal API")
    Rel(api, auth, "Validates", "Internal API")
    Rel(mcp, auth, "Verifies", "Internal API")

    Rel(auth, router, "Routes", "Tier-based routing")
    Rel(router, cache, "Checks", "Cache lookup")
    
    Rel(router, workspace, "Calls", "Direct integration")
    Rel(router, vertex, "Calls", "MCP adapter")
    Rel(router, jules, "Calls", "MCP adapter")

    Rel(auth, db, "Reads/Writes", "SQLite")
    Rel(router, db, "Logs metrics", "SQLite")
    Rel(cache, memory, "Stores", "In-memory")

    Rel(workspace, google, "Integrates", "Google APIs")
    Rel(vertex, google, "Integrates", "Vertex AI")
    Rel(jules, google, "Integrates", "Jules API")
```

### Level 3: Component Diagram - Authentication Service

```mermaid
C4Component
    title Component Diagram - Authentication Service

    Container_Boundary(auth, "Authentication Service") {
        Component(oauth, "OAuth2 Manager", "Node.js", "Google OAuth2 flow management")
        Component(tierDetector, "Tier Detector", "Node.js", "User tier identification and validation")
        Component(permManager, "Permission Manager", "Node.js", "Tier-based permission control")
        Component(tokenManager, "Token Manager", "Node.js", "Internal token generation and validation")
        Component(rateLimiter, "Rate Limiter", "Node.js", "Tier-specific rate limiting")
    }

    ContainerDb(db, "SQLite Database")
    ContainerDb(cache, "Memory Cache")
    System_Ext(google, "Google OAuth2")

    Rel(oauth, google, "Authenticates", "OAuth2 flow")
    Rel(oauth, tierDetector, "Provides user info", "Internal call")
    Rel(tierDetector, db, "Queries", "User tier data")
    Rel(tierDetector, permManager, "Validates", "Tier permissions")
    Rel(permManager, tokenManager, "Generates", "Internal tokens")
    Rel(tokenManager, cache, "Caches", "Token validation")
    Rel(rateLimiter, db, "Tracks", "Usage metrics")
```

## Detailed Component Interactions

### Authentication Flow Sequence

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant AuthService
    participant TierDetector
    participant Google
    participant Database
    participant Cache

    User->>CLI: gemini-flow auth login
    CLI->>AuthService: initiate_auth()
    AuthService->>Google: request_oauth_url()
    Google-->>AuthService: authorization_url
    AuthService-->>CLI: display_auth_url
    CLI-->>User: Open browser for auth
    
    User->>Google: Complete OAuth flow
    Google->>AuthService: authorization_code
    AuthService->>Google: exchange_code_for_tokens()
    Google-->>AuthService: access_token, user_info
    
    AuthService->>TierDetector: detect_tier(user_info, tokens)
    TierDetector->>Google: check_workspace_domain()
    TierDetector->>Google: check_gemini_advanced()
    TierDetector->>Google: check_vertex_project()
    Google-->>TierDetector: tier_validation_results
    
    TierDetector->>Database: store_user_tier()
    Database-->>TierDetector: confirmation
    TierDetector-->>AuthService: user_tier
    
    AuthService->>Cache: cache_auth_token()
    Cache-->>AuthService: cached
    AuthService-->>CLI: authentication_success
    CLI-->>User: Login successful (Tier: Advanced)
```

### Model Routing Decision Flow

```mermaid
sequenceDiagram
    participant Request
    participant Router
    participant TierValidator
    participant ModelSelector
    participant CacheManager
    participant ServiceAdapter
    participant MetricsCollector

    Request->>Router: model_request(prompt, user_tier)
    Router->>TierValidator: validate_tier_access()
    TierValidator-->>Router: access_granted
    
    Router->>CacheManager: check_cache(request_hash)
    CacheManager-->>Router: cache_miss
    
    Router->>ModelSelector: select_optimal_model(request, tier)
    ModelSelector->>ModelSelector: analyze_complexity()
    ModelSelector->>ModelSelector: check_tier_models()
    ModelSelector-->>Router: model_selection
    
    Router->>ServiceAdapter: execute_request(model, request)
    ServiceAdapter->>ServiceAdapter: transform_request()
    ServiceAdapter-->>Router: model_response
    
    Router->>CacheManager: cache_response(request, response)
    CacheManager-->>Router: cached
    
    Router->>MetricsCollector: record_metrics(tier, latency, cost)
    MetricsCollector-->>Router: recorded
    
    Router-->>Request: final_response
```

## Data Flow Architecture

### Tier Detection Data Flow

```mermaid
flowchart TD
    A[User Request] --> B{Authentication Type?}
    
    B -->|OAuth2| C[Extract User Info]
    B -->|Service Account| D[Extract Project Info]
    
    C --> E{Has Workspace Domain?}
    E -->|Yes| F[Check Workspace Subscription]
    E -->|No| G[Check Individual Subscription]
    
    F --> H{Has Gemini Advanced?}
    G --> H
    
    H -->|Yes| I{Has Ultra + Jules?}
    H -->|No| J[Free Tier]
    
    I -->|Yes| K[Ultra Tier]
    I -->|No| L[Advanced Tier]
    
    D --> M{Has Vertex AI Project?}
    M -->|Yes| N[Pro Tier]
    M -->|No| J
    
    J --> O[Apply Free Limits]
    L --> P[Apply Advanced Limits]
    K --> Q[Apply Ultra Limits]
    N --> R[Apply Pro Limits]
    
    O --> S[Store in Database]
    P --> S
    Q --> S
    R --> S
    
    S --> T[Cache for 5 minutes]
    T --> U[Return Tier Configuration]
```

### Model Selection Decision Tree

```mermaid
flowchart TD
    A[Incoming Request] --> B[Analyze Request Complexity]
    
    B --> C{Complexity Level?}
    
    C -->|Low| D{User Tier?}
    C -->|Medium| E{User Tier?}
    C -->|High| F{User Tier?}
    
    D -->|Free| G[Gemini Flash]
    D -->|Advanced+| H[Gemini Flash]
    
    E -->|Free| I[Gemini Flash with limits]
    E -->|Advanced| J[Gemini Pro]
    E -->|Ultra+| K[Gemini Pro/Ultra]
    
    F -->|Free| L[Upgrade Required]
    F -->|Advanced| M[Gemini Pro]
    F -->|Ultra| N{Requires Jules?}
    F -->|Pro| O{Use Vertex AI?}
    
    N -->|Yes| P[Jules AI]
    N -->|No| Q[Gemini Ultra]
    
    O -->|Yes| R[Vertex AI Custom]
    O -->|No| S[Gemini Ultra]
    
    G --> T[Execute Request]
    H --> T
    I --> T
    J --> T
    K --> T
    L --> U[Return Upgrade Message]
    M --> T
    P --> T
    Q --> T
    R --> T
    S --> T
    
    T --> V[Cache Response]
    V --> W[Return to User]
```

## Integration Architecture Patterns

### Hard-coded vs MCP Integration Decision Matrix

```mermaid
flowchart LR
    A[Service Integration Decision] --> B{Performance Critical?}
    
    B -->|Yes| C{Complex Configuration?}
    B -->|No| D[MCP Adapter]
    
    C -->|No| E[Hard-coded Integration]
    C -->|Yes| F{Enterprise Features?}
    
    F -->|Yes| D
    F -->|No| E
    
    E --> G[Direct API Calls]
    D --> H[MCP Protocol]
    
    G --> I[Examples:<br/>- Gemini API<br/>- Google Workspace<br/>- Basic Auth]
    H --> J[Examples:<br/>- Vertex AI<br/>- Jules AI<br/>- Custom Models]
    
    I --> K[<20ms overhead]
    J --> L[<50ms overhead]
```

### Performance Optimization Stack

```mermaid
flowchart TB
    subgraph "Application Layer"
        A1[CLI Interface]
        A2[REST API]
        A3[MCP Server]
    end
    
    subgraph "Caching Layer"
        B1[Tier Cache<br/>5min TTL]
        B2[Auth Cache<br/>30min TTL]
        B3[Model Cache<br/>1hr TTL]
        B4[Context Cache<br/>Tier-based TTL]
    end
    
    subgraph "Routing Layer"
        C1[Load Balancer]
        C2[Connection Pool]
        C3[Model Router]
    end
    
    subgraph "Integration Layer"
        D1[Gemini API<br/>Hard-coded]
        D2[Workspace APIs<br/>Hard-coded]
        D3[Vertex AI<br/>MCP Adapter]
        D4[Jules AI<br/>MCP Adapter]
    end
    
    subgraph "Data Layer"
        E1[SQLite DB<br/>12 Tables]
        E2[In-Memory Cache]
        E3[Metrics Store]
    end
    
    A1 --> B1
    A2 --> B2
    A3 --> B3
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
    B4 --> C3
    
    C1 --> D1
    C2 --> D2
    C3 --> D3
    C3 --> D4
    
    C1 --> E1
    C2 --> E2
    C3 --> E3
```

## Security Architecture

### Tier-based Security Model

```mermaid
flowchart TD
    A[Incoming Request] --> B[Authentication Layer]
    
    B --> C{Valid Token?}
    C -->|No| D[Return 401 Unauthorized]
    C -->|Yes| E[Extract User Tier]
    
    E --> F{Tier Security Level?}
    
    F -->|Free| G[Basic Security<br/>- Rate limiting<br/>- Input validation]
    F -->|Advanced| H[Enhanced Security<br/>- Domain validation<br/>- Workspace verification<br/>- Extended logging]
    F -->|Ultra| I[Premium Security<br/>- Jules token validation<br/>- Advanced monitoring<br/>- Priority support]
    F -->|Pro| J[Enterprise Security<br/>- Project validation<br/>- Compliance checks<br/>- Audit logging<br/>- VPC support]
    
    G --> K[Apply Free Tier Policies]
    H --> L[Apply Advanced Tier Policies]
    I --> M[Apply Ultra Tier Policies]
    J --> N[Apply Pro Tier Policies]
    
    K --> O[Process Request]
    L --> O
    M --> O
    N --> O
    
    O --> P[Log Security Event]
    P --> Q[Return Response]
```

## Monitoring and Observability

### Metrics Collection Architecture

```mermaid
flowchart LR
    subgraph "Request Flow"
        A[User Request] --> B[Authentication]
        B --> C[Tier Validation]
        C --> D[Model Routing]
        D --> E[Service Execution]
        E --> F[Response]
    end
    
    subgraph "Metrics Collection"
        G[Authentication Metrics]
        H[Tier Usage Metrics]
        I[Routing Metrics]
        J[Performance Metrics]
        K[Cost Metrics]
    end
    
    subgraph "Storage & Analysis"
        L[SQLite Metrics Table]
        M[Time-series Analysis]
        N[Cost Analysis]
        O[Performance Dashboard]
    end
    
    B --> G
    C --> H
    D --> I
    E --> J
    E --> K
    
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M
    L --> N
    M --> O
    N --> O
```

### Real-time Monitoring Dashboard

```mermaid
graph TB
    subgraph "Dashboard Components"
        A[Tier Distribution<br/>Pie Chart]
        B[Request Volume<br/>Time Series]
        C[Latency Metrics<br/>Histogram]
        D[Error Rates<br/>Alert Panel]
        E[Cost Tracking<br/>Cost Breakdown]
        F[Cache Hit Rates<br/>Performance Gauge]
    end
    
    subgraph "Data Sources"
        G[SQLite Metrics Table]
        H[In-Memory Cache Stats]
        I[Google API Quotas]
        J[Real-time Event Stream]
    end
    
    G --> A
    G --> B
    H --> C
    J --> D
    G --> E
    H --> F
    I --> E
```

## Deployment Architecture

### Multi-Environment Deployment

```mermaid
flowchart TB
    subgraph "Development Environment"
        D1[Local SQLite]
        D2[Mock Google APIs]
        D3[In-Memory Cache]
    end
    
    subgraph "Staging Environment"
        S1[Staging SQLite]
        S2[Google Test Project]
        S3[Redis Cache]
    end
    
    subgraph "Production Environment"
        P1[Production SQLite<br/>with Backup]
        P2[Google Production APIs]
        P3[Redis Cluster]
        P4[Load Balancer]
        P5[Monitoring Stack]
    end
    
    subgraph "Enterprise Environment"
        E1[Multi-region SQLite]
        E2[Vertex AI Private Endpoints]
        E3[VPC-native Deployment]
        E4[Enterprise Monitoring]
        E5[Compliance Logging]
    end
    
    D1 --> S1
    D2 --> S2
    D3 --> S3
    
    S1 --> P1
    S2 --> P2
    S3 --> P3
    
    P1 --> E1
    P2 --> E2
    P3 --> E3
```

## Technology Stack Overview

### Core Technologies by Layer

```mermaid
mindmap
  root((Gemini-Flow<br/>Tech Stack))
    Client Interfaces
      Node.js CLI
      Express.js REST API
      MCP Protocol Server
    Authentication
      Google OAuth2 SDK
      JWT Tokens
      Passport.js
    Data Storage
      SQLite (better-sqlite3)
      In-Memory Cache
      12 Specialized Tables
    Google Integrations
      @google/generative-ai
      googleapis SDK
      Google Auth Library
    Performance
      Connection Pooling
      Context Caching
      Load Balancing
    Monitoring
      Winston Logging
      Custom Metrics
      Performance Tracking
```

This comprehensive architecture documentation provides detailed visual representations of the Google-centric tier system, showing how all components interact to deliver the <100ms overhead performance while maintaining scalability and cost optimization across all four tiers.