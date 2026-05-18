# ATC MCP Server

[![ATC MCP Server Tests](https://github.com/alexkast/ai-challenge-2/actions/workflows/atc-mcp-tests.yml/badge.svg)](https://github.com/alexkast/ai-challenge-2/actions/workflows/atc-mcp-tests.yml)

## Overview

The ATC MCP Server is a Model Context Protocol server that exposes an Air Traffic Control scheduling system to any MCP-compatible client. It accepts flight submissions, assigns runways and gates using a priority-based greedy algorithm, and surfaces scheduling results through five tools and three read-only resources. The server is designed to be driven interactively by an AI assistant such as Claude, which can query status, submit flights, trigger re-scheduling, and interpret bottleneck analysis without any human-written glue code.

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.11+ | 3.12 or 3.13 recommended |
| pip | any recent | bundled with Python |
| Node.js | 18+ | required only for `mcp dev` / MCP Inspector |

---

## Installation

```bash
cd task-4
pip install -r requirements.txt
```

---

## Configuration

All configuration is supplied through environment variables. The four **Required** variables must be set before the server starts; missing or invalid values cause an immediate exit with a descriptive error message.

| Variable | Required | Default | Type | Description |
|---|---|---|---|---|
| `RUNWAY_COUNT` | Yes | — | positive int | Number of runways to create (`RW-1` … `RW-N`) |
| `RUNWAY_LENGTHS` | Yes | — | comma-separated positive ints | Length in metres of each runway, in order. Count must equal `RUNWAY_COUNT` |
| `GATE_COUNT` | Yes | — | positive int | Number of gates to create (`G-1` … `G-N`) |
| `GROUND_CREW_COUNT` | Yes | — | positive int | Maximum number of operations that may be active simultaneously |
| `SEPARATION_TAKEOFF` | No | `3` | int ≥ 0 | Minimum gap in minutes between consecutive departures on the same runway |
| `SEPARATION_LANDING` | No | `3` | int ≥ 0 | Minimum gap in minutes between consecutive arrivals on the same runway |
| `SEPARATION_MIXED` | No | `5` | int ≥ 0 | Minimum gap in minutes between an arrival and a departure (or vice-versa) on the same runway |
| `GATE_TURNAROUND_TIME` | No | `30` | int ≥ 0 | Minutes a gate remains occupied after an operation ends |
| `DEPENDENCY_BUFFER` | No | `15` | int ≥ 0 | Minimum minutes required between a dependency completing and its dependent starting |
| `MAX_SCHEDULING_HORIZON` | No | `480` | int ≥ 0 | Latest allowed `scheduled_end` in minutes from T=0 |
| `OPERATION_DURATION_ARRIVAL` | No | `15` | int ≥ 0 | Default runway occupancy in minutes for an arrival |
| `OPERATION_DURATION_DEPARTURE` | No | `12` | int ≥ 0 | Default runway occupancy in minutes for a departure |

---

## Running the Server

### a) MCP Inspector (interactive testing)

```bash
RUNWAY_COUNT=2 RUNWAY_LENGTHS=3000,3500 GATE_COUNT=5 GROUND_CREW_COUNT=3 \
  mcp dev server.py
```

Opens the browser-based MCP Inspector where you can call tools and read resources manually.

### b) Direct stdio (Claude Desktop or other MCP clients)

```bash
RUNWAY_COUNT=2 RUNWAY_LENGTHS=3000,3500 GATE_COUNT=5 GROUND_CREW_COUNT=3 \
  python server.py
```

The server speaks the MCP stdio protocol on stdin/stdout and is ready to be connected to any compatible client.

### c) Claude Desktop configuration

Add the following block to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atc": {
      "command": "python",
      "args": ["/absolute/path/to/task-4/server.py"],
      "env": {
        "RUNWAY_COUNT": "2",
        "RUNWAY_LENGTHS": "3000,3500",
        "GATE_COUNT": "5",
        "GROUND_CREW_COUNT": "3"
      }
    }
  }
}
```

Replace `/absolute/path/to/task-4/server.py` with the actual path on your machine.

---

## Tools Reference

| Tool | Parameters | Returns | Description |
|---|---|---|---|
| `submit_flight` | `flight_number: str` (required)<br>`operation: str` — `"arrival"` or `"departure"` (required)<br>`priority: str` — `"high"`, `"medium"`, or `"low"` (required)<br>`dependencies: list[str]` — flight numbers this flight depends on (optional, default `[]`)<br>`runway_requirement: int` — minimum runway length in metres (optional, default `null`) | JSON confirmation with flight details and `submission_order` | Queues a new flight. The flight enters `QUEUED` status and will be considered on the next `generate_schedule` call. |
| `generate_schedule` | none | JSON summary: `scheduled_count`, `unscheduled_count`, `total_flights`, `completion_time`, `scheduled_flights` list, `unscheduled_flights` list | Resets all previous scheduling results and recomputes the full schedule from scratch. Flights are ordered by priority (high → low) then submission order. Returns per-flight runway, gate, and time assignments. |
| `get_airport_status` | none | JSON object with flight counts by status and operation type, runway and gate utilisation, ground crew peak usage, constraint warnings, unscheduled flight reasons, and overall completion time | Returns a snapshot of current airport operational state. Does not trigger re-scheduling. |
| `cancel_flight` | `flight_number: str` (required) | JSON: `{ "cancelled": str, "affected_dependents": list[str] }` | Marks a flight as `CANCELLED`. Does not automatically cancel dependent flights — they will be marked `UNSCHEDULED` with an explanatory reason on the next `generate_schedule` call. |
| `analyze_bottlenecks` | none | JSON: `has_bottleneck`, `critical_chain` (ordered list of flights), `total_duration`, `chain_length`, `dependency_buffers_total` | Identifies the critical dependency chain — the longest root-to-leaf path through the dependency DAG, measured using actual scheduled start and end times. Requires a prior `generate_schedule` call. |

---

## Resources Reference

| URI | Name | Returns | Description |
|---|---|---|---|
| `airport://flights` | Flight Queue | JSON array of all flights | Complete flight list including `QUEUED`, `SCHEDULED`, `UNSCHEDULED`, and `CANCELLED` flights. Each entry includes status, assigned runway and gate, scheduled times, dependencies, and unscheduled reason if applicable. Sorted by submission order. |
| `airport://runways` | Runway Status | JSON array of runway objects | Each runway entry includes its ID, length in metres, and a list of booked time slots with flight number, operation type, and start/end times. |
| `airport://timeline` | Operations Timeline | JSON array of scheduled operations | Chronological list of all `SCHEDULED` flights sorted by start time. Each entry includes flight number, operation type, priority, assigned runway and gate, start and end times, and dependencies. |

---

## Validation Scenarios

### Scenario 1 — Morning Rush

Validates that the scheduler handles mixed-priority traffic across multiple runways without slot conflicts.

```
submit_flight("AA100", "arrival",   "high")
submit_flight("BB200", "departure", "medium")
submit_flight("CC300", "arrival",   "low")
submit_flight("DD400", "departure", "low")
generate_schedule()
get_airport_status()
```

Expected: all four flights reach `SCHEDULED` status; high-priority `AA100` is assigned an earlier start than low-priority `CC300`; no two flights share an overlapping slot on the same runway.

---

### Scenario 2 — Heavy Hauler

Validates that runway length filtering rejects a flight when no runway meets its minimum length requirement.

```
submit_flight("XX900", "departure", "high", runway_requirement=5000)
generate_schedule()
```

Expected: `XX900` reaches `UNSCHEDULED` status with an `unscheduled_reason` explaining that no runway meets the 5000 m requirement (the configured runways are 3000 m and 3500 m).

---

### Scenario 3 — Connecting Flight

Validates that dependency tracking enforces the buffer between an arriving flight and its dependent departure.

```
submit_flight("IN100",  "arrival",   "high")
submit_flight("OUT200", "departure", "medium", dependencies=["IN100"])
generate_schedule()
analyze_bottlenecks()
```

Expected: both flights reach `SCHEDULED` status; `OUT200.scheduled_start >= IN100.scheduled_end + DEPENDENCY_BUFFER`; `analyze_bottlenecks` reports a two-flight critical chain spanning `IN100` → `OUT200`.
