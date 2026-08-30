#!/usr/bin/env python3
"""
Extract topics + curated resource links from every roadmap in a local clone
of https://github.com/kamranahmedse/developer-roadmap, and build:

  data/roadmaps/<roadmap-slug>.json   — one file per roadmap, topics only
                                         (title, description, raw resource
                                         links as found on that topic)
  data/learning_resources_full.json   — ONE flat, deduped pool of every
                                         resource link across all roadmaps,
                                         tagged with which skill_id(s)
                                         (<roadmap>:<topic-slug>) reference it
  data/roadmap_summary.json           — topic/link counts per roadmap

Resources are deduped globally (not per-roadmap) because the same URL is
often linked from multiple roadmaps — deduping per-file would either
duplicate it N times or force cross-file lookups. Topics stay split per
roadmap because nothing else needs them merged, and it keeps seeding /
diffs / team ownership scoped to one roadmap at a time.

This does NOT produce skill_dependencies.json or goal_templates.json —
those need real prerequisite edges, which this repo doesn't publish (see
roadmap-source-notes.md). Keep using the hand-curated DAG for the 8
roadmaps already built; this pool is available for future goals once
someone curates dependency edges for them.

Usage:
    git clone --depth 1 https://github.com/kamranahmedse/developer-roadmap.git repo
    python3 extract_all_roadmaps_v2.py --repo ./repo --out ./data
"""

import re
import os
import json
import argparse

LINK_RE = re.compile(r'-\s*\[@(\w[\w-]*)@([^\]]+)\]\(([^)]+)\)')

TYPE_MAP = {
    "course": "course",
    "opensource": "project",
    "official": "article",
    "article": "article",
    "video": "article",
    "blog": "article",
    "feed": "article",
    "podcast": "article",
    "paid-course": "course",
    "paid": "course",
}


def parse_topic_file(path, slug, node_id, roadmap):
    text = open(path, encoding="utf-8", errors="replace").read()
    lines = text.strip().splitlines()

    title = slug.replace("-", " ").title()
    for l in lines:
        if l.startswith("# "):
            title = l[2:].strip()
            break

    desc_lines = []
    for l in lines[1:]:
        stripped = l.strip()
        if stripped.startswith("Visit the following") or stripped.startswith("- ["):
            break
        if stripped:
            desc_lines.append(stripped)
    description = " ".join(desc_lines).strip()[:400]

    resources = []
    for m in LINK_RE.finditer(text):
        rtype, rtitle, url = m.groups()
        resources.append({
            "raw_type": rtype,
            "title": rtitle.strip(),
            "url": url.strip(),
        })

    return {
        "skill_id": f"{roadmap}:{slug}",
        "topic_slug": slug,
        "node_id": node_id,
        "title": title,
        "description": description,
        "resources": resources,  # kept here too, for convenience reading one roadmap file standalone
    }


def discover_roadmaps(repo_dir):
    roadmaps_dir = os.path.join(repo_dir, "roadmaps")
    slugs = []
    for name in sorted(os.listdir(roadmaps_dir)):
        content_dir = os.path.join(roadmaps_dir, name, "content")
        if os.path.isdir(content_dir):
            slugs.append(name)
    return slugs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default="./repo", help="path to cloned developer-roadmap repo")
    ap.add_argument("--out", default="./data", help="output directory (your project's data/ folder)")
    args = ap.parse_args()

    roadmaps_out_dir = os.path.join(args.out, "roadmaps")
    os.makedirs(roadmaps_out_dir, exist_ok=True)

    roadmaps = discover_roadmaps(args.repo)
    print(f"Discovered {len(roadmaps)} roadmaps")

    resources_by_url = {}  # global dedup pool, built while writing per-roadmap files
    total_topics = 0
    summary = []

    for roadmap in roadmaps:
        content_dir = os.path.join(args.repo, "roadmaps", roadmap, "content")
        topics = []
        link_count = 0

        for fname in sorted(os.listdir(content_dir)):
            if not fname.endswith(".md"):
                continue
            base = fname[:-3]
            if "@" in base:
                slug, node_id = base.rsplit("@", 1)
            else:
                slug, node_id = base, ""

            topic = parse_topic_file(os.path.join(content_dir, fname), slug, node_id, roadmap)
            topics.append(topic)
            link_count += len(topic["resources"])

            for r in topic["resources"]:
                url = r["url"]
                if url not in resources_by_url:
                    resources_by_url[url] = {
                        "title": r["title"],
                        "type": TYPE_MAP.get(r["raw_type"], "article"),
                        "source_url": url,
                        "referenced_by": [],
                    }
                existing = resources_by_url[url]
                if topic["skill_id"] not in {ref["skill_id"] for ref in existing["referenced_by"]}:
                    existing["referenced_by"].append({
                        "skill_id": topic["skill_id"],
                        "roadmap_source": roadmap,
                    })

        # write per-roadmap file
        with open(os.path.join(roadmaps_out_dir, f"{roadmap}.json"), "w", encoding="utf-8") as f:
            json.dump({
                "roadmap": roadmap,
                "topic_count": len(topics),
                "topics": topics,
            }, f, indent=2)

        total_topics += len(topics)
        summary.append({"roadmap": roadmap, "topic_count": len(topics), "resource_link_count": link_count})
        print(f"  {roadmap}: {len(topics)} topics -> data/roadmaps/{roadmap}.json")

    # flat, deduped, cross-roadmap resource pool
    learning_resources = []
    for i, (url, data) in enumerate(sorted(resources_by_url.items()), start=1):
        learning_resources.append({
            "resource_id": f"res_full_{i:05d}",
            "title": data["title"],
            "type": data["type"],
            "source_url": data["source_url"],
            "roadmap_sources": sorted({ref["roadmap_source"] for ref in data["referenced_by"]}),
            "skill_ids": [ref["skill_id"] for ref in data["referenced_by"]],
        })

    with open(os.path.join(args.out, "learning_resources_full.json"), "w", encoding="utf-8") as f:
        json.dump(learning_resources, f, indent=2)

    with open(os.path.join(args.out, "roadmap_summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\nWrote {len(roadmaps)} per-roadmap files to {roadmaps_out_dir}/")
    print(f"Wrote learning_resources_full.json — {len(learning_resources)} deduped resources")
    print(f"Wrote roadmap_summary.json")
    print(f"Total topics: {total_topics}")


if __name__ == "__main__":
    main()
