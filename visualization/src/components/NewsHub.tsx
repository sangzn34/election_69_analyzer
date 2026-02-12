'use client'

import { useState } from 'react'
import { Newspaper, ScanBarcode } from 'lucide-react'
import ElectionNews from './ElectionNews'
import BallotBarcode from './BallotBarcode'

export type NewsTab = 'news' | 'barcode'

const TABS: { id: NewsTab; label: string; icon: typeof Newspaper }[] = [
  { id: 'news', label: 'ข่าวความผิดปกติ', icon: Newspaper },
  { id: 'barcode', label: 'บาร์โค้ดบัตรเลือกตั้ง', icon: ScanBarcode },
]

interface NewsHubProps {
  activeTab?: NewsTab
  onTabChange?: (tab: NewsTab) => void
}

export default function NewsHub({ activeTab, onTabChange }: NewsHubProps) {
  const [internalTab, setInternalTab] = useState<NewsTab>(activeTab ?? 'news')
  const tab = activeTab ?? internalTab

  const handleTabChange = (t: NewsTab) => {
    setInternalTab(t)
    onTabChange?.(t)
  }

  return (
    <div>
      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 20,
        borderBottom: '2px solid var(--border)',
        paddingBottom: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -2,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {tab === 'news' && <ElectionNews />}
      {tab === 'barcode' && <BallotBarcode />}
    </div>
  )
}
