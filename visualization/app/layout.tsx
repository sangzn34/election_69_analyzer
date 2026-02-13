import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'วิเคราะห์ผลเลือกตั้ง 2569 — ความผิดปกติทางสถิติ',
  description: 'วิเคราะห์ความสัมพันธ์ระหว่างเบอร์ ส.ส. เขต กับ คะแนนบัญชีรายชื่อ ถอดรหัสบาร์โค้ดบัตร และข้อมูลเชิงลึกจากการเลือกตั้ง 2569',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
