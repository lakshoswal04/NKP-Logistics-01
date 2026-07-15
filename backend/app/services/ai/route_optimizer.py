"""Vehicle routing (CVRP) via Google OR-Tools, per PRD §5.

Given a depot, pending shipments (destination city + load) and a vehicle
fleet, returns per-vehicle stop sequences that minimize total distance while
respecting capacity. Falls back to a greedy nearest-neighbour plan if the
solver can't produce a solution in its time budget.
"""

from dataclasses import dataclass

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.services.maps.cities import CITY_COORDS
from app.services.maps.mock import ROAD_FACTOR, haversine_km


@dataclass
class Stop:
    shipment_ref: str
    city: str
    load_kg: float


@dataclass
class VehicleSpec:
    name: str
    capacity_kg: float


def _distance_km(a: str, b: str) -> float:
    if a == b:
        return 0.0
    return haversine_km(CITY_COORDS[a], CITY_COORDS[b]) * ROAD_FACTOR


def _greedy_fallback(depot: str, stops: list[Stop], vehicles: list[VehicleSpec]) -> list[list[int]]:
    remaining = list(range(len(stops)))
    routes: list[list[int]] = []
    for v in vehicles:
        route, load, here = [], 0.0, depot
        while remaining:
            candidates = [i for i in remaining if load + stops[i].load_kg <= v.capacity_kg]
            if not candidates:
                break
            nxt = min(candidates, key=lambda i: _distance_km(here, stops[i].city))
            route.append(nxt)
            load += stops[nxt].load_kg
            here = stops[nxt].city
            remaining.remove(nxt)
        routes.append(route)
    return routes


def optimize_routes(depot: str, stops: list[Stop], vehicles: list[VehicleSpec]) -> dict:
    depot = depot.strip().lower()
    if depot not in CITY_COORDS:
        raise ValueError(f"Unknown depot city {depot!r}")
    for s in stops:
        s.city = s.city.strip().lower()
        if s.city not in CITY_COORDS:
            raise ValueError(f"Unknown destination city {s.city!r}")

    cities = [depot] + [s.city for s in stops]
    matrix = [[int(_distance_km(a, b) * 10) for b in cities] for a in cities]
    demands = [0] + [int(s.load_kg) for s in stops]

    manager = pywrapcp.RoutingIndexManager(len(cities), len(vehicles), 0)
    routing = pywrapcp.RoutingModel(manager)

    transit_cb = routing.RegisterTransitCallback(
        lambda i, j: matrix[manager.IndexToNode(i)][manager.IndexToNode(j)]
    )
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb)

    demand_cb = routing.RegisterUnaryTransitCallback(lambda i: demands[manager.IndexToNode(i)])
    routing.AddDimensionWithVehicleCapacity(
        demand_cb, 0, [int(v.capacity_kg) for v in vehicles], True, "Capacity"
    )

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.FromSeconds(2)

    solution = routing.SolveWithParameters(params)

    if solution:
        vehicle_routes: list[list[int]] = []
        for v in range(len(vehicles)):
            idx = routing.Start(v)
            route = []
            while not routing.IsEnd(idx):
                node = manager.IndexToNode(idx)
                if node != 0:
                    route.append(node - 1)  # stop index
                idx = solution.Value(routing.NextVar(idx))
            vehicle_routes.append(route)
        solver = "or-tools CVRP (guided local search)"
    else:
        vehicle_routes = _greedy_fallback(depot, stops, vehicles)
        solver = "greedy nearest-neighbour fallback"

    # Naive baseline for the savings figure: each vehicle out-and-back in input order
    def route_distance(route: list[int]) -> float:
        km, here = 0.0, depot
        for i in route:
            km += _distance_km(here, stops[i].city)
            here = stops[i].city
        km += _distance_km(here, depot)
        return km

    chunk = max(1, -(-len(stops) // len(vehicles)))
    naive_km = sum(
        route_distance(list(range(i, min(i + chunk, len(stops)))))
        for i in range(0, len(stops), chunk)
    )

    routes_out = []
    total_km = 0.0
    for v, route in zip(vehicles, vehicle_routes, strict=True):
        km = route_distance(route) if route else 0.0
        load = sum(stops[i].load_kg for i in route)
        total_km += km
        routes_out.append(
            {
                "vehicle": v.name,
                "capacity_kg": v.capacity_kg,
                "load_kg": round(load, 0),
                "utilization": round(load / v.capacity_kg, 3) if v.capacity_kg else 0,
                "distance_km": round(km, 1),
                "stops": [
                    {
                        "order": n + 1,
                        "shipment_ref": stops[i].shipment_ref,
                        "city": stops[i].city.title(),
                        "load_kg": stops[i].load_kg,
                        "lat": CITY_COORDS[stops[i].city][0],
                        "lng": CITY_COORDS[stops[i].city][1],
                    }
                    for n, i in enumerate(route)
                ],
            }
        )

    assigned = sum(len(r["stops"]) for r in routes_out)
    return {
        "depot": depot.title(),
        "depot_lat": CITY_COORDS[depot][0],
        "depot_lng": CITY_COORDS[depot][1],
        "solver": solver,
        "routes": routes_out,
        "total_distance_km": round(total_km, 1),
        "naive_distance_km": round(naive_km, 1),
        "distance_saved_km": round(max(naive_km - total_km, 0), 1),
        "unassigned": len(stops) - assigned,
    }
