"""Week 15: Comprehensive Load Testing & Performance Benchmarking."""

import asyncio
import statistics
import json
from datetime import datetime
from typing import Dict, List, Any
import logging

import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class LoadTestConfig(BaseModel):
    """Configuration for load testing."""
    
    base_url: str = "http://localhost:8000"
    concurrent_users: int = 10
    total_requests: int = 1000
    ramp_up_time_sec: int = 10
    test_duration_sec: int = 60
    think_time_sec: float = 0.1
    timeout_sec: int = 30


class LoadTestResult:
    """Store and analyze load test results."""
    
    def __init__(self):
        self.response_times: List[float] = []
        self.status_codes: Dict[int, int] = {}
        self.errors: List[str] = []
        self.start_time: datetime = datetime.now()
        self.end_time: datetime = None
        self.requests_completed: int = 0
        self.requests_failed: int = 0
    
    def add_response(self, response_time: float, status_code: int):
        """Record a response."""
        self.response_times.append(response_time)
        self.status_codes[status_code] = self.status_codes.get(status_code, 0) + 1
        
        if 200 <= status_code < 300:
            self.requests_completed += 1
        else:
            self.requests_failed += 1
    
    def add_error(self, error: str):
        """Record an error."""
        self.errors.append(error)
        self.requests_failed += 1
    
    def get_summary(self) -> Dict[str, Any]:
        """Generate test summary."""
        
        if not self.response_times:
            return {"error": "No successful responses"}
        
        self.end_time = datetime.now()
        duration = (self.end_time - self.start_time).total_seconds()
        
        sorted_times = sorted(self.response_times)
        
        return {
            "test_duration_sec": duration,
            "total_requests": self.requests_completed + self.requests_failed,
            "successful_requests": self.requests_completed,
            "failed_requests": self.requests_failed,
            "success_rate": f"{(self.requests_completed / (self.requests_completed + self.requests_failed) * 100):.1f}%",
            "requests_per_sec": round(self.requests_completed / duration),
            
            "response_times_ms": {
                "min": round(min(sorted_times) * 1000, 2),
                "max": round(max(sorted_times) * 1000, 2),
                "mean": round(statistics.mean(self.response_times) * 1000, 2),
                "median": round(statistics.median(self.response_times) * 1000, 2),
                "p95": round(sorted_times[int(len(sorted_times) * 0.95)] * 1000, 2),
                "p99": round(sorted_times[int(len(sorted_times) * 0.99)] * 1000, 2),
                "stdev": round(statistics.stdev(self.response_times) * 1000, 2) if len(self.response_times) > 1 else 0,
            },
            
            "status_codes": self.status_codes,
            "error_count": len(self.errors),
            "sample_errors": self.errors[:5],  # First 5 errors
        }


class LoadTester:
    """Comprehensive load testing tool."""
    
    def __init__(self, config: LoadTestConfig):
        self.config = config
        self.result = LoadTestResult()
    
    async def run_test(self):
        """Run load test."""
        
        logger.info(f"Starting load test: {self.config.concurrent_users} users")
        logger.info(f"Target: {self.config.base_url}")
        
        # Create tasks for concurrent users
        tasks = []
        requests_per_user = self.config.total_requests // self.config.concurrent_users
        
        for user_id in range(self.config.concurrent_users):
            task = self._user_session(user_id, requests_per_user)
            tasks.append(task)
        
        # Run all tasks concurrently
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Print results
        summary = self.result.get_summary()
        self._print_results(summary)
        
        return summary
    
    async def _user_session(self, user_id: int, num_requests: int):
        """Simulate a user session making multiple requests."""
        
        async with httpx.AsyncClient(timeout=self.config.timeout_sec) as client:
            for req_num in range(num_requests):
                try:
                    # Rotate through different endpoints
                    endpoints = [
                        "/api/health",
                        "/api/predictions/conflict-risk",
                        "/api/intelligence/entity-extraction",
                        "/api/knowledge-graph/nodes",
                    ]
                    
                    endpoint = endpoints[req_num % len(endpoints)]
                    
                    # Make request
                    start = datetime.now()
                    response = await client.get(f"{self.config.base_url}{endpoint}")
                    duration = (datetime.now() - start).total_seconds()
                    
                    # Record result
                    self.result.add_response(duration, response.status_code)
                    
                    # Think time
                    await asyncio.sleep(self.config.think_time_sec)
                    
                except Exception as e:
                    self.result.add_error(str(e))
    
    def _print_results(self, summary: Dict[str, Any]):
        """Print formatted test results."""
        
        print("\n" + "=" * 60)
        print("LOAD TEST RESULTS")
        print("=" * 60)
        
        print(f"\nTest Duration: {summary['test_duration_sec']:.1f} seconds")
        print(f"Total Requests: {summary['total_requests']}")
        print(f"Successful: {summary['successful_requests']}")
        print(f"Failed: {summary['failed_requests']}")
        print(f"Success Rate: {summary['success_rate']}")
        print(f"Throughput: {summary['requests_per_sec']} req/sec")
        
        print(f"\nResponse Times (ms):")
        rt = summary['response_times_ms']
        print(f"  Min:    {rt['min']}")
        print(f"  Mean:   {rt['mean']}")
        print(f"  Median: {rt['median']}")
        print(f"  p95:    {rt['p95']}")
        print(f"  p99:    {rt['p99']}")
        print(f"  Max:    {rt['max']}")
        print(f"  Stdev:  {rt['stdev']}")
        
        print(f"\nStatus Codes:")
        for code, count in sorted(summary['status_codes'].items()):
            print(f"  {code}: {count}")
        
        if summary['error_count'] > 0:
            print(f"\nErrors ({summary['error_count']}):")
            for error in summary['sample_errors']:
                print(f"  - {error[:60]}...")
        
        print("=" * 60 + "\n")


class EndToEndScenarioTester:
    """Test common user workflows end-to-end."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30)
        self.results = []
    
    async def test_conflict_prediction_workflow(self):
        """Test: User requests conflict prediction for a region."""
        
        logger.info("Testing: Conflict prediction workflow")
        
        payload = {
            "region": "Kenya",
            "confidence_threshold": 0.7,
        }
        
        try:
            response = await self.client.post(
                f"{self.base_url}/api/predictions/conflict-risk",
                json=payload
            )
            
            assert response.status_code == 200, f"Got {response.status_code}"
            data = response.json()
            assert "prediction_id" in data
            assert "conflict_risk_score" in data
            
            logger.info("✓ Conflict prediction workflow passed")
            self.results.append(("Conflict prediction", True))
        except Exception as e:
            logger.error(f"✗ Conflict prediction workflow failed: {e}")
            self.results.append(("Conflict prediction", False))
    
    async def test_intelligence_search_workflow(self):
        """Test: User searches intelligence database."""
        
        logger.info("Testing: Intelligence search workflow")
        
        try:
            response = await self.client.post(
                f"{self.base_url}/api/intelligence/search",
                json={"query": "al-qaeda"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "results" in data or "data" in data
            
            logger.info("✓ Intelligence search workflow passed")
            self.results.append(("Intelligence search", True))
        except Exception as e:
            logger.error(f"✗ Intelligence search workflow failed: {e}")
            self.results.append(("Intelligence search", False))
    
    async def test_export_request_workflow(self):
        """Test: User requests data export."""
        
        logger.info("Testing: Export request workflow")
        
        payload = {
            "dataset_id": "ds_001",
            "format": "csv",
            "filters": {"region": "East Africa"},
        }
        
        try:
            response = await self.client.post(
                f"{self.base_url}/api/exports/request",
                json=payload
            )
            
            # Should either succeed or require auth
            assert response.status_code in [200, 201, 401, 403]
            
            logger.info("✓ Export request workflow passed")
            self.results.append(("Export request", True))
        except Exception as e:
            logger.error(f"✗ Export request workflow failed: {e}")
            self.results.append(("Export request", False))
    
    async def test_complete_workflow(self):
        """Run all workflow tests."""
        
        logger.info("Starting end-to-end workflow tests...")
        
        await self.test_conflict_prediction_workflow()
        await self.test_intelligence_search_workflow()
        await self.test_export_request_workflow()
        
        # Print summary
        passed = sum(1 for _, result in self.results if result)
        total = len(self.results)
        
        print(f"\n{'=' * 50}")
        print(f"End-to-End Test Results: {passed}/{total} passed")
        print(f"{'=' * 50}")
        
        for workflow, passed in self.results:
            status = "✓" if passed else "✗"
            print(f"{status} {workflow}")
        
        await self.client.aclose()


class PerformanceBenchmark:
    """Benchmark critical endpoints."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.benchmarks = {}
    
    async def benchmark_endpoint(self, method: str, endpoint: str, 
                                iterations: int = 100, payload: dict = None):
        """Benchmark an endpoint."""
        
        times = []
        
        async with httpx.AsyncClient() as client:
            for _ in range(iterations):
                try:
                    start = datetime.now()
                    
                    if method.upper() == "GET":
                        response = await client.get(f"{self.base_url}{endpoint}")
                    elif method.upper() == "POST":
                        response = await client.post(f"{self.base_url}{endpoint}", json=payload)
                    
                    duration = (datetime.now() - start).total_seconds() * 1000
                    times.append(duration)
                except Exception as e:
                    logger.warning(f"Benchmark error: {e}")
        
        if times:
            sorted_times = sorted(times)
            self.benchmarks[endpoint] = {
                "method": method,
                "iterations": iterations,
                "mean_ms": round(statistics.mean(times), 2),
                "median_ms": round(statistics.median(times), 2),
                "p95_ms": round(sorted_times[int(len(sorted_times) * 0.95)], 2),
                "p99_ms": round(sorted_times[int(len(sorted_times) * 0.99)], 2),
                "min_ms": round(min(times), 2),
                "max_ms": round(max(times), 2),
            }
    
    async def run_benchmarks(self):
        """Run all benchmarks."""
        
        await self.benchmark_endpoint("GET", "/api/health")
        await self.benchmark_endpoint("GET", "/api/predictions/list")
        await self.benchmark_endpoint("POST", "/api/predictions/conflict-risk", 
                                     payload={"region": "Kenya"})
        
        self._print_benchmarks()
    
    def _print_benchmarks(self):
        """Print benchmark results."""
        
        print(f"\n{'=' * 80}")
        print("PERFORMANCE BENCHMARKS")
        print(f"{'=' * 80}")
        
        for endpoint, metrics in sorted(self.benchmarks.items()):
            print(f"\n{metrics['method']} {endpoint}")
            print(f"  Iterations: {metrics['iterations']}")
            print(f"  Mean:   {metrics['mean_ms']:6.2f} ms")
            print(f"  Median: {metrics['median_ms']:6.2f} ms")
            print(f"  p95:    {metrics['p95_ms']:6.2f} ms")
            print(f"  p99:    {metrics['p99_ms']:6.2f} ms")
            print(f"  Min:    {metrics['min_ms']:6.2f} ms")
            print(f"  Max:    {metrics['max_ms']:6.2f} ms")


async def main():
    """Run performance tests."""
    
    # 1. Run load test
    config = LoadTestConfig(
        concurrent_users=50,
        total_requests=500,
    )
    tester = LoadTester(config)
    await tester.run_test()
    
    # 2. Run end-to-end tests
    e2e = EndToEndScenarioTester()
    await e2e.test_complete_workflow()
    
    # 3. Run benchmarks
    benchmark = PerformanceBenchmark()
    await benchmark.run_benchmarks()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
