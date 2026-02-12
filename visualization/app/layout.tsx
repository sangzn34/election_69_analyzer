import type { Metadata } from 'next'
import 'leaflet/dist/leaflet.css'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'วิเคราะห์ทฤษฎีการซื้อเสียง เลือกตั้ง 2569',
  description: 'ทฤษฎี "กาเบอร์เดียวกันทั้ง 2 ใบ" — การวิเคราะห์ความสัมพันธ์ระหว่างเบอร์ ส.ส. เขต กับ คะแนนบัญชีรายชื่อ',
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
