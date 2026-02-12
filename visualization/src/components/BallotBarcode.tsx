'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import {
  ScanBarcode, ShieldAlert, Calculator, BookOpen, AlertTriangle,
  Check, Copy, ArrowRight, Info, ExternalLink, Hash, Search,
  ChevronDown, ChevronUp, Scale, Building2, Gavel,
} from 'lucide-react'

/* ─── Decode logic ─── */
function decodeBallot(ballotId: string) {
  const cleaned = ballotId.trim().toUpperCase()
  if (!cleaned) return null

  // Accept formats: A03398985, 03398985
  const match = cleaned.match(/^([A-Z]?)(\d{5,})$/)
  if (!match) return null

  const prefix = match[1] || ''
  const N = parseInt(match[2], 10)
  const bookNum = Math.floor(N / 20) + 1
  const posInBook = (N % 20) || 20 // 1–20, where 0 wraps to 20
  const bookId = prefix ? prefix + String(bookNum).padStart(7, '0') : String(bookNum)

  return {
    input: cleaned,
    prefix,
    N,
    bookId,
    bookNum,
    posInBook: N % 20 === 0 ? 20 : (N % 20),
    formula: `⌊${N} / 20⌋ + 1 = ⌊${(N / 20).toFixed(1)}⌋ + 1 = ${Math.floor(N / 20)} + 1 = ${bookNum}`,
  }
}

/* ─── PPTV evidence data ─── */
const PPTV_EVIDENCE = [
  { ballot: 'A37805049', party: 'พรรคเพื่อไทย', color: '#e74c3c' },
  { ballot: 'A37805050', party: 'พรรคไทยสร้างไทย', color: '#f39c12' },
  { ballot: 'A37805055', party: 'พรรคประชาชน', color: '#ff6d21' },
  { ballot: 'A37804930', party: 'พรรคภูมิใจไทย', color: '#3498db' },
]

/* ─── Component ─── */
export default function BallotBarcode() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<{ input: string; bookId: string; pos: number; formula: string }[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showMath, setShowMath] = useState(false)
  const [showECT, setShowECT] = useState(false)
  const [showLaw, setShowLaw] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const result = useMemo(() => decodeBallot(input), [input])

  const handleDecode = useCallback(() => {
    if (!result) return
    // Add to history (avoid duplicates)
    setHistory(prev => {
      if (prev.some(h => h.input === result.input)) return prev
      return [{ input: result.input, bookId: result.bookId, pos: result.posInBook, formula: result.formula }, ...prev].slice(0, 20)
    })
  }, [result])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleDecode()
  }, [handleDecode])

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])

  const handlePPTVExample = useCallback((barcode: string) => {
    setInput(barcode)
    const r = decodeBallot(barcode)
    if (r) {
      setHistory(prev => {
        if (prev.some(h => h.input === r.input)) return prev
        return [{ input: r.input, bookId: r.bookId, pos: r.posInBook, formula: r.formula }, ...prev].slice(0, 20)
      })
    }
  }, [])

  return (
    <div className="section">
      <div className="section-title">
        <ScanBarcode size={20} /> ถอดรหัสบาร์โค้ดบัตรเลือกตั้ง
      </div>

      {/* ── Alert Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #7f1d1d33, #991b1b22)',
        border: '1px solid #ef444444',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        display: 'flex',
        gap: 12,
        alignItems: 'start',
      }}>
        <ShieldAlert size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fca5a5', marginBottom: 6 }}>
            ⚠️ ปัญหาความลับของบัตรเลือกตั้ง
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            บัตรเลือกตั้ง ส.ส. (ทั้งแบ่งเขต, บัญชีรายชื่อ) และบัตรออกเสียงประชามติ มี<strong style={{ color: 'var(--text-primary)' }}>บาร์โค้ดที่มีเลขเฉพาะไม่ซ้ำกัน</strong>แต่ละใบ
            ซึ่งสามารถคำนวณย้อนกลับหา<strong style={{ color: 'var(--text-primary)' }}>เล่มที่</strong>ของบัตรได้ด้วยสูตรง่ายๆ
            — เมื่อรู้เล่มที่ → ก็รู้ต้นขั้ว → ต้นขั้วมีลายเซ็นและลำดับที่ผู้ลงคะแนน → <strong style={{ color: '#ef4444' }}>สืบย้อนรู้ว่าใครกาเบอร์อะไรได้</strong>
          </div>
          <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 8, fontStyle: 'italic' }}>
            ตาม รธน. การเลือกตั้งต้องเป็นไปโดย "ลับ" — หากสืบย้อนได้ อาจขัดรัฐธรรมนูญ
          </div>
        </div>
      </div>

      {/* ── Decoder Form ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 20,
        border: '1px solid var(--border)',
        marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={18} style={{ color: 'var(--accent)' }} />
          ถอดรหัส: เลขที่บัตร → เล่มที่
        </h3>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="กรอกเลขที่บัตร เช่น A03398985"
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontFamily: 'monospace',
                outline: 'none',
                letterSpacing: 1,
              }}
            />
          </div>
          <button
            onClick={handleDecode}
            disabled={!result}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: result ? 'var(--accent)' : 'var(--bg-primary)',
              color: result ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${result ? 'var(--accent)' : 'var(--border)'}`,
              cursor: result ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Search size={14} /> ถอดรหัส
          </button>
        </div>

        {/* ── Result ── */}
        {result && (
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 10,
            padding: 16,
            border: '1px solid var(--border)',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>เลขที่บัตร (N)</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: 1 }}>
                  {result.input}
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <ArrowRight size={14} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>เล่มที่ (M)</span>
                </div>
                <div style={{
                  fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#ef4444',
                  marginTop: 4, letterSpacing: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  {result.bookId}
                  <button
                    onClick={() => copyToClipboard(result.bookId, 'book')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: copiedId === 'book' ? '#22c55e' : 'var(--text-secondary)',
                      padding: 2,
                    }}
                    title="คัดลอก"
                  >
                    {copiedId === 'book' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>ลำดับที่ในเล่ม</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  ใบที่ {result.posInBook} / 20
                </div>
              </div>
            </div>

            {/* formula */}
            <div style={{
              background: '#1e293b',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'monospace',
              fontSize: 13,
              color: '#94a3b8',
              lineHeight: 1.6,
              overflowX: 'auto',
            }}>
              <span style={{ color: '#60a5fa' }}>M</span> = ⌊<span style={{ color: '#fbbf24' }}>N</span> / 20⌋ + 1 = {result.formula}
            </div>
          </div>
        )}

        {/* Quick examples */}
        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ตัวอย่าง (จากข่าว PPTV):</span>
          {PPTV_EVIDENCE.map(e => (
            <button
              key={e.ballot}
              onClick={() => handlePPTVExample(e.ballot)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'monospace',
                background: input === e.ballot ? `${e.color}22` : 'var(--bg-primary)',
                border: `1px solid ${input === e.ballot ? e.color : 'var(--border)'}`,
                color: input === e.ballot ? e.color : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {e.ballot}
            </button>
          ))}
        </div>
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 12,
          padding: 16,
          border: '1px solid var(--border)',
          marginBottom: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} /> ประวัติการถอดรหัส
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>เลขที่บัตร (N)</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>เล่มที่ (M)</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ลำดับในเล่ม</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>สูตร</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.input} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{h.input}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>{h.bookId}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{h.pos} / 20</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{h.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PPTV Evidence Table ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid var(--border)',
        marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          📺 หลักฐานจากข่าว PPTV HD36
        </h3>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
          ทดลองสแกนบาร์โค้ดจากภาพบัตรเลือกตั้ง ส.ส. บัญชีรายชื่อ 4 ใบ จากหน่วยเลือกตั้งเดียวกัน (กาพรรคต่างกัน)
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ใบที่</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>พรรคที่ลงคะแนน</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>บาร์โค้ด</th>
                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>เล่มที่ (คำนวณ)</th>
                <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ลำดับในเล่ม</th>
              </tr>
            </thead>
            <tbody>
              {PPTV_EVIDENCE.map((e, i) => {
                const d = decodeBallot(e.ballot)!
                return (
                  <tr key={e.ballot} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                        background: e.color, marginRight: 6, verticalAlign: 'middle',
                      }} />
                      <span style={{ color: 'var(--text-primary)' }}>{e.party}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{e.ballot}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>{d.bookId}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{d.posInBook} / 20</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Info size={11} /> ใบที่ 1-3 มาจากเล่มเดียวกัน (A1890253) ใบที่ 4 มาจากเล่มก่อนหน้า (A1890247) — ทั้ง 4 ใบมาจากหน่วยเดียวกัน
        </div>
      </div>

      {/* ── How it works (Expandable) ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        marginBottom: 20,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setShowMath(!showMath)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calculator size={16} style={{ color: 'var(--accent)' }} /> อธิบายหลักคณิตศาสตร์
          </span>
          {showMath ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showMath && (
          <div style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)' }}>
            <div style={{
              background: '#1e293b',
              borderRadius: 8,
              padding: 16,
              fontFamily: 'monospace',
              marginBottom: 14,
              fontSize: 14,
              lineHeight: 2,
            }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>{'// กำหนดให้'}</div>
              <div><span style={{ color: '#60a5fa' }}>M</span> <span style={{ color: '#94a3b8' }}>=</span> เล่มที่ <span style={{ color: '#94a3b8' }}>(Book ID)</span></div>
              <div><span style={{ color: '#fbbf24' }}>N</span> <span style={{ color: '#94a3b8' }}>=</span> เลขที่บัตร <span style={{ color: '#94a3b8' }}>(Ballot Number จากบาร์โค้ด)</span></div>
              <div style={{ marginTop: 8, color: '#94a3b8' }}>{'// สูตร'}</div>
              <div style={{ fontSize: 16, color: '#f0f0f0' }}>
                <span style={{ color: '#60a5fa' }}>M</span> = ⌊<span style={{ color: '#fbbf24' }}>N</span> / 20⌋ + 1
              </div>
            </div>

            <p>
              <strong style={{ color: 'var(--text-primary)' }}>ทำไม 20?</strong> — กกต. ระบุว่าบัตรเลือกตั้ง 1 เล่ม มี <strong style={{ color: 'var(--accent)' }}>20 ฉบับ</strong>
            </p>

            <p>
              <strong style={{ color: 'var(--text-primary)' }}>แปลว่าอะไร?</strong> — เลขที่บัตร (N) จะเรียงลำดับต่อเนื่องไปเรื่อยๆ ไม่มีซ้ำ
              แต่ละเล่มจะมี 20 ใบ ดังนั้นเล่มที่ 1 = บัตร 1–20, เล่มที่ 2 = บัตร 21–40, เล่มที่ 3 = บัตร 41–60 ...
            </p>

            <p>
              <strong style={{ color: 'var(--text-primary)' }}>ห่วงโซ่การสืบย้อน:</strong>
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              margin: '8px 0 12px',
              fontSize: 13,
            }}>
              {[
                { label: 'บาร์โค้ด', color: 'var(--accent)' },
                { label: 'เลขที่ (N)', color: '#fbbf24' },
                { label: 'เล่มที่ (M)', color: '#ef4444' },
                { label: 'ต้นขั้ว', color: '#a78bfa' },
                { label: 'ลายเซ็น + ลำดับ', color: '#f97316' },
                { label: 'ตัวตนผู้ลงคะแนน', color: '#ef4444' },
              ].map((step, i) => (
                <span key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: `${step.color}18`,
                    border: `1px solid ${step.color}44`,
                    color: step.color,
                    fontWeight: 600,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}>
                    {step.label}
                  </span>
                  {i < 5 && <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />}
                </span>
              ))}
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid var(--border)',
              marginTop: 12,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>💡 ตัวอย่างคำนวณ</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2, color: '#94a3b8' }}>
                <div>บาร์โค้ด: <span style={{ color: 'var(--accent)' }}>A03398985</span></div>
                <div>N = 3398985</div>
                <div>M = ⌊3398985 / 20⌋ + 1 = ⌊169949.25⌋ + 1 = 169949 + 1 = <span style={{ color: '#ef4444', fontWeight: 700 }}>169950</span></div>
                <div>เล่มที่ = <span style={{ color: '#ef4444', fontWeight: 700 }}>A0169950</span></div>
                <div>ลำดับในเล่ม = 3398985 mod 20 = <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>5</span> (ใบที่ 5 จาก 20)</div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>JavaScript:</strong>
              <pre style={{
                background: '#1e293b',
                borderRadius: 6,
                padding: 12,
                marginTop: 6,
                overflow: 'auto',
                fontSize: 12,
                lineHeight: 1.6,
                color: '#e2e8f0',
              }}>
{`function getBallotBookId(ballotId) {
  const prefix = ballotId.slice(0, 1);
  const N = parseInt(ballotId.slice(1), 10);
  const start = Math.floor(N / 20);
  return prefix + String(start + 1).padStart(7, "0");
}`}
              </pre>
              <div style={{ marginTop: 6 }}>
                <a
                  href="https://codepen.io/earthchie/pen/vEKbZBb?editors=1010"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                >
                  <ExternalLink size={11} /> เปิด CodePen ต้นฉบับ (earthchie)
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ECT Response (Expandable) ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        marginBottom: 20,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setShowECT(!showECT)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={16} style={{ color: '#60a5fa' }} /> คำชี้แจงจาก กกต.
          </span>
          {showECT ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showECT && (
          <div style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <div style={{
              background: '#1e3a5f22',
              border: '1px solid #60a5fa33',
              borderRadius: 8,
              padding: 14,
              marginBottom: 12,
            }}>
              <div style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 6, fontSize: 13 }}>
                ว่าที่ ร.ต.ภาสกร สิริภคยาพร — รองเลขาธิการ กกต.
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>บาร์โค้ดเป็น <strong style={{ color: 'var(--text-primary)' }}>มาตรการ รปภ.</strong> (รักษาความปลอดภัย) เพื่อควบคุมที่ไปที่มาของบัตร</li>
                <li>ข้อมูลในบาร์โค้ดคือ <strong style={{ color: 'var(--text-primary)' }}>ล็อตสำหรับการจัดพิมพ์</strong> — พิมพ์เมื่อไหร่ ที่ไหน แจกจ่ายเขตไหน</li>
                <li>ยืนยันว่า<strong style={{ color: '#22c55e' }}>ไม่ใช่ข้อมูลของพรรคการเมือง</strong></li>
                <li>ยืนยันว่า<strong style={{ color: '#22c55e' }}>ไม่มีใครรู้ได้ว่าเป็นข้อมูลหน่วยไหน</strong></li>
              </ul>
            </div>

            <div style={{
              background: '#f97316' + '12',
              border: '1px solid #f9731633',
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ fontWeight: 600, color: '#f97316', marginBottom: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> ข้อสังเกต — สิ่งที่ กกต. ยังไม่ได้ตอบ
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>ทำไมบัตรแต่ละใบถึงมี <strong style={{ color: 'var(--text-primary)' }}>เลขเฉพาะไม่ซ้ำกัน</strong>? (ถ้าเป็นแค่ข้อมูลล็อต ทำไมไม่ใช้เลขเดียวกันทั้งเล่ม)</li>
                <li>ทำไมเลขบาร์โค้ดถึง<strong style={{ color: 'var(--text-primary)' }}>คำนวณย้อนกลับหาเล่มที่ได้</strong>ด้วยสูตรคณิตศาสตร์?</li>
                <li>ต้นขั้วบัตรมีลายเซ็นและลำดับผู้มาลงคะแนน — หากรู้เล่มที่ ก็รู้ต้นขั้ว → <strong style={{ color: '#ef4444' }}>สืบย้อนตัวตนได้</strong></li>
                <li>ข้อมูลจัดพิมพ์: กกต. สั่งพิมพ์บัตรเลือกตั้ง ส.ส. 56,100,000 บัตร (จากผู้มีสิทธิ ~53.4 ล้านคน + สำรอง 5%)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── กฎหมายที่เกี่ยวข้อง (Expandable) ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        marginBottom: 20,
        overflow: 'hidden',
      }}>
        <button
          onClick={() => setShowLaw(!showLaw)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gavel size={16} style={{ color: '#eab308' }} /> กฎหมายที่เกี่ยวข้อง — พ.ร.บ.ประกอบ รธน. เลือกตั้ง ส.ส.
          </span>
          {showLaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showLaw && (
          <div style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              บาร์โค้ดที่มีเลขเฉพาะแต่ละใบ สามารถคำนวณย้อนหาเล่มที่ → ต้นขั้ว → ตัวตนผู้ลงคะแนนได้ ซึ่งอาจขัดต่อกฎหมายเลือกตั้งอย่างน้อย <strong style={{ color: '#eab308' }}>3 มาตรา</strong>
            </div>

            {/* มาตรา 92 */}
            <div style={{
              background: '#eab30812',
              border: '1px solid #eab30833',
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: '#eab30822',
                  color: '#eab308',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  มาตรา 92
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  การลงคะแนน &quot;โดยตรงและลับ&quot;
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                กำหนดให้การลงคะแนนเลือกตั้งเป็นไปโดย <strong style={{ color: '#eab308' }}>&quot;โดยตรงและลับ&quot;</strong> — หากบาร์โค้ดสามารถสืบย้อนตัวตนผู้ลงคะแนนได้ ย่อมขัดต่อหลัก &quot;ลับ&quot; ที่กฎหมายบัญญัติไว้
              </div>
            </div>

            {/* มาตรา 93 */}
            <div style={{
              background: '#3b82f612',
              border: '1px solid #3b82f633',
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: '#3b82f622',
                  color: '#3b82f6',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  มาตรา 93
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  บังคับพับบัตร — ไม่ให้ผู้อื่นทราบว่าลงคะแนนอย่างไร
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                บังคับให้ <strong style={{ color: '#3b82f6' }}>พับบัตร</strong> ก่อนหย่อนลงหีบ เพื่อไม่ให้ผู้อื่นทราบว่าลงคะแนนอย่างไร — แต่หากบาร์โค้ดด้านนอกบัตรสามารถอ่านได้โดยไม่ต้องเปิดบัตร การพับบัตรก็ไม่ช่วยปกป้องความลับ
              </div>
            </div>

            {/* มาตรา 96 */}
            <div style={{
              background: '#ef444412',
              border: '1px solid #ef444433',
              borderRadius: 10,
              padding: 14,
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{
                  background: '#ef444422',
                  color: '#ef4444',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  มาตรา 96
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  ห้ามทำเครื่องหมายที่สังเกตได้บนบัตร
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                ห้ามทำ <strong style={{ color: '#ef4444' }}>เครื่องหมายที่ทำให้สังเกตได้</strong> บนบัตรเลือกตั้ง — บาร์โค้ดที่มีเลขเฉพาะไม่ซ้ำกันแต่ละใบ ถือเป็นเครื่องหมายที่สามารถแยกแยะบัตรแต่ละใบออกจากกันได้ จึงอาจเข้าข่ายเป็น &quot;เครื่องหมายที่ทำให้สังเกตได้&quot; ตามมาตรานี้
              </div>
            </div>

            {/* สรุป */}
            <div style={{
              background: 'var(--bg-primary)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid var(--border)',
              marginTop: 4,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#f97316', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> ข้อสังเกต
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                กฎหมายเลือกตั้งออกแบบมาเพื่อปกป้อง <strong style={{ color: 'var(--text-primary)' }}>ความลับของผู้ลงคะแนน</strong> ทั้ง 3 มาตรานี้มุ่งเน้นเรื่องเดียวกัน — ไม่ให้มีทางสืบย้อนได้ว่าใครลงคะแนนให้ใคร หากบาร์โค้ดสามารถย้อนหาตัวตนได้จริง ย่อมเป็นช่องทางที่ขัดต่อเจตนารมณ์ของกฎหมาย
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary box ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-secondary), #1e293b)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Scale size={16} style={{ color: '#eab308' }} /> สรุปประเด็น
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 8,
            padding: 12,
            borderLeft: '3px solid #ef4444',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>🔴 ข้อกังวล</div>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: 12 }}>
              <li>บาร์โค้ดมีเลขเฉพาะแต่ละใบ</li>
              <li>คำนวณย้อนหาเล่มที่ได้</li>
              <li>ต้นขั้วมีลายเซ็นผู้ลงคะแนน</li>
              <li>อาจขัด ม.92, ม.93, ม.96</li>
            </ul>
          </div>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 8,
            padding: 12,
            borderLeft: '3px solid #60a5fa',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 4 }}>🔵 คำชี้แจง กกต.</div>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: 12 }}>
              <li>เป็นมาตรการ รปภ. ควบคุมบัตร</li>
              <li>เป็นข้อมูลล็อตจัดพิมพ์</li>
              <li>ไม่ใช่ข้อมูลพรรคการเมือง</li>
              <li>ไม่มีใครรู้ข้อมูลหน่วย</li>
            </ul>
          </div>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 8,
            padding: 12,
            borderLeft: '3px solid #eab308',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#eab308', marginBottom: 4 }}>🟡 สถานะ</div>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8, color: 'var(--text-secondary)', fontSize: 12 }}>
              <li>รอ กกต. ชี้แจงเพิ่มเติม</li>
              <li>อาจมีการยื่นร้องศาล รธน.</li>
              <li>เป็นเหมือนกันทั้ง 3 บัตร</li>
              <li>(แบ่งเขต + บัญชีรายชื่อ + ประชามติ)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
