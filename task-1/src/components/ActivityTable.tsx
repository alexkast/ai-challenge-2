import type { Activity } from "../types";

// Screenshots confirm all activity table badges use the neutral gray "default" style
const categoryBadgeStyle: Record<string, { bg: string; text: string }> = {
  Education: { bg: "var(--color-badge-default-bg)", text: "var(--color-badge-default-text)" },
  "Public Speaking": { bg: "var(--color-badge-default-bg)", text: "var(--color-badge-default-text)" },
  "University Partnership": { bg: "var(--color-badge-default-bg)", text: "var(--color-badge-default-text)" },
};

interface ActivityTableProps {
  activities: Activity[];
}

export default function ActivityTable({ activities }: ActivityTableProps) {
  return (
    <div
      style={{
        background: "var(--color-details-bg)",
        borderTop: "1px solid var(--color-border)",
        padding: "24px",
      }}
      className="details-section"
    >
      <p
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          margin: "0 0 16px 0",
        }}
      >
        RECENT ACTIVITY
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["ACTIVITY", "CATEGORY", "DATE", "POINTS"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    textAlign: i === 3 ? "right" : "left",
                    padding: "12px 8px",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((a, idx) => {
              const badge = categoryBadgeStyle[a.category] ?? {
                bg: "var(--color-badge-default-bg)",
                text: "var(--color-badge-default-text)",
              };
              const isLast = idx === activities.length - 1;
              return (
                <tr
                  key={idx}
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--color-hover-bg)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "";
                  }}
                >
                  <td
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--color-activity-cell)",
                      padding: "16px 8px",
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                    }}
                  >
                    {a.name}
                  </td>
                  <td
                    style={{
                      padding: "16px 8px",
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                    }}
                  >
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        fontSize: "12px",
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: "12px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.category}
                    </span>
                  </td>
                  <td
                    style={{
                      fontSize: "14px",
                      fontWeight: 400,
                      color: "var(--color-text-secondary)",
                      padding: "16px 8px",
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.date}
                  </td>
                  <td
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      padding: "16px 8px",
                      textAlign: "right",
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                    }}
                  >
                    +{a.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
