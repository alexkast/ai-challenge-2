"""Load and validate airport configuration from environment variables."""

import os
import sys

from models import AirportConfig


def _get_positive_int(name: str) -> int:
    raw = os.environ.get(name)
    if raw is None:
        print(f"ERROR: required environment variable '{name}' is not set.")
        sys.exit(1)
    try:
        value = int(raw)
    except ValueError:
        print(f"ERROR: '{name}' must be an integer, got: {raw!r}")
        sys.exit(1)
    if value <= 0:
        print(f"ERROR: '{name}' must be a positive integer, got: {value}")
        sys.exit(1)
    return value


def _get_non_negative_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        value = int(raw)
    except ValueError:
        print(f"ERROR: '{name}' must be an integer, got: {raw!r}")
        sys.exit(1)
    if value < 0:
        print(f"ERROR: '{name}' must be a non-negative integer, got: {value}")
        sys.exit(1)
    return value


def load_config() -> AirportConfig:
    """Read environment variables and return a validated AirportConfig."""
    runway_count = _get_positive_int("RUNWAY_COUNT")
    gate_count = _get_positive_int("GATE_COUNT")
    ground_crew_count = _get_positive_int("GROUND_CREW_COUNT")

    raw_lengths = os.environ.get("RUNWAY_LENGTHS")
    if raw_lengths is None:
        print("ERROR: required environment variable 'RUNWAY_LENGTHS' is not set.")
        sys.exit(1)
    try:
        runway_lengths = [int(v.strip()) for v in raw_lengths.split(",")]
    except ValueError:
        print(f"ERROR: 'RUNWAY_LENGTHS' must be comma-separated integers, got: {raw_lengths!r}")
        sys.exit(1)
    if any(l <= 0 for l in runway_lengths):
        print(f"ERROR: every value in 'RUNWAY_LENGTHS' must be a positive integer, got: {runway_lengths}")
        sys.exit(1)
    if len(runway_lengths) != runway_count:
        print(
            f"ERROR: 'RUNWAY_LENGTHS' has {len(runway_lengths)} value(s) but "
            f"'RUNWAY_COUNT' is {runway_count}; they must be equal."
        )
        sys.exit(1)

    return AirportConfig(
        runway_count=runway_count,
        runway_lengths=runway_lengths,
        gate_count=gate_count,
        ground_crew_count=ground_crew_count,
        separation_takeoff=_get_non_negative_int("SEPARATION_TAKEOFF", 3),
        separation_landing=_get_non_negative_int("SEPARATION_LANDING", 3),
        separation_mixed=_get_non_negative_int("SEPARATION_MIXED", 5),
        gate_turnaround_time=_get_non_negative_int("GATE_TURNAROUND_TIME", 30),
        dependency_buffer=_get_non_negative_int("DEPENDENCY_BUFFER", 15),
        max_scheduling_horizon=_get_non_negative_int("MAX_SCHEDULING_HORIZON", 480),
        operation_duration_arrival=_get_non_negative_int("OPERATION_DURATION_ARRIVAL", 15),
        operation_duration_departure=_get_non_negative_int("OPERATION_DURATION_DEPARTURE", 12),
    )
