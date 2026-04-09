#!/usr/bin/env python3
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PALACE_PATH = PROJECT_ROOT / ".mempalace" / "palace"
WING = "future_screen"
IDENTITY_PATH = Path.home() / ".mempalace" / "identity.txt"
DEFAULT_IDENTITY = """Name: femida4me
Role: developer
Primary language: Russian
Secondary language: English
Timezone: Asia/Yekaterinburg
"""


def run(cmd: list[str], input_text: str | None = None) -> None:
    print(f"[session] $ {' '.join(cmd)}")
    subprocess.run(
        cmd,
        cwd=PROJECT_ROOT,
        check=True,
        text=True,
        input=input_text,
    )


def py_cmd() -> list[str]:
    return [sys.executable, "-X", "utf8"]


def mp_cmd() -> list[str]:
    return py_cmd() + ["-m", "mempalace", "--palace", "./.mempalace/palace"]


def ensure_identity() -> None:
    if IDENTITY_PATH.exists():
        return

    IDENTITY_PATH.parent.mkdir(parents=True, exist_ok=True)
    IDENTITY_PATH.write_text(DEFAULT_IDENTITY, encoding="utf-8")
    print(f"[session] created default identity template: {IDENTITY_PATH}")


def memory_init() -> None:
    run(mp_cmd() + ["init", ".", "--yes"], input_text="\n")


def memory_wakeup() -> None:
    run(mp_cmd() + ["wake-up", "--wing", WING])


def memory_status() -> None:
    run(mp_cmd() + ["status"])


def memory_save() -> None:
    run(py_cmd() + ["scripts/memory_save.py", "--project", ".", "--palace", "./.mempalace/palace", "--agent", "codex"])


def palace_ready() -> bool:
    return (PALACE_PATH / "chroma.sqlite3").exists()


def main() -> int:
    parser = argparse.ArgumentParser(description="MemPalace session helper")
    parser.add_argument(
        "--mode",
        choices=["start", "save", "sync"],
        default="start",
        help="start: wake context, save: re-index, sync: wake then re-index",
    )
    args = parser.parse_args()
    ensure_identity()

    if args.mode == "start":
        if not palace_ready():
            print("[session] palace not found, running init + save first")
            memory_init()
            memory_save()
        memory_wakeup()
        return 0

    if args.mode == "save":
        memory_save()
        memory_status()
        return 0

    if not palace_ready():
        print("[session] palace not found, running init first")
        memory_init()
    memory_wakeup()
    memory_save()
    memory_status()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
