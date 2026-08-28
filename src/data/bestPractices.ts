export interface PlaybookStep {
  stepNumber: string;
  title: string;
  subtitle: string;
  summary: string;
  whyItMatters: string;
  codeSnippet: string;
  codeLanguage: string;
  tips: string[];
}

export const PLAYBOOK_STEPS: PlaybookStep[] = [
  {
    stepNumber: '01',
    title: 'Validate DAG Topological Order & Catch Circular Dependencies',
    subtitle: 'Mathematical Graph Integrity',
    summary: 'Raw community JSONs often lack explicit cycle detection. A single circular prerequisite (e.g. Node A requires B, and B requires A) breaks automated path algorithms and LMS engines.',
    whyItMatters: 'Guarantees your curriculum engine can always compute a valid linear or parallel study schedule for any learner.',
    codeLanguage: 'python',
    codeSnippet: `import json
from collections import defaultdict, deque

def validate_roadmap_dag(json_path: str):
    """Verifies that the roadmap JSON is a valid Directed Acyclic Graph (DAG)."""
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    nodes = {n['id']: n for n in data['nodes']}
    in_degree = {n_id: 0 for n_id in nodes}
    adj_list = defaultdict(list)
    
    # Build adjacency list (Prerequisite -> Dependent Node)
    for node_id, node in nodes.items():
        for prereq_id in node.get('prerequisites', []):
            if prereq_id not in nodes:
                raise ValueError(f"Unknown prerequisite '{prereq_id}' in node '{node_id}'")
            adj_list[prereq_id].append(node_id)
            in_degree[node_id] += 1
            
    # Kahn's Algorithm for Topological Sort
    queue = deque([n_id for n_id, deg in in_degree.items() if deg == 0])
    sorted_order = []
    
    while queue:
        curr = queue.popleft()
        sorted_order.append(curr)
        for neighbor in adj_list[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    if len(sorted_order) != len(nodes):
        cycle_nodes = [n_id for n_id, deg in in_degree.items() if deg > 0]
        raise RuntimeError(f"🚨 CYCLE DETECTED! Circular prerequisites in: {cycle_nodes}")
        
    print(f"✅ DAG is 100% valid! Computed topological learning sequence: {sorted_order[:4]}...")
    return sorted_order`,
    tips: [
      'Run this validation script as a GitHub Action pre-commit hook before merging any roadmap JSON modifications.',
      'Enforce that every node has at least 1 prerequisite unless it is marked as level: "Fundamentals".'
    ]
  },
  {
    stepNumber: '02',
    title: 'Transform Raw JSON into High-Context Chunks for Hybrid GraphRAG',
    subtitle: 'Metadata-Rich Ingestion Pipeline',
    summary: 'Do not embed raw JSON directly. Convert each node into structured semantic markdown documents with explicit metadata headers (node ID, role, prerequisites, evaluation rubric, internal company links).',
    whyItMatters: 'Enables your Vector DB (Qdrant/Pinecone) to filter by role/level before computing cosine similarity, achieving 99%+ context accuracy.',
    codeLanguage: 'python',
    codeSnippet: `import json
from langchain_core.documents import Document

def transform_nodes_to_rag_documents(roadmap_json_path: str) -> list[Document]:
    with open(roadmap_json_path, 'r') as f:
        data = json.load(f)
        
    documents = []
    for node in data['nodes']:
        # Create semantic text chunk for embedding
        content = f"""# Skill Node: {node['label']} (ID: {node['id']})
**Role:** {data['title']} | **Level:** {node['level']} | **Estimated Time:** {node['estimatedHours']} Hours
**Prerequisites:** {', '.join(node.get('prerequisites', [])) or 'None (Entry Point)'}
**Importance:** {node.get('importance', 'Required')}

### Concept Description
{node['description']}

### Key Topics & Competencies
- {"\\n- ".join(node['keyTopics'])}

### Company Stack & Internal Standards
Standard: {node.get('companyStandardStack', 'Industry Standard')}
Internal Wiki: {node.get('internalDocUrl', 'wiki.internal/engineering')}

### Assessment Challenge & Evaluation Rubric
{node.get('evaluationRubric', 'Complete practical implementation.')}
"""
        # Metadata dictionary for Vector DB filtering
        metadata = {
            "node_id": node['id'],
            "roadmap_id": data['id'],
            "level": node['level'],
            "hours": node['estimatedHours'],
            "prerequisites": node.get('prerequisites', []),
            "has_rubric": bool(node.get('evaluationRubric'))
        }
        documents.append(Document(page_content=content, metadata=metadata))
        
    print(f"📦 Successfully prepared {len(documents)} enriched documents for Vector Indexing.")
    return documents`,
    tips: [
      'Include the node ID and prerequisite IDs directly in the page_content so LLMs can reason over the graph structure.',
      'Use metadata filtering to query only nodes for a specific department or seniority level.'
    ]
  },
  {
    stepNumber: '03',
    title: 'Export to Graph Database (Neo4j Cypher / NetworkX / GraphML)',
    subtitle: 'Deterministic Multi-Hop Querying',
    summary: 'Load your roadmap directly into Neo4j or an in-memory NetworkX graph to run graph queries like shortest learning path, critical path duration, and skill cluster centrality.',
    whyItMatters: 'Allows your engineering manager to run instant Cypher queries: "Find all unmastered nodes blocking Sarah from becoming a Senior Backend Engineer".',
    codeLanguage: 'sql',
    codeSnippet: `// 1. Create Constraint for Unique Skill Nodes
CREATE CONSTRAINT node_id_unique IF NOT EXISTS
FOR (n:SkillNode) REQUIRE n.id IS UNIQUE;

// 2. Cypher Ingestion Script (Load JSON Nodes & Edges)
UNWIND $nodes AS n
MERGE (s:SkillNode {id: n.id})
SET s.label = n.label,
    s.level = n.level,
    s.hours = n.estimatedHours,
    s.rubric = n.evaluationRubric;

// 3. Connect Prerequisite Edges
UNWIND $nodes AS n
UNWIND n.prerequisites AS prereq_id
MATCH (parent:SkillNode {id: prereq_id})
MATCH (child:SkillNode {id: n.id})
MERGE (parent)-[:PREREQUISITE_FOR]->(child);

// 4. Query Shortest Learning Path to Target Skill
MATCH path = shortestPath((start:SkillNode {id: 'py-basics'})-[:PREREQUISITE_FOR*]->(target:SkillNode {id: 'py-database-orm'}))
RETURN [node in nodes(path) | node.label] AS LearningPath,
       reduce(totalHours = 0, node in nodes(path) | totalHours + node.hours) AS TotalHoursRequired;`,
    tips: [
      'Store edge weights as `estimatedHours` so graph algorithms like Dijkstra find the fastest path to mastery.',
      'Tag company-critical nodes with `:CORE_COMPETENCY` labels for instant organizational reporting.'
    ]
  },
  {
    stepNumber: '04',
    title: 'Integrate into Internal Developer Portals (Backstage / Notion / Slack)',
    subtitle: 'Zero-Friction Team Adoption',
    summary: 'Do not keep your roadmaps locked inside private repositories. Expose them via Backstage plugins, Markdown sync to Notion, and interactive Slack commands.',
    whyItMatters: 'If the roadmap is not where engineers do daily work, adoption drops by 80%. Embedding it into daily tools creates habitual progression.',
    codeLanguage: 'typescript',
    codeSnippet: `// Example: Express / Slack Bot Command Handler for /roadmap
import express from 'express';
import { ROADMAPS } from './roadmapsData';

const app = express();
app.use(express.json());

app.post('/api/slack/roadmap', (req, res) => {
  const { text: userQuery, user_id } = req.body;
  // Format: /roadmap python next
  const [trackName, action] = (userQuery || 'python').toLowerCase().split(' ');
  
  const roadmap = ROADMAPS.find(r => r.id.includes(trackName));
  if (!roadmap) {
    return res.json({ text: \`⚠️ Track "\${trackName}" not found. Available: python, frontend, devops, backend, security, ai, fullstack, cloud\` });
  }
  
  const inProgress = roadmap.nodes.filter(n => n.status === 'in-progress');
  const nextNodes = roadmap.nodes.filter(n => n.status === 'not-started').slice(0, 2);
  
  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: \`🗺️ \${roadmap.title} Career Progression\` }
    },
    {
      type: "section",
      text: { 
        type: "mrkdwn", 
        text: \`*Active Focus:*\n\${inProgress.map(n => \`• *[\${n.label}]* (\${n.estimatedHours}h) - \${n.description}\`).join('\\n') || 'None in progress'}\` 
      }
    },
    {
      type: "section",
      text: { 
        type: "mrkdwn", 
        text: \`*Recommended Next Steps:*\n\${nextNodes.map(n => \`• *\${n.label}* (\${n.level})\`).join('\\n')}\` 
      }
    }
  ];
  
  res.json({ blocks });
});`,
    tips: [
      'Create a Slack channel like `#guild-learning-roadmap` where completed milestones trigger celebratory shout-outs.',
      'Automate monthly badge awards in company all-hands meetings.'
    ]
  },
  {
    stepNumber: '05',
    title: 'Automate Practical Code Rubric Verification in CI/CD',
    subtitle: 'From Theory to Verifiable Code Artifacts',
    summary: 'Instead of multiple-choice quizzes, have engineers submit a mini repository or pull request satisfying the node\'s `evaluationRubric`. Automate automated linting, test suite execution, and coverage verification in GitHub Actions.',
    whyItMatters: 'Proves true hands-on competence rather than passive reading.',
    codeLanguage: 'yaml',
    codeSnippet: `# .github/workflows/verify-roadmap-rubric.yml
name: Verify Roadmap Rubric Challenge
on:
  pull_request:
    paths:
      - 'challenges/**'

jobs:
  rubric-verification:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python & Testcontainers
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Challenge Dependencies
        run: |
          pip install poetry
          poetry install

      - name: Run Rubric Test Suite
        run: |
          # Verify test coverage > 85% and all unit/integration tests pass
          poetry run pytest --cov=src --cov-fail-under=85 tests/

      - name: Check Strict Linting & Type Annotations
        run: |
          poetry run ruff check src/
          poetry run mypy src/ --strict

      - name: Post Milestone Completion Badge
        if: success()
        run: |
          echo "🎉 Rubric criteria verified! Updating employee roadmap skill graph..."`,
    tips: [
      'Provide clean starter template repositories with intentionally failing tests for candidates or junior hires.',
      'Have team leads do a 10-minute code review focused on architectural style.'
    ]
  },
  {
    stepNumber: '06',
    title: 'Establish a Continuous Feedback Loop & Tech Radar Sync',
    subtitle: 'Keep Roadmaps Living, Not Stale',
    summary: 'Technologies change rapidly. Schedule a bi-annual Engineering Guild review where staff engineers deprecate obsolete nodes (e.g. jQuery -> React Server Components) and upgrade company standard stacks.',
    whyItMatters: 'Prevents roadmaps from becoming outdated shelf-ware.',
    codeLanguage: 'markdown',
    codeSnippet: `### Bi-Annual Roadmap Guild Review Checklist

1. **Deprecation Check:**
   - Are any listed libraries deprecated or past LTS? (e.g. Python 3.8 -> 3.12+)
   - Has our company adopted a new standard framework? (e.g. Flask -> FastAPI, Webpack -> Vite)

2. **Hours Calibration:**
   - Review actual engineer time logs vs. estimated node hours.
   - Adjust \`estimatedHours\` if engineers consistently take more or less time.

3. **Rubric Modernization:**
   - Upgrade evaluation challenge repos with latest dependencies.
   - Ensure all internal Confluence links resolve correctly.`,
    tips: [
      'Assign an engineering "Roadmap Champion" for each domain (e.g. Principal DevOps for the DevOps track).',
      'Use GitHub Discussions to gather feedback from developers actively taking the tracks.'
    ]
  }
];
