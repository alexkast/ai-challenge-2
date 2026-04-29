import type { CSSProperties } from "react";
import type { FilterState } from "../types";

interface FilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}

const selectStyle: CSSProperties = {
  fontSize: "14px",
  color: "var(--color-text-primary)",
  background: "var(--color-card-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  padding: "8px 12px",
  cursor: "pointer",
  outline: "none",
  minWidth: "140px",
  flex: "1 1 auto",
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  function set(key: keyof FilterState, value: string) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div
      style={{
        background: "var(--color-card-bg)",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        padding: "20px 24px",
        marginBottom: "24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.1)";
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", flex: "1 1 auto" }}>
        <select
          value={filters.year}
          onChange={(e) => set("year", e.target.value)}
          style={selectStyle}
          aria-label="Filter by year"
        >
          <option value="all">All Years</option>
          <option value="2025">2025</option>
        </select>

        <select
          value={filters.quarter}
          onChange={(e) => set("quarter", e.target.value)}
          style={selectStyle}
          aria-label="Filter by quarter"
        >
          <option value="all">All Quarters</option>
          <option value="Q1">Q1</option>
          <option value="Q2">Q2</option>
          <option value="Q3">Q3</option>
          <option value="Q4">Q4</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => set("category", e.target.value)}
          style={selectStyle}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          <option value="Education">Education</option>
          <option value="Public Speaking">Public Speaking</option>
          <option value="University Partnership">University Partnership</option>
        </select>
      </div>

      <div style={{ flex: "1 1 200px" }}>
        <input
          type="text"
          placeholder="Search employee..."
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          style={{
            ...selectStyle,
            width: "100%",
            minWidth: "unset",
          }}
        />
      </div>
    </div>
  );
}
