# AI Rules

## Purpose
This file defines how coding agents should work in this repository.

## Core Principles
- **Always read `docs/PROJECT_CONTEXT.md` first** to understand the project structure and stack.
- Before relying on `mempalace`, ensure the one-time user identity file exists at `~/.mempalace/identity.txt`; if it is missing, create it or run the project session helper that bootstraps the default template.
- Follow existing project patterns before introducing new ones.
- Prefer minimal, local changes over broad refactors.
- Keep solutions simple and production-appropriate.
- Do not change unrelated code.
- Do not optimize prematurely.
- Do not add abstractions unless there is clear repeated need.

## Scope Discipline
- Only modify files directly relevant to the task.
- Do not rename files, folders, functions, or exports unless required.
- Do not change public APIs unless explicitly asked.
- Do not rewrite working code just for style consistency.

## Architecture Rules
- Keep business logic out of UI components.
- Keep data access and external integrations out of presentation layers.
- Reuse existing services, utilities, hooks, and helpers before creating new ones.
- Follow the current folder and module structure.
- Treat existing schemas, contracts, and types as the source of truth.

## TypeScript Rules
- Use TypeScript strictly.
- Do not use `any` unless explicitly unavoidable.
- Prefer explicit types for public functions and exported APIs.
- Reuse existing types before introducing new ones.
- Do not weaken type safety to make errors disappear.

## Dependencies
- Do not introduce new dependencies unless absolutely necessary.
- Prefer built-in platform APIs and existing project libraries.
- If a new dependency is required, explain why in the task output.

## Styling and UI
- Reuse existing UI components, tokens, and patterns.
- Do not introduce a new visual pattern if an existing one already solves the problem.
- Keep markup and styling consistent with nearby files.

## API and Data Contracts
- Respect existing API contracts, validation rules, and response shapes.
- Do not invent fields, endpoints, or DB columns.
- If the contract is unclear, inspect existing implementations first.

## Tests
- Add or update tests when the touched area already has test coverage or when logic is critical.
- Prefer focused tests over broad rewrites of test suites.
- Do not delete tests unless they are clearly obsolete and replaced.

## Safety Rules
- Never commit or expose secrets.
- Never hardcode tokens, passwords, API keys, or private URLs.
- Use `.env.example` as the reference for environment variables.

## Change Strategy
- Prefer the smallest diff that correctly solves the problem.
- Preserve backward compatibility where reasonable.
- Avoid mixing refactor + feature + formatting into one change.

## Expected Output for Each Task
When completing a task, provide:
1. What changed
2. Which files were touched
3. Any assumptions or risks
4. Any follow-up work worth doing
5. Whether tests/build/lint should be run

## Pre-Commit Verification
Before committing changes:
- Run the build command (`npm run build` or equivalent) to ensure no build errors
- Verify no missing imports or unresolved files
- Check that TypeScript compiles without errors (`tsc --noEmit` if applicable)

## Definition of Done
A task is complete when:
- the requested behavior is implemented
- the change follows existing repository patterns
- types remain sound
- affected code is readable and maintainable
- no unrelated code was changed
- build passes successfully
