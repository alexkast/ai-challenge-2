# ATC MCP Server — Technical Report

## 1. Scheduling Approach

### Algorithm: Priority-Based Greedy Scheduling

The scheduler processes flights in a fixed order — sorted by `(priority.value ASC, submission_order ASC)` — and assigns each flight the earliest feasible slot across all suitable runways and gates. Once a flight is placed, its slot is committed and never reconsidered.

**Rationale for greedy.** Optimal multi-resource scheduling (joint runway, gate, and crew assignment with dependencies) is NP-hard in the general case. A greedy approach provides determinism, predictable performance, and results that are correct enough for the scope of this problem. Determinism is a first-class requirement here: identical inputs must always produce identical outputs, which a greedy algorithm with a stable sort naturally satisfies.

**Sort order.** `priority.value` maps HIGH=1, MEDIUM=2, LOW=3, so ascending order places high-priority flights first. `submission_order` is an auto-incremented integer assigned at submission time, providing a stable tiebreaker when two flights share the same priority level.

**Resource discovery: unified slot search.** The core function `find_earliest_feasible_time` checks all three constraints — runway separation, gate availability, and ground crew capacity — in a single forward pass over time. No constraint is checked in isolation before the others. This prevents the common class of bug where a slot passes one check in isolation but fails a combined check.

**Time scanning: discrete-event jumps.** When a candidate time T is rejected, the scanner does not increment T by one minute. Instead it jumps directly to the earliest time at which the blocking resource becomes available:

- **Runway blocked** → jump to `blocking_slot.end + required_separation_buffer`
- **Gate blocked** → jump to `earliest_gate_release + gate_turnaround_time`
- **Crew exhausted** → jump to `min(scheduled_end)` among all overlapping operations

This keeps the 50-iteration cap safe for realistic schedules while remaining efficient.

**Determinism.** Every iteration over runways and gates uses `sorted()` with an explicit key. No sets or unordered collections appear in any code path that influences output. The sort key `(priority.value, submission_order)` is unique per flight, making the processing order fully reproducible.

---

## 2. Key Design Decisions

**In-memory state.** The task does not require persistence between process restarts. `AirportState` is created once on startup from the environment configuration and lives for the lifetime of the server process. This eliminates an entire class of serialisation and consistency bugs without sacrificing any required functionality.

**Full recomputation on `generate_schedule`.** Every call to `generate_schedule` begins with `reset_schedule()`, which clears all slot assignments and returns all non-cancelled flights to `QUEUED`. The schedule is then recomputed from scratch. This is simpler and more correct than incremental updates: there is no risk of stale slots, ghost assignments, or partial state from a previous run influencing the new one. It is also explicitly required by the task specification.

**Async/sync split.** MCP tool and resource handlers are declared as `async def` as required by the MCP SDK. All domain logic — `AirportState`, `scheduler`, `bottleneck` — is implemented as regular synchronous functions. Async handlers call synchronous domain functions directly. This clean boundary means domain logic can be unit-tested without any async test infrastructure, while the MCP layer remains straightforward.

**Pydantic models.** All data structures are Pydantic `BaseModel` subclasses. This provides automatic type coercion at construction time, clear data contracts between modules, and readable serialisation to JSON. Enum fields (`FlightStatus`, `OperationType`, `Priority`) are defined with `str` or `int` base classes so they serialise naturally.

**Modular architecture.** Each concern lives in its own file: `models.py` (data), `config.py` (environment), `airport_state.py` (state and queries), `scheduler.py` (algorithm), `bottleneck.py` (analysis), `server.py` (MCP layer). This separation made it straightforward to write targeted unit tests for separation logic in isolation, and to debug the scheduler without touching the MCP layer.

---

## 3. Bottleneck Analysis

The `analyze_bottlenecks` function builds a directed acyclic graph from the dependency relationships among currently `SCHEDULED` flights, then finds the critical chain using a depth-first search.

**Algorithm.** Root nodes are scheduled flights with no scheduled dependencies. Leaf nodes are scheduled flights that no other scheduled flight depends on. A DFS from each root enumerates all root-to-leaf paths. The path with the highest `total_duration` is the critical chain.

**Actual scheduled times.** `total_duration` is computed as:

```
scheduled_end of last flight − scheduled_start of first flight
```

These are the actual values stored on each `Flight` object after scheduling. They capture real resource contention: if a flight had to wait for a runway that was occupied, or for a gate to turn around, those delays are embedded in `scheduled_start` and `scheduled_end`. Using theoretical formulas (`sum of durations + sum of buffers`) would undercount the true chain duration whenever resource contention pushed a flight later than its dependency buffer alone required.

**`dependency_buffers_total`** sums the idle gaps between consecutive flights in the chain:

```
sum(chain[i+1].scheduled_start − chain[i].scheduled_end)
```

This makes explicit how much of the chain duration is waiting time versus active operation time.

---

## 4. Tools and Techniques

| Tool / Technique | Role |
|---|---|
| Python 3.11+ | Runtime. `list[str] \| None` union syntax and reliable dict insertion order used throughout. |
| MCP Python SDK (`mcp[cli]`) | Server framework. Handles protocol framing, tool registration, and stdio transport. |
| Pydantic v2 | Data models, type validation, and JSON serialisation. |
| Claude Code | Primary development environment. Used for code generation, iterative debugging, and code review across all modules. |
| MCP Inspector | Interactive end-to-end testing of tools and resources without writing a dedicated client. |
| GitHub Copilot | In-IDE assistance for boilerplate and repetitive patterns. |
| CLAUDE.md | Persistent project context file. Architecture rules, invariants, and environment variable examples were recorded here so that Claude Code sessions remained consistent across multiple conversations. |
| pytest | Unit tests for `check_runway_separation` (6 cases) and integration tests for the three validation scenarios. |

---

## 5. What Worked Well

**MCP SDK abstraction.** The SDK handles all protocol-level concerns — message framing, tool schema generation from type annotations, resource registration — leaving the implementation entirely focused on scheduling logic. The `@mcp.tool()` and `@mcp.resource()` decorators required almost no boilerplate.

**Modular structure.** Having a clean boundary between the domain layer and the MCP layer made debugging straightforward. When the scheduler produced unexpected results, it could be exercised directly in a Python REPL or test without starting the MCP server.

**Test-first for separation logic.** Writing and passing the six `check_runway_separation` unit tests before integrating the function into `find_earliest_feasible_time` caught buffer direction issues early — specifically the asymmetry between checking a slot that precedes the proposed window versus one that follows it. Fixing these at the unit level avoided harder-to-diagnose integration failures.

**Discrete-event jumps.** Replacing `T += 1` increments with jumps to the next blocking resource release time made the slot-search loop both efficient and easy to reason about. Each iteration either succeeds or advances T by a meaningful amount; there are no wasted cycles.

**CLAUDE.md for session continuity.** Recording architecture rules — the async/sync split, determinism requirements, `reset_schedule` as mandatory first step, and the actual-times invariant for bottleneck analysis — in `CLAUDE.md` ensured that every Claude Code session made decisions consistent with earlier ones, even when the conversation context had been cleared.

---

## 6. What Was Challenging

**Separation buffer directionality.** The runway separation check must be applied in both directions: the proposed operation must clear the buffer after any preceding slot, and any following slot must clear the buffer after the proposed operation. Both checks use `required_buffer(op_before, op_after)`, but the argument order flips depending on which side of the proposed window the existing slot sits. Getting this right required careful test cases that specifically exercised each direction independently.

**Complete determinism.** Achieving determinism required more than just sorting runways and gates at the top level. Every intermediate code path that iterates flights, adjacency lists, or slot collections needed its own `sorted()` call with an explicit key. The rule "never use sets" was the hardest to apply consistently: the `visited` tracking dict in `cancel_flight` and the `leaves` membership lookup in `bottleneck.py` both started as sets and had to be replaced with dicts to comply.

**Transitive cancellation dependency traversal.** When a flight is cancelled, identifying all transitively dependent flights requires a full graph traversal — not just scanning direct dependents. The recursive DFS in `cancel_flight` must track visited nodes to avoid revisiting flights in diamond-shaped dependency graphs, and the traversal order must be deterministic (sorted by `submission_order`) to produce a stable `affected_dependents` list.

**Bottleneck analysis based on actual times.** The natural temptation when computing chain duration is to use `sum(operation_duration) + sum(dependency_buffer * N)`. This is wrong whenever resource contention delays a flight beyond its dependency constraint. Maintaining the invariant that `total_duration` uses only `scheduled_start` and `scheduled_end` required discipline across the entire analysis function, since those values are only valid after a `generate_schedule` call has completed successfully.
