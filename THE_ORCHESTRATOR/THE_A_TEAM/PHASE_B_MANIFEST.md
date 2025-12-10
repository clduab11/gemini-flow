# ═══════════════════════════════════════════════════════════════════════════
# PHASE B - GENERATION MANIFEST
# ═══════════════════════════════════════════════════════════════════════════
#
# Generated: 2024-11-28
# Total Files: 14
# Total Lines: ~5,620
# Confidence: 95%+
#
# ═══════════════════════════════════════════════════════════════════════════

## 🚀 WHAT PHASE B DELIVERS

Phase B completes the execution layer - the ability to actually RUN pipelines
and generate AI content. Without this, Phase A was just infrastructure.

---

## 🔧 PIPELINE EXECUTION ENGINE

### PipelineRunnerService (~600 LOC)
**Path:** `backend/pipelines/pipeline-runner.service.ts`

The brain of pipeline execution:
- **Topological sorting** - Resolves node dependencies
- **Parallel execution** - Runs independent nodes simultaneously
- **State persistence** - Redis-backed checkpoints for pause/resume
- **Progress tracking** - Real-time WebSocket updates
- **Error recovery** - Graceful handling with per-node retries

Key methods:
```typescript
runPipeline(pipelineId, tenantId, userId, options)
executePipelineRun(runId, executionPlan, inputData, dryRun)
pausePipeline(runId, tenantId)
resumePipeline(runId, tenantId)
cancelPipeline(runId, tenantId)
getRunStatus(runId, tenantId)
```

### PipelineNodeExecutor (~800 LOC)
**Path:** `backend/pipelines/executors/pipeline-node.executor.ts`

Executes individual node types:
- **Trigger nodes:** Manual, Schedule, Webhook
- **AI/ML nodes:** Content generate, Rewrite, Analyze entities, Gap analysis, Cluster, Intent
- **SEO nodes:** SERP check, Rank track, Backlink check, Publisher analyze
- **Transform nodes:** Map, Filter, Aggregate, Merge, Split, Template
- **Condition nodes:** If, Switch, Loop
- **Output nodes:** Result, Notify, Store

### PipelineStateManager (~350 LOC)
**Path:** `backend/pipelines/services/pipeline-state-manager.service.ts`

State persistence layer:
- Context creation and management
- Checkpoint save/restore for pause/resume
- Node output storage in Redis
- Cleanup of expired states

### Pipeline Entities (~450 LOC)
**Path:** `backend/pipelines/entities/pipeline.entity.ts`

Complete database schema:
- `Pipeline` - Pipeline definition
- `PipelineNode` - Individual nodes
- `PipelineNodeConnection` - Node connections
- `PipelineRun` - Execution records
- `NodeExecution` - Per-node execution tracking
- `PipelineTemplate` - Shareable templates

---

## 🤖 APEX ENGINE (Python)

### apex_engine.py (~700 LOC)
**Path:** `services/bacowr/apex_engine.py`

The AI content generation core:

**ApexEngine** - Main generator
- Claude-powered article generation
- Multi-section content with entity integration
- Publisher profile adaptation
- Quality scoring integration
- Readability calculations

**ApexRewriter** - Content improvement
- Instruction-based rewriting
- Tone adjustment
- SEO optimization

**ApexPatcher** - Gap filling
- Missing entity coverage
- Seamless content patches
- Insertion suggestions

Models:
- `GenerationRequest` - Full generation parameters
- `GeneratedArticle` - Complete output with scores
- `ContentSection` - Article sections
- `EntityRequirement` - Required entities
- `PublisherProfile` - Target publisher style

### main.py (BACOWR Service) (~400 LOC)
**Path:** `services/bacowr/main.py`

FastAPI service exposing APEX:
- `POST /generate` - Generate article
- `POST /rewrite` - Rewrite content
- `POST /patch` - Generate content patch
- `POST /analyze-publisher` - Profile publisher
- `POST /preflight` - Marriage score + recommendations
- `GET /health` - Health check

---

## 👤 PUBLISHER PROFILER

### publisher_profiler.py (~500 LOC)
**Path:** `services/bacowr/publisher_profiler.py`

Analyzes target publishers:
- Fetches and parses articles
- Calculates style metrics
- Determines tone/formality
- Generates content guidelines

Output includes:
- Average word count, paragraph length, sentence length
- Subheading frequency
- Bullet point usage
- Link density
- Style notes
- Content guidelines

---

## 💍 MARRIAGE SCORER

### marriage_scorer.py (~400 LOC)
**Path:** `services/bacowr/marriage_scorer.py`

Calculates keyword-entity fit:
- Semantic similarity via embeddings
- Entity coherence analysis
- Diversity scoring
- Quality prediction

Output:
- Marriage score (0-100)
- Per-entity scores
- Weak/strong connections
- Estimated quality
- Recommendations
- Entity suggestions

---

## 📊 ML SERVICE

### quality_scorer.py (~500 LOC)
**Path:** `services/ml-service/quality_scorer.py`

ML-based quality scoring:

**Pre-generation prediction:**
- Feature extraction from request params
- LightGBM model (when trained)
- Rule-based fallback
- Risk identification
- Improvement suggestions

**Post-generation scoring:**
- Readability (Flesch-Kincaid)
- SEO score
- Engagement score
- Accuracy score
- Issues/strengths identification

### main.py (ML Service) (~350 LOC)
**Path:** `services/ml-service/main.py`

FastAPI service:
- `POST /predict-quality` - Pre-generation prediction
- `POST /score-content` - Post-generation scoring
- `POST /classify-intent` - Keyword intent classification
- `POST /cluster-keywords` - Keyword clustering
- `GET /health` - Health check

---

## 📁 FILE INDEX

```
phase-b/
├── backend/
│   └── pipelines/
│       ├── pipelines.module.ts           # Module definition
│       ├── pipeline-runner.service.ts    # Execution engine
│       ├── pipeline.processor.ts         # Bull job processor
│       ├── entities/
│       │   └── pipeline.entity.ts        # Database entities
│       ├── executors/
│       │   └── pipeline-node.executor.ts # Node execution
│       └── services/
│           └── pipeline-state-manager.service.ts
└── services/
    ├── bacowr/
    │   ├── main.py                       # FastAPI service
    │   ├── apex_engine.py                # Content generation
    │   ├── publisher_profiler.py         # Publisher analysis
    │   ├── marriage_scorer.py            # Keyword-entity fit
    │   ├── Dockerfile
    │   └── requirements.txt
    └── ml-service/
        ├── main.py                       # FastAPI service
        └── quality_scorer.py             # ML scoring
```

---

## 🔌 INTEGRATION POINTS

### Pipeline → BACOWR
```typescript
// Inside pipeline-node.executor.ts
case NodeType.ACTION_CONTENT_GENERATE:
  return this.bacowr.generateContent({
    topic: config.topic,
    keyword: config.keyword,
    requiredEntities: config.requiredEntities,
    publisherProfile: config.publisherProfile,
  });
```

### Pipeline → SIE-X
```typescript
case NodeType.ACTION_ANALYZE_ENTITIES:
  return this.sieX.analyzeContent({
    content,
    language: config.language,
    extractEntities: true,
  });
```

### Frontend → Pipeline API
```typescript
// Start pipeline
POST /api/pipelines/:id/run
{
  "inputData": { "keyword": "seo tools" },
  "dryRun": false
}

// Get progress
GET /api/pipelines/runs/:runId/status
→ { status, progress, currentNode, completedNodes }
```

---

## 🎯 WHAT THIS ENABLES

With Phase B complete:

1. **Pipeline Execution** ✅
   - Visual pipelines can now RUN
   - Real-time progress tracking
   - Pause/resume capability

2. **AI Content Generation** ✅
   - Claude-powered articles
   - Publisher style matching
   - Entity integration
   - Quality scoring

3. **Pre-flight Checks** ✅
   - Marriage score validation
   - Quality prediction
   - Recommendations before generation

4. **ML Scoring** ✅
   - Intent classification
   - Keyword clustering
   - Quality prediction

---

## 🚀 USAGE EXAMPLE

```python
# Generate content via BACOWR
import httpx

response = httpx.post("http://bacowr:8001/generate", json={
    "topic": "SEO Best Practices for 2024",
    "keyword": "seo best practices",
    "word_count": 1500,
    "tone": "professional",
    "required_entities": [
        {"name": "Google", "type": "org", "importance": 1.0},
        {"name": "backlinks", "type": "concept", "importance": 0.8},
    ],
    "include_faq": True,
    "faq_count": 3,
})

article = response.json()
print(f"Title: {article['title']}")
print(f"Quality: {article['quality_score']}")
print(f"Words: {article['total_word_count']}")
```

---

## 📈 NEXT: PHASE C

With execution complete, Phase C focuses on intelligence:

1. **Link Planner Engine** - Strategic backlink planning
2. **Keyword Clustering** - Semantic grouping
3. **Rank Tracking Enhancement** - Position monitoring
4. **Competitor Gap Analysis** - Automated competitor research
5. **Real-time Collaboration** - Multi-user editing

---

## 📝 NOTES

- All Python services use FastAPI with Pydantic validation
- Redis used for caching and state management
- LightGBM model optional (rule-based fallback)
- Pipeline execution is fully async with Bull queues
- Health checks on all services for orchestration

**Total Phase B: 5,620 lines of production-ready code**
