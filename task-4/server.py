"""MCP server entry point for the Air Traffic Control scheduling system."""

import json
from typing import Optional

from mcp.server.fastmcp import FastMCP

from airport_state import AirportState
from bottleneck import analyze_bottlenecks as _analyze_bottlenecks
from config import load_config
from scheduler import generate_schedule as _generate_schedule

# ---------------------------------------------------------------------------
# Startup: config and global state (exits on misconfiguration)
# ---------------------------------------------------------------------------

config = load_config()
state = AirportState(config)

# ---------------------------------------------------------------------------
# Server instance
# ---------------------------------------------------------------------------

mcp = FastMCP("Air Traffic Control")

# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def submit_flight(
    flight_number: str,
    operation: str,
    priority: str,
    dependencies: Optional[list[str]] = None,
    runway_requirement: Optional[int] = None,
) -> str:
    """Submit a new flight to the airport queue. Specify operation type
    (arrival/departure), priority (high/medium/low), optional list of
    flight_number dependencies, and optional minimum runway length requirement in meters."""
    try:
        result = state.submit_flight(
            flight_number, operation, priority, dependencies or [], runway_requirement
        )
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
async def generate_schedule() -> str:
    """Generate or refresh the airport schedule. Replaces the current schedule
    with a freshly computed one based on the current flight queue and airport
    configuration. Call this after submitting flights to see scheduled times."""
    try:
        result = _generate_schedule(state, config)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
async def get_airport_status() -> str:
    """Get current airport operational status: flight counts by state and operation type,
    runway and gate capacity and usage, ground crew utilization, resource constraint
    indicators, unscheduled flights with reasons, and schedule completion time."""
    try:
        result = state.get_status()
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
async def cancel_flight(flight_number: str) -> str:
    """Cancel a flight. The flight is marked CANCELLED. Dependent flights are identified
    but not auto-cancelled — they will be re-evaluated as UNSCHEDULED on the next
    generate_schedule call."""
    try:
        result = state.cancel_flight(flight_number)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.tool()
async def analyze_bottlenecks() -> str:
    """Identify the critical dependency chain — the ordered sequence of dependent flights
    that drives the total schedule duration. Uses actual scheduled times from the
    generated schedule, not theoretical estimates."""
    try:
        result = _analyze_bottlenecks(state, config)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ---------------------------------------------------------------------------
# Resources
# ---------------------------------------------------------------------------

@mcp.resource("airport://flights")
async def flights_resource() -> str:
    """Complete list of all flights with current status, assigned runway and gate,
    scheduled start/end times, dependencies, and unscheduled reason if applicable.
    Includes queued, scheduled, unscheduled, and cancelled flights."""
    try:
        return json.dumps(state.get_all_flights())
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.resource("airport://runways")
async def runways_resource() -> str:
    """Runway configuration, length, and scheduled usage slots showing which flights
    are assigned to each runway and their time slots."""
    try:
        return json.dumps(state.get_runway_usage())
    except Exception as e:
        return json.dumps({"error": str(e)})


@mcp.resource("airport://timeline")
async def timeline_resource() -> str:
    """Chronological timeline of all scheduled operations sorted by start time.
    Shows flight number, operation type, priority, assigned runway, gate,
    start and end times, and dependencies."""
    try:
        return json.dumps(state.get_timeline())
    except Exception as e:
        return json.dumps({"error": str(e)})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run()
