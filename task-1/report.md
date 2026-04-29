# Approach Report

## Tools Used

- **Claude Code (Pro)** — primary AI coding tool for generating React components, fake data, and deployment configuration
- **GitHub Copilot** — autocomplete assistance during manual adjustments
- **Chrome DevTools** — extracting layout structure, CSS design tokens, and interaction patterns from the original leaderboard
- **Stack**: React + Vite + TypeScript + Tailwind CSS
- **Deployment**: GitHub Pages via GitHub Actions

## Approach

1. **Analysed the original leaderboard** using Chrome DevTools to capture layout structure (DOM hierarchy), design tokens (exact colours, fonts, spacing from Computed styles), filter and sort behaviour, and the data model — all without capturing any real user data.
2. **Created a reference specification** (`REFERENCE.md`) documenting every visual and interactive element of the original, using sanitised structure with all personal data replaced by placeholders.
3. **Described the UI requirements to Claude Code** using the reference specification. No real names, photos, or department names were provided to any AI tool at any point.
4. **Generated fake participant data** with realistic characteristics: international names, generic department names, industry-standard job titles, and a score distribution that mimics a natural leaderboard curve (few high outliers, clustered middle, tapering low end).
5. **Built the application iteratively** following a strict order: data model → layout → row/card component → sorting → filtering → visual polish to match original colours and spacing.
6. **Verified the clone** against the reference specification to ensure all filters, sorts, and visual elements matched the original.
7. **Deployed to GitHub Pages** via a GitHub Actions workflow triggered on push to `main`.

## Data Replacement Strategy

All original data was replaced with generated alternatives:

| Original field | Replacement method |
|---|---|
| Names | Randomly generated international first + last names (no celebrity or sequential names) |
| Departments | Generic department names (Engineering, Marketing, Sales, Design, Product, Operations) |
| Titles | Common industry titles matching department context (Senior Engineer, Product Manager, etc.) |
| Scores | Distributed with realistic leaderboard curve — not uniform random |
| Avatars | Generated via DiceBear API (`avataaars` style) using participant name as seed for consistency |

**No real corporate data — names, photos, titles, department names, or scores — was used or fed into any AI tool at any stage of development.**

## Challenges and Decisions

- **Tailwind v4 CSS-only config** — The project uses Tailwind CSS v4, which dropped `tailwind.config.ts` in favour of an `@theme {}` block in `index.css`. All custom design tokens (colours, font stack) are declared as CSS variables there and referenced via `var()` throughout components.
- **No icon library** — The original uses Fluent UI icons. Rather than importing a heavy icon library, inline SVG components were created for the three category icons (Education/graduation cap, Public Speaking/monitor, University Partnership/smiley) and UI controls (Star, ChevronDown, ChevronUp). This keeps the bundle minimal.
- **Olympic podium layout** — The CSS flex `order` property is used to reorder rank 2 (left), rank 1 (center, elevated), rank 3 (right) from data that arrives sorted 1-2-3. Rank 1 gets a negative `margin-top` of 32px to appear elevated above the other two.
- **Score recalculation on filter** — When a Year/Quarter/Category filter is active, each participant's `totalScore` and `categoryStats` are recalculated from only the matching activities. Participants with zero matching activities are removed. Ranks are then reassigned on the filtered set so the podium and list stay consistent.
- **Vite config bug fix** — The starter `vite.config.ts` referenced `tailwindcss()` without importing the `@tailwindcss/vite` package. The import was added as part of setup.

## Local Testing with Docker

```bash
cd task-1
docker build -t leaderboard .
docker run -p 8080:8080 leaderboard
# open http://localhost:8080/ai-challenge-2/
```

## Live Demo

🔗 [GitHub Pages](https://alexkast.github.io/ai-challenge-2/)
