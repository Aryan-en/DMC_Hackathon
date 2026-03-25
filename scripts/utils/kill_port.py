#!/usr/bin/env python3
"""Kill processes holding port 8000"""
import subprocess
import sys
import time

# PIDs found to be using port 8000
pids_to_kill = [40620, 46228, 45820]

print("[INFO] Attempting to kill processes using port 8000...")
for pid in pids_to_kill:
    try:
        # Try using wmic to kill
        result = subprocess.run(
            f'wmic process where processid={pid} delete',
            shell=True,
            capture_output=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"[OK] Killed process {pid}")
        else:
            print(f"[SKIP] Could not kill process {pid}")
    except Exception as e:
        print(f"[WARN] Error killing {pid}: {e}")

print("[INFO] Waiting 2 seconds for ports to release...")
time.sleep(2)

print("[INFO] Checking port status...")
result = subprocess.run(
    'netstat -ano | findstr :8000',
    shell=True,
    capture_output=True,
    text=True
)

if result.stdout:
    print("[WARN] Port 8000 still in use:")
    print(result.stdout[:200])
else:
    print("[OK] Port 8000 is now free!")
