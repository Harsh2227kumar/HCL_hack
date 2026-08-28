export interface VisualizationMethod {
  id: string;
  title: string;
  paradigm: string;
  bestFor: string;
  description: string;
  algorithmicGeneration: {
    inputStructure: string;
    transformationSteps: string[];
    layoutAlgorithm: string;
    outputFormat: string;
  };
  teamUtility: {
    engineers: string;
    managers: string;
    recruiters: string;
    crossFunctional: string;
  };
  sampleJsonSnippet: string;
}

export const VISUALIZATION_METHODS: VisualizationMethod[] = [
  {
    id: 'flowchart-dag',
    title: 'Topological Flowchart & Directed Acyclic Graph (DAG)',
    paradigm: 'Sequential Dependency Graph',
    bestFor: 'Prerequisite sequencing, critical path analysis, and identifying learning bottlenecks.',
    description: 'A layered topological graph where nodes represent discrete competencies and directed edges represent strict prerequisites. Tiers flow from Fundamental to Expert, guaranteeing no backwards dependencies.',
    algorithmicGeneration: {
      inputStructure: 'Array of `RoadmapNode` with `id`, `prerequisites: string[]`, and `level`.',
      transformationSteps: [
        '1. Construct Adjacency List: Map each node ID to its prerequisite parent IDs.',
        '2. Compute In-Degrees: Count incoming prerequisite requirements for each node.',
        '3. Topological Sorting (Kahn\'s Algorithm): Assign nodes into horizontal/vertical topological tiers (Tier 0: Root nodes with in-degree 0; Tier N: Nodes whose dependencies are all satisfied in Tier < N).',
        '4. Coordinate Assignment: Compute (x, y) coordinates with node collision avoidance and Bezier curve routing for edges.'
      ],
      layoutAlgorithm: 'Sugiyama Hierarchical Layering / Kahn\'s Topological Tiers with Spline Edge Routing.',
      outputFormat: 'SVG Canvas with interactive node hover, edge highlight, and prerequisite breadcrumb tracing.'
    },
    teamUtility: {
      engineers: 'Provides unambiguous step-by-step guidance. Engineers know exactly which prerequisite must be mastered before tackling complex frameworks.',
      managers: 'Quickly identifies skill bottlenecks across team members and ensures training investments follow logical progression.',
      recruiters: 'Assesses candidate capability level objectively against prerequisite milestones rather than vague resume bullet points.',
      crossFunctional: 'Clarifies technical readiness across disciplines before kicking off cross-team projects.'
    },
    sampleJsonSnippet: `{
  "id": "py-database-orm",
  "label": "Databases & ORM",
  "level": "Intermediate",
  "prerequisites": ["py-frameworks-web"],
  "estimatedHours": 25
}`
  },
  {
    id: 'mind-map-radial',
    title: 'Mind Map & Radial Competency Tree',
    paradigm: 'Exploratory Hierarchical Tree',
    bestFor: 'Holistic domain exploration, competency clustering, and core vs. auxiliary skill discovery.',
    description: 'A radial or expansive tree branching outwards from a central discipline hub into domain branches (e.g., Syntax, Frameworks, Testing, Security). Ideal for high-level competency overviews and non-linear exploration.',
    algorithmicGeneration: {
      inputStructure: 'Hierarchical categorization: `category -> sub-category -> node`.',
      transformationSteps: [
        '1. Cluster by Category: Group nodes by their `category` field (e.g., "Web Services", "Data Persistence", "Security").',
        '2. Compute Radial Angles: Divide 360 degrees equally among category branches: `angle = (branchIndex / totalBranches) * 2 * PI`.',
        '3. Project Polar Coordinates: Calculate `x = centerX + radius * cos(angle)` and `y = centerY + radius * sin(angle)`.',
        '4. Render Branch Connectors: Draw smooth cubic Bezier branches expanding from the central role root node.'
      ],
      layoutAlgorithm: 'Reingold-Tilford Tree Algorithm with Polar Coordinate Projection (D3-Hierarchy Cluster).',
      outputFormat: 'Interactive Zoomable SVG / Canvas with collapsible category clusters and branch expansion.'
    },
    teamUtility: {
      engineers: 'Enables panoramic domain discovery without feeling overwhelmed by sequential ordering constraints.',
      managers: 'Provides an executive 10,000-foot view of team domain coverage and competency balance.',
      recruiters: 'Maps interview scorecard categories to visual branches for standardized technical screening.',
      crossFunctional: 'Helps product managers and designers understand what technical domains are involved in building full-stack products.'
    },
    sampleJsonSnippet: `{
  "category": "Web Services",
  "nodes": [
    { "id": "py-frameworks-web", "label": "FastAPI / Django" },
    { "id": "py-caching-queues", "label": "Celery & Redis" }
  ]
}`
  },
  {
    id: 'timeline-milestones',
    title: 'Interactive Timeline & Sprint Milestone Schedule',
    paradigm: 'Temporal Progression (Gantt / Burndown)',
    bestFor: 'Quarterly OKR planning, sprint-by-sprint learning pacing, and time-to-mastery forecasting.',
    description: 'Transforms estimated learning hours into a calendar-projected timeline based on dedicated weekly learning hours (e.g. 5 hrs/week vs 20 hrs/week). Features sprint milestones, quarterly targets, and completion burndown.',
    algorithmicGeneration: {
      inputStructure: 'Array of nodes with `estimatedHours`, `prerequisites`, and engineer\'s `hoursPerWeek` commitment.',
      transformationSteps: [
        '1. Topologically Sort Nodes: Order nodes by dependency constraint.',
        '2. Accumulate Effort (Critical Path Method): Calculate cumulative start and end weeks: `StartWeek = max(EndWeeks of all prerequisites); EndWeek = StartWeek + (node.estimatedHours / hoursPerWeek)`.',
        '3. Group into Sprints/Quarters: Segment weeks into 2-week agile sprints and 12-week quarterly OKR cycles.',
        '4. Project Calendar Milestones: Map relative week offsets to concrete calendar dates starting from user start date.'
      ],
      layoutAlgorithm: 'Critical Path Method (CPM) Scheduling with Resource Constrained Forward-Pass Allocation.',
      outputFormat: 'Gantt Timeline with draggable sprint boundaries, milestone checkpoint flags, and progress sliders.'
    },
    teamUtility: {
      engineers: 'Sets realistic, non-burnout personal pacing with clear week-by-week goals and checkpoint deliverables.',
      managers: 'Directly incorporates skill acquisition into quarterly engineering OKRs and professional development budgets.',
      recruiters: 'Calculates onboarding ramp-up timelines for new hires at different seniority levels.',
      crossFunctional: 'Aligns skill acquisition schedules with upcoming product launch release milestones.'
    },
    sampleJsonSnippet: `{
  "id": "py-async",
  "label": "Concurrency & AsyncIO",
  "estimatedHours": 30,
  "weeklyPaceHours": 10,
  "projectedDurationWeeks": 3
}`
  },
  {
    id: 'cross-discipline-matrix',
    title: 'Cross-Discipline Knowledge Matrix & Network Chord',
    paradigm: 'Multi-Role Interconnection Graph',
    bestFor: 'Full-stack squads, shared API contracts, and cross-functional team interfaces.',
    description: 'A circular chord or inter-domain bipartite network highlighting how skills in one discipline (e.g. Python backend packaging) interface directly with skills in another discipline (e.g. DevOps Docker containerization).',
    algorithmicGeneration: {
      inputStructure: 'Multi-discipline roadmaps + `CrossDisciplineEdge[]` contract specifications.',
      transformationSteps: [
        '1. Extract Multi-Role Nodes: Aggregate nodes across all active engineering tracks.',
        '2. Filter Cross-Domain Edges: Identify all edges where `sourceDiscipline !== targetDiscipline`.',
        '3. Construct Bipartite / Chord Matrix: Calculate connection frequency and interface strength between disciplines.',
        '4. Render Interactive Chord Arcs: Draw ribbon connectors between discipline perimeters with hover isolation.'
      ],
      layoutAlgorithm: 'D3 Chord Diagram / Bipartite Force-Directed Layout with Circular Partitioning.',
      outputFormat: 'Interactive Chord Diagram with interface contract drawer and code snippet previews.'
    },
    teamUtility: {
      engineers: 'Helps backend developers understand what DevOps and Security teams require from their code before deploying.',
      managers: 'Breaks down organizational silos by visualizing inter-team technical dependencies.',
      recruiters: 'Identifies T-shaped generalists capable of bridging multiple engineering domains.',
      crossFunctional: 'Establishes clear architectural boundaries and API contracts across squads.'
    },
    sampleJsonSnippet: `{
  "source": "py-packaging-dist",
  "target": "devops-docker-containers",
  "relationship": "CONTAINERIZES",
  "contract": "Multi-stage Dockerfile using Poetry export"
}`
  },
  {
    id: 'skill-radar-gap',
    title: 'Skill Radar & Competency Gap Diagnostic',
    paradigm: 'Multidimensional Capability Polygon',
    bestFor: '1-on-1 performance reviews, level benchmarking (L3 vs L5), and hiring calibration.',
    description: 'A polar radar chart plotting an engineer\'s current mastery across 6-8 core technical axes (e.g. Architecture, Security, Concurrency, Testing, Tooling, Operations) compared against company leveling baselines.',
    algorithmicGeneration: {
      inputStructure: 'Array of categories with node completion weights and target leveling benchmarks.',
      transformationSteps: [
        '1. Define Domain Axes: Extract unique categories across the roadmap.',
        '2. Aggregate Mastery Score: For each axis, compute: `Score = (Sum of hours of mastered nodes) / (Total hours in axis) * 100`.',
        '3. Map to Polar Coordinates: For each axis `i`: `x = center + (score / 100) * radius * cos(2*PI*i / numAxes)`.',
        '4. Render Polygon Overlay: Draw filled polygon for current engineer mastery against target level polygon benchmark.'
      ],
      layoutAlgorithm: 'Polar Coordinate Web Polygon with Normalized Radial Axes (D3-Radial Web).',
      outputFormat: 'Interactive Radar Chart with level selector (Junior, Mid, Senior, Staff) and gap highlight.'
    },
    teamUtility: {
      engineers: 'Visualizes clear personal growth opportunities and removes ambiguity from promotion expectations.',
      managers: 'Conducts objective, evidence-based performance reviews grounded in tangible milestone deliverables.',
      recruiters: 'Calibrates candidate skill balance during technical debriefs.',
      crossFunctional: 'Assesses overall squad resilience and ensures no single point of failure in critical competency areas.'
    },
    sampleJsonSnippet: `{
  "axis": "Quality Engineering",
  "currentScore": 85,
  "targetBenchmarkSenior": 90,
  "gap": 5
}`
  }
];
