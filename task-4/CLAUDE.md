# ATC MCP Server — Project Context
## Project Overview
Python MCP server implementing an Air Traffic Control scheduling system.
Internal AI Challenge submission — task-4.
## File Structure
- `server.py` — MCP entry point, tool and resource registration
- `config.py` — environment variable loading and validation, synchronous
- `models.py` — Pydantic data models
- `airport_state.py` — in-memory airport state, ALL methods synchronous
- `scheduler.py` — priority-based greedy scheduling algorithm, synchronous
- `bottleneck.py` — critical path analysis, synchronous
## Critical Architecture Rules
### 1. ASYNC/SYNC Split — Non-Negotiable
- `server.py` tool and resource handlers MUST be `async def`
- ALL domain logic (airport_state, scheduler, bottleneck) MUST be regular synchronous functions
- Async handlers call synchronous methods — this is correct and intentional
- Example:
  @mcp.tool()
  async def submit_flight(...) -> str:
      result = state.submit_flight(...)  # synchronous — correct
      return json.dumps(result)
### 2. Determinism — Non-Negotiable
Always use sorted() when iterating over runways or gates. Never use sets or unordered collections.
- Runways: sorted(runways, key=lambda r: r.id)
- Gates: sorted(gates, key=lambda g: g.id)
- Flights: sort by (flight.priority.value ASC, flight.submission_order ASC)
Identical inputs MUST always produce identical outputs.
### 3. Schedule Reset
generate_schedule() MUST call state.reset_schedule() as its FIRST action.
Full recomputation every time — no incremental updates.
### 4. Error Handling
All exceptions in tools/resources MUST be caught and returned as JSON error dicts.
Never let Python tracebacks reach the MCP client.
## Scheduling Algorithm: find_earliest_feasible_time
Single linear scan finding earliest time T where ALL three constraints pass simultaneously:
1. Runway available at [T, T+duration] respecting separation buffers
2. Gate available at [T, T+turnaround_time]
3. Concurrent active operations < ground_crew_count
DISCRETE-EVENT JUMPS: When T is blocked by a resource, jump T to the end time of that
blocking resource — never increment T by 1.
- Runway blocked: jump to (blocking_slot.end + required_separation_buffer)
- Gate blocked: jump to (blocking_gate_slot.end + turnaround_time)
- Crew exhausted: jump to earliest end time of any currently overlapping operation
Separation buffer logic is in a separate testable function:
check_runway_separation(runway, op_type, start, end, config) -> bool
- departure after departure: separation_takeoff
- arrival after arrival: separation_landing
- different types: separation_mixed
- Check BOTH previous slot (buffer after it) AND next slot (buffer before it)
## Bottleneck Analysis
- Uses ACTUAL scheduled_start and scheduled_end from the generated schedule
- NEVER compute total_duration from theoretical formulas (duration + buffer)
- total_duration = scheduled_end of last flight - scheduled_start of first flight in chain
## Environment Variables for Testing
RUNWAY_COUNT=2 RUNWAY_LENGTHS=3000,3500 GATE_COUNT=5 GROUND_CREW_COUNT=3
## MCP Interface
Tools (5): submit_flight, generate_schedule, get_airport_status, cancel_flight, analyze_bottlenecks
Resources (3): airport://flights, airport://runways, airport://timeline
