import os
import sys

os.environ.setdefault("RUNWAY_COUNT", "2")
os.environ.setdefault("RUNWAY_LENGTHS", "3000,3500")
os.environ.setdefault("GATE_COUNT", "5")
os.environ.setdefault("GROUND_CREW_COUNT", "3")

sys.path.insert(0, os.path.dirname(__file__))

from config import load_config
from models import FlightStatus
from airport_state import AirportState
from scheduler import generate_schedule

CONFIG = load_config()


def _no_runway_overlaps(state: AirportState) -> list[str]:
    """Return a list of overlap descriptions; empty means no violations."""
    violations = []
    for runway in state.runways:
        slots = runway.slots
        for i in range(len(slots)):
            for j in range(i + 1, len(slots)):
                a, b = slots[i], slots[j]
                if not (a.end <= b.start or b.end <= a.start):
                    violations.append(
                        f"{runway.id}: slot {a.flight_number}[{a.start},{a.end}) "
                        f"overlaps {b.flight_number}[{b.start},{b.end})"
                    )
    return violations


# ---------------------------------------------------------------------------
# Scenario 1: Morning Rush
# ---------------------------------------------------------------------------

def test_morning_rush():
    print("\n=== SCENARIO 1: Morning Rush ===")
    state = AirportState(CONFIG)

    state.submit_flight("AA100", "arrival", "high")
    state.submit_flight("BB200", "departure", "medium")
    state.submit_flight("CC300", "arrival", "low")
    state.submit_flight("DD400", "departure", "low")

    result = generate_schedule(state, CONFIG)

    for fn in ("AA100", "BB200", "CC300", "DD400"):
        f = state.flights[fn]
        print(f"  {fn}: status={f.status.value}  runway={f.assigned_runway}"
              f"  gate={f.assigned_gate}  [{f.scheduled_start},{f.scheduled_end})")
        assert f.status == FlightStatus.SCHEDULED, (
            f"{fn} expected SCHEDULED, got {f.status.value}"
        )

    overlaps = _no_runway_overlaps(state)
    assert not overlaps, "Runway overlap(s) detected:\n  " + "\n  ".join(overlaps)

    aa = state.flights["AA100"]
    cc = state.flights["CC300"]
    assert aa.scheduled_start <= cc.scheduled_start, (
        f"Priority violated: AA100 (high) starts at {aa.scheduled_start} "
        f"but CC300 (low) starts at {cc.scheduled_start}"
    )

    print(f"  Priority check: AA100 start={aa.scheduled_start} <= CC300 start={cc.scheduled_start} ✓")
    print(f"  scheduled={result['scheduled_count']}, unscheduled={result['unscheduled_count']}")
    print("  PASS")


# ---------------------------------------------------------------------------
# Scenario 2: Heavy Hauler
# ---------------------------------------------------------------------------

def test_heavy_hauler():
    print("\n=== SCENARIO 2: Heavy Hauler ===")
    state = AirportState(CONFIG)

    state.submit_flight("XX900", "departure", "high", runway_requirement=5000)

    generate_schedule(state, CONFIG)

    xx = state.flights["XX900"]
    print(f"  XX900: status={xx.status.value}  reason={xx.unscheduled_reason!r}")

    assert xx.status == FlightStatus.UNSCHEDULED, (
        f"XX900 expected UNSCHEDULED, got {xx.status.value}"
    )

    reason_lower = (xx.unscheduled_reason or "").lower()
    assert "runway" in reason_lower or "length" in reason_lower, (
        f"Unscheduled reason does not mention runway/length: {xx.unscheduled_reason!r}"
    )

    print("  PASS")


# ---------------------------------------------------------------------------
# Scenario 3: Connecting Flight
# ---------------------------------------------------------------------------

def test_connecting_flight():
    print("\n=== SCENARIO 3: Connecting Flight ===")
    state = AirportState(CONFIG)

    state.submit_flight("IN100", "arrival", "high")
    state.submit_flight("OUT200", "departure", "medium", dependencies=["IN100"])

    generate_schedule(state, CONFIG)

    in100 = state.flights["IN100"]
    out200 = state.flights["OUT200"]

    print(f"  IN100 : status={in100.status.value}  [{in100.scheduled_start},{in100.scheduled_end})")
    print(f"  OUT200: status={out200.status.value}  [{out200.scheduled_start},{out200.scheduled_end})"
          f"  deps={out200.dependencies}")

    assert in100.status == FlightStatus.SCHEDULED, (
        f"IN100 expected SCHEDULED, got {in100.status.value}"
    )
    assert out200.status == FlightStatus.SCHEDULED, (
        f"OUT200 expected SCHEDULED, got {out200.status.value} "
        f"(reason: {out200.unscheduled_reason})"
    )

    min_start = in100.scheduled_end + CONFIG.dependency_buffer
    assert out200.scheduled_start >= min_start, (
        f"OUT200 must start >= IN100.end({in100.scheduled_end}) + "
        f"buffer({CONFIG.dependency_buffer}) = {min_start}, "
        f"but starts at {out200.scheduled_start}"
    )

    print(
        f"  Dependency buffer: OUT200.start({out200.scheduled_start}) >= "
        f"IN100.end({in100.scheduled_end}) + {CONFIG.dependency_buffer} = {min_start} ✓"
    )
    print("  PASS")
