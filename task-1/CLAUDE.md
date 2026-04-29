# Leaderboard Clone

## Repository Structure
- **Repo**: `alexkast/ai-challenge-2` (public)
- **App source**: `task-1/` subdirectory
- **GitHub Pages URL**: `https://alexkast.github.io/ai-challenge-2/`
- **Vite base path**: `/ai-challenge-2/` (already configured in `vite.config.ts`)

## Purpose
Exact visual and functional replica of an internal company leaderboard. Static site deployed to GitHub Pages. All data is fake — no real names, titles, photos, or department names.

## Critical Constraints
- **GitHub Pages only** — no backend, no SSR, no runtime API calls. Pure static site.
- **Exact clone** — replicate what exists. Do NOT add features, animations, dark mode, or anything not in the original. When in doubt, leave it out.
- **No real data** — every name, title, department, avatar, and score must be generated. Nothing copied from the original.
- **Read REFERENCE.md first** — before writing any component, read `REFERENCE.md` for the original's exact layout, colors, fonts, filters, and sorting behaviour. Do not guess.
- **All app files go inside `task-1/`** — do not create app source files outside this directory.

## Stack
- React 18 + Vite + TypeScript
- Tailwind CSS (v4) for all styling
- No component library unless REFERENCE.md indicates complex UI elements that justify shadcn/ui
- Data: hardcoded TypeScript array — no fetch, no API, no JSON file import

## Project Structure
```
ai-challenge-2/
├── .github/
│   ├── workflows/
│   │   └── deploy.yml           # CI: lint → build → deploy to Pages
│   └── dependabot.yml           # Dependency updates
└── task-1/                      # ← ALL app code lives here
    ├── CLAUDE.md                # This file
    ├── REFERENCE.md             # Extracted design specification
    ├── report.md                # Approach report (write last)
    ├── index.html
    ├── vite.config.ts           # base: '/ai-challenge-2/'
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── package.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css            # Tailwind directives + custom fonts
        ├── types/
        │   └── index.ts         # All TypeScript interfaces
        ├── data/
        │   └── participants.ts  # Generated fake data array
        ├── hooks/
        │   └── useLeaderboard.ts # Filter + sort logic
        └── components/
            ├── LeaderboardTable.tsx
            ├── ParticipantRow.tsx
            ├── FilterBar.tsx
            └── SortControls.tsx
```

Simplify component list based on actual complexity. If the original is a simple table with 1 filter, fewer components is fine.

## CI/CD Pipeline

The pipeline at `.github/workflows/deploy.yml` runs automatically on push to `main`:

1. **Lint job**: `npm run lint` + `npx tsc --noEmit` — fails if lint or type errors exist
2. **Build & Deploy job**: `npm run build` → upload `task-1/dist/` → deploy to GitHub Pages

Pipeline only runs when files in `task-1/` or the workflow itself change.

**Your code must pass lint and type check before it reaches GitHub Pages.**

Lint commands (run locally before pushing):
```bash
cd task-1
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript type check
npm run build       # Vite production build
```

## Implementation Order — Follow Strictly

### Phase 1: Foundation
1. Read `REFERENCE.md` completely before writing any code
2. Create `src/types/index.ts` — the `Participant` interface matching REFERENCE.md
3. Create `src/data/participants.ts` — 25-40 fake entries following data generation rules below

### Phase 2: Layout
4. Build `App.tsx` — overall page layout matching REFERENCE.md
5. Build `ParticipantRow.tsx` — single row/card matching the original
6. Build `LeaderboardTable.tsx` — renders all rows with column headers

### Phase 3: Interactivity
7. Build `useLeaderboard.ts` — filtering and sorting as a custom hook
8. Build `FilterBar.tsx` — filter controls matching the original exactly
9. Build `SortControls.tsx` — sort UI (skip if sort is column header clicks)

### Phase 4: Polish
10. Match colors, fonts, spacing, border-radius to REFERENCE.md values
11. Add hover states if the original has them
12. Verify all filters and sorting work
13. Test empty state

### Phase 5: Verify
14. Run lint: `npm run lint` — fix all errors
15. Run type check: `npx tsc --noEmit` — fix all errors
16. Run build: `npm run build` — must succeed
17. Preview locally: `npm run preview` — verify at `http://localhost:4173/ai-challenge-2/`

### Phase 6: Report
18. Create `report.md` from template

## Data Generation Rules

- **Count**: 25-40 participants
- **Names**: realistic mix of international first + last names. No celebrity names, no sequential "User 1, User 2"
- **Departments**: use exactly the departments from REFERENCE.md. Fallback: Engineering, Marketing, Sales, Design, Product, Operations
- **Titles**: realistic titles matching department context
- **Scores**: realistic leaderboard curve — 2-3 high outliers, clustered middle, some low. Not uniform random.
- **Avatars**: DiceBear: `https://api.dicebear.com/7.x/avataaars/svg?seed={name}`
- **Other fields**: match all fields in REFERENCE.md

## Code Rules

### TypeScript
- Type every prop, state, parameter, and return value
- No `any` — use `unknown` if genuinely unknown
- All interfaces in `src/types/index.ts`
- Code must pass `npx tsc --noEmit` with zero errors

### React
- Functional components only
- `useLeaderboard` hook owns ALL filter + sort logic — components only render
- No `useEffect` for derived state — use `useMemo`
- No `console.log` in committed code
- No commented-out code
- Minimal state — only filter values and sort config. Everything else is derived.

### Styling
- Tailwind utility classes only — no inline `style={}` props
- Custom colors → `tailwind.config.ts` under `extend.colors`
- Custom fonts → Google Fonts in `index.html`, `tailwind.config.ts` under `extend.fontFamily`
- Match original's spacing precisely
- Responsive only if original is responsive

### Linting
- ESLint must pass: `npm run lint`
- Fix all warnings before committing — CI treats warnings as errors
- No eslint-disable comments unless truly necessary (document why)

## What NOT to Do

- Do NOT add features not in the original (search, dark mode, animations, pagination, tooltips, footer, export)
- Do NOT add loading states — data is hardcoded
- Do NOT use state management libraries (Redux, Zustand)
- Do NOT add tests — out of scope for this task
- Do NOT refactor working code
- Do NOT create files outside `task-1/` (except `.github/` which is at repo root)

## Before Final Push Checklist

- [ ] `npm run lint` passes with zero errors
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] `npm run preview` — app works at `http://localhost:4173/ai-challenge-2/`
- [ ] All filters from REFERENCE.md work correctly
- [ ] Sorting works
- [ ] Visual appearance matches REFERENCE.md
- [ ] No real data anywhere: `grep -ri "REAL_NAME" src/`
- [ ] No `console.log`: `grep -r "console.log" src/`
- [ ] No unused imports
- [ ] `report.md` exists and is complete
- [ ] GitHub Pages link works in incognito: `https://alexkast.github.io/ai-challenge-2/`
