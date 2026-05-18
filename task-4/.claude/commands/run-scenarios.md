Run all three validation scenarios for the ATC MCP server and report results.
Execute the test script with the standard test configuration:
RUNWAY_COUNT=2 RUNWAY_LENGTHS=3000,3500 GATE_COUNT=5 GROUND_CREW_COUNT=3 python test_scheduler.py
Report the pass/fail status of each scenario:
1. Morning Rush — mixed priority scheduling
2. Heavy Hauler — oversized runway requirement
3. Connecting Flight — dependency chain with buffer
If any scenario fails, show the assertion error and the actual vs expected values.
