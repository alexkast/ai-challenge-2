import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from models import AirportConfig, OperationType, Runway, RunwaySlot
from scheduler import check_runway_separation

CONFIG = AirportConfig(
    runway_count=1,
    runway_lengths=[3000],
    gate_count=1,
    ground_crew_count=10,
    separation_takeoff=3,
    separation_landing=3,
    separation_mixed=5,
    gate_turnaround_time=30,
    dependency_buffer=15,
    max_scheduling_horizon=480,
)


def build_runway(slots: list[RunwaySlot]) -> Runway:
    return Runway(id="RW-1", length=3000, slots=slots)


def test_empty_runway_allows_departure():
    runway = build_runway([])
    assert check_runway_separation(runway, OperationType.DEPARTURE, 0, 12, CONFIG) is True


def test_departure_after_departure_separation():
    slot = RunwaySlot(flight_number="A", operation=OperationType.DEPARTURE, start=0, end=12)
    runway = build_runway([slot])
    # 12 + 3 = 15; start=14 violates, start=15 is allowed
    assert check_runway_separation(runway, OperationType.DEPARTURE, 14, 26, CONFIG) is False
    assert check_runway_separation(runway, OperationType.DEPARTURE, 15, 27, CONFIG) is True


def test_arrival_after_departure_separation():
    slot = RunwaySlot(flight_number="A", operation=OperationType.DEPARTURE, start=0, end=12)
    runway = build_runway([slot])
    # 12 + 5 = 17 (mixed); start=16 violates, start=17 is allowed
    assert check_runway_separation(runway, OperationType.ARRIVAL, 16, 31, CONFIG) is False
    assert check_runway_separation(runway, OperationType.ARRIVAL, 17, 32, CONFIG) is True


def test_arrival_after_arrival_separation():
    slot = RunwaySlot(flight_number="A", operation=OperationType.ARRIVAL, start=0, end=15)
    runway = build_runway([slot])
    # 15 + 3 = 18; start=17 violates, start=18 is allowed
    assert check_runway_separation(runway, OperationType.ARRIVAL, 17, 32, CONFIG) is False
    assert check_runway_separation(runway, OperationType.ARRIVAL, 18, 33, CONFIG) is True


def test_departure_after_arrival_separation():
    slot = RunwaySlot(flight_number="A", operation=OperationType.ARRIVAL, start=0, end=15)
    runway = build_runway([slot])
    # 15 + 5 = 20 (mixed); start=19 violates, start=20 is allowed
    assert check_runway_separation(runway, OperationType.DEPARTURE, 19, 31, CONFIG) is False
    assert check_runway_separation(runway, OperationType.DEPARTURE, 20, 32, CONFIG) is True


def test_insertion_between_two_slots():
    slots = [
        RunwaySlot(flight_number="A", operation=OperationType.ARRIVAL, start=0, end=15),
        RunwaySlot(flight_number="B", operation=OperationType.DEPARTURE, start=30, end=42),
    ]
    runway = build_runway(slots)
    # [18, 30]: end=30, next slot starts at 30 < 30+5=35 → violates pre-departure buffer
    assert check_runway_separation(runway, OperationType.ARRIVAL, 18, 30, CONFIG) is False
    # [18, 25]: end=25, next slot starts at 30 >= 25+5=30 → exactly meets buffer → allowed
    assert check_runway_separation(runway, OperationType.ARRIVAL, 18, 25, CONFIG) is True
