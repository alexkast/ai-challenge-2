import type { Participant } from "../types";
import ParticipantRow from "./ParticipantRow";

interface ParticipantListProps {
  participants: Participant[];
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  if (participants.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "var(--color-text-secondary)",
          fontSize: "16px",
        }}
      >
        No results found.
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {participants.map((p) => (
        <ParticipantRow key={p.id} participant={p} />
      ))}
    </div>
  );
}
