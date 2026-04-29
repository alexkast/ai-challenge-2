import { useState } from "react";
import type { FilterState } from "./types";
import { useLeaderboard } from "./hooks/useLeaderboard";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import Podium from "./components/Podium";
import ParticipantList from "./components/ParticipantList";

const defaultFilters: FilterState = {
  year: "all",
  quarter: "all",
  category: "all",
  search: "",
};

export default function App() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const { participants, podiumTop3 } = useLeaderboard(filters);

  return (
    <div
      style={{
        background: "var(--color-page-bg)",
        minHeight: "100vh",
        padding: "24px",
      }}
      className="leaderboard-root"
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Header />
        <FilterBar filters={filters} onChange={setFilters} />
        {podiumTop3.length === 3 && <Podium top3={podiumTop3} />}
        <ParticipantList participants={participants} />
      </div>
    </div>
  );
}
