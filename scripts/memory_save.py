#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
from pathlib import Path

from mempalace.miner import READABLE_EXTENSIONS, get_collection, load_config, process_file

ALLOWED_DIRS = [
    "src",
    "server",
    "api",
    "docs",
    "supabase",
    "sql",
    "scripts",
    "types",
    "tests",
]

SKIP_DIRS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    "dist",
    "build",
    ".next",
    "coverage",
    ".mempalace",
}

SKIP_FILES = {
    "mempalace.yaml",
    "mempalace.yml",
    "mempal.yaml",
    "mempal.yml",
    ".gitignore",
    "package-lock.json",
}


def iter_allowed_files(project_root: Path) -> list[Path]:
    files: list[Path] = []
    for dirname in ALLOWED_DIRS:
        base = project_root / dirname
        if not base.exists() or not base.is_dir():
            continue
        for root, dirs, filenames in os.walk(base):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for filename in filenames:
                if filename in SKIP_FILES:
                    continue
                path = Path(root) / filename
                if path.suffix.lower() in READABLE_EXTENSIONS:
                    files.append(path)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="Focused MemPalace indexing for this repository")
    parser.add_argument(
        "--project",
        default=".",
        help="Project root (default: current directory)",
    )
    parser.add_argument(
        "--palace",
        default="./.mempalace/palace",
        help="Palace path (default: ./.mempalace/palace)",
    )
    parser.add_argument(
        "--agent",
        default="codex",
        help="Agent name to store in metadata (default: codex)",
    )
    args = parser.parse_args()

    project_root = Path(args.project).resolve()
    palace_path = str(Path(args.palace).resolve())

    config = load_config(str(project_root))
    wing = config.get("wing", project_root.name.lower().replace("-", "_").replace(" ", "_"))
    rooms = config.get("rooms", [{"name": "general", "description": "Fallback"}])

    files = iter_allowed_files(project_root)
    collection = get_collection(palace_path)

    total = len(files)
    added_total = 0
    processed = 0

    print(f"[memory] wing={wing}")
    print(f"[memory] files selected={total}")
    print(f"[memory] palace={palace_path}")

    for filepath in files:
        processed += 1
        added = process_file(
            filepath=filepath,
            project_path=project_root,
            collection=collection,
            wing=wing,
            rooms=rooms,
            agent=args.agent,
            dry_run=False,
        )
        added_total += added
        if processed % 150 == 0:
            print(f"[memory] processed={processed}/{total} drawers_added={added_total}")

    print(f"[memory] done processed={processed} drawers_added={added_total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
