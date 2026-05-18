"""Pydantic models for the ATC MCP server."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class FlightStatus(str, Enum):
    """Lifecycle state of a flight in the scheduling system."""

    QUEUED = "QUEUED"
    SCHEDULED = "SCHEDULED"
    UNSCHEDULED = "UNSCHEDULED"
    CANCELLED = "CANCELLED"


class OperationType(str, Enum):
    """Whether the flight is arriving or departing."""

    ARRIVAL = "ARRIVAL"
    DEPARTURE = "DEPARTURE"


class Priority(int, Enum):
    """Scheduling priority; lower integer value means higher priority."""

    HIGH = 1
    MEDIUM = 2
    LOW = 3


class Flight(BaseModel):
    """A flight request submitted to the ATC scheduling system."""

    flight_number: str
    operation: OperationType
    priority: Priority
    status: FlightStatus = FlightStatus.QUEUED
    dependencies: list[str] = Field(default_factory=list)
    runway_requirement: Optional[int] = None
    assigned_runway: Optional[str] = None
    assigned_gate: Optional[str] = None
    scheduled_start: Optional[int] = None
    scheduled_end: Optional[int] = None
    unscheduled_reason: Optional[str] = None
    submission_order: int


class RunwaySlot(BaseModel):
    """A time slot reserved on a runway for one flight operation."""

    flight_number: str
    operation: OperationType
    start: int
    end: int


class GateSlot(BaseModel):
    """A time slot reserved at a gate for one flight."""

    flight_number: str
    start: int
    end: int


class Runway(BaseModel):
    """A runway resource with its physical length and booked slots."""

    id: str
    length: int
    slots: list[RunwaySlot] = Field(default_factory=list)


class Gate(BaseModel):
    """An airport gate with its booked occupancy slots."""

    id: str
    slots: list[GateSlot] = Field(default_factory=list)


class AirportConfig(BaseModel):
    """Static configuration that governs the scheduling algorithm."""

    runway_count: int
    runway_lengths: list[int]
    gate_count: int
    ground_crew_count: int
    separation_takeoff: int
    separation_landing: int
    separation_mixed: int
    gate_turnaround_time: int
    dependency_buffer: int
    max_scheduling_horizon: int
    operation_duration_arrival: int = 15
    operation_duration_departure: int = 12
