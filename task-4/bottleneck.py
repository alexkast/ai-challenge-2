"""Critical-chain (bottleneck) analysis for the ATC scheduling system."""

from airport_state import AirportState
from models import AirportConfig, FlightStatus


def analyze_bottlenecks(state: AirportState, config: AirportConfig) -> dict:
    """Return the critical dependency chain among currently scheduled flights."""

    # --- 1. Collect scheduled flights and build DAG ---
    scheduled = {
        fn: f
        for fn, f in state.flights.items()
        if f.status == FlightStatus.SCHEDULED
    }

    # adj[dep_id] -> list of dependent flight_numbers (forward edges)
    adj: dict[str, list[str]] = {fn: [] for fn in scheduled}
    # deps_in_dag[fn] -> list of scheduled dependency flight_numbers (for root detection)
    deps_in_dag: dict[str, list[str]] = {fn: [] for fn in scheduled}

    has_edges = False
    for fn, f in scheduled.items():
        for dep_id in f.dependencies:
            if dep_id in scheduled:
                adj[dep_id].append(fn)
                deps_in_dag[fn].append(dep_id)
                has_edges = True

    if not has_edges:
        return {
            "has_bottleneck": False,
            "critical_chain": [],
            "total_duration": 0,
            "chain_length": 0,
            "dependency_buffers_total": 0,
        }

    # --- 2 & 3. Roots and leaves ---
    roots = sorted(fn for fn in scheduled if not deps_in_dag[fn])
    leaves = {fn: True for fn in scheduled if not adj[fn]}

    # --- 4. DFS: enumerate all root-to-leaf paths ---
    all_paths: list[list[str]] = []

    def _dfs(node: str, path: list[str]) -> None:
        path.append(node)
        if node in leaves:
            all_paths.append(list(path))
        else:
            for neighbour in sorted(adj[node]):
                _dfs(neighbour, path)
        path.pop()

    for root in roots:
        _dfs(root, [])

    # --- 5 & 6. Select critical chain by maximum total_duration ---
    best_path: list[str] | None = None
    best_duration = -1

    for path in all_paths:
        first = scheduled[path[0]]
        last = scheduled[path[-1]]
        duration = last.scheduled_end - first.scheduled_start
        if duration > best_duration:
            best_duration = duration
            best_path = path

    if best_path is None:
        return {
            "has_bottleneck": True,
            "critical_chain": [],
            "total_duration": 0,
            "chain_length": 0,
            "dependency_buffers_total": 0,
        }

    chain = [
        {
            "flight_number": scheduled[fn].flight_number,
            "operation": scheduled[fn].operation.value,
            "priority": scheduled[fn].priority.name.lower(),
            "scheduled_start": scheduled[fn].scheduled_start,
            "scheduled_end": scheduled[fn].scheduled_end,
        }
        for fn in best_path
    ]

    buffers_total = sum(
        scheduled[best_path[i + 1]].scheduled_start - scheduled[best_path[i]].scheduled_end
        for i in range(len(best_path) - 1)
    )

    return {
        "has_bottleneck": True,
        "critical_chain": chain,
        "total_duration": best_duration,
        "chain_length": len(best_path),
        "dependency_buffers_total": buffers_total,
    }
