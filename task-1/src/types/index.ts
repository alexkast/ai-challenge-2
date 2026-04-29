export type ActivityCategory = "Education" | "Public Speaking" | "University Partnership";

export interface Activity {
  name: string;
  category: ActivityCategory;
  date: string;
  points: number;
  year: number;
  quarter: number;
}

export interface CategoryStat {
  icon: "Education" | "Presentation" | "Emoji2";
  count: number;
  label: ActivityCategory;
}

export interface Participant {
  id: number;
  rank: number;
  name: string;
  role: string;
  avatarUrl: string;
  totalScore: number;
  categoryStats: CategoryStat[];
  activities: Activity[];
}

export interface FilterState {
  year: string;
  quarter: string;
  category: string;
  search: string;
}
