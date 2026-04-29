import type { Activity, CategoryStat } from "../types";

export function buildCategoryStats(activities: Activity[]): CategoryStat[] {
  const map = new Map<
    string,
    { icon: "Education" | "Presentation" | "Emoji2"; count: number; label: CategoryStat["label"] }
  >();
  for (const a of activities) {
    const icon =
      a.category === "Education"
        ? "Education"
        : a.category === "Public Speaking"
        ? "Presentation"
        : "Emoji2";
    const entry = map.get(a.category);
    if (entry) {
      entry.count++;
    } else {
      map.set(a.category, { icon, count: 1, label: a.category });
    }
  }
  return Array.from(map.values());
}
