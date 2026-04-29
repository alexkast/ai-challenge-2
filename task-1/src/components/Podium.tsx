import type { CSSProperties } from "react";
import type { Participant } from "../types";

interface PodiumProps {
  top3: Participant[];
}

interface PodiumColumnProps {
  participant: Participant;
  isFirst: boolean;
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l1.76 3.57 3.94.57-2.85 2.78.67 3.92L8 9.77l-3.52 1.85.67-3.92L2.3 4.14l3.94-.57z" />
    </svg>
  );
}

function PodiumColumn({ participant: p, isFirst }: PodiumColumnProps) {
  const rank = p.rank;
  const isRank1 = rank === 1;
  const avatarSize = isRank1 ? 112 : 80;
  const badgeSize = isRank1 ? 40 : 32;
  const blockHeight = isRank1 ? 160 : rank === 2 ? 128 : 96;
  const watermarkSize = isRank1 ? 112 : 96;

  const badgeBg =
    rank === 1
      ? "var(--color-rank-gold)"
      : rank === 2
      ? "var(--color-rank-silver)"
      : "var(--color-rank-bronze)";

  const blockGradient =
    rank === 1
      ? "linear-gradient(180deg, var(--color-rank-gold-light), var(--color-rank-gold-mid))"
      : "linear-gradient(180deg, var(--color-rank-silver-light), var(--color-rank-silver-mid))";

  const watermarkColor =
    rank === 1 ? "rgba(234,179,8,0.2)" : "rgba(148,163,184,0.2)";

  const avatarBorder =
    rank === 1 ? "4px solid var(--color-rank-gold-avatar-border)" : "none";

  const scoreStyle: CSSProperties =
    rank === 1
      ? {
          background: "var(--color-rank-gold-score-bg)",
          border: "1px solid var(--color-rank-gold-score-border)",
          color: "var(--color-rank-gold-score-text)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          fontSize: "20px",
          fontWeight: 700,
        }
      : {
          background: "transparent",
          border: "none",
          color: "var(--color-accent)",
          fontSize: "18px",
          fontWeight: 700,
        };

  const nameSize = isRank1 ? 24 : 20;
  const order = rank === 1 ? 2 : rank === 2 ? 1 : 3;
  const marginTop = isFirst ? -32 : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        order,
        marginTop,
        flex: "1 1 0",
        minWidth: 0,
      }}
    >
      {/* User info above podium block */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "0" }}>
        {/* Avatar + badge */}
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <img
            src={p.avatarUrl}
            alt={p.name}
            width={avatarSize}
            height={avatarSize}
            style={{
              borderRadius: "50%",
              border: avatarBorder,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "block",
              background: "#e2e8f0",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: badgeSize,
              height: badgeSize,
              borderRadius: "50%",
              background: badgeBg,
              border: "4px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: isRank1 ? "16px" : "14px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {rank}
          </div>
        </div>

        {/* Name */}
        <h3
          style={{
            fontSize: nameSize,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: "0 0 4px 0",
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {p.name}
        </h3>

        {/* Role */}
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            margin: "0 0 8px 0",
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {p.role}
        </p>

        {/* Score */}
        <div
          style={{
            ...scoreStyle,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 12px",
            borderRadius: "20px",
            marginBottom: "16px",
          }}
        >
          <StarIcon />
          <span>{p.totalScore}</span>
        </div>
      </div>

      {/* Podium block */}
      <div
        style={{
          width: "100%",
          height: blockHeight,
          background: blockGradient,
          borderRadius: "8px 8px 0 0",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: watermarkSize,
            fontWeight: 700,
            color: watermarkColor,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {rank}
        </span>
      </div>
    </div>
  );
}

export default function Podium({ top3 }: PodiumProps) {
  if (top3.length < 3) return null;

  const rank1 = top3.find((p) => p.rank === 1);
  const rank2 = top3.find((p) => p.rank === 2);
  const rank3 = top3.find((p) => p.rank === 3);

  if (!rank1 || !rank2 || !rank3) return null;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto 64px auto",
        padding: "32px 8px 0 8px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "24px",
        }}
        className="podium-container"
      >
        <PodiumColumn participant={rank2} isFirst={false} />
        <PodiumColumn participant={rank1} isFirst={true} />
        <PodiumColumn participant={rank3} isFirst={false} />
      </div>
    </div>
  );
}
