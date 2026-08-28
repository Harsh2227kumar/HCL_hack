export interface ComparisonDimension {
  title: string;
  ragScore: number; // out of 10
  okfScore: number; // out of 10
  hybridScore: number; // out of 10
  ragDetails: string;
  okfDetails: string;
  hybridDetails: string;
}

export interface SimulationQuery {
  id: string;
  query: string;
  category: 'Prerequisite Traversal' | 'Curriculum Generation' | 'Skill Gap Evaluation' | 'Resource Explanation';
  ragResponse: {
    approach: string;
    pros: string;
    cons: string;
    simulatedOutput: string;
    failureMode: string;
  };
  okfResponse: {
    approach: string;
    pros: string;
    cons: string;
    simulatedOutput: string;
    failureMode: string;
  };
  hybridResponse: {
    approach: string;
    pros: string;
    cons?: string;
    simulatedOutput: string;
    whyItWins: string;
  };
}

export const ARCHITECTURE_COMPARISONS: ComparisonDimension[] = [
  {
    title: 'DAG Prerequisite Sequence Integrity',
    ragScore: 4,
    okfScore: 10,
    hybridScore: 10,
    ragDetails: 'Vector search retrieves chunks by semantic similarity. It cannot guarantee topological ordering and frequently suggests Step 4 before Step 2 is satisfied.',
    okfDetails: 'Graph ontologies model direct edges (Parent -> Child). Prerequisite traversal is 100% deterministic with zero LLM hallucination.',
    hybridDetails: 'OKF enforces strict path sequencing via graph query; RAG fills the node content with rich markdown context.'
  },
  {
    title: 'Unstructured Notes & Explanation Depth',
    ragScore: 10,
    okfScore: 3,
    hybridScore: 10,
    ragDetails: 'Excels at indexing markdown notes, external blog links, interview anecdotes, and generating fluid conversational explanations.',
    okfDetails: 'Ontologies are rigid. Storing long descriptive texts in triples (RDF/OWL) is clunky and limits natural language synthesis.',
    hybridDetails: 'Best of both worlds: Graph identifies the exact node IDs, then RAG retrieves targeted chunk embeddings linked to those IDs.'
  },
  {
    title: 'Multi-Hop Skill Gap Reasoning',
    ragScore: 5,
    okfScore: 9,
    hybridScore: 10,
    ragDetails: 'Vector similarity degrades over multi-hop queries (e.g. "What skills connect Python basic syntax to deploying an ArgoCD canary?").',
    okfDetails: 'Graph traversal (Dijkstra, BFS, Cypher path queries) finds shortest learning paths and missing prerequisite bridges instantly.',
    hybridDetails: 'Graph computes shortest missing skill subgraph; LLM produces personalized week-by-week learning syllabus.'
  },
  {
    title: 'Schema Adaptability & Team Customization',
    ragScore: 7,
    okfScore: 8,
    hybridScore: 9,
    ragDetails: 'Adding company tech stack notes is as easy as dropping new markdown files into the vector database ingestion folder.',
    okfDetails: 'Requires defining explicit relations (`:uses_company_stack`, `:evaluated_by_lead`), ensuring strict enterprise governance.',
    hybridDetails: 'Teams define clear JSON-LD/Graph schema for mandatory competencies, and team members enrich markdown notes asynchronously.'
  },
  {
    title: 'Hallucination & Verification Safety',
    ragScore: 5,
    okfScore: 10,
    hybridScore: 10,
    ragDetails: 'LLM can fabricate nonexistent libraries or invent prerequisite shortcuts if vector chunks lack explicit relational bounds.',
    okfDetails: 'Ontology guarantees zero hallucinated prerequisites because relationships are hard-coded in the graph topology.',
    hybridDetails: 'Deterministic ground-truth graph acts as strict validation guardrail before LLM output is served to engineers.'
  }
];

export const SIMULATION_QUERIES: SimulationQuery[] = [
  {
    id: 'query-1',
    query: 'I already know Python basic syntax and functions. What exact roadmap nodes must I complete before I can build a production FastAPI service with PostgreSQL?',
    category: 'Prerequisite Traversal',
    ragResponse: {
      approach: 'Embeds query, searches top-k chunks from roadmap notes matching "FastAPI", "PostgreSQL", "Python syntax".',
      pros: 'Retrieves relevant markdown excerpts quickly.',
      cons: 'Misses intermediate dependencies (e.g. forgot AsyncIO and Context Managers) because they did not have high semantic overlap with the specific query words.',
      simulatedOutput: '"You can start by installing FastAPI and SQLAlchemy. Then connect to PostgreSQL using asyncpg. You should also look into Pydantic models and writing unit tests."',
      failureMode: 'Hallucination of sequence. Missed critical prerequisite: AsyncIO TaskGroups and OOP Dunder/Protocols.'
    },
    okfResponse: {
      approach: 'Executes Cypher query: MATCH path = (start:Node {id:"py-basics"})-[*]->(target:Node {id:"py-database-orm"}) RETURN path.',
      pros: '100% mathematically correct dependency chain: py-basics -> py-oop-advanced & py-async -> py-frameworks-web -> py-database-orm.',
      cons: 'Returns dry node IDs and relation tables with minimal contextual guidance or study tips.',
      simulatedOutput: 'Prerequisite Chain:\n1. [py-oop-advanced] OOP, Dunder & Metaclasses (20 hrs)\n2. [py-async] Concurrency & AsyncIO (30 hrs)\n3. [py-frameworks-web] Web Frameworks FastAPI (35 hrs)\n4. [py-database-orm] Databases & ORM SQLAlchemy (25 hrs)',
      failureMode: 'Lack of conversational explanation, rationale, or custom project ideas.'
    },
    hybridResponse: {
      approach: 'Step 1 (OKF Graph): Computes exact topological subgraph between completed skills and target goal.\nStep 2 (RAG): Ingests the 4 identified node notes, internal company guides, and team standards into LLM context.',
      pros: 'Guaranteed dependency integrity + rich contextual guidance with internal company repo links.',
      simulatedOutput: `### Verified Topological Learning Path (Total: 110 Hours)

**Step 1: OOP, Dunder & Metaclasses (20 hrs)**
- **Why before FastAPI:** FastAPI's dependency injection and Pydantic v2 validation rely heavily on Python descriptors, type hints, and class decorators.
- *Company Standard:* Review our internal Pydantic v2 guidelines at \`wiki.internal/python/style-guide\`.

**Step 2: Concurrency & AsyncIO (30 hrs)**
- **Why before Web:** FastAPI runs on the ASGI Uvicorn loop. You must understand \`asyncio.TaskGroup\` and non-blocking I/O before writing async route handlers.

**Step 3: Web Frameworks (FastAPI) (35 hrs)**
- Build modular routers with dependency injection and OpenAPI contract validation.

**Step 4: Databases & ORM (SQLAlchemy 2.0 Async) (25 hrs)**
- Connect asyncpg connection poolers and handle zero-downtime Alembic schema migrations.`,
      whyItWins: '100% correct prerequisite order guaranteed by Graph DAG + Rich practical explanations and internal links provided by RAG.'
    }
  },
  {
    id: 'query-2',
    query: 'Generate an onboarding plan for a new Junior DevOps Engineer joining our team to achieve production Kubernetes deployment capability within 6 weeks.',
    category: 'Curriculum Generation',
    ragResponse: {
      approach: 'Synthesizes general text advice from devops markdown docs.',
      pros: 'Generates plausible weekly schedule text.',
      cons: 'Orders topics arbitrarily (suggests ArgoCD GitOps before Linux networking fundamentals), leading to confusion.',
      simulatedOutput: 'Week 1: Kubernetes Pods & Deployments\nWeek 2: Docker Containers\nWeek 3: ArgoCD\nWeek 4: Prometheus\nWeek 5: Linux Bash\nWeek 6: Terraform',
      failureMode: 'Inverted pedagogical sequence (Kubernetes before Docker & Linux).'
    },
    okfResponse: {
      approach: 'Calculates topological sort of DevOps DAG filtered by `level <= Intermediate` and sums `estimatedHours`.',
      pros: 'Accurate chronological sequencing based on defined node graph.',
      cons: 'Does not format into actionable weekly calendar milestones with team touchpoints.',
      simulatedOutput: 'Sequence: [devops-linux-networking] (30h) -> [devops-docker-containers] (25h) -> [devops-cicd-github-actions] (25h) -> [devops-terraform-iac] (35h) -> [devops-kubernetes-k8s] (45h). Total: 160h.',
      failureMode: 'Raw data dump without mentor check-ins or project milestone context.'
    },
    hybridResponse: {
      approach: 'OKF selects topological subgraph nodes fitting 160 available hours; RAG decorates each milestone with company-specific onboarding tasks and team buddy check-ins.',
      pros: 'Pedagogically sound, balanced hour budgets, paired with real company resources.',
      simulatedOutput: `### 6-Week Junior DevOps Onboarding Syllabus

* **Weeks 1–2: Systems & Containers (55h)**
  - Nodes: \`Linux Networking\` (30h) & \`Docker Optimization\` (25h)
  - Milestone: Build an unprivileged distroless Docker image under 80MB.
  - Team Touchpoint: Pairing session with Senior Platform Engineer.

* **Weeks 3–4: Automation & Cloud IaC (60h)**
  - Nodes: \`GitHub Actions CI/CD\` (25h) & \`Terraform IaC\` (35h)
  - Milestone: Deploy a staging VPC with automated OIDC authentication.

* **Weeks 5–6: Kubernetes Orchestration & Observability (75h)**
  - Nodes: \`Kubernetes Operations\` (45h) & \`Prometheus/Grafana Metrics\` (30h)
  - Milestone: Deploy microservice with zero-downtime rolling update, HPA, and Grafana SLO dashboard.
  - Graduation: Production deployment certification with Team Lead.`,
      whyItWins: 'Eliminates structural hallucinations while creating a human-centered, realistic team onboarding plan.'
    }
  },
  {
    id: 'query-3',
    query: 'A candidate claims Mid-Level Backend Engineer experience. What assessment project and technical rubric should we use to evaluate their data persistence and architecture skills?',
    category: 'Skill Gap Evaluation',
    ragResponse: {
      approach: 'Retrieves generic interview questions from backend markdown documents.',
      pros: 'Provides classic trivia questions (e.g. "What is ACID?").',
      cons: 'Fails to assess practical architectural capability or map to explicit leveling standards.',
      simulatedOutput: 'Ask them about SQL vs NoSQL, B-Trees, and how Kafka works. Ask them to write a CRUD app in Go or Python.',
      failureMode: 'Superficial trivia instead of concrete rubrics tied to organizational standards.'
    },
    okfResponse: {
      approach: 'Queries nodes `be-architecture-patterns`, `be-rdbms-internals`, and `be-event-driven-kafka` for `evaluationRubric` properties.',
      pros: 'Returns defined rubrics mapped directly to our skill ontology.',
      cons: 'Lacks conversational interview script or follow-up probe questions.',
      simulatedOutput: '1. be-rdbms-internals: "Analyze a slow query plan with EXPLAIN ANALYZE and design an index reducing disk reads by 95%."\n2. be-event-driven-kafka: "Implement the Transactional Outbox Pattern to guarantee event delivery to Kafka during database commits."',
      failureMode: 'Terse rubric strings without interviewer guidance.'
    },
    hybridResponse: {
      approach: 'OKF provides the formal evaluation criteria from the schema; RAG generates realistic scenario prompts, candidate scoring matrix, and red flags.',
      pros: 'Comprehensive hiring package tailored to company standards.',
      simulatedOutput: `### Mid-Level Backend Technical Evaluation Kit

**Practical Take-Home / Live Pairing Project: The Resilient Order Service**
1. **Database Schema & Indexing Benchmark (be-rdbms-internals)**
   - *Prompt:* Candidate receives a database with 5M mock order records and a slow aggregation query.
   - *Pass Criteria:* Uses \`EXPLAIN (ANALYZE, BUFFERS)\`, identifies sequential scan, creates compound index with partial filter, and explains B-Tree disk page traversal.
   - *Red Flag:* Blindly adding indexes without examining query cost or explaining write amplification.

2. **Transactional Outbox Pattern (be-event-driven-kafka)**
   - *Prompt:* Ensure order creation and Kafka event publishing are atomic across network partitions.
   - *Pass Criteria:* Implements relational outbox table written in the same DB transaction, polled via Debezium CDC or background worker.
   - *Red Flag:* Calling Kafka producer directly inside HTTP request handler without fallback or retry lock.`,
      whyItWins: 'Directly bridges hiring criteria to company engineering standards with zero guesswork.'
    }
  }
];
