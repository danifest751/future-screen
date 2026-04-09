# Agent Workflow Rules

This repository uses `mempalace` as external working memory for coding sessions.

## Required Memory Routine

1. At the start of each task:
   - Run `npm run memory:session` (preferred)
   - Alternative: run `npm run memory:wakeup`
   - If first run or empty palace: run `npm run memory:init` then `npm run memory:save`
   - One-time setup: if wake-up reports `No identity configured`, create `~/.mempalace/identity.txt` before continuing. The session helper now bootstraps a default template automatically if it is missing.

2. Before searching broadly in code:
   - Run targeted recall first: `npm run memory:search -- "<query>"`

3. After any meaningful code/content changes:
   - Run `npm run memory:session:save` (preferred)
   - Alternative: run `npm run memory:save`

4. Before final handoff (optional but recommended):
   - Run `npm run memory:status`

## Scope

Default indexing must use focused mode (`npm run memory:save`) to avoid noise.
Use `npm run memory:save:full` only when explicitly needed.
Use `npm run memory:session:sync` for a full wake + reindex cycle in one command.

## Definition Of Done (Per Task)

Before push or handoff, run:

1. `npm run lint`
2. `npm run build`
3. `npm run work:end`
4. Quick regression self-check:
   - no new hardcoded user-facing strings in active UI
   - no i18n scope regressions (public `en`, admin `ru`)

Preferred one-command flow: `npm run check:prepush`

## Git Workflow Rules

1. Start task from up-to-date branch (`git pull --rebase` when appropriate).
2. Keep commits small and scoped.
3. Follow commit format from `CONTRIBUTING.md` (English, imperative, short subject).
4. Before push, ensure no accidental files are staged (artifacts, secrets, temp files).

## i18n Guardrails

1. Any new user-facing text must go through locale dictionaries/content, not inline JSX literals.
2. Fallback behavior should be explicit and visible where relevant (use fallback indicators in admin content tooling).
3. Keep locale state isolated by scope:
   - public website language
   - admin panel language

## Supabase Guardrails

1. Schema changes only via migrations.
2. If data shape changes, update dependent typings/mappers in the same task.
3. When a content model affects locales, ensure both RU and EN fields/flows are covered.

## Notifications Guardrails

For changes touching forms/leads/messages, perform smoke checks:

1. Telegram notification text (RU-friendly wording)
2. Email template text (RU-friendly wording)
3. Source labels and service messages are not accidentally reverted to English

## Notes

- Palace path is project-local: `.mempalace/palace`
- Memory config: `mempalace.yaml`
- User-level identity file: `~/.mempalace/identity.txt`
- Generated memory artifacts are git-ignored
- One-click helpers:
  - start: `npm run work:start` (or `scripts/start-work.ps1`)
  - finish: `npm run work:end` (or `scripts/end-work.ps1`)
