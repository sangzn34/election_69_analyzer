#!/usr/bin/env python3
"""
Election 69 News Scraper
========================
Scrape ข่าวเลือกตั้ง 2569 จากหลายแหล่งข่าว แล้ว export เป็น JSON
ให้คุณกรองข่าวที่เกี่ยวข้องไปใส่ ElectionNews.tsx ได้สะดวก

Usage:
    python scripts/news_scraper.py
    python scripts/news_scraper.py --pages 3
    python scripts/news_scraper.py --source khaosod
    python scripts/news_scraper.py --keyword "บาร์โค้ด"
"""

import requests
from bs4 import BeautifulSoup
import json
import os
import re
import time
import argparse
from datetime import datetime
from urllib.parse import urljoin, quote

# ─── Configuration ───────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "news")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "scraped_news.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "th,en;q=0.9",
}

# ข่าว keyword สำหรับกรองข่าวเลือกตั้ง
ELECTION_KEYWORDS = [
    "เลือกตั้ง", "กกต", "บัตรเลือกตั้ง", "นับคะแนน", "บาร์โค้ด",
    "หีบบัตร", "ทุจริต", "ซื้อเสียง", "โมฆะ", "บัตรเขย่ง",
    "หัวคะแนน", "ผู้สมัคร สส", "ปาร์ตี้ลิสต์", "เขตเลือกตั้ง",
    "คะแนนเสียง", "ผลเลือกตั้ง", "คูหา", "ต้นขั้ว", "QR Code",
    "ศาลรธน", "ศาลรัฐธรรมนูญ", "ผู้ตรวจการแผ่นดิน",
    "พรรคประชาชน", "ภูมิใจไทย", "เพื่อไทย", "ประชาธิปัตย์",
    "กล้าธรรม", "ไทยสร้างไทย", "พลังประชารัฐ",
]

REQUEST_DELAY = 1.5  # seconds between requests


# ─── Helper Functions ────────────────────────────────────────────
def safe_request(url, max_retries=3):
    """Make HTTP request with retry logic."""
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            return resp
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                print(f"  ⚠️  Retry {attempt+1}/{max_retries} for {url} (wait {wait}s)")
                time.sleep(wait)
            else:
                print(f"  ❌ Failed after {max_retries} attempts: {url}")
                print(f"     Error: {e}")
                return None


def is_election_related(title, summary=""):
    """Check if article is related to elections."""
    text = (title + " " + summary).lower()
    return any(kw.lower() in text for kw in ELECTION_KEYWORDS)


def thai_date_to_standard(thai_date_str):
    """
    Convert Thai date formats to DD/MM/YYYY (Buddhist era).
    Handles: "13 ก.พ. 2569", "13 กุมภาพันธ์ 2569", "2026-02-13" etc.
    """
    thai_months = {
        "ม.ค.": "01", "มกราคม": "01",
        "ก.พ.": "02", "กุมภาพันธ์": "02",
        "มี.ค.": "03", "มีนาคม": "03",
        "เม.ย.": "04", "เมษายน": "04",
        "พ.ค.": "05", "พฤษภาคม": "05",
        "มิ.ย.": "06", "มิถุนายน": "06",
        "ก.ค.": "07", "กรกฎาคม": "07",
        "ส.ค.": "08", "สิงหาคม": "08",
        "ก.ย.": "09", "กันยายน": "09",
        "ต.ค.": "10", "ตุลาคม": "10",
        "พ.ย.": "11", "พฤศจิกายน": "11",
        "ธ.ค.": "12", "ธันวาคม": "12",
    }

    # Try Thai format: "13 ก.พ. 2569" or "13 กุมภาพันธ์ 2569"
    for thai_m, num_m in thai_months.items():
        if thai_m in thai_date_str:
            parts = thai_date_str.strip().split()
            day = parts[0].strip()
            # Find year (4-digit number)
            year = None
            for p in parts:
                p_clean = p.strip().rstrip(".")
                if re.match(r"^\d{4}$", p_clean):
                    year = p_clean
                    break
            if day and year:
                return f"{int(day):02d}/{num_m}/{year}"

    # Try ISO format: "2026-02-13"
    iso_match = re.search(r"(\d{4})-(\d{2})-(\d{2})", thai_date_str)
    if iso_match:
        y, m, d = iso_match.groups()
        be_year = int(y) + 543
        return f"{d}/{m}/{be_year}"

    return thai_date_str


def extract_time(text):
    """Extract time (HH:MM) from text like '13 ก.พ. 2569 17:06 น.' or '10:39 น.'"""
    time_match = re.search(r"(\d{1,2}):(\d{2})\s*น\.?", text)
    if time_match:
        h, m = time_match.groups()
        return f"{int(h):02d}:{m}"
    # Also try HH.MM format
    time_match = re.search(r"(\d{1,2})\.(\d{2})\s*น\.?", text)
    if time_match:
        h, m = time_match.groups()
        return f"{int(h):02d}:{m}"
    return None


# ─── Scrapers for each source ────────────────────────────────────

def scrape_khaosod(pages=2, keyword=None):
    """
    Scrape ข่าวสด (khaosod.co.th)
    - /politics section
    - Search results if keyword provided
    """
    articles = []
    source_name = "ข่าวสด"

    if keyword:
        # Search mode
        urls = [
            f"https://www.khaosod.co.th/search?q={quote(keyword)}&page={p}"
            for p in range(1, pages + 1)
        ]
    else:
        urls = [
            f"https://www.khaosod.co.th/politics?page={p}"
            for p in range(1, pages + 1)
        ]

    for url in urls:
        print(f"  📰 Fetching: {url}")
        resp = safe_request(url)
        if not resp:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        # Find article links
        article_links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/news_" in href and href.startswith("http"):
                article_links.add(href)
            elif "/news_" in href:
                article_links.add(urljoin("https://www.khaosod.co.th", href))

        print(f"    Found {len(article_links)} article links")

        for link in article_links:
            time.sleep(REQUEST_DELAY)
            article = scrape_khaosod_article(link, source_name)
            if article:
                articles.append(article)

    return articles


def scrape_khaosod_article(url, source_name="ข่าวสด"):
    """Scrape a single Khaosod article."""
    resp = safe_request(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_el = soup.find("h1")
    if not title_el:
        return None
    title = title_el.get_text(strip=True)

    if not is_election_related(title):
        print(f"    ⏭️  Skip (not election): {title[:50]}...")
        return None

    # Date/Time — look for pattern like "13 ก.พ. 2569-12:45 น."
    date_str = ""
    time_str = ""

    # Try meta tags first
    meta_date = soup.find("meta", {"property": "article:published_time"})
    if meta_date:
        content = meta_date.get("content", "")
        date_str = thai_date_to_standard(content)
        # Extract time from ISO format
        t_match = re.search(r"T(\d{2}):(\d{2})", content)
        if t_match:
            time_str = f"{t_match.group(1)}:{t_match.group(2)}"

    # Fallback: look in page text
    if not date_str:
        date_els = soup.find_all(string=re.compile(r"\d{1,2}\s+(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s+\d{4}"))
        for el in date_els:
            text = el.strip()
            date_str = thai_date_to_standard(text)
            if not time_str:
                time_str = extract_time(text) or ""
            if date_str:
                break

    # Summary — first paragraph or meta description
    summary = ""
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        summary = meta_desc.get("content", "").strip()

    if not summary:
        # Try first <p> in article body
        article_body = soup.find("div", class_=re.compile(r"article|content|entry"))
        if article_body:
            first_p = article_body.find("p")
            if first_p:
                summary = first_p.get_text(strip=True)[:300]

    # Tags
    tags = []
    tag_els = soup.find_all("a", href=re.compile(r"/tag/"))
    for tag_el in tag_els:
        tag_text = tag_el.get_text(strip=True)
        if tag_text and len(tag_text) < 50:
            tags.append(tag_text)

    print(f"    ✅ {title[:60]}...")

    return {
        "title": title,
        "summary": summary[:500] if summary else "",
        "date": date_str,
        "time": time_str,
        "source": source_name,
        "sourceUrl": url,
        "tags": tags[:8],
    }


def scrape_thairath(pages=2, keyword=None):
    """
    Scrape ไทยรัฐ (thairath.co.th)
    - /news/politic section
    """
    articles = []
    source_name = "ไทยรัฐ"

    if keyword:
        urls = [
            f"https://www.thairath.co.th/search?q={quote(keyword)}&page={p}"
            for p in range(1, pages + 1)
        ]
    else:
        urls = [
            f"https://www.thairath.co.th/news/politic"
        ]
        # Thairath uses infinite scroll, so we mainly get the first page
        # plus search if keyword given

    for url in urls:
        print(f"  📰 Fetching: {url}")
        resp = safe_request(url)
        if not resp:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        article_links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            # Match /news/politic/XXXXXXX pattern
            if re.search(r"/news/politic/\d+", href):
                full_url = urljoin("https://www.thairath.co.th", href)
                article_links.add(full_url)
            # Also match /video/news-update/XXXXXXX
            elif re.search(r"/video/.*?/\d+", href):
                full_url = urljoin("https://www.thairath.co.th", href)
                article_links.add(full_url)

        print(f"    Found {len(article_links)} article links")

        for link in article_links:
            time.sleep(REQUEST_DELAY)
            article = scrape_thairath_article(link, source_name)
            if article:
                articles.append(article)

    return articles


def scrape_thairath_article(url, source_name="ไทยรัฐ"):
    """Scrape a single Thairath article."""
    resp = safe_request(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_el = soup.find("h1")
    if not title_el:
        return None
    title = title_el.get_text(strip=True)

    if not is_election_related(title):
        print(f"    ⏭️  Skip (not election): {title[:50]}...")
        return None

    # Date/Time
    date_str = ""
    time_str = ""

    # Try meta tag
    meta_date = soup.find("meta", {"property": "article:published_time"})
    if meta_date:
        content = meta_date.get("content", "")
        date_str = thai_date_to_standard(content)
        t_match = re.search(r"T(\d{2}):(\d{2})", content)
        if t_match:
            time_str = f"{t_match.group(1)}:{t_match.group(2)}"

    # Fallback: look for visible date text
    if not date_str:
        for el in soup.find_all(string=re.compile(r"\d{1,2}\s+ก\.พ\.\s+\d{4}")):
            text = el.strip()
            date_str = thai_date_to_standard(text)
            time_str = extract_time(text) or ""
            if date_str:
                break

    # Summary
    summary = ""
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        summary = meta_desc.get("content", "").strip()

    # Tags — Thairath uses tag links
    tags = []
    for tag_a in soup.find_all("a", href=re.compile(r"/tag/")):
        t = tag_a.get_text(strip=True)
        if t and len(t) < 50:
            tags.append(t)

    print(f"    ✅ {title[:60]}...")

    return {
        "title": title,
        "summary": summary[:500] if summary else "",
        "date": date_str,
        "time": time_str,
        "source": source_name,
        "sourceUrl": url,
        "tags": tags[:8],
    }


def scrape_matichon(pages=2, keyword=None):
    """
    Scrape มติชน (matichon.co.th)
    - /politics/election69 section
    """
    articles = []
    source_name = "มติชน"

    if keyword:
        urls = [
            f"https://www.matichon.co.th/?s={quote(keyword)}&paged={p}"
            for p in range(1, pages + 1)
        ]
    else:
        urls = [
            f"https://www.matichon.co.th/politics/election69?paged={p}"
            for p in range(1, pages + 1)
        ]

    for url in urls:
        print(f"  📰 Fetching: {url}")
        resp = safe_request(url)
        if not resp:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        article_links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if re.search(r"/news_\d+", href):
                full_url = urljoin("https://www.matichon.co.th", href)
                article_links.add(full_url)

        print(f"    Found {len(article_links)} article links")

        for link in article_links:
            time.sleep(REQUEST_DELAY)
            article = scrape_matichon_article(link, source_name)
            if article:
                articles.append(article)

    return articles


def scrape_matichon_article(url, source_name="มติชน"):
    """Scrape a single Matichon article."""
    resp = safe_request(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_el = soup.find("h1")
    if not title_el:
        return None
    title = title_el.get_text(strip=True)

    if not is_election_related(title):
        print(f"    ⏭️  Skip (not election): {title[:50]}...")
        return None

    # Date/Time
    date_str = ""
    time_str = ""

    meta_date = soup.find("meta", {"property": "article:published_time"})
    if meta_date:
        content = meta_date.get("content", "")
        date_str = thai_date_to_standard(content)
        t_match = re.search(r"T(\d{2}):(\d{2})", content)
        if t_match:
            time_str = f"{t_match.group(1)}:{t_match.group(2)}"

    # Summary
    summary = ""
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        summary = meta_desc.get("content", "").strip()

    # Tags
    tags = []
    for tag_a in soup.find_all("a", href=re.compile(r"/tag/")):
        t = tag_a.get_text(strip=True)
        if t and len(t) < 50:
            tags.append(t)

    print(f"    ✅ {title[:60]}...")

    return {
        "title": title,
        "summary": summary[:500] if summary else "",
        "date": date_str,
        "time": time_str,
        "source": source_name,
        "sourceUrl": url,
        "tags": tags[:8],
    }


def scrape_thaipbs(pages=2, keyword=None):
    """
    Scrape Thai PBS (thaipbs.or.th)
    - /news/categories/politics section
    - Extracts time from <time datetime="..."> tags and JSON-LD datePublished
    """
    articles = []
    source_name = "Thai PBS"

    if keyword:
        urls = [
            f"https://www.thaipbs.or.th/search?q={quote(keyword)}&page={p}"
            for p in range(1, pages + 1)
        ]
    else:
        urls = [
            f"https://www.thaipbs.or.th/news/categories/politics"
        ]

    for url in urls:
        print(f"  📰 Fetching: {url}")
        resp = safe_request(url)
        if not resp:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        article_links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            # Match /news/content/XXXXXX pattern
            if re.search(r"/news/content/\d+", href):
                full_url = urljoin("https://www.thaipbs.or.th", href)
                article_links.add(full_url)
            # Also match /program/*/watch/* and /program/*/episodes/*
            elif re.search(r"/program/.+?/(watch|episodes)/", href):
                full_url = urljoin("https://www.thaipbs.or.th", href)
                article_links.add(full_url)

        print(f"    Found {len(article_links)} article links")

        for link in list(article_links)[:30]:
            time.sleep(REQUEST_DELAY)
            article = scrape_thaipbs_article(link, source_name)
            if article:
                articles.append(article)

    return articles


def scrape_thaipbs_article(url, source_name="Thai PBS"):
    """
    Scrape a single Thai PBS article.

    Thai PBS news pages have:
    - <time datetime="2026-02-12T20:01:48+07:00">12 ก.พ. 69</time>
    - JSON-LD with datePublished

    Thai PBS program pages have:
    - JSON-LD with datePublished and uploadDate
    """
    resp = safe_request(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_el = soup.find("h1")
    if not title_el:
        return None
    title = title_el.get_text(strip=True)

    if not is_election_related(title):
        print(f"    ⏭️  Skip (not election): {title[:50]}...")
        return None

    # Date/Time — prefer <time> tag, then JSON-LD, then meta
    date_str = ""
    time_str = ""

    # Method 1: <time datetime="..."> tag (most accurate for news pages)
    time_tag = soup.find("time", {"datetime": True})
    if time_tag:
        dt_val = time_tag.get("datetime", "")
        # Parse ISO datetime: 2026-02-12T20:01:48+07:00
        iso_match = re.search(r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})", dt_val)
        if iso_match:
            y, m, d, hh, mm = iso_match.groups()
            be_year = int(y) + 543
            date_str = f"{d}/{m}/{be_year}"
            time_str = f"{hh}:{mm}"

    # Method 2: JSON-LD datePublished (works for both news & program pages)
    if not date_str:
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string)
                if isinstance(data, dict):
                    dp = data.get("datePublished", "")
                    if dp:
                        iso_match = re.search(
                            r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})", dp
                        )
                        if iso_match:
                            y, m, d, hh, mm = iso_match.groups()
                            be_year = int(y) + 543
                            date_str = f"{d}/{m}/{be_year}"
                            time_str = f"{hh}:{mm}"
                            break
            except (json.JSONDecodeError, TypeError):
                pass

    # Method 3: meta article:published_time
    if not date_str:
        meta_date = soup.find("meta", {"property": "article:published_time"})
        if meta_date:
            content = meta_date.get("content", "")
            date_str = thai_date_to_standard(content)
            t_match = re.search(r"T(\d{2}):(\d{2})", content)
            if t_match:
                time_str = f"{t_match.group(1)}:{t_match.group(2)}"

    # Summary — meta description
    summary = ""
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        summary = meta_desc.get("content", "").strip()

    if not summary:
        # Try first <p> in article body
        article_body = soup.find("div", class_=re.compile(r"article|content|entry"))
        if article_body:
            first_p = article_body.find("p")
            if first_p:
                summary = first_p.get_text(strip=True)[:300]

    # Tags — Thai PBS uses /tags?q= links
    tags = []
    for tag_a in soup.find_all("a", href=re.compile(r"/tags\?q=")):
        t = tag_a.get_text(strip=True)
        if t and len(t) < 50:
            tags.append(t)

    print(f"    ✅ {title[:60]}...")

    return {
        "title": title,
        "summary": summary[:500] if summary else "",
        "date": date_str,
        "time": time_str,
        "source": source_name,
        "sourceUrl": url,
        "tags": tags[:8],
    }


def scrape_pptv(pages=1, keyword=None):
    """
    Scrape PPTV HD36 (pptvhd36.com)
    - /news/การเมือง section
    """
    articles = []
    source_name = "PPTV HD36"

    base_url = "https://www.pptvhd36.com"

    if keyword:
        urls = [f"{base_url}/search?q={quote(keyword)}"]
    else:
        urls = [f"{base_url}/news/%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%80%E0%B8%A1%E0%B8%B7%E0%B8%AD%E0%B8%87"]

    for url in urls:
        print(f"  📰 Fetching: {url}")
        resp = safe_request(url)
        if not resp:
            continue

        soup = BeautifulSoup(resp.text, "html.parser")

        article_links = set()
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if re.search(r"/news/.*?/\d+", href):
                full_url = urljoin(base_url, href)
                article_links.add(full_url)

        print(f"    Found {len(article_links)} article links")

        for link in list(article_links)[:20]:  # Limit to 20 per page
            time.sleep(REQUEST_DELAY)
            article = scrape_pptv_article(link, source_name)
            if article:
                articles.append(article)

    return articles


def scrape_pptv_article(url, source_name="PPTV HD36"):
    """Scrape a single PPTV article."""
    resp = safe_request(url)
    if not resp:
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    title_el = soup.find("h1")
    if not title_el:
        return None
    title = title_el.get_text(strip=True)

    if not is_election_related(title):
        print(f"    ⏭️  Skip (not election): {title[:50]}...")
        return None

    date_str = ""
    time_str = ""

    meta_date = soup.find("meta", {"property": "article:published_time"})
    if meta_date:
        content = meta_date.get("content", "")
        date_str = thai_date_to_standard(content)
        t_match = re.search(r"T(\d{2}):(\d{2})", content)
        if t_match:
            time_str = f"{t_match.group(1)}:{t_match.group(2)}"

    summary = ""
    meta_desc = soup.find("meta", {"name": "description"})
    if meta_desc:
        summary = meta_desc.get("content", "").strip()

    tags = []
    for tag_a in soup.find_all("a", href=re.compile(r"/tag/")):
        t = tag_a.get_text(strip=True)
        if t and len(t) < 50:
            tags.append(t)

    print(f"    ✅ {title[:60]}...")

    return {
        "title": title,
        "summary": summary[:500] if summary else "",
        "date": date_str,
        "time": time_str,
        "source": source_name,
        "sourceUrl": url,
        "tags": tags[:8],
    }


# ─── Deduplication ───────────────────────────────────────────────

def deduplicate(articles):
    """Remove duplicate articles by URL."""
    seen_urls = set()
    unique = []
    for a in articles:
        url = a.get("sourceUrl", "")
        if url not in seen_urls:
            seen_urls.add(url)
            unique.append(a)
    return unique


# ─── Load existing data to avoid re-scraping ─────────────────────

def load_existing():
    """Load previously scraped articles."""
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("articles", [])
        except Exception:
            pass
    return []


def load_existing_urls_from_tsx():
    """Load URLs already in ElectionNews.tsx to mark them."""
    tsx_path = os.path.join(
        os.path.dirname(__file__), "..", "visualization",
        "src", "components", "ElectionNews.tsx"
    )
    urls = set()
    if os.path.exists(tsx_path):
        with open(tsx_path, "r", encoding="utf-8") as f:
            for line in f:
                match = re.search(r"sourceUrl:\s*['\"](.+?)['\"]", line)
                if match:
                    urls.add(match.group(1))
    return urls


# ─── Output Formatting ───────────────────────────────────────────

def format_for_tsx(articles, existing_tsx_urls):
    """
    Format articles as TSX-ready code snippet.
    Marks articles already in ElectionNews.tsx.
    """
    lines = []
    lines.append("// ─── Scraped News (กรองแล้วเฉพาะข่าวเลือกตั้ง) ───")
    lines.append("// วันที่ scrape: " + datetime.now().strftime("%Y-%m-%d %H:%M"))
    lines.append("// คัดลอกเฉพาะข่าวที่ต้องการไปใส่ใน NEWS_DATA array")
    lines.append("// แล้วเพิ่ม id, category, province, area ตามความเหมาะสม")
    lines.append("")

    for i, a in enumerate(articles, 1):
        in_tsx = a["sourceUrl"] in existing_tsx_urls
        marker = "// ✅ ALREADY IN TSX" if in_tsx else "// 🆕 NEW"

        lines.append(f"  {marker}")
        lines.append("  {")
        lines.append(f"    id: ???,  // กำหนด id เอง")
        lines.append(f"    title: '{_escape(a['title'])}',")
        lines.append(f"    summary: '{_escape(a['summary'])}',")
        lines.append(f"    date: '{a['date']}',")
        if a.get("time"):
            lines.append(f"    time: '{a['time']}',")
        lines.append(f"    source: '{a['source']}',")
        lines.append(f"    sourceUrl: '{a['sourceUrl']}',")
        lines.append(f"    category: '???',  // recount | fraud | irregularity | ect | analysis")
        lines.append(f"    tags: {json.dumps(a.get('tags', []), ensure_ascii=False)},")
        lines.append("  },")
        lines.append("")

    return "\n".join(lines)


def _escape(s):
    """Escape single quotes for TSX string."""
    return s.replace("'", "\\'").replace("\n", " ").strip()


# ─── Main ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="🗳️ Election 69 News Scraper — Scrape ข่าวเลือกตั้งจากหลายแหล่ง"
    )
    parser.add_argument(
        "--pages", type=int, default=2,
        help="จำนวนหน้าที่จะ scrape ต่อแหล่ง (default: 2)"
    )
    parser.add_argument(
        "--source", type=str, default="all",
        choices=["all", "khaosod", "thairath", "matichon", "pptv", "thaipbs"],
        help="เลือกแหล่งข่าว (default: all)"
    )
    parser.add_argument(
        "--keyword", type=str, default=None,
        help="ค้นหาด้วย keyword เฉพาะ เช่น 'บาร์โค้ด' หรือ 'ชลบุรี'"
    )
    parser.add_argument(
        "--no-tsx", action="store_true",
        help="ไม่ต้อง generate TSX snippet"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("🗳️  Election 69 News Scraper")
    print("=" * 60)
    print(f"  Pages: {args.pages} | Source: {args.source} | Keyword: {args.keyword or '(none)'}")
    print()

    all_articles = []

    # Load existing
    existing = load_existing()
    existing_urls = {a["sourceUrl"] for a in existing}
    print(f"📦 Existing scraped articles: {len(existing)}")

    # Scrape each source
    scrapers = {
        "khaosod": scrape_khaosod,
        "thairath": scrape_thairath,
        "matichon": scrape_matichon,
        "pptv": scrape_pptv,
        "thaipbs": scrape_thaipbs,
    }

    sources = [args.source] if args.source != "all" else scrapers.keys()

    for source in sources:
        print(f"\n{'─' * 40}")
        print(f"📡 Scraping: {source.upper()}")
        print(f"{'─' * 40}")

        scraper_fn = scrapers[source]
        new_articles = scraper_fn(pages=args.pages, keyword=args.keyword)
        print(f"  → Got {len(new_articles)} election-related articles")
        all_articles.extend(new_articles)

    # Merge with existing + deduplicate
    combined = existing + all_articles
    combined = deduplicate(combined)

    # Sort by date (newest first)
    def sort_key(a):
        d = a.get("date", "")
        t = a.get("time", "00:00")
        # Convert DD/MM/YYYY to sortable format
        parts = d.split("/")
        if len(parts) == 3:
            return f"{parts[2]}{parts[1]}{parts[0]}{t}"
        return d + t
    combined.sort(key=sort_key, reverse=True)

    # Save to JSON
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_data = {
        "scraped_at": datetime.now().isoformat(),
        "total": len(combined),
        "new_in_this_run": len(all_articles),
        "articles": combined,
    }
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n{'=' * 60}")
    print(f"✅ Saved {len(combined)} articles to: {OUTPUT_FILE}")
    print(f"   New in this run: {len(all_articles)}")

    # Generate TSX snippet
    if not args.no_tsx:
        tsx_urls = load_existing_urls_from_tsx()
        tsx_snippet = format_for_tsx(all_articles, tsx_urls)
        tsx_file = os.path.join(OUTPUT_DIR, "news_tsx_snippet.txt")
        with open(tsx_file, "w", encoding="utf-8") as f:
            f.write(tsx_snippet)
        print(f"📝 TSX snippet saved to: {tsx_file}")

        # Count new vs existing
        new_count = sum(1 for a in all_articles if a["sourceUrl"] not in tsx_urls)
        existing_count = len(all_articles) - new_count
        print(f"   🆕 New (not in TSX): {new_count}")
        print(f"   ✅ Already in TSX: {existing_count}")

    print(f"\n💡 Tip: Review {OUTPUT_FILE} แล้วเลือกข่าวที่ต้องการไปใส่ ElectionNews.tsx")
    print()


if __name__ == "__main__":
    main()
