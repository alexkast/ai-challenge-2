export default function Header() {
  return (
    <header className="mb-6 md:mb-8">
      <h2
        style={{
          fontSize: "30px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          margin: 0,
          marginBottom: "8px",
        }}
      >
        Leaderboard
      </h2>
      <p
        style={{
          fontSize: "14px",
          fontWeight: 400,
          color: "var(--color-text-secondary)",
          margin: 0,
        }}
      >
        Top performers based on contributions and activity
      </p>
    </header>
  );
}
