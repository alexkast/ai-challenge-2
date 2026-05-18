"""Flight scheduling algorithm for the ATC MCP server."""

from typing import Optional

from airport_state import AirportState
from models import (
    AirportConfig,
    Flight,
    FlightStatus,
    Gate,
    GateSlot,
    OperationType,
    RunwaySlot,
)


# ---------------------------------------------------------------------------
# Buffer helpers
# ---------------------------------------------------------------------------

def required_buffer(op_before: OperationType, op_after: OperationType, config: AirportConfig) -> int:
    """Return the minimum separation in minutes required between two operations on the same runway."""
    if op_before == OperationType.DEPARTURE and op_after == OperationType.DEPARTURE:
        return config.separation_takeoff
    if op_before == OperationType.ARRIVAL and op_after == OperationType.ARRIVAL:
        return config.separation_landing
    return config.separation_mixed


def check_runway_separation(runway, new_op_type: OperationType, start: int, end: int, config: AirportConfig) -> bool:
    """Return True if [start, end) can be placed on runway without violating separation rules."""
    for slot in runway.slots:
        # Direct overlap
        if slot.start < end and slot.end > start:
            return False
        # Slot ends before start — enforce post-slot buffer
        if slot.end <= start:
            required = required_buffer(slot.operation, new_op_type, config)
            if start < slot.end + required:
                return False
        # Slot starts after end — enforce post-new-op buffer
        if slot.start >= end:
            required = required_buffer(new_op_type, slot.operation, config)
            if slot.start < end + required:
                return False
    return True


# ---------------------------------------------------------------------------
# Discrete-event jump helpers
# ---------------------------------------------------------------------------

def compute_next_runway_candidate(runway, op_type: OperationType, T: int, duration: int, config: AirportConfig) -> int:
    """Return the earliest T' > T that clears all runway-separation conflicts at T."""
    best = T + 1
    for slot in runway.slots:
        buf_after_slot = required_buffer(slot.operation, op_type, config)
        buf_after_new = required_buffer(op_type, slot.operation, config)

        blocked = False
        if slot.start < T + duration and slot.end > T:
            # Direct overlap
            blocked = True
        elif slot.end <= T and T < slot.end + buf_after_slot:
            # Too close after an existing slot
            blocked = True
        elif slot.start >= T + duration and slot.start < T + duration + buf_after_new:
            # Future slot is too close after the proposed operation
            blocked = True

        if blocked:
            candidate = slot.end + buf_after_slot
            if candidate > best:
                best = candidate

    return best


def count_concurrent_operations(state: AirportState, start: int, end: int) -> int:
    """Count SCHEDULED flights whose window overlaps [start, end)."""
    count = 0
    for flight in state.flights.values():
        if (
            flight.status == FlightStatus.SCHEDULED
            and flight.scheduled_start is not None
            and flight.scheduled_end is not None
            and flight.scheduled_start < end
            and flight.scheduled_end > start
        ):
            count += 1
    return count


def find_earliest_crew_release(state: AirportState, start: int, end: int) -> int:
    """Return the earliest scheduled_end among SCHEDULED flights overlapping [start, end)."""
    min_end: Optional[int] = None
    for flight in state.flights.values():
        if (
            flight.status == FlightStatus.SCHEDULED
            and flight.scheduled_start is not None
            and flight.scheduled_end is not None
            and flight.scheduled_start < end
            and flight.scheduled_end > start
        ):
            if min_end is None or flight.scheduled_end < min_end:
                min_end = flight.scheduled_end
    return min_end if min_end is not None else end + 1


# ---------------------------------------------------------------------------
# Core slot-search function
# ---------------------------------------------------------------------------

def find_earliest_feasible_time(
    flight: Flight,
    earliest_start: int,
    runway,
    state: AirportState,
    config: AirportConfig,
) -> Optional[tuple[int, int, Gate]]:
    """Return (start, end, gate) for the earliest feasible slot on runway, or None."""
    duration = (
        config.operation_duration_arrival
        if flight.operation == OperationType.ARRIVAL
        else config.operation_duration_departure
    )
    T = earliest_start

    for _ in range(50):
        if T + duration > config.max_scheduling_horizon:
            return None

        # Check 1: runway separation
        if not check_runway_separation(runway, flight.operation, T, T + duration, config):
            T = compute_next_runway_candidate(runway, flight.operation, T, duration, config)
            continue

        # Check 2: gate availability — pick earliest-available gate
        best_gate: Optional[Gate] = None
        best_gate_time: Optional[int] = None
        for gate in sorted(state.gates, key=lambda g: g.id):
            gate_available = 0
            if gate.slots:
                gate_available = max(s.end for s in gate.slots) + config.gate_turnaround_time
            if gate_available <= T:
                best_gate = gate
                best_gate_time = T
                break
            elif best_gate is None or gate_available < best_gate_time:
                best_gate = gate
                best_gate_time = gate_available

        if best_gate_time > T:
            T = best_gate_time
            continue

        # Check 3: ground crew capacity
        active_ops = count_concurrent_operations(state, T, T + duration)
        if active_ops >= config.ground_crew_count:
            T = find_earliest_crew_release(state, T, T + duration)
            continue

        return (T, T + duration, best_gate)

    return None  # max iterations exceeded


# ---------------------------------------------------------------------------
# Per-flight scheduling
# ---------------------------------------------------------------------------

def _try_schedule_flight(flight: Flight, state: AirportState, config: AirportConfig) -> None:
    """Attempt to schedule flight in-place; sets SCHEDULED or UNSCHEDULED with reason."""

    # Step A — dependency check
    earliest_start = 0
    for dep_id in flight.dependencies:
        dep = state.flights.get(dep_id)
        if dep is None or dep.status == FlightStatus.CANCELLED:
            flight.status = FlightStatus.UNSCHEDULED
            flight.unscheduled_reason = f"dependency {dep_id} is cancelled"
            return
        if dep.status != FlightStatus.SCHEDULED:
            flight.status = FlightStatus.UNSCHEDULED
            flight.unscheduled_reason = f"dependency {dep_id} not yet scheduled"
            return
        dep_earliest = (dep.scheduled_end or 0) + config.dependency_buffer
        if dep_earliest > earliest_start:
            earliest_start = dep_earliest

    # Step B — runway filter
    if flight.runway_requirement is not None:
        suitable = [r for r in state.runways if r.length >= flight.runway_requirement]
    else:
        suitable = list(state.runways)

    if not suitable:
        flight.status = FlightStatus.UNSCHEDULED
        flight.unscheduled_reason = (
            f"no runway meets minimum length requirement of {flight.runway_requirement}m"
        )
        return

    suitable = sorted(suitable, key=lambda r: r.id)

    # Step C — find best slot across all suitable runways
    best_start: Optional[int] = None
    best_end: Optional[int] = None
    best_runway = None
    best_gate: Optional[Gate] = None

    for runway in suitable:
        result = find_earliest_feasible_time(flight, earliest_start, runway, state, config)
        if result is None:
            continue
        t_start, t_end, gate = result
        if (
            best_start is None
            or t_start < best_start
            or (t_start == best_start and runway.id < best_runway.id)
        ):
            best_start = t_start
            best_end = t_end
            best_runway = runway
            best_gate = gate

    if best_runway is None:
        flight.status = FlightStatus.UNSCHEDULED
        flight.unscheduled_reason = "no resources available within scheduling horizon"
        return

    # Step D — assign
    flight.status = FlightStatus.SCHEDULED
    flight.assigned_runway = best_runway.id
    flight.assigned_gate = best_gate.id
    flight.scheduled_start = best_start
    flight.scheduled_end = best_end

    best_runway.slots.append(RunwaySlot(
        flight_number=flight.flight_number,
        operation=flight.operation,
        start=best_start,
        end=best_end,
    ))
    best_gate.slots.append(GateSlot(
        flight_number=flight.flight_number,
        start=best_start,
        end=best_end,
    ))


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_schedule(state: AirportState, config: AirportConfig) -> dict:
    """Reset state, schedule all non-cancelled flights, and return a summary."""
    state.reset_schedule()

    to_schedule = [f for f in state.flights.values() if f.status != FlightStatus.CANCELLED]
    to_schedule.sort(key=lambda f: (f.priority.value, f.submission_order))

    for flight in to_schedule:
        _try_schedule_flight(flight, state, config)

    all_flights = list(state.flights.values())
    scheduled = [f for f in all_flights if f.status == FlightStatus.SCHEDULED]
    unscheduled = [f for f in all_flights if f.status == FlightStatus.UNSCHEDULED]
    total = len([f for f in all_flights if f.status != FlightStatus.CANCELLED])

    completion_time: Optional[int] = None
    if scheduled:
        completion_time = max(f.scheduled_end for f in scheduled if f.scheduled_end is not None)

    return {
        "scheduled_count": len(scheduled),
        "unscheduled_count": len(unscheduled),
        "total_flights": total,
        "completion_time": completion_time,
        "scheduled_flights": [
            {
                "flight_number": f.flight_number,
                "operation": f.operation.value,
                "priority": f.priority.name.lower(),
                "runway": f.assigned_runway,
                "gate": f.assigned_gate,
                "start": f.scheduled_start,
                "end": f.scheduled_end,
                "dependencies": f.dependencies,
            }
            for f in sorted(scheduled, key=lambda f: (f.scheduled_start or 0))
        ],
        "unscheduled_flights": [
            {"flight_number": f.flight_number, "reason": f.unscheduled_reason or ""}
            for f in unscheduled
        ],
    }
