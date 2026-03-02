from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("Testing /api/health (should be excluded from rate limiting)...")
for i in range(10):
    r = client.get("/api/health")
    if r.status_code != 200:
        print(f"Health check failed on attempt {i+1} with status {r.status_code}")

print("\nTesting an arbitrary API endpoint to trigger unauthenticated rate limit (5 calls/min)...")
success_calls = 0
rate_limited_calls = 0

for i in range(7):
    # This might return 401 or 404, but after 5 calls it should return 429
    r = client.get("/api/v1/nonexistent") 
    if r.status_code == 429:
        rate_limited_calls += 1
        print(f"Call {i+1}: 429 Rate Limited")
    else:
        success_calls += 1
        print(f"Call {i+1}: Allowed (Status {r.status_code})")

if rate_limited_calls == 2 and success_calls == 5:
    print("\nSUCCESS: Rate limiter works correctly!")
else:
    print(f"\nFAILURE: Expected 5 allowed and 2 limited, got {success_calls} allowed and {rate_limited_calls} limited.")
