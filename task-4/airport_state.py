"""In-memory state for the ATC scheduling system."""

from models import (
    AirportConfig,
    Flight,
    FlightStatus,
    Gate,
    GateSlot,
    OperationType,
    Priority,
    Runway,
    RunwaySlot,
)

_OPERATION_MAP = {
    "arrival": OperationType.ARRIVAL,
    "departure": OperationType.DEPARTURE,
}

_PRIORITY_MAP = {
    "high": Priority.HIGH,
    "medium": Priority.MEDIUM,
    "low": Priority.LOW,
}


class AirportState:
    """Holds all mutable airport state: flights, runways, and gates."""

    def __init__(self, config: AirportConfig) -> None:
        self.config = config
        self.flights: dict[str, Flight] = {}
        self.runways: list[Runway] = [
            Runway(id=f"RW-{i + 1}", length=config.runway_lengths[i])
            for i in range(config.runway_count)
        ]
        self.gates: list[Gate] = [
            Gate(id=f"G-{i + 1}")
            for i in range(config.gate_count)
        ]
        self._submission_counter: int = 0

    # ------------------------------------------------------------------
    # 1. submit_flight
    # ------------------------------------------------------------------

    def submit_flight(
        self,
        flight_number: str,
        operation: str,
        priority: str,
        dependencies: list[str] | None = None,
        runway_requirement: int | None = None,
    ) -> dict:
        """Queue a new flight for scheduling."""
        if flight_number in self.flights:
            raise ValueError(f"Flight '{flight_number}' already exists.")

        op = _OPERATION_MAP.get(operation.lower())
        if op is None:
            raise ValueError(f"Invalid operation '{operation}'; must be 'arrival' or 'departure'.")

        pri = _PRIORITY_MAP.get(priority.lower())
        if pri is None:
            raise ValueError(f"Invalid priority '{priority}'; must be 'high', 'medium', or 'low'.")

        deps = dependencies or []
        for dep in deps:
            if dep not in self.flights:
                raise ValueError(f"Dependency flight '{dep}' does not exist.")

        flight = Flight(
            flight_number=flight_number,
            operation=op,
            priority=pri,
            status=FlightStatus.QUEUED,
            dependencies=deps,
            runway_requirement=runway_requirement,
            submission_order=self._submission_counter,
        )
        self._submission_counter += 1
        self.flights[flight_number] = flight

        return {
            "flight_number": flight.flight_number,
            "operation": flight.operation.value,
            "priority": flight.priority.name.lower(),
            "status": flight.status.value,
            "dependencies": flight.dependencies,
            "runway_requirement": flight.runway_requirement,
            "submission_order": flight.submission_order,
        }

    # ------------------------------------------------------------------
    # 2. cancel_flight
    # ------------------------------------------------------------------

    def cancel_flight(self, flight_number: str) -> dict:
        """Cancel a flight and report transitively dependent flights."""
        if flight_number not in self.flights:
            raise ValueError(f"Flight '{flight_number}' does not exist.")
        flight = self.flights[flight_number]
        if flight.status == FlightStatus.CANCELLED:
            raise ValueError(f"Flight '{flight_number}' is already cancelled.")

        was_scheduled = flight.status == FlightStatus.SCHEDULED
        flight.status = FlightStatus.CANCELLED

        # If the flight held resources, free them immediately so resource endpoints
        # reflect the cancellation without requiring a generate_schedule call.
        if was_scheduled:
            for rw in self.runways:
                if rw.id == flight.assigned_runway:
                    rw.slots = [s for s in rw.slots if s.flight_number != flight_number]
            for gate in self.gates:
                if gate.id == flight.assigned_gate:
                    gate.slots = [s for s in gate.slots if s.flight_number != flight_number]
            flight.assigned_runway = None
            flight.assigned_gate = None
            flight.scheduled_start = None
            flight.scheduled_end = None

        # Find all flights that transitively depend on the cancelled flight.
        affected: list[str] = []
        visited: dict[str, bool] = {}

        def _collect(fn: str) -> None:
            for f in sorted(self.flights.values(), key=lambda x: x.submission_order):
                if fn in f.dependencies and f.flight_number not in visited:
                    visited[f.flight_number] = True
                    affected.append(f.flight_number)
                    _collect(f.flight_number)

        _collect(flight_number)

        return {"cancelled": flight_number, "affected_dependents": affected}

    # ------------------------------------------------------------------
    # 3. get_all_flights
    # ------------------------------------------------------------------

    def get_all_flights(self) -> list[dict]:
        """Return all flights sorted by submission order."""
        sorted_flights = sorted(self.flights.values(), key=lambda f: f.submission_order)
        return [self._flight_to_dict(f) for f in sorted_flights]

    # ------------------------------------------------------------------
    # 4. get_status
    # ------------------------------------------------------------------

    def get_status(self) -> dict:
        """Return an aggregate status snapshot of the airport."""
        all_flights = list(self.flights.values())
        not_cancelled = [f for f in all_flights if f.status != FlightStatus.CANCELLED]
        total = len(not_cancelled)

        by_status = {s.value.lower(): 0 for s in FlightStatus}
        by_op = {o.value.lower(): 0 for o in OperationType}
        for f in all_flights:
            by_status[f.status.value.lower()] += 1
            if f.status != FlightStatus.CANCELLED:
                by_op[f.operation.value.lower()] += 1

        runway_usage = []
        for rw in self.runways:
            ops = len(rw.slots)
            util = (ops / total * 100) if total > 0 else 0.0
            runway_usage.append({
                "id": rw.id,
                "length": rw.length,
                "scheduled_operations": ops,
                "utilization_percent": round(util, 2),
            })

        gate_usage = []
        for gate in self.gates:
            ops = len(gate.slots)
            util = (ops / total * 100) if total > 0 else 0.0
            gate_usage.append({
                "id": gate.id,
                "scheduled_operations": ops,
                "utilization_percent": round(util, 2),
            })

        # Peak concurrent ground-crew usage: count overlapping scheduled operations.
        scheduled = [f for f in all_flights if f.status == FlightStatus.SCHEDULED]
        peak = self._peak_concurrent(scheduled)

        constraints = []
        if self.config.ground_crew_count < peak:
            constraints.append({
                "type": "ground_crew",
                "description": (
                    f"Peak concurrent operations ({peak}) exceeds "
                    f"ground crew count ({self.config.ground_crew_count})."
                ),
            })

        unscheduled_flights = [
            {"flight_number": f.flight_number, "reason": f.unscheduled_reason or ""}
            for f in all_flights
            if f.status == FlightStatus.UNSCHEDULED
        ]

        completion_time: int | None = None
        if scheduled:
            completion_time = max(f.scheduled_end for f in scheduled if f.scheduled_end is not None)

        return {
            "flight_counts": {"by_status": by_status, "by_operation": by_op},
            "runway_usage": runway_usage,
            "gate_usage": gate_usage,
            "ground_crew": {
                "total": self.config.ground_crew_count,
                "peak_concurrent_usage": peak,
            },
            "constraints": constraints,
            "unscheduled_flights": unscheduled_flights,
            "schedule_completion_time": completion_time,
        }

    # ------------------------------------------------------------------
    # 5. get_runway_usage
    # ------------------------------------------------------------------

    def get_runway_usage(self) -> list[dict]:
        """Return per-runway slot details."""
        result = []
        for rw in self.runways:
            result.append({
                "id": rw.id,
                "length": rw.length,
                "slots": [
                    {
                        "flight_number": s.flight_number,
                        "operation": s.operation.value,
                        "start": s.start,
                        "end": s.end,
                    }
                    for s in rw.slots
                ],
            })
        return result

    # ------------------------------------------------------------------
    # 6. get_timeline
    # ------------------------------------------------------------------

    def get_timeline(self) -> list[dict]:
        """Return all scheduled flights sorted by start time."""
        scheduled = [
            f for f in self.flights.values() if f.status == FlightStatus.SCHEDULED
        ]
        scheduled.sort(key=lambda f: (f.scheduled_start or 0))
        return [
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
            for f in scheduled
        ]

    # ------------------------------------------------------------------
    # 7. reset_schedule
    # ------------------------------------------------------------------

    def reset_schedule(self) -> None:
        """Clear all scheduling results, returning queued flights to QUEUED."""
        for f in self.flights.values():
            if f.status in (FlightStatus.SCHEDULED, FlightStatus.UNSCHEDULED):
                f.status = FlightStatus.QUEUED
            f.assigned_runway = None
            f.assigned_gate = None
            f.scheduled_start = None
            f.scheduled_end = None
            f.unscheduled_reason = None
        for rw in self.runways:
            rw.slots = []
        for gate in self.gates:
            gate.slots = []

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _flight_to_dict(f: Flight) -> dict:
        return {
            "flight_number": f.flight_number,
            "operation": f.operation.value,
            "priority": f.priority.name.lower(),
            "status": f.status.value,
            "dependencies": f.dependencies,
            "runway_requirement": f.runway_requirement,
            "assigned_runway": f.assigned_runway,
            "assigned_gate": f.assigned_gate,
            "scheduled_start": f.scheduled_start,
            "scheduled_end": f.scheduled_end,
            "unscheduled_reason": f.unscheduled_reason,
            "submission_order": f.submission_order,
        }

    @staticmethod
    def _peak_concurrent(flights: list[Flight]) -> int:
        """Return the maximum number of flights active at the same time."""
        if not flights:
            return 0
        events: list[tuple[int, int]] = []
        for f in flights:
            if f.scheduled_start is not None and f.scheduled_end is not None:
                events.append((f.scheduled_start, 1))
                events.append((f.scheduled_end, -1))
        events.sort(key=lambda e: (e[0], e[1]))
        peak = current = 0
        for _, delta in events:
            current += delta
            if current > peak:
                peak = current
        return peak
