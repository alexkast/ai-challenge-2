import { useMemo } from "react";
import type { Participant, FilterState, CategoryStat, Activity } from "../types";
import { participants as allParticipants } from "../data/participants";

function buildCategoryStats(activities: Activity[]): CategoryStat[] {
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

export function useLeaderboard(filters: FilterState): {
  participants: Participant[];
  podiumTop3: Participant[];
} {
  return useMemo(() => {
    const { year, quarter, category, search } = filters;

    const filtered: Participant[] = [];

    for (const p of allParticipants) {
      // Name search
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) {
        continue;
      }

      // Filter activities
      let acts = p.activities;
      if (year !== "all") {
        acts = acts.filter((a) => a.year === parseInt(year));
      }
      if (quarter !== "all") {
        const q = parseInt(quarter.replace("Q", ""));
        acts = acts.filter((a) => a.quarter === q);
      }
      if (category !== "all") {
        acts = acts.filter((a) => a.category === category);
      }

      // Only show if at least one matching activity
      if (acts.length === 0) continue;

      const totalScore = acts.reduce((s, a) => s + a.points, 0);
      filtered.push({
        ...p,
        activities: acts,
        totalScore,
        categoryStats: buildCategoryStats(acts),
        rank: 0,
      });
    }

    // Sort and re-rank
    filtered.sort((a, b) => b.totalScore - a.totalScore);
    filtered.forEach((p, i) => {
      p.rank = i + 1;
    });

    const podiumTop3 = filtered.slice(0, 3);
    return { participants: filtered, podiumTop3 };
  }, [filters]);
}
