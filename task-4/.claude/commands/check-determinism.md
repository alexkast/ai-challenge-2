Verify that the scheduler produces deterministic results by running it twice and comparing outputs.
Run this Python code and confirm both runs produce identical results:
import os
os.environ.update({
    "RUNWAY_COUNT": "2",
    "RUNWAY_LENGTHS": "3000,3500",
    "GATE_COUNT": "5",
    "GROUND_CREW_COUNT": "3"
})
from config import load_config
from airport_state import AirportState
from scheduler import generate_schedule
def run_schedule():
    config = load_config()
    state = AirportState(config)
    state.submit_flight("AA100", "arrival", "high")
    state.submit_flight("BB200", "departure", "medium")
    state.submit_flight("CC300", "arrival", "low")
    state.submit_flight("DD400", "departure", "low")
    generate_schedule(state, config)
    return [
        (f.flight_number, f.scheduled_start, f.scheduled_end, f.assigned_runway, f.assigned_gate)
        for f in sorted(state.flights.values(), key=lambda x: x.submission_order)
        if f.scheduled_start is not None
    ]
run1 = run_schedule()
run2 = run_schedule()
assert run1 == run2, f"NON-DETERMINISTIC RESULT!\nRun 1: {run1}\nRun 2: {run2}"
print("DETERMINISM CHECK PASSED")
for entry in run1:
    print(f"  {entry}")
If the assertion fails, identify which flights differ and investigate the sorting or resource selection logic in scheduler.py.
