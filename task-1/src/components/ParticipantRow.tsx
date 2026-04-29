import { useState } from "react";
import type { Participant } from "../types";
import ActivityTable from "./ActivityTable";

interface ParticipantRowProps {
  participant: Participant;
}

function EducationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
    </svg>
  );
}

function PresentationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
    </svg>
  );
}

function Emoji2Icon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5 14.67 11 15.5 11zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l1.76 3.57 3.94.57-2.85 2.78.67 3.92L8 9.77l-3.52 1.85.67-3.92L2.3 4.14l3.94-.57z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 10l5 5 5-5H7z" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 14l5-5 5 5H7z" />
    </svg>
  );
}

const iconMap = {
  Education: EducationIcon,
  Presentation: PresentationIcon,
  Emoji2: Emoji2Icon,
};

export default function ParticipantRow({ participant: p }: ParticipantRowProps) {
  const [expanded, setExpanded] = useState(false);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-card-bg)",
    borderRadius: "12px",
    boxShadow: expanded ? "0 4px 12px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.1)",
    border: expanded ? "2px solid var(--color-accent)" : "2px solid transparent",
    overflow: "hidden",
    transition: "box-shadow 0.15s",
  };

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    if (!expanded) {
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    }
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLDivElement>) {
    if (!expanded) {
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
    }
  }

  return (
    <div style={cardStyle} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
        className="row-main"
      >
        {/* Left section: rank + avatar + info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flex: "1 1 0",
            minWidth: 0,
          }}
          className="row-left"
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              minWidth: "32px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            {p.rank}
          </span>

          <img
            src={p.avatarUrl}
            alt={p.name}
            width={56}
            height={56}
            style={{
              borderRadius: "50%",
              flexShrink: 0,
              background: "#e2e8f0",
              display: "block",
            }}
          />

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.name}
            </h3>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--color-text-secondary)",
              }}
            >
              {p.role}
            </span>
          </div>
        </div>

        {/* Right section: stats + total + expand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexShrink: 0,
          }}
          className="row-right"
        >
          {/* Category stats */}
          {p.categoryStats.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }} className="category-stats">
              {p.categoryStats.map((stat) => {
                const Icon = iconMap[stat.icon];
                return (
                  <div
                    key={stat.label}
                    title={stat.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "default",
                    }}
                  >
                    <span style={{ color: "var(--color-text-muted)" }}>
                      <Icon />
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      {stat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total score */}
          <div
            style={{
              paddingLeft: "24px",
              borderLeft: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
            className="total-section"
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginBottom: "2px",
              }}
            >
              TOTAL
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--color-accent)",
              }}
            >
              <StarIcon />
              <span>{p.totalScore}</span>
            </div>
          </div>

          {/* Expand button */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse" : "Expand"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: expanded ? "var(--color-accent-light)" : "var(--color-hover-bg)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-accent)",
              flexShrink: 0,
              padding: "8px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!expanded) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-hover-border)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = expanded
                ? "var(--color-accent-light)"
                : "var(--color-hover-bg)";
            }}
          >
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      </div>

      {expanded && <ActivityTable activities={p.activities} />}
    </div>
  );
}
