# Thai Election 69 — Vote-Buying Forensic Analyzer

> **Live Demo:** [sangzn34.github.io/election_69_analyzer](https://sangzn34.github.io/election_69_analyzer/)

เครื่องมือวิเคราะห์เชิงสถิติสำหรับตรวจสอบความผิดปกติในผลการเลือกตั้ง สส. ครั้งที่ 69 ของไทย โดยใช้ ensemble model รวม 10 ตัวชี้วัด พร้อมการทดสอบเชิงนิติวิทยาศาสตร์ (forensic statistics) อีก 3 โมเดล

> Fork จาก [**Pethon/election_69_analyzer**](https://github.com/Pethon/election_69_analyzer) ซึ่งเป็นผู้สร้างระบบ scraping และ MP–Party List correlation analysis ดั้งเดิม

---

## 📊 Project Overview

โปรเจกต์นี้แบ่งเป็น 3 ส่วนหลัก:

1. **Data Scraping** (จาก upstream) — ดึงข้อมูลผลเลือกตั้งไม่เป็นทางการจาก Thai PBS API
2. **Data Pipeline** (`prepare_data.py`) — ประมวลผลข้อมูลดิบเป็น JSON สำหรับ visualization
3. **Interactive Dashboard** (React + Recharts) — แสดงผลวิเคราะห์แบบ interactive บน GitHub Pages

## 🔬 Forensic Models

### Ensemble Suspicion Score — 10 Indicators

คำนวณคะแนนความน่าสงสัยจาก 10 ตัวชี้วัด ถ่วงน้ำหนักด้วย **Entropy Weight Method** และทดสอบ spatial autocorrelation ด้วย **Moran's I**:

| # | Indicator | คำอธิบาย |
|---|-----------|----------|
| 1 | Winner Dominance | สัดส่วนคะแนนผู้ชนะ |
| 2 | Turnout Rate | อัตราการใช้สิทธิ์ |
| 3 | HHI (Herfindahl) | ความกระจุกตัวของคะแนน |
| 4 | Spoiled Rate | สัดส่วนบัตรเสีย (ข้อมูลจริงจาก กกต.) |
| 5 | Twin-Number Effect | เลขผู้สมัคร ≈ เลขพรรค |
| 6 | Focus Area Flag | พื้นที่ร้อน / เมือง / ฐานเสียง / ชายแดน |
| 7 | Win66 Party Switch | พรรคผู้ชนะเปลี่ยนจากปี 66 |
| 8 | NoVote Ratio | สัดส่วนผู้ไม่ไปใช้สิทธิ์ |
| 9 | Voters/Station | ผู้มีสิทธิ์ต่อหน่วยเลือกตั้ง |
| 10 | Benford's Law | 1st-digit distribution + Chi-square test |

### โมเดลนิติวิทยาศาสตร์เพิ่มเติม

| Model | วิธีการ | อ้างอิง |
|-------|---------|---------|
| **Klimek Fingerprint** | 2D histogram ของ Turnout × Vote Share | Klimek et al. (2012) |
| **Last-Digit Uniformity** | ทดสอบว่าหลักสุดท้ายกระจายสม่ำเสมอ | Beber & Scacco (2012) |
| **2nd-Digit Benford** | ทดสอบหลักที่ 2 ตาม Benford's Law | Mebane (2008) |
| **Monte Carlo Null Model** | 500-iteration permutation test สำหรับ twin-number | — |

## 🖥️ Dashboard Features

- **Summary Cards** — ภาพรวมผลเลือกตั้ง
- **Ensemble Analysis** — 11 มุมมอง (scatter, radar, spatial, benford, klimek, last-digit, 2nd-benford, table ฯลฯ)
- **Party Switcher** — วิเคราะห์การเปลี่ยนพรรคผู้ชนะ
- **Turnout Anomaly** — ตรวจจับ turnout ผิดปกติ
- **Vote Splitting** — เปรียบเทียบ MP vs Party List
- **Winning Margin** — ส่วนต่างคะแนนผู้ชนะ
- **Referendum Correlation** — เปรียบเทียบกับผลประชามติ

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Data Pipeline | Python 3.12+ (stdlib only) |
| Frontend | React 19 + TypeScript 5.9 |
| Charts | Recharts 2.15 |
| Build | Vite 6 |
| Deployment | GitHub Pages + GitHub Actions |

## � Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+

### Installation

```bash
git clone https://github.com/sangzn34/election_69_analyzer.git
cd election_69_analyzer
```

### Run Data Pipeline

```bash
cd visualization
pip install -r ../requirements.txt
python3 scripts/prepare_data.py
```

ไฟล์ `public/election_data.json` จะถูกสร้างขึ้น

### Run Dev Server

```bash
cd visualization
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

## 📖 Original Features (from upstream)

ระบบ scraping และ correlation analysis ดั้งเดิมจาก [Pethon](https://github.com/Pethon):

```bash
# ดึงข้อมูลจาก Thai PBS API
python scripts/election_scraper.py

# วิเคราะห์ correlation ระหว่าง MP number กับ Party List
python scripts/mp_pl_comparer.py
```

## � Acknowledgments

- **Original Project**: [**Pethon/election_69_analyzer**](https://github.com/Pethon/election_69_analyzer) — ระบบ scraping, data collection, และ MP–Party List correlation analysis
- **Inspiration**: [Khajochorn (Khajochi)](https://www.facebook.com/KhajochiBlog/posts/pfbid02qyYXY3NH7zns1gr3Emhdcij48y8UFQg3htvXYHRgfaDosjhQzytHapCAAj3bLhgl) สำหรับข้อสังเกตเชิงวิเคราะห์ครั้งแรก
- **Data Source**: [Thai PBS Election 69](https://www.thaipbs.or.th/election69/result/en/geo?region=all&view=area)
- **Area Code Map**: [@anwam](https://github.com/anwam)

## 📄 License

MIT — ดู [LICENSE](LICENSE)

---

*Disclaimer: โปรเจกต์นี้มีวัตถุประสงค์เพื่อการวิเคราะห์และศึกษาเท่านั้น ข้อมูลอ้างอิงจากผลการเลือกตั้งไม่เป็นทางการ*