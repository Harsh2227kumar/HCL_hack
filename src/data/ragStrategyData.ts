export interface RagStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  summary: string;
  technicalDetails: string[];
  codeSample: string;
  codeLanguage: string;
  pitfallsToAvoid: string[];
}

export const RAG_INTEGRATION_PIPELINE: RagStep[] = [
  {
    stepNumber: 1,
    title: 'Data Preprocessing & AST Node Serialization',
    subtitle: 'Extracting Deterministic Graphs from Raw JSON',
    summary: 'Raw community roadmaps are nested hierarchical JSON trees or flat arrays. Before embedding, we must decompose the roadmap into discrete, topologically aware markdown chunks with explicit ancestor and descendant relationship tags.',
    technicalDetails: [
      'Parse raw roadmap JSON to extract node IDs, levels, estimated hours, and prerequisite arrays.',
      'Inject explicit ancestor lineage into each chunk payload so the vector search retains topological context (e.g. `Prerequisites: [py-basics, py-async]`).',
      'Format each node as a self-contained markdown document containing: Title, Level, Description, Key Competencies, Company Stack, and Practical Evaluation Rubric.',
      'Construct a global node-id registry to enable bi-directional mapping between vector embeddings and graph database nodes.'
    ],
    codeLanguage: 'python',
    codeSample: `def serialize_node_to_rag_document(node: dict, roadmap_meta: dict) -> Document:
    """Transforms a roadmap node JSON into an enriched, context-heavy markdown chunk."""
    content = f"""# Domain: {roadmap_meta['title']}
## Competency: {node['label']} (Level: {node['level']})
- **Node ID:** {node['id']}
- **Estimated Effort:** {node['estimatedHours']} hours
- **Prerequisites Required:** {', '.join(node['prerequisites']) or 'None (Root Node)'}
- **Importance Tier:** {node['importance']}

### Conceptual Scope
{node['description']}

### Key Topics & Skills
{chr(10).join(f"- {topic}" for topic in node['keyTopics'])}

### Company Production Standards
- **Approved Stack:** {node.get('companyStandardStack', 'Standard Stack')}
- **Internal Team Application:** {node.get('teamApplication', 'General Engineering')}

### Verifiable Milestone Challenge
{node.get('evaluationRubric', 'Complete practical implementation test.')}
"""
    return Document(
        page_content=content,
        metadata={
            "node_id": node["id"],
            "roadmap_id": roadmap_meta["id"],
            "level": node["level"],
            "hours": node["estimatedHours"],
            "prerequisites": node["prerequisites"],
            "importance": node["importance"]
        }
    )`,
    pitfallsToAvoid: [
      'Never chunk raw JSON without converting to semantic markdown; vector models perform poorly on curly braces and JSON syntax.',
      'Do not strip prerequisite IDs during chunking; these are essential for hybrid graph-vector lookups.'
    ]
  },
  {
    stepNumber: 2,
    title: 'Embedding Strategy & Representation Schema',
    subtitle: 'Hybrid Dense + Sparse Keyword Vectors',
    summary: 'Developer roadmaps contain a mixture of conceptual prose and exact technical keywords (e.g., "FastAPI", "Uvicorn", "RS256", "eBPF"). We use hybrid dense semantic embeddings combined with sparse BM25/SPLADE tokens for maximum retrieval precision.',
    technicalDetails: [
      'Dense Embeddings: Generate 1536-dim or 3072-dim vectors using `text-embedding-3-large` or `gemini-embedding-exp-0824` with cosine metric.',
      'Sparse Vectors: Index BM25 token frequencies to ensure exact library names, flags, and CLI tools match with 100% precision.',
      'Metadata Vector Weighting: Prepend the role and category context to the embedding string to prevent cross-domain collision (e.g., distinguishing "Python Decorators" from "TypeScript Decorators").',
      'Normalized Unit Vectors: L2-normalize vectors to enable fast dot-product similarity search.'
    ],
    codeLanguage: 'python',
    codeSample: `from qdrant_client import QdrantClient, models
from fastembed import TextEmbedding, SparseTextEmbedding

# Initialize dual dense + sparse embedding models
dense_model = TextEmbedding(model_name="BAAI/bge-large-en-v1.5")
sparse_model = SparseTextEmbedding(model_name="Qdrant/bm25")

def embed_roadmap_chunks(documents: list[Document]):
    texts = [doc.page_content for doc in documents]
    dense_embeddings = list(dense_model.embed(texts))
    sparse_embeddings = list(sparse_model.embed(texts))
    
    points = []
    for i, doc in enumerate(documents):
        points.append(
            models.PointStruct(
                id=doc.metadata["node_id"],
                vector={
                    "dense": dense_embeddings[i].tolist(),
                    "sparse": sparse_embeddings[i].as_object()
                },
                payload=doc.metadata
            )
        )
    return points`,
    pitfallsToAvoid: [
      'Do not rely solely on dense embeddings for niche tool names (e.g. `py-spy`, `k9s`, `envoy`), which can have weak semantic embeddings.',
      'Avoid embedding long documents without chunk boundaries; keep each roadmap node as a discrete chunk under 512 tokens.'
    ]
  },
  {
    stepNumber: 3,
    title: 'Vector Indexing & Collection Partitioning',
    subtitle: 'HNSW Graph Indexing with Payload Filtering in Qdrant',
    summary: 'Vector databases must support fast Approximate Nearest Neighbor (ANN) search with deterministic payload filtering by role, skill level, and prerequisite satisfied status.',
    technicalDetails: [
      'HNSW Graph Index Configuration: Set $M = 16$, $\\text{efConstruction} = 128$, $\\text{efSearch} = 64$ for sub-millisecond retrieval with high recall.',
      'Payload Indexes: Create explicit payload indexes on `roadmap_id`, `level`, `importance`, and `prerequisites` in Qdrant/Chroma.',
      'Discipline Namespacing: Partition collections by discipline (e.g., `dev_roadmaps_python`, `dev_roadmaps_devops`) or use global tenant filtering.',
      'Real-Time Payload Sync: Update node `status` (Mastered / In-Progress) directly in vector payload to dynamically filter out mastered skills during search.'
    ],
    codeLanguage: 'python',
    codeSample: `client = QdrantClient(url="https://qdrant.internal:6333", api_key=QDRANT_KEY)

# Create collection with hybrid dense + sparse vector configuration
client.create_collection(
    collection_name="enterprise_roadmaps",
    vectors_config={
        "dense": models.VectorParams(size=1024, distance=models.Distance.COSINE)
    },
    sparse_vectors_config={
        "sparse": models.SparseVectorParams(index=models.SparseIndexParams(on_disk=False))
    },
    hnsw_config=models.HnswConfigDiff(
        m=16,
        ef_construct=128,
        full_scan_threshold=10000
    )
)

# Create index on payload fields for instant filtering
client.create_payload_index(
    collection_name="enterprise_roadmaps",
    field_name="roadmap_id",
    field_schema=models.PayloadSchemaType.KEYWORD
)
client.create_payload_index(
    collection_name="enterprise_roadmaps",
    field_name="level",
    field_schema=models.PayloadSchemaType.KEYWORD
)`,
    pitfallsToAvoid: [
      'Do not perform post-filtering in memory after querying top-k; use database-level payload filtering to prevent empty result sets.',
      'Ensure the vector index is persisted to disk with snapshotting enabled.'
    ]
  },
  {
    stepNumber: 4,
    title: 'Retrieval & Graph-Guided Query Orchestration',
    subtitle: 'Two-Stage Retrieval + Topological Re-Ranking',
    summary: 'A standard RAG pipeline returns semantically similar chunks without topological constraint checks. The orchestrator must perform a two-stage retrieval: vector semantic search followed by a DAG dependency resolver to guarantee valid prerequisite sequences.',
    technicalDetails: [
      'Step 4.1 (Query Embedding): Embed developer question and run hybrid search against vector collection.',
      'Step 4.2 (Topological Expansion): For each retrieved candidate node, query the Graph DAG to retrieve missing prerequisite predecessor nodes.',
      'Step 4.3 (Cross-Encoder Re-Ranking): Score candidates using a cross-encoder model (e.g. `bge-reranker-large`).',
      'Step 4.4 (Prompt Assembly): Inject ordered prerequisite sequence and verified rubrics into the LLM system prompt for deterministic syllabus synthesis.'
    ],
    codeLanguage: 'python',
    codeSample: `def hybrid_graph_rag_query(query_str: str, user_completed_nodes: list[str]) -> str:
    # 1. Semantic Retrieval
    search_results = client.search(
        collection_name="enterprise_roadmaps",
        query_vector=dense_model.embed(query_str),
        limit=5
    )
    target_node_ids = [hit.id for hit in search_results]

    # 2. Graph Prerequisite Resolution (Kahn's DAG Traversal)
    required_prereqs = graph_service.get_unfulfilled_prerequisites(
        target_nodes=target_node_ids,
        completed_nodes=user_completed_nodes
    )

    # 3. Context Assembly with Guaranteed Prerequisite Ordering
    all_nodes_in_order = graph_service.topological_sort(required_prereqs + target_node_ids)
    context_docs = [node_doc_store.get(nid) for nid in all_nodes_in_order]

    # 4. LLM Generation
    prompt = f"""You are an enterprise staff engineering mentor.
The developer asked: "{query_str}"

MANDATORY TOPOLOGICAL LEARNING ORDER (Zero Hallucination Permitted):
{chr(10).join(f"{i+1}. {doc['label']} [{doc['level']}] (Prereqs: {doc['prerequisites']})" for i, doc in enumerate(context_docs))}

Provide a structured, step-by-step learning path strictly adhering to the order above."""

    return llm.generate(prompt)`,
    pitfallsToAvoid: [
      'Never send unordered vector hits directly to the LLM; the LLM will hallucinate that Step 4 comes before Step 1.',
      'Always filter out nodes already mastered by the engineer.'
    ]
  }
];

export interface SystemComparison {
  dimension: string;
  pureRag: {
    score: number;
    pros: string;
    cons: string;
    details: string;
  };
  pureOkf: {
    score: number;
    pros: string;
    cons: string;
    details: string;
  };
  hybridGraphRag: {
    score: number;
    verdict: string;
    details: string;
  };
}

export const SYSTEM_COMPARISON_TABLE: SystemComparison[] = [
  {
    dimension: 'Prerequisite Sequence Integrity',
    pureRag: {
      score: 4,
      pros: 'Fast semantic search over fuzzy developer queries.',
      cons: 'Cannot guarantee topological dependency ordering; causes sequence inversion.',
      details: 'Vector similarity measures token proximity, not directed causality. An engineer asking about "Building Kubernetes Operators" gets operator chunks without prerequisite Golang, Docker, or Linux cgroups fundamentals.'
    },
    pureOkf: {
      score: 10,
      pros: '100% deterministic, mathematically guaranteed prerequisite DAG traversal.',
      cons: 'No conversational generation or natural language reasoning.',
      details: 'Graph traversals (BFS, Kahn\'s algorithm) compute exact topological ordering with 0% sequence hallucination.'
    },
    hybridGraphRag: {
      score: 10,
      verdict: 'Optimal Standard',
      details: 'Graph computes the exact topological sequence of node IDs; RAG populates each node with rich markdown guides and code rubrics.'
    }
  },
  {
    dimension: 'Handling Unstructured Documentation',
    pureRag: {
      score: 10,
      pros: 'Natively ingests blog posts, RFC markdown, internal wiki links, and YouTube transcripts.',
      cons: 'High token volume and potential noise in context window.',
      details: 'Vector stores excel at ingesting messy, heterogeneous markdown notes and returning fluent natural-language explanations.'
    },
    pureOkf: {
      score: 3,
      pros: 'Structured node properties are cleanly typed.',
      cons: 'Rigid schema; cannot represent nuanced prose, tips, or conversational mentorship.',
      details: 'Storing long markdown texts or code snippets in RDF triples / graph node attributes is clunky and limits semantic search flexibility.'
    },
    hybridGraphRag: {
      score: 10,
      verdict: 'Optimal Standard',
      details: 'Decoupled architecture: graph stores the relational skeleton; vector store handles unstructured descriptive documentation.'
    }
  },
  {
    dimension: 'Multi-Hop Dependency Resolution',
    pureRag: {
      score: 5,
      pros: 'Single query retrieves conceptually adjacent chunks.',
      cons: 'Multi-hop retrieval rapidly loses semantic precision across 3+ levels of depth.',
      details: 'If Skill A requires B, which requires C, which requires D, vector search on "How do I do Skill A?" rarely retrieves C and D because their keyword overlap is low.'
    },
    pureOkf: {
      score: 9,
      pros: 'Effortlessly executes N-hop graph traversals with constant computational complexity.',
      cons: 'Queries require rigid Cypher or SPARQL query authoring.',
      details: '`MATCH (start)-[:PREREQUISITE_FOR*]->(target)` resolves arbitrary multi-hop dependency chains in milliseconds.'
    },
    hybridGraphRag: {
      score: 10,
      verdict: 'Optimal Standard',
      details: 'Graph executes the multi-hop BFS; vector DB enriches only the nodes on the resolved path.'
    }
  },
  {
    dimension: 'Schema Maintenance & Evolution Cost',
    pureRag: {
      score: 8,
      pros: 'Drop new markdown files into the folder and re-index; zero schema migrations.',
      cons: 'Silent drift: outdated documents contaminate retrieval without explicit deprecation.',
      details: 'Very low initial authoring effort, but high operational risk of contradictory or stale advice over time.'
    },
    pureOkf: {
      score: 6,
      pros: 'Strict ontology enforcement prevents orphan nodes and cyclical dependencies.',
      cons: 'High initial schema authoring cost; requires graph database maintenance.',
      details: 'Every new skill requires creating explicit nodes and edges. High engineering discipline required.'
    },
    hybridGraphRag: {
      score: 9,
      verdict: 'Optimal Standard',
      details: 'Automated CI/CD pipelines validate the JSON DAG schema on pull requests, while markdown notes can be updated asynchronously.'
    }
  },
  {
    dimension: 'Hallucination & Corporate Governance',
    pureRag: {
      score: 4,
      pros: 'Broad world knowledge from underlying foundation model.',
      cons: 'High risk of recommending deprecated or unapproved third-party packages.',
      details: 'An LLM may invent shortcuts or suggest unapproved packages (e.g. suggesting `flask` when the company standard is `fastapi`).'
    },
    pureOkf: {
      score: 10,
      pros: 'Only explicitly declared nodes in the enterprise ontology exist.',
      cons: 'Cannot answer queries about topics outside the defined ontology.',
      details: 'Guaranteed compliance with enterprise standards: only vetted, company-approved stacks are served.'
    },
    hybridGraphRag: {
      score: 10,
      verdict: 'Optimal Standard',
      details: 'Graph acts as a strict guardrail filter: the LLM is only permitted to generate advice for nodes present in the verified graph payload.'
    }
  }
];
