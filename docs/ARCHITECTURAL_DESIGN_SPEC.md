# Developer Roadmap Engine: Architectural Design Specification

This document provides a comprehensive breakdown of the design system, visual paradigms, component anatomy, and page-by-page layout strategies used across the Developer Roadmap Engine application.

---

## 1. Global Aesthetic Paradigm: "Technical Blueprint"

The application utilizes a **brutalist-lite, high-information-density aesthetic** modeled after mid-century engineering manuals, terminal interfaces, and architectural blueprints. 
It relies on strict geometric borders, high-contrast typography, and purposeful negative space, rejecting modern UI trends like glassmorphism, soft drop-shadows, and heavy border radii.

### 1.1 Color Matrix
*   **#FDFCFB (Canvas)**: Primary application background. Off-white to reduce eye strain.
*   **#F8F7F4 (Surface)**: Alternate background for secondary panels, drawers, and form backgrounds.
*   **#EAE8E1 (Subtle Highlight)**: Disabled states, inactive tabs, and subtle border accents.
*   **#1A1A1A (Ink)**: Primary text, hard 2px borders, solid shadow offsets, and dark mode terminal backgrounds.
*   **Semantic Accents**:
    *   **Emerald (#059669)**: Mastery, success, live generation, active tracks.
    *   **Blue (#2563EB)**: In-progress, infrastructure, architectural APIs.
    *   **Amber (#D97706)**: Warnings, critical paths, recruitment flags.
    *   **Purple (#7C3AED)**: Cross-functional integrations, LLM/AI outputs.
    *   **Rose (#E11D48)**: Anti-patterns, vulnerability alerts, errors.

### 1.2 Typographic Hierarchy
*   **Primary Display (`font-serif italic`)**: Used exclusively for page titles, major section headers, and thematic framing. Provides an editorial, academic feel.
*   **Editorial Body (`font-serif text-[#333]`)**: Used for long-form explanatory text and strategic playbooks. Encourages reading comprehension for dense technical material.
*   **UI Controls & Data (`font-mono uppercase`)**: Dictates interface controls, metadata, tags, tabs, and machine-readable schema paths. The tension between the serif and the tracked-out monospace creates the core visual hierarchy.
*   **Dense Data (`font-sans`)**: Limited usage for tight node labels or standard paragraphs where serif would be too noisy.

### 1.3 Component Anatomy
*   **Panels & Cards**: 2px hard `#1A1A1A` borders with a solid 4px hard offset shadow (`shadow-[4px_4px_0px_#1A1A1A]`). 
*   **Interactive Triggers**: Buttons use inset shadows or background inversions (`bg-[#1A1A1A] text-white`) instead of floating elevations.
*   **Tags & Badges**: Small (`text-[10px]`), heavily tracked, monospace, often featuring an accent background with contrasting dark text.

---

## 2. Global Layout Structure

### 2.1 The Masthead (Header)
*   **Top Metadata Bar**: A thin, border-bottom strip containing environmental metadata ("SPECIFICATION", "INDEX: GITHUB/KAMRANAHMEDSE", active track indicator with a pulsing emerald dot).
*   **Title Block**: Large serif italic masthead title ("Roadmap Engine & DAG Architecture") paired with a monospace subtitle.
*   **KPI Badge**: Right-aligned structural box displaying the active paradigm ("Hybrid GraphRAG + OKF").
*   **Navigation Tabs**: Horizontally scrollable border-bottom tabs. Active tabs get a bold `text-[#1A1A1A]`, a background tint (`bg-[#F8F7F4]`), and an inner shadow `shadow-[inset_0_-2px_0_#1A1A1A]`.

### 2.2 The Footer
*   Minimalist, technical tracking strip at the bottom of the viewport. Features monospace text, dot separators (`•`), and versioning data ("DAG ENGINE V2.4").

### 2.3 The Node Detail Drawer
*   A right-side sliding overlay (`fixed inset-y-0 right-0 w-[480px]`).
*   Features a dark header (`bg-[#1A1A1A] text-white`) with terminal-like status toggles.
*   Inner body uses editorial serif for descriptions and monospace blocks for arrays (like prerequisites or topics).

---

## 3. Page-by-Page Detailed Breakdown

### Tab 01: DAG Engine (`DAGVisualizer.tsx`)
*   **Layout**: Full-bleed split view. Left side contains the graph canvas; right side (conditionally) shows the inspector.
*   **Graph Canvas**: 
    *   Dot-grid background pattern to simulate drafting paper.
    *   Floating top-left zoom/pan controls with strict square borders.
    *   Top-right floating legend detailing the color-coding of nodes (Mastered vs. In Progress).
*   **Nodes**: SVG-rendered rectangles with left-side color strips denoting status. Nodes use sharp corners and strict mathematical layouts based on Kahn's Topological Sort algorithm.
*   **Edges**: Smooth SVG bezier curves (`path`) mapping dependencies. Active/completed paths are highlighted in solid `#1A1A1A`, pending paths in dashed gray.

### Tab 02: Knowledge Graph (`KnowledgeGraph.tsx`)
*   **Layout**: Sub-tab navigation switching between 4 distinct visualization modes.
*   **Mode 1: 2D Graph**: Circular/radial multi-orbit SVG graph connecting disparate disciplines. Interactive nodes that update a sticky right-hand inspector panel.
*   **Mode 2: Interface Matrix**: A vertical feed of dense cards detailing API contracts between teams. Features high-contrast directional arrows (e.g., `Python -> DevOps`).
*   **Mode 3: Path Finder**: Split-form layout for selecting Origin and Target nodes. Renders a step-by-step verified topological path chain using numbered blocks.
*   **Mode 4: Contracts**: 2-column grid of code snippet cards showing exact Dockerfiles, Protobufs, or YAML configs that bind teams together. Code blocks use dark `#1A1A1A` backgrounds with specialized syntax colors.

### Tab 03: RAG Strategy & OKF (`RagVsOkfView.tsx`)
*   **Layout**: Editorial "essay" style. Maximum width constraints (`max-w-5xl`) to maintain readable line lengths.
*   **Pipeline Navigation**: A 4-step horizontal button grid for the RAG ingestion phases. Clicking a step reveals a deep-dive panel below.
*   **Deep-Dive Panels**: Combines serif prose for summaries, checklist grids for implementation details, and dark monospace boxes for Python code samples. Includes "Anti-Patterns" callout boxes with rose-tinted backgrounds.
*   **Comparative Matrix**: A dense 3-column grid comparing Pure RAG, Pure OKF, and Hybrid GraphRAG. Evaluated on 5 dimensions using distinct column tints (Amber for RAG, Blue for OKF, Emerald for Hybrid).
*   **Query Simulator**: An interactive form field. Outputs generate into a 3-column split view demonstrating how different architectures process the exact same user query.

### Tab 04: Visualization Plan (`VisualizationPlanView.tsx`)
*   **Layout**: Top section contains 5 paradigm selector tabs. Bottom section is split between a "Live Generated Render" preview and a technical algorithm spec.
*   **Interactive Render Previews**:
    *   *Timeline*: Features an interactive HTML `<input type="range">` slider to adjust "Hours/Week", which mathematically re-calculates simulated sprint Gantt bars using CSS width percentages.
    *   *Radar*: Renders horizontal CSS progress bars comparing user scores to dynamic target benchmarks (Junior, Mid, Staff).
*   **Algorithmic Breakdown**: 2-column grid showing JSON input schemas on the left and mathematical transformation steps on the right.

### Tab 05: Schema Enricher (`SchemaEnricher.tsx`)
*   **Layout**: Three-pane IDE layout (Sidebar, Editor, Preview).
*   **Sidebar**: Vertical list of nodes. Active node gets a dark inverted background.
*   **Form Editor**: Stacked inputs with stark square borders. Arrays (like key topics) are managed via dynamic list inputs.
*   **JSON Preview Pane**: Right-side panel spanning the full height. Renders the live JSON output of the currently edited node in a dark terminal window. Read-only, highlighting the exact structural payload ready for database ingestion.

### Tab 06: Team Matrix (`TeamMatrixView.tsx`)
*   **Layout**: Horizontal scrolling Kanban-style columns, one for each engineering discipline.
*   **Columns**: Each column lists the core competencies mapped to that discipline.
*   **Intersections**: Visual badges inside the cards show which other teams rely on this node (e.g., a Backend node might have a "Blocked by Cloud" warning tag).

### Tab 07: Engineering Playbook (`PlaybookView.tsx`)
*   **Layout**: A linear sequence of Standard Operating Procedures (SOPs).
*   **SOP Cards**: Heavy border cards containing step-by-step instructions.
*   **Code Blocks**: Prominent CLI command blocks (`npm run deploy`, `docker build`) with one-click "Copy Code" actions to facilitate rapid developer execution.
*   **Checklists**: Interactive checkboxes to simulate deployment verification.

### Tab 08: Design Theme (`DesignSystemView.tsx`)
*   **Layout**: A self-documenting catalog of the application's visual language.
*   **Grids**: Uses strict CSS Grid (`grid-cols-4`, `grid-cols-2`) to align typography specimens, color swatches, and component examples flawlessly.
*   **Swatches**: Renders physical color blocks alongside their HEX codes and semantic usage instructions.
