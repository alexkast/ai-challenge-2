# Reference — Original Leaderboard

> **Instructions**: Extracted from the original SharePoint-hosted leaderboard via Chrome DevTools.
> All real names, real photos, and personal data have been replaced with placeholders.
> This file is the single source of truth for the clone.

---

## Page Layout

```
SharePoint page title above the web part: "Company Leader Board 2025" (breadcrumb: Home / EDU / Company Leader Board 2025).
The SharePoint chrome (nav bar, breadcrumb, page title) is NOT part of the clone — build only the web part content below.

The SharePoint page background outside the web part is a medium gray (SharePoint default site background, ~#f3f2f1).
The web part itself sits on a light #f8fafc background filling the full available width.

Inside the leaderboard web part (top to bottom):
  1. Header:  title "Leaderboard" + subtitle paragraph
  2. Filter bar: horizontal bar with 3 dropdowns + 1 search box (all on one row)
  3. Podium: Olympic-style podium for top 3 (rank 2 left, rank 1 center/elevated, rank 3 right)
  4. List: ALL participants (rank 1–N) as stacked cards in descending score order

No sidebar. No footer. No pagination — all results visible.
Below the web part: SharePoint comments section — NOT part of the clone, do not implement.
```

## Leaderboard Format

- Type: hybrid — podium (top 3) + ranked card list (all participants, 1 through N)
- The top 3 appear both in the podium AND in the list below

**Podium columns (left to right):**
1. Rank 2 — medium avatar (80 × 80), silver rank badge
2. Rank 1 — large avatar (112 × 112), gold rank badge, card elevated higher
3. Rank 3 — medium avatar (80 × 80), bronze rank badge

**List row fields (left to right):**
1. Rank number
2. Avatar (56 × 56 circle)
3. Name + role/title (stacked)
4. Category stats (icon + activity count per category, shown with tooltip on hover)
5. "TOTAL" label + total score (with star icon)
6. Expand button (ChevronDown icon when collapsed → ChevronUp icon when expanded)

## Data Model

```typescript
interface Participant {
  rank: number;           // 1-based integer, sorted desc by totalScore
  name: string;           // Full name — FAKE in clone
  role: string;           // Job title (e.g. "Senior Software Engineer")
  avatarUrl: string;      // Profile photo URL — use DiceBear in clone
  totalScore: number;     // Total points across all activities
  categoryStats: CategoryStat[];  // One entry per category that has activities > 0
}

interface CategoryStat {
  icon: string;    // Fluent UI icon name: "Education" | "Presentation" | "Emoji2"
  count: number;   // Number of activities in this category
  label: string;   // Category display name (shown in tooltip)
}

// Activity detail shown when row is expanded
interface Activity {
  name: string;       // Activity title — often prefixed: "[LAB]", "[REG]", "[UNI]", "[EDU]"
  category: ActivityCategory;
  date: string;       // Display format: "14-May-2025" (day-MonthAbbr-year)
  points: number;     // Points awarded — displayed as "+64", "+16" (with + prefix, blue)
}

// Category labels as shown in the UI (dropdown + activity table badges)
type ActivityCategory = "Education" | "Public Speaking" | "University Partnership";

// Activity name prefix meanings (from original page comments, for realism):
// [LAB] = lab curators, lecturers, and mentors
// [REG] = speakers at events and internal trainings in locations
// [UNI] = university speakers, academic practice curators, and other activities with universities
// [EDU] = speakers/performers at EDU events
```

**Activity categories observed in the original data:**
| Category label     | Fluent icon   | Badge style                                     |
|--------------------|---------------|-------------------------------------------------|
| Education          | Education     | (maps to "Training" badge — blue)               |
| Public Speaking    | Presentation  | (maps to "Contribution" badge — purple)         |
| University Partnership | Emoji2    | (maps to "Community" badge — green)             |

**Participant count:** 200+ in the real data (rank 227 observed in screenshots). For the clone, generate 30–40 fake entries — enough to show a realistic score curve and demonstrate all filter/sort behaviour.

## Filters

| # | Filter name | UI type | Options (confirmed from screenshots) |
|---|-------------|---------|--------------------------------------|
| 1 | Year | Dropdown | **All Years**, 2025 |
| 2 | Quarter | Dropdown | **All Quarters**, Q1, Q2, Q3, Q4 |
| 3 | Category | Dropdown | **All Categories**, Education, Public Speaking, University Partnership |
| 4 | Search | Text input | placeholder: "Search employee..." |

> Year filter has only 2 options: "All Years" and "2025" — the dataset covers 2025 data only.

Default state on page load: "All Years", "All Quarters", "All Categories" selected; search empty.

> **Clone note**: Use regular `<select>` or custom dropdown — no need for Fluent UI. Category filter options: All Categories, Education, Public Speaking, University Partnership.

## Sorting

- Default sort: Score descending (rank 1 = highest score)
- No interactive column sorting — ranking is fixed by the server/hook
- No sort indicator UI — just a pre-sorted list
- Ties: participants with equal scores share adjacent ranks (no explicit tie-breaking visible)

## Visual Design Tokens

### Colors

| Element | Value |
|---------|-------|
| Page background | `#f8fafc` |
| Card / row background | `#ffffff` |
| Card / row hover shadow intensifies | see Shadows section |
| Primary text | `#0f172a` |
| Secondary text | `#64748b` |
| Accent / score color | `#0ea5e9` |
| Border color | `#e2e8f0` |
| Expand button bg | `#f1f5f9` |
| Expand button hover bg | `#e2e8f0` |
| Expanded row border | `#0ea5e9` |
| Rank number (list) | `#94a3b8` |
| Rank 1 badge bg | `#eab308` (gold) |
| Rank 2 badge bg | `#94a3b8` (silver) |
| Rank 3 badge bg | `#92400e` (bronze) |
| Rank badge border | `#ffffff` (4px) |
| Podium rank 1 avatar border | `4px solid #fbbf24` |
| Podium rank 1 block bg | `linear-gradient(180deg, #fef3c7, #fde68a)` |
| Podium rank 2/3 block bg | `linear-gradient(180deg, #e2e8f0, #cbd5e1)` |
| Podium rank 1 score bg | `#fef9c3`, border `#fde047`, text `#ca8a04` |
| Podium rank 2/3 score text | `#0ea5e9` |
| Podium rank number (large watermark) | `rgba(148,163,184,0.2)` (rank 1: `rgba(234,179,8,0.2)`) |
| Category badge — Training | bg `#dbeafe`, text `#1e40af` |
| Category badge — Contribution | bg `#f3e8ff`, text `#6b21a8` |
| Category badge — Community | bg `#dcfce7`, text `#166534` |
| Category badge — Default | bg `#e2e8f0`, text `#475569` |
| Activity table row hover | `#f1f5f9` |
| Details / expanded bg | `#f8fafc` |
| Details border-top | `#e2e8f0` |

### Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Page title (h2) | Segoe UI stack¹ | 30px (24px mobile) | 700 | `#0f172a` |
| Subtitle paragraph | Segoe UI stack | 14px | 400 | `#64748b` |
| Podium rank 1 name | Segoe UI stack | 24px | 700 | `#0f172a` |
| Podium rank 2/3 name | Segoe UI stack | 20px | 700 | `#0f172a` |
| Podium role | Segoe UI stack | 14px | 500 | `#64748b` |
| Podium score (rank 1) | Segoe UI stack | 20px | 700 | `#ca8a04` |
| Podium score (rank 2/3) | Segoe UI stack | 18px | 700 | `#0ea5e9` |
| Row rank number | Segoe UI stack | 24px | 700 | `#94a3b8` |
| Row participant name | Segoe UI stack | 18px | 700 | `#0f172a` |
| Row role / subtitle | Segoe UI stack | 14px | 400 | `#64748b` |
| Category stat count | Segoe UI stack | 12px | 600 | `#475569` |
| "TOTAL" label | Segoe UI stack | 10px | 600 | `#94a3b8`, letter-spacing 0.05em, uppercase |
| Total score | Segoe UI stack | 24px | 700 | `#0ea5e9` |
| Activity table header | Segoe UI stack | 12px | 600 | `#64748b`, uppercase, letter-spacing 0.05em |
| Activity table cell | Segoe UI stack | 14px | 400 | `#1e293b` |
| Activity name | Segoe UI stack | 14px | 600 | `#1e293b` |
| Activity points | Segoe UI stack | 14px | 700 | `#0ea5e9`, right-aligned |
| Activity date | Segoe UI stack | 14px | 400 | `#64748b` |

¹ Font stack: `Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`

### Spacing and Sizing

| Element | Value |
|---------|-------|
| Page padding | `24px` (all sides); `16px` on mobile |
| Header margin-bottom | `32px` (24px on mobile) |
| Filter bar padding | `20px 24px` (16px on mobile) |
| Filter bar border-radius | `12px` |
| Filter bar margin-bottom | `24px` |
| Filter bar gap (between controls) | `12px` |
| Podium max-width | `900px` |
| Podium padding | `32px 8px` |
| Podium margin-bottom | `64px` (32px on mobile) |
| Podium column gap | `24px` |
| Podium rank 1 avatar | `112 × 112 px`, circle |
| Podium rank 2/3 avatar | `80 × 80 px`, circle |
| Podium rank 1 block height | `160px` (140px mobile) |
| Podium rank 2 block height | `128px` (96px mobile) |
| Podium rank 3 block height | `96px` (64px mobile) |
| Podium rank badge (rank 1) | `40 × 40 px`, circle |
| Podium rank badge (rank 2/3) | `32 × 32 px`, circle |
| Podium rank number watermark | `112px` font-size for rank 1; `96px` for rank 2/3 |
| Podium name margin-bottom | `4px` |
| Podium role margin-bottom | `8px` |
| List max-width | `1200px` |
| List gap (between rows) | `16px` |
| Row padding | `20px 24px` (16px on mobile) |
| Row border-radius | `12px` |
| Avatar (list row) | `56 × 56 px`, circle |
| Row left section gap | `24px` (16px mobile) |
| Row main gap | `16px` |
| Row right section gap | `24px` |
| Category stats gap | `24px` (16px mobile) |
| Total section padding-left | `24px`, left border `1px solid #e2e8f0` |
| Expand button | `8px` padding, `50%` border-radius (circle) |
| Details section padding | `24px` (16px mobile) |
| Activity table row padding | `16px 8px` per cell |
| Activity table header padding | `12px 8px` per cell |
| Category badge | padding `4px 12px`, border-radius `12px` |

### Shadows

| Element | Value |
|---------|-------|
| Filter bar (default) | `0 1px 3px rgba(0,0,0,0.1)` |
| Filter bar (hover) | `0 4px 12px rgba(0,0,0,0.05)` |
| Row card (default) | `0 1px 3px rgba(0,0,0,0.1)` |
| Row card (hover) | `0 4px 12px rgba(0,0,0,0.1)` |
| Row card (expanded) | `0 4px 12px rgba(0,0,0,0.1)` |
| Podium avatar | `0 4px 12px rgba(0,0,0,0.15)` |
| Podium score badge | `0 1px 2px rgba(0,0,0,0.05)` |
| Theme toggle button | `0 1px 2px rgba(0,0,0,0.05)` |

## Interactive Behaviour

### Filter behaviour
- Year dropdown: shows only participants with activities in the selected year
- Quarter dropdown: shows only participants with activities in the selected quarter (requires year or alone)
- Category dropdown: shows only participants with activities in the selected category; also changes which `categoryStats` column is highlighted
- Search box: filters by participant name (case-insensitive substring match, client-side)
- All four filters combine with AND logic — each active filter narrows results further
- Selecting "All …" option for a dropdown resets that filter (no restriction)
- Empty state when no results: not confirmed from screenshot — implement a simple "No results found" message

### Row expand / collapse
- Each row has a round expand button (ChevronDown icon when collapsed, `#0ea5e9`, bg `#f1f5f9`)
- Clicking expands the row to show an activity detail table below the main row info
- Expanded state: row border turns `#0ea5e9`, expand button icon switches to **ChevronUp**, button bg turns `#e0f2fe`
- Expanded section header: **"RECENT ACTIVITY"** (uppercase, small gray label)
- Activity table columns (left to right): **ACTIVITY** | **CATEGORY** | **DATE** | **POINTS**
  - Table column headers are uppercase, `12px`, `#64748b`
  - POINTS column is right-aligned
- Activity name: bold, prefixed with [LAB] / [REG] / [UNI] / [EDU] in the original
- Category shown as pill badge (gray in screenshots — both "Public Speaking" and "Education" appear as neutral gray pills, matching the `categoryDefault` style)
- Date format: `"14-May-2025"` (day-MonthAbbr-year, e.g. "15-Apr-2025")
- Points: `"+64"`, `"+16"` — displayed with a `+` prefix in blue (`#0ea5e9`), bold
- Each table row has a bottom border `1px solid #e2e8f0`; last row has no border
- Clicking the expand button again collapses the row
- **Multiple rows can be expanded simultaneously** (confirmed: rows 1–3 collapsed while row 4 expanded in screenshot)

### Hover states
- Filter bar: box-shadow increases from default to hover value
- Row card: box-shadow increases from default to hover value
- Expand button: bg changes from `#f1f5f9` → `#e2e8f0`
- Theme toggle button: border and icon color change to `#0ea5e9` on hover
- Activity table rows: bg changes to `#f1f5f9` on hover

### Podium
- Rank 1 column is visually elevated (negative margin-top: -32px, order: 2 in flex so it appears center)
- Rank 2 is left (order: 1), Rank 3 is right (order: 3)
- Rank badges are positioned absolute on bottom-right of avatar

### Other
- Theme toggle button (dark/light mode): exists in original header — **do not implement** (not required for static clone)
- No click navigation on rows — they are not links
- No search pagination — all results displayed

## Responsive Behaviour

- Is the original responsive? **Yes**
- Breakpoint: `768px` (max-width)
- Changes at ≤768px:
  - Page padding reduced to `16px`
  - Header title reduces to `24px`
  - Filter bar stacks vertically (flex-direction: column), full width, padding `16px`
  - Individual filter controls go full width
  - Podium stacks vertically (flex-direction: column, align-items: center), margin-bottom `32px`
    - Rank 1 loses negative margin-top and moves to order:1 (top)
    - Rank 2 becomes order:2, Rank 3 becomes order:3
    - Podium block heights reduce
  - Row padding reduces to `16px`
  - Row main layout stacks vertically (flex-direction: column)
  - Row left section uses `gap: 16px`
  - Row right section gets a top border `1px solid #e2e8f0`, full width, space-between
  - "TOTAL" / score section hidden on mobile (display: none) — only category stats shown

## Sanitised HTML Structure

```html
<!-- Leaderboard web part root -->
<div class="leaderboard">
  <!-- Header -->
  <header class="header">
    <div class="headerContent">
      <h2>Leaderboard</h2>
      <p>Top performers based on contributions and activity</p>
    </div>
    <!-- theme toggle button — omit in clone -->
  </header>

  <!-- Filter bar -->
  <div class="filterBar">
    <div class="filters">
      <div class="dropdown"><!-- Year dropdown, default "All Years" --></div>
      <div class="dropdown"><!-- Quarter dropdown, default "All Quarters" --></div>
      <div class="dropdown"><!-- Category dropdown, default "All Categories" --></div>
    </div>
    <div class="search">
      <input type="text" placeholder="Search employee..." />
    </div>
  </div>

  <!-- Podium (top 3) -->
  <div class="podium">
    <!-- Rank 2 (left) -->
    <div class="podiumColumn podiumRank2">
      <div class="podiumUser">
        <div class="podiumAvatarContainer">
          <div class="podiumAvatar" style="width:80px;height:80px;background-image:url('[placeholder]')"></div>
          <div class="podiumRankBadge" style="width:32px;height:32px;">2</div>
        </div>
        <h3 class="podiumName">[Person 2 Name]</h3>
        <p class="podiumRole">[Job Title 2]</p>
        <div class="podiumScore">
          <i data-icon="FavoriteStarFill"></i>
          <span>[score]</span>
        </div>
      </div>
      <div class="podiumBlock">
        <div class="podiumBlockTop"></div>
        <span class="podiumRankNumber">2</span>
      </div>
    </div>

    <!-- Rank 1 (center, elevated) -->
    <div class="podiumColumn podiumRank1">
      <div class="podiumUser">
        <div class="podiumAvatarContainer">
          <div class="podiumAvatar" style="width:112px;height:112px;background-image:url('[placeholder]')"></div>
          <div class="podiumRankBadge" style="width:40px;height:40px;">1</div>
        </div>
        <h3 class="podiumName">[Person 1 Name]</h3>
        <p class="podiumRole">[Job Title 1]</p>
        <div class="podiumScore">
          <i data-icon="FavoriteStarFill"></i>
          <span>[score]</span>
        </div>
      </div>
      <div class="podiumBlock">
        <div class="podiumBlockTop"></div>
        <span class="podiumRankNumber">1</span>
      </div>
    </div>

    <!-- Rank 3 (right) -->
    <div class="podiumColumn podiumRank3">
      <!-- same structure as rank 2 -->
    </div>
  </div>

  <!-- Ranked list (all participants) -->
  <div class="list">
    <!-- Repeated for each participant -->
    <div class="userRowContainer">
      <div class="row">
        <div class="rowMain">
          <div class="rowLeft">
            <span class="rank">[rank]</span>
            <div class="avatar" style="background-image:url('[placeholder]')"></div>
            <div class="info">
              <h3 class="name">[Name]</h3>
              <span class="role">[Job Title]</span>
            </div>
          </div>
          <div class="rowRight">
            <div class="categoryStats">
              <!-- Per active category: -->
              <div class="categoryStat">
                <i data-icon="[Education|Presentation|Emoji2]" class="categoryStatIcon"></i>
                <span class="categoryStatCount">[count]</span>
                <!-- tooltip: category label -->
              </div>
            </div>
            <div class="totalSection">
              <span class="totalLabel">TOTAL</span>
              <div class="score">
                <i data-icon="FavoriteStarFill"></i>
                <span>[total score]</span>
              </div>
            </div>
            <button class="expandButton" aria-label="Expand">
              <i data-icon="ChevronDown"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Expanded details (hidden by default) -->
      <div class="details" hidden>
        <p class="detailsTitle">RECENT ACTIVITY</p>
        <div class="tableWrapper">
          <table class="activityTable">
            <thead>
              <tr>
                <th>Activity</th>
                <th>Category</th>
                <th>Date</th>
                <th style="text-align:right">Points</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="activityName">[Activity Name]</td>
                <td>
                  <span class="categoryBadge categoryTraining">[Category]</span>
                </td>
                <td class="activityDate">14-May-2025</td><!-- format: day-MonthAbbr-year -->
                <td class="activityPoints">+64</td><!-- + prefix, blue, bold -->
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Screenshots (references, not to feed to AI)

Captured in `screens/` folder:

| File | What it shows |
|------|---------------|
| `Screenshot 2026-04-28 at 12.45.31.png` | Full page — podium + top of list, filter bar visible |
| `Screenshot 2026-04-28 at 12.45.45.png` | Full page slightly scrolled — confirms podium block colors |
| `Screenshot 2026-04-28 at 12.46.09.png` | Collect Feedback dialog — **not part of leaderboard** |
| `Screenshot 2026-04-28 at 12.46.20.png` | Collect Feedback dialog dropdown — **not part of leaderboard** |
| `Screenshot 2026-04-28 at 12.46.38.png` | **Year dropdown open** — options: "All Years", "2025" |
| `Screenshot 2026-04-28 at 12.46.47.png` | **Quarter dropdown open** — options: "All Quarters", Q1, Q2, Q3, Q4 |
| `Screenshot 2026-04-28 at 12.46.59.png` | **Category dropdown open** — options: "All Categories", "Education", "Public Speaking", "University Partner…" |
| `Screenshot 2026-04-28 at 12.47.43.png` | **Expanded row** — full activity table: columns ACTIVITY / CATEGORY / DATE / POINTS, section header "RECENT ACTIVITY" |
| `Screenshot 2026-04-28 at 12.47.53.png` | **Tooltip: "Public Speaking"** over monitor/presentation icon |
| `Screenshot 2026-04-28 at 12.48.02.png` | **Tooltip: "Education"** over graduation cap icon |
| `Screenshot 2026-04-28 at 12.48.13.png` | List rows 1–4 — confirms icon layout; row 4 expanded (ChevronUp visible) |
| `Screenshot 2026-04-28 at 12.48.39.png` | Rank 227 row — confirms 200+ total participants; comments section below (not in clone) |
| `Screenshot 2026-04-28 at 12.48.58.png` | SharePoint comments section — **not part of leaderboard** |
| `Screenshot 2026-04-28 at 12.49.11.png` | **Tooltip: "University Partnership"** over smiley face (Emoji2) icon |
