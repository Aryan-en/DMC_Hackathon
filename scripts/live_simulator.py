import asyncio
import time
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'backend'))

from tasks.ingestion import generate_simulated_metrics

def simulate_loop():
    print("ONTORA Dynamic Telemetry Simulator v1.0")
    print("Generating oscillating CPU/Network metrics [1s interval]...")
    while True:
        try:
            # Task handles its own loop
            generate_simulated_metrics()
            print(".", end="", flush=True)
        except Exception as e:
            print(f"\nSimulation Error: {e}")
        time.sleep(1)

if __name__ == "__main__":
    try:
        simulate_loop()
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
