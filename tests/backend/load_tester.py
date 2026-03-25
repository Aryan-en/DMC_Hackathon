"""Load testing and performance benchmarking."""

import asyncio
import time
import statistics
from typing import List, Dict, Optional, Callable, Coroutine
import aiohttp
from datetime import datetime


class LoadTestMetrics:
    """Metrics collected during load test."""
    
    def __init__(self):
        self.response_times: List[float] = []
        self.status_codes: Dict[int, int] = {}
        self.errors: List[str] = []
        self.start_time = None
        self.end_time = None
    
    def add_response(self, response_time: float, status_code: int):
        """Record a response."""
        self.response_times.append(response_time)
        self.status_codes[status_code] = self.status_codes.get(status_code, 0) + 1
    
    def add_error(self, error: str):
        """Record an error."""
        self.errors.append(error)
    
    def get_summary(self) -> Dict:
        """Get test summary."""
        if not self.response_times:
            return {
                "status": "error",
                "message": "No responses received",
                "total_requests": 0,
                "errors": len(self.errors)
            }
        
        duration = (self.end_time - self.start_time).total_seconds() if self.end_time and self.start_time else 0
        
        return {
            "total_requests": len(self.response_times),
            "successful": sum(1 for sc in self.status_codes if 200 <= sc < 300),
            "failed": len(self.errors),
            "status_codes": self.status_codes,
            "response_times": {
                "min": round(min(self.response_times), 3),
                "max": round(max(self.response_times), 3),
                "mean": round(statistics.mean(self.response_times), 3),
                "median": round(statistics.median(self.response_times), 3),
                "stdev": round(statistics.stdev(self.response_times), 3) if len(self.response_times) > 1 else 0,
                "p95": round(sorted(self.response_times)[int(len(self.response_times) * 0.95)], 3) if self.response_times else 0,
                "p99": round(sorted(self.response_times)[int(len(self.response_times) * 0.99)], 3) if self.response_times else 0,
            },
            "throughput": {
                "requests_per_second": round(len(self.response_times) / duration, 2) if duration > 0 else 0,
                "total_duration_seconds": round(duration, 2),
            },
            "errors": self.errors[:10]  # First 10 errors
        }


class LoadTester:
    """Load testing utility."""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.metrics = LoadTestMetrics()
    
    async def test_endpoint(self, method: str, path: str, num_requests: int = 100,
                           concurrent_users: int = 10, payload: Optional[Dict] = None) -> Dict:
        """Run load test on an endpoint."""
        print(f"Starting load test: {method} {path}")
        print(f"  Total requests: {num_requests}")
        print(f"  Concurrent users: {concurrent_users}")
        print(f"  Base URL: {self.base_url}")
        
        self.metrics.start_time = datetime.utcnow()
        
        url = f"{self.base_url}{path}"
        
        async with aiohttp.ClientSession() as session:
            # Create tasks for all requests
            tasks = []
            for i in range(num_requests):
                task = self._make_request(session, method, url, payload)
                tasks.append(task)
                
                # Stagger requests to simulate users (not all at once)
                if (i + 1) % concurrent_users == 0:
                    await asyncio.gather(*tasks)
                    tasks = []
            
            # Wait for remaining tasks
            if tasks:
                await asyncio.gather(*tasks)
        
        self.metrics.end_time = datetime.utcnow()
        
        summary = self.metrics.get_summary()
        self._print_summary(summary)
        
        return summary
    
    async def _make_request(self, session: aiohttp.ClientSession, method: str,
                           url: str, payload: Optional[Dict] = None):
        """Make a single request and record metrics."""
        start_time = time.time()
        
        try:
            async with session.request(method, url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                response_time = time.time() - start_time
                self.metrics.add_response(response_time, response.status)
        except asyncio.TimeoutError:
            response_time = time.time() - start_time
            self.metrics.add_error(f"Timeout after {response_time:.2f}s")
        except Exception as e:
            response_time = time.time() - start_time
            self.metrics.add_error(str(e))
    
    def _print_summary(self, summary: Dict):
        """Print test summary."""
        print("\n" + "="*50)
        print("LOAD TEST RESULTS")
        print("="*50)
        print(f"Total Requests: {summary['total_requests']}")
        print(f"Successful: {summary.get('successful', 0)}")
        print(f"Failed: {summary['failed']}")
        print(f"\nResponse Times (ms):")
        rt = summary['response_times']
        print(f"  Min: {rt['min']*1000:.2f}ms")
        print(f"  Max: {rt['max']*1000:.2f}ms")
        print(f"  Mean: {rt['mean']*1000:.2f}ms")
        print(f"  Median: {rt['median']*1000:.2f}ms")
        print(f"  P95: {rt['p95']*1000:.2f}ms")
        print(f"  P99: {rt['p99']*1000:.2f}ms")
        print(f"\nThroughput: {summary['throughput']['requests_per_second']} req/s")
        print(f"Duration: {summary['throughput']['total_duration_seconds']}s")
        if summary.get('status_codes'):
            print(f"\nStatus Codes:")
            for code, count in summary['status_codes'].items():
                print(f"  {code}: {count}")
        if summary['errors']:
            print(f"\nErrors (first 10):")
            for error in summary['errors']:
                print(f"  - {error}")
        print("="*50 + "\n")


class StressTest:
    """Stress testing to find breaking point."""
    
    def __init__(self, base_url: str):
        self.base_url = base_url
    
    async def run(self, method: str, path: str, initial_users: int = 10,
                 increment: int = 10, max_users: int = 100) -> Dict:
        """Run stress test incrementally increasing load."""
        print(f"Starting stress test: {method} {path}")
        print(f"  Initial users: {initial_users}")
        print(f"  User increment: {increment}")
        print(f"  Max users: {max_users}")
        
        results = []
        current_users = initial_users
        
        while current_users <= max_users:
            print(f"\nTesting with {current_users} concurrent users...")
            tester = LoadTester(self.base_url)
            summary = await tester.test_endpoint(method, path, num_requests=current_users*10, 
                                                concurrent_users=current_users)
            
            results.append({
                "users": current_users,
                "throughput": summary['throughput']['requests_per_second'],
                "p95_latency": summary['response_times']['p95'],
                "error_rate": (summary['failed'] / summary['total_requests']) if summary['total_requests'] > 0 else 0
            })
            
            # Check for breaking point (>10% error rate)
            if results[-1]['error_rate'] > 0.1:
                print(f"Breaking point found at {current_users} users (error rate: {results[-1]['error_rate']*100:.1f}%)")
                break
            
            current_users += increment
        
        return {
            "results": results,
            "recommended_max_users": results[-2]['users'] if len(results) > 1 else initial_users
        }
