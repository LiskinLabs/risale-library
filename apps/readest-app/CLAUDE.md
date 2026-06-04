# Risale AI Studio — Claude Code Instructions

See [AGENTS.md](./AGENTS.md) for the full project overview, common commands, architecture, and conventions.

## Quick Reference
- **Stack:** Next.js 16 + Tauri v2, TypeScript strict mode, Zustand, Tailwind CSS, shadcn/ui
- **Package manager:** pnpm 11.x
- **Monorepo root:** `../../` (pnpm workspace)
- **Testing:** `pnpm test` (vitest), `pnpm test:browser` (playwright), `pnpm test:e2e:web` (playwright E2E)
- **Linting:** `pnpm lint` (biome + tsgo)
- **Rust:** `pnpm fmt:check`, `pnpm clippy:check`

## Key Architecture Notes
- See `.claude/memory/MEMORY.md` for detailed bug patterns and architecture decisions
- Rules in `.claude/rules/`: test-first.md, typescript.md, verification.md
- Skills in `.claude/skills/`: gstack, i18n, i18n-koplugin
