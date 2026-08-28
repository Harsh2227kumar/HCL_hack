import { RoadmapNode, ROADMAPS } from './roadmapsData';

export type DisciplineId = 
  | 'python-developer'
  | 'frontend-developer'
  | 'devops-engineer'
  | 'backend-systems'
  | 'cyber-security'
  | 'ai-ml-engineer'
  | 'fullstack-developer'
  | 'cloud-architect';

export interface DisciplineMeta {
  id: DisciplineId;
  label: string;
  shortCode: string;
  color: string; // Tailwind/Hex for border & tags
  bgLight: string;
  category: string;
  leadIcon: string;
}

export const DISCIPLINES: DisciplineMeta[] = [
  {
    id: 'python-developer',
    label: 'Python Developer',
    shortCode: 'PY',
    color: '#365D88',
    bgLight: '#EFF5FB',
    category: 'Backend & Data',
    leadIcon: 'FileCode'
  },
  {
    id: 'frontend-developer',
    label: 'Frontend Specialist',
    shortCode: 'FE',
    color: '#087EA4',
    bgLight: '#ECF8FD',
    category: 'Client Engineering',
    leadIcon: 'Layout'
  },
  {
    id: 'devops-engineer',
    label: 'DevOps & SRE',
    shortCode: 'DEVOPS',
    color: '#D97706',
    bgLight: '#FEF3C7',
    category: 'Infrastructure & Reliability',
    leadIcon: 'Terminal'
  },
  {
    id: 'backend-systems',
    label: 'Backend Systems',
    shortCode: 'BE',
    color: '#059669',
    bgLight: '#ECFDF5',
    category: 'Distributed Systems',
    leadIcon: 'Server'
  },
  {
    id: 'cyber-security',
    label: 'Cyber Security',
    shortCode: 'SEC',
    color: '#DC2626',
    bgLight: '#FEF2F2',
    category: 'Security & AppSec',
    leadIcon: 'Shield'
  },
  {
    id: 'ai-ml-engineer',
    label: 'AI & Machine Learning',
    shortCode: 'AI',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    category: 'Intelligent Systems',
    leadIcon: 'Sparkles'
  },
  {
    id: 'fullstack-developer',
    label: 'Full Stack Engineer',
    shortCode: 'FS',
    color: '#4F46E5',
    bgLight: '#EEF2FF',
    category: 'End-to-End Delivery',
    leadIcon: 'Layers'
  },
  {
    id: 'cloud-architect',
    label: 'Cloud & Data Architect',
    shortCode: 'CLOUD',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    category: 'Enterprise Infrastructure',
    leadIcon: 'Cloud'
  }
];

export type RelationshipType = 
  | 'CONTAINERIZES'
  | 'DEPLOYS_TO'
  | 'FEEDS_DATA_TO'
  | 'CONSUMES_API'
  | 'HARDENS_SECURITY'
  | 'TELEMETRY_PIPELINE'
  | 'ORCHESTRATES_INFRA'
  | 'SERVES_MODELS'
  | 'SHARED_PREREQUISITE';

export interface CrossDisciplineEdge {
  id: string;
  sourceNodeId: string;
  sourceDiscipline: DisciplineId;
  sourceLabel: string;
  targetNodeId: string;
  targetDiscipline: DisciplineId;
  targetLabel: string;
  relationship: RelationshipType;
  description: string;
  productionContract: string; // Architectural explanation of the contract (e.g. Dockerfile, OpenAPI, OTel Span)
  strength: 'Critical' | 'Standard' | 'Auxiliary';
}

export const CROSS_DISCIPLINE_EDGES: CrossDisciplineEdge[] = [
  // Python -> DevOps
  {
    id: 'edge-py-devops-packaging',
    sourceNodeId: 'py-packaging-dist',
    sourceDiscipline: 'python-developer',
    sourceLabel: 'Packaging, Poetry & CI/CD',
    targetNodeId: 'devops-docker-containers',
    targetDiscipline: 'devops-engineer',
    targetLabel: 'Containerization (Docker / OCI)',
    relationship: 'CONTAINERIZES',
    description: 'Python wheel builds and deterministic lockfiles (Poetry/UV) are packaged into multi-stage OCI Docker images.',
    productionContract: 'Multi-stage Dockerfile: builder stage uses uv/poetry export; runner stage copies lean site-packages without dev tooling.',
    strength: 'Critical'
  },
  {
    id: 'edge-py-devops-k8s',
    sourceNodeId: 'py-frameworks-web',
    sourceDiscipline: 'python-developer',
    sourceLabel: 'Web Frameworks (FastAPI / Django)',
    targetNodeId: 'devops-k8s-orchestration',
    targetDiscipline: 'devops-engineer',
    targetLabel: 'Container Orchestration (Kubernetes)',
    relationship: 'DEPLOYS_TO',
    description: 'FastAPI ASGI microservices are deployed as Kubernetes Deployments with Horizontal Pod Autoscalers and readiness probes.',
    productionContract: 'K8s manifest spec: probes FastAPI /healthz endpoint; sets memory requests/limits based on Uvicorn worker count.',
    strength: 'Critical'
  },
  {
    id: 'edge-py-devops-telemetry',
    sourceNodeId: 'py-observability',
    sourceDiscipline: 'python-developer',
    sourceLabel: 'Observability (OpenTelemetry & Prometheus)',
    targetNodeId: 'devops-observability-metrics',
    targetDiscipline: 'devops-engineer',
    targetLabel: 'Observability (Prometheus, Grafana, OpenTelemetry)',
    relationship: 'TELEMETRY_PIPELINE',
    description: 'Python OpenTelemetry traces and Prometheus metric endpoints are scraped by cluster-wide Prometheus and OTel Collectors.',
    productionContract: 'OTel OTLP gRPC exporter pushing to collector:4317; Grafana alerts fire when p99 latency exceeds 250ms.',
    strength: 'Critical'
  },

  // Python -> AI / ML
  {
    id: 'edge-py-ai-data',
    sourceNodeId: 'py-data-tooling',
    sourceDiscipline: 'python-developer',
    sourceLabel: 'Data Processing (Polars / Pandas)',
    targetNodeId: 'ai-data-feature-engineering',
    targetDiscipline: 'ai-ml-engineer',
    targetLabel: 'Data Pipelines & Feature Engineering',
    relationship: 'FEEDS_DATA_TO',
    description: 'High-performance Python Polars LazyFrames and Apache Arrow structures feed vectorized training datasets into ML pipelines.',
    productionContract: 'Zero-copy Arrow memory buffers converted to PyTorch Tensors for batch model training.',
    strength: 'Critical'
  },
  {
    id: 'edge-py-ai-rag',
    sourceNodeId: 'py-frameworks-web',
    sourceDiscipline: 'python-developer',
    sourceLabel: 'Web Frameworks (FastAPI / Django)',
    targetNodeId: 'ai-llm-rag-orchestration',
    targetDiscipline: 'ai-ml-engineer',
    targetLabel: 'LLM Orchestration & RAG Pipelines',
    relationship: 'SERVES_MODELS',
    description: 'FastAPI routes stream Server-Sent Events (SSE) from LangChain / LlamaIndex RAG retrieval pipelines to frontend clients.',
    productionContract: 'StreamingResponse(event_generator(), media_type="text/event-stream") with token-by-token emission.',
    strength: 'Critical'
  },

  // Frontend -> Backend & Python
  {
    id: 'edge-fe-be-api',
    sourceNodeId: 'fe-react-ecosystem',
    sourceDiscipline: 'frontend-developer',
    sourceLabel: 'Modern Component Architectures (React)',
    targetNodeId: 'be-grpc-protobuf',
    targetDiscipline: 'backend-systems',
    targetLabel: 'gRPC & Protocol Buffers',
    relationship: 'CONSUMES_API',
    description: 'React client consumes typed gRPC-Web / Connect-RPC endpoints generated from shared Proto3 specifications.',
    productionContract: 'buf.build code generation produces type-safe TypeScript query hooks directly from service.proto definitions.',
    strength: 'Critical'
  },
  {
    id: 'edge-fe-py-api',
    sourceNodeId: 'fe-state-management',
    sourceDiscipline: 'frontend-developer',
    sourceLabel: 'State Orchestration & Server Cache',
    targetNodeId: 'py-frameworks-web',
    targetDiscipline: 'python-developer',
    targetLabel: 'Web Frameworks (FastAPI / Django)',
    relationship: 'CONSUMES_API',
    description: 'TanStack Query handles client caching, optimistic updates, and automatic invalidation against FastAPI REST endpoints.',
    productionContract: 'OpenAPI-TypeScript CLI auto-generates fetch client interfaces from FastAPI openapi.json.',
    strength: 'Critical'
  },

  // Cyber Security -> Python & Frontend & DevOps
  {
    id: 'edge-sec-py-appsec',
    sourceNodeId: 'sec-appsec-owasp',
    sourceDiscipline: 'cyber-security',
    sourceLabel: 'Application Security & OWASP Top 10',
    targetNodeId: 'py-security-auth',
    targetDiscipline: 'python-developer',
    targetLabel: 'AppSec & Auth (JWT, OAuth2, RBAC)',
    relationship: 'HARDENS_SECURITY',
    description: 'Security team mandates cryptographic password hashing (Argon2id), secure JWT RS256 rotation, and SQL injection audits.',
    productionContract: 'Automated Bandit and Semgrep SAST rules block GitHub PRs containing unescaped SQL or hardcoded secrets.',
    strength: 'Critical'
  },
  {
    id: 'edge-sec-fe-csp',
    sourceNodeId: 'sec-appsec-owasp',
    sourceDiscipline: 'cyber-security',
    sourceLabel: 'Application Security & OWASP Top 10',
    targetNodeId: 'fe-security-web',
    targetDiscipline: 'frontend-developer',
    targetLabel: 'Web AppSec (CSP, CORS, XSS, CSRF)',
    relationship: 'HARDENS_SECURITY',
    description: 'Enforces strict Content-Security-Policy (CSP) headers, Subresource Integrity (SRI), and HttpOnly SameSite cookie flags.',
    productionContract: 'Nginx / Cloudflare Edge rules inject: Content-Security-Policy: default-src \'self\'; script-src \'nonce-xyz\';',
    strength: 'Critical'
  },
  {
    id: 'edge-sec-devops-iam',
    sourceNodeId: 'sec-cloud-iam',
    sourceDiscipline: 'cyber-security',
    sourceLabel: 'Cloud Security & IAM Governance',
    targetNodeId: 'devops-ci-cd-pipelines',
    targetDiscipline: 'devops-engineer',
    targetLabel: 'CI/CD Pipelines (GitHub Actions / GitLab)',
    relationship: 'HARDENS_SECURITY',
    description: 'Enforces OpenID Connect (OIDC) short-lived federated credentials in CI/CD runners, eliminating static AWS/GCP access keys.',
    productionContract: 'GitHub Actions uses id-token: write permissions to assume temporary IAM roles via Google Workload Identity.',
    strength: 'Critical'
  },

  // DevOps -> Cloud Architect
  {
    id: 'edge-devops-cloud-iac',
    sourceNodeId: 'devops-iac-terraform',
    sourceDiscipline: 'devops-engineer',
    sourceLabel: 'Infrastructure as Code (Terraform / OpenTofu)',
    targetNodeId: 'cloud-terraform-iac',
    targetDiscipline: 'cloud-architect',
    targetLabel: 'Multi-Cloud IaC (Terraform / Pulumi)',
    relationship: 'ORCHESTRATES_INFRA',
    description: 'DevOps engineers instantiate enterprise architectural modules (VPCs, transit gateways, managed K8s) designed by Cloud Architects.',
    productionContract: 'Terragrunt configuration executing vetted modules from internal company Terraform Registry.',
    strength: 'Critical'
  },
  {
    id: 'edge-cloud-sec-governance',
    sourceNodeId: 'cloud-iam-governance',
    sourceDiscipline: 'cloud-architect',
    sourceLabel: 'Cloud IAM & Least Privilege Governance',
    targetNodeId: 'sec-cloud-iam',
    targetDiscipline: 'cyber-security',
    targetLabel: 'Cloud Security & IAM Governance',
    relationship: 'SHARED_PREREQUISITE',
    description: 'Cloud architects define enterprise organizational units (OUs), SCP policies, and least-privilege role hierarchies audit-verified by Security.',
    productionContract: 'AWS SCP / GCP Organization Policy constraints disallowing public S3 buckets and enforcing CMEK encryption.',
    strength: 'Standard'
  },

  // AI/ML -> Backend Systems & Cloud
  {
    id: 'edge-ai-be-serving',
    sourceNodeId: 'ai-model-serving-apis',
    sourceDiscipline: 'ai-ml-engineer',
    sourceLabel: 'High-Performance Model Serving (vLLM / Triton)',
    targetNodeId: 'be-distributed-consensus',
    targetDiscipline: 'backend-systems',
    targetLabel: 'Distributed Consensus (Raft / Paxos)',
    relationship: 'SERVES_MODELS',
    description: 'Distributed inference clusters coordinate GPU worker nodes, KV cache replication, and model weight sharding using Raft consensus.',
    productionContract: 'vLLM tensor-parallel worker ring communicating over NVLink/InfiniBand with health heartbeats.',
    strength: 'Standard'
  },
  {
    id: 'edge-ai-cloud-vector',
    sourceNodeId: 'ai-llm-rag-orchestration',
    sourceDiscipline: 'ai-ml-engineer',
    sourceLabel: 'LLM Orchestration & RAG Pipelines',
    targetNodeId: 'cloud-data-warehouse',
    targetDiscipline: 'cloud-architect',
    targetLabel: 'Data Lakehouse & Warehouse (Snowflake / BigQuery)',
    relationship: 'FEEDS_DATA_TO',
    description: 'RAG embeddings and document metadata are synchronized with the enterprise Cloud Data Lakehouse for continuous evaluation.',
    productionContract: 'Airbyte / dbt sync pulling chunked knowledge base documents from Cloud Storage to Qdrant vector index.',
    strength: 'Standard'
  },

  // Full Stack -> Frontend & Backend
  {
    id: 'edge-fs-fe-fullcycle',
    sourceNodeId: 'fs-fullcycle-dev',
    sourceDiscipline: 'fullstack-developer',
    sourceLabel: 'Full-Cycle Engineering & Micro-Frontends',
    targetNodeId: 'fe-dom-js',
    targetDiscipline: 'frontend-developer',
    targetLabel: 'Modern JavaScript & DOM Internals',
    relationship: 'SHARED_PREREQUISITE',
    description: 'Full-stack engineers leverage core browser lifecycle understanding to build resilient isomorphic SSR/SSG web applications.',
    productionContract: 'Next.js / Remix SSR pipeline hydrating client React components with server-rendered HTML payloads.',
    strength: 'Standard'
  }
];

// Helper to look up node metadata across all roadmaps
export function findGlobalNode(nodeId: string): { node: RoadmapNode; discipline: DisciplineMeta } | null {
  for (const roadmap of ROADMAPS) {
    const foundNode = roadmap.nodes.find(n => n.id === nodeId);
    if (foundNode) {
      const disc = DISCIPLINES.find(d => d.id === roadmap.id) || DISCIPLINES[0];
      return { node: foundNode, discipline: disc };
    }
  }
  return null;
}

// Find path between two nodes across disciplines using Breadth-First Search (BFS)
export function findCrossDisciplinePath(
  startNodeId: string,
  targetNodeId: string
): CrossDisciplineEdge[] | null {
  if (startNodeId === targetNodeId) return [];

  // Build adjacency graph
  const adj = new Map<string, CrossDisciplineEdge[]>();
  CROSS_DISCIPLINE_EDGES.forEach(edge => {
    if (!adj.has(edge.sourceNodeId)) adj.set(edge.sourceNodeId, []);
    adj.get(edge.sourceNodeId)!.push(edge);
  });

  const queue: { current: string; path: CrossDisciplineEdge[] }[] = [
    { current: startNodeId, path: [] }
  ];
  const visited = new Set<string>([startNodeId]);

  while (queue.length > 0) {
    const { current, path } = queue.shift()!;
    if (current === targetNodeId) {
      return path;
    }

    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.targetNodeId)) {
        visited.add(edge.targetNodeId);
        queue.push({
          current: edge.targetNodeId,
          path: [...path, edge]
        });
      }
    }
  }

  return null;
}
