'use client'

import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  title?: string
  methodology: string
  findings: string[]
  interpretation: string
  limitation?: string
  defaultOpen?: boolean
}

export default function AnalysisSummary({ title, methodology, findings, interpretation, limitation, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{
      marginTop: 24,
      borderRadius: 12,
      border: '1px solid var(--border)',
      background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
      overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
          <BookOpen size={16} style={{ color: 'var(--accent)' }} />
          {title || 'สรุปผลการวิเคราะห์'}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 1.9, color: 'var(--text-secondary)' }}>

          {/* Methodology */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              วิธีการวิเคราะห์
            </div>
            <div dangerouslySetInnerHTML={{ __html: methodology }} />
          </div>

          {/* Findings */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              ผลลัพธ์ที่พบ
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {findings.map((f, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: f }} />
              ))}
            </ul>
          </div>

          {/* Interpretation */}
          <div style={{ marginBottom: limitation ? 14 : 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#22c55e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              การตีความ
            </div>
            <div dangerouslySetInnerHTML={{ __html: interpretation }} />
          </div>

          {/* Limitation */}
          {limitation && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                ข้อจำกัด
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }} dangerouslySetInnerHTML={{ __html: limitation }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
