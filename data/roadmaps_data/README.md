# Full-scale roadmap.sh extraction (all 92 roadmaps)

## What's in this folder

- **`extract_all_roadmaps.py`** — the script. Re-runnable against any fresh
  clone of `kamranahmedse/developer-roadmap` if the source content updates.
  ```bash
  git clone --depth 1 https://github.com/kamranahmedse/developer-roadmap.git repo
  python3 extract_all_roadmaps.py --repo ./repo --out ./output
  ```
- **`roadmaps/`** — every discovered roadmap copied with the same directory and
  file structure as the source repository, including each roadmap's `content/`
  Markdown files.
- **`learning_resources_full.json`** — the deduped pool. **20,101 unique
  resources** (deduped by URL — the same article linked from 3 different
  roadmaps becomes 1 resource entry with 3 entries in `roadmap_sources` /
  `skill_ids`, not 3 duplicate rows). Each entry: `resource_id`, `title`,
  `type` (`course` / `project` / `article` — mapped from roadmap.sh's own
  `@official@` / `@video@` / `@opensource@` etc. tags), `source_url`,
  `roadmap_sources[]`, `skill_ids[]` (format `<roadmap>:<topic-slug>`).
- **`roadmap_summary.json`** — topic + link counts per roadmap, useful for
  picking which roadmap to hand-curate a DAG for next.

## What this does NOT include (same limitation as the 8-roadmap version)

No dependency edges / DAG for the other 84 roadmaps. This repo doesn't
publish the real prerequisite graph (confirmed by inspection — see
`../roadmap-source-notes.md`), so there's nothing honest for a script to
extract here. Your `skill_dependencies.json` and `goal_templates.json`
stay scoped to the 8 hand-curated roadmaps
(`python`, `frontend`, `backend`, `devops`, `cyber-security`, `full-stack`,
`data-analyst`, `ai-engineer`).

## Using this pool without a DAG

`learning_resources_full.json` is still directly useful even for roadmaps
that don't have a curated DAG yet: RAG retrieval (F7) only needs resources
tagged with skill IDs and embedded — it doesn't need prerequisite edges to
find semantically relevant candidates. The DAG is only required for
bottleneck detection (F6) and the topological path sort (F10), which are
scoped to your 8 active goal templates. If you curate a DAG for a 9th goal
later, its resources are already sitting in this file, ready to filter in.

## Before you seed all 20,101 into Supabase

- Batch the inserts in `prisma/seed/seed-resources.ts` — don't do one
  giant insert.
- Embeddings (`lib/ai/embeddings.ts`) run once per resource at seed time.
  20,101 resources = 20,101 embedding calls, one-time, free-tier
  (`text-embedding-004`), but budget the run time for it — this is not a
  30-second seed anymore.
- Consider seeding only the resources whose `skill_ids` fall under your
  8 active goal templates first (fast, small, unblocks the demo), then
  backfilling the rest of the pool as a background/optional step.
