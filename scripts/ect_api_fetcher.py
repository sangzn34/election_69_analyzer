"""
ECT API Data Fetcher - ดึงข้อมูลการเลือกตั้ง 69 จาก กกต. โดยตรง
===============================================================
ดึงข้อมูลจาก 7 API endpoints ของ กกต.:
- Static (refs): info_province, info_constituency, info_party_overview, info_mp_candidate, info_party_candidate
- Live (stats): stats_cons, stats_party
"""

import requests
import json
import os
import time
from datetime import datetime

# === Configuration ===
BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "ect_api")

STATIC_BASE = "https://static-ectreport69.ect.go.th/data/data/refs"
STATS_BASE = "https://stats-ectreport69.ect.go.th/data/records"

API_ENDPOINTS = {
    # Group 1: Static Reference Data (info_*)
    "info_province": f"{STATIC_BASE}/info_province.json",
    "info_constituency": f"{STATIC_BASE}/info_constituency.json",
    "info_party_overview": f"{STATIC_BASE}/info_party_overview.json",
    "info_mp_candidate": f"{STATIC_BASE}/info_mp_candidate.json",
    "info_party_candidate": f"{STATIC_BASE}/info_party_candidate.json",
    # Group 2: Live Stats Data (stats_*)
    "stats_cons": f"{STATS_BASE}/stats_cons.json",
    "stats_party": f"{STATS_BASE}/stats_party.json",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
}


def fetch_endpoint(name: str, url: str) -> dict | list | None:
    """Fetch a single API endpoint."""
    print(f"  📡 Fetching {name}...")
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        data = response.json()
        size_kb = len(response.content) / 1024
        print(f"  ✅ {name}: {size_kb:.1f} KB")
        return data
    except requests.exceptions.RequestException as e:
        print(f"  ❌ {name} failed: {e}")
        return None


def save_json(data, filepath: str):
    """Save data to JSON file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def fetch_all():
    """Fetch all 7 API endpoints and save to data/ect_api/"""
    print("=" * 60)
    print(f"🗳️  ECT Election 69 Data Fetcher")
    print(f"📅 Fetch time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    os.makedirs(BASE_DIR, exist_ok=True)

    results = {}
    success_count = 0
    fail_count = 0

    for name, url in API_ENDPOINTS.items():
        data = fetch_endpoint(name, url)
        if data is not None:
            filepath = os.path.join(BASE_DIR, f"{name}.json")
            save_json(data, filepath)
            results[name] = data
            success_count += 1
        else:
            fail_count += 1
        time.sleep(0.5)  # Rate limiting

    # Save metadata
    metadata = {
        "fetched_at": datetime.now().isoformat(),
        "endpoints": {name: url for name, url in API_ENDPOINTS.items()},
        "success": success_count,
        "failed": fail_count,
    }
    save_json(metadata, os.path.join(BASE_DIR, "_metadata.json"))

    print("\n" + "=" * 60)
    print(f"📊 Results: {success_count} success, {fail_count} failed")
    print(f"📁 Data saved to: {BASE_DIR}")
    print("=" * 60)

    return results


if __name__ == "__main__":
    fetch_all()
