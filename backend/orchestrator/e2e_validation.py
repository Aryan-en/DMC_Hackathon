"""Phase-1 E2E validation and lightweight benchmarks."""

from __future__ import annotations

import asyncio
import sys
import time
from pathlib import Path
from statistics import mean

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from orchestrator.test_nlp_pipeline import run_checks


def data_quality_checks() -> dict:
    checks = run_checks()
    return {
        "entity_count_nonzero": checks["entity_count"] > 0,
        "token_count_nonzero": checks["token_count"] > 0,
        "dependency_pipeline_present": checks["dependency_count"] >= 0,
    }


def performance_benchmark(iterations: int = 10) -> dict:
    timings = []
    for _ in range(iterations):
        start = time.perf_counter()
        run_checks()
        timings.append((time.perf_counter() - start) * 1000)

    return {
        "iterations": iterations,
        "avg_latency_ms": round(mean(timings), 3),
        "max_latency_ms": round(max(timings), 3),
        "min_latency_ms": round(min(timings), 3),
    }


async def run_all() -> dict:
    return {
        "quality": data_quality_checks(),
        "performance": performance_benchmark(),
    }


if __name__ == "__main__":
    print(asyncio.run(run_all()))
