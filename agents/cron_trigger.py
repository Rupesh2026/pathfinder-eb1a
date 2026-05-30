"""Called by Render cron services to trigger agent endpoints."""
import sys
import os
import httpx

ENDPOINTS = {
    "daily": "/run-daily-agents",
    "weekly": "/run-weekly-reflection",
}

if len(sys.argv) != 2 or sys.argv[1] not in ENDPOINTS:
    print(f"Usage: python cron_trigger.py [daily|weekly]")
    sys.exit(1)

service_url = os.environ["SERVICE_URL"].rstrip("/")
cron_api_key = os.environ["CRON_API_KEY"]
endpoint = ENDPOINTS[sys.argv[1]]
url = service_url + endpoint

print(f"POST {url}")
response = httpx.post(url, headers={"X-Api-Key": cron_api_key}, timeout=600)
response.raise_for_status()
print(response.json())
