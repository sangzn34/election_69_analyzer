'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import {
  ScanBarcode, ShieldAlert, Calculator, BookOpen, AlertTriangle,
  Check, Copy, ArrowRight, Info, ExternalLink, Hash, Search,
  ChevronDown, ChevronUp, Scale, Building2, Gavel, QrCode,
  FileWarning, LockOpen, Lock,
} from 'lucide-react'

/* ─── Ballot type ─── */
type BallotType = 'pink' | 'green'

/* ─── Pink ballot decode logic (บัตรบัญชีรายชื่อ / Party List) ─── */
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

/* ─── Green ballot QR decode logic (บัตร ส.ส. แบ่งเขต / Constituency) ─── */
/* Algorithm from verify.election.in.th by @killernay */
const GREEN_BASE36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const GREEN_QR_LEN = 5
const GREEN_MOD_SERIAL = 100_000_000
const GREEN_K_MULTIPLIER = 32_216_237
const GREEN_K_OFFSET = 42_413_113
const GREEN_MAX_N = Math.pow(36, 5) // 60,466,176

function greenGetK(charIndex: number) {
  return (GREEN_K_MULTIPLIER * charIndex + GREEN_K_OFFSET) % GREEN_MOD_SERIAL
}

function greenDecode(qrCode: string): { serial: string; qr: string; n: number; i: number; k: number } | null {
  const cleaned = qrCode.trim().toUpperCase()
  if (cleaned.length !== GREEN_QR_LEN) return null
  // Must be valid Base36
  if (!/^[0-9A-Z]{5}$/.test(cleaned)) return null

  const n = parseInt(cleaned, 36)
  const i = GREEN_BASE36.indexOf(cleaned[1])
  const k = greenGetK(i)
  const serial = (n + k) % GREEN_MOD_SERIAL
  const serialStr = 'B' + String(serial).padStart(8, '0')

  return { serial: serialStr, qr: cleaned, n, i, k }
}

function greenEncode(serialInput: string): string | null {
  let s = serialInput.trim().toUpperCase()
  if (s.startsWith('B')) s = s.slice(1)
  if (!/^\d+$/.test(s)) return null
  const serial = parseInt(s.padStart(8, '0'), 10)

  for (let mult = 0; mult < 3; mult++) {
    const x = serial + mult * GREEN_MOD_SERIAL
    for (let ci = 0; ci < 36; ci++) {
      const k = greenGetK(ci)
      const n = x - k
      if (n >= 0 && n < GREEN_MAX_N) {
        let result = ''
        let val = n
        for (let j = 0; j < GREEN_QR_LEN; j++) {
          result = GREEN_BASE36[val % 36] + result
          val = Math.floor(val / 36)
        }
        if (GREEN_BASE36.indexOf(result[1]) === ci) return result
      }
    }
  }
  return null
}

/* Green ballot also has books of 20 */
function greenDecodeWithBook(qrCode: string) {
  const decoded = greenDecode(qrCode)
  if (!decoded) return null

  const numericSerial = parseInt(decoded.serial.slice(1), 10) // strip 'B'
  const bookNum = Math.floor(numericSerial / 20) + 1
  const posInBook = (numericSerial % 20) || 20

  return {
    ...decoded,
    bookNum,
    bookId: 'B' + String(bookNum).padStart(7, '0'),
    posInBook,
    formula: `⌊${numericSerial} / 20⌋ + 1 = ${bookNum}`,
  }
}

/* ─── Real QR Code Component (scannable) ─── */
function RealQRCode({ data, size }: { data: string; size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data) return
    QRCode.toCanvas(canvasRef.current, data, {
      width: size,
      margin: 0,
      color: { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).catch(() => {})
  }, [data, size])

  return <canvas ref={canvasRef} style={{ display: 'block', width: size, height: size, borderRadius: 4 }} />
}

/* ─── Real Barcode Component (scannable Code128) ─── */
function RealBarcode({ data, height }: { data: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data) return
    try {
      JsBarcode(svgRef.current, data, {
        format: 'CODE128',
        width: 1.5,
        height: height || 40,
        displayValue: false,
        margin: 0,
        background: 'transparent',
        lineColor: '#1a1a1a',
      })
    } catch {}
  }, [data, height])

  return <svg ref={svgRef} style={{ display: 'block', width: '100%', maxHeight: height || 40 }} />
}

/* ─── Ballot Card Visual Component ─── */
function BallotCardVisual({ type, ballotNumber, bookId, posInBook, qrCode }: {
  type: BallotType
  ballotNumber: string
  bookId: string
  posInBook: number
  qrCode?: string
}) {
  const isPink = type === 'pink'
  const bgGradient = isPink
    ? 'linear-gradient(160deg, #fce4ec 0%, #f8bbd0 30%, #f48fb1 70%, #f06292 100%)'
    : 'linear-gradient(160deg, #e8f5e9 0%, #c8e6c9 30%, #a5d6a7 70%, #81c784 100%)'
  const borderColor = isPink ? '#e91e63' : '#43a047'
  const accentColor = isPink ? '#880e4f' : '#1b5e20'
  const lightAccent = isPink ? '#ad1457' : '#2e7d32'
  const subtleBg = isPink ? 'rgba(136, 14, 79, 0.08)' : 'rgba(27, 94, 32, 0.08)'

  return (
    <div style={{
      position: 'relative',
      background: bgGradient,
      borderRadius: 12,
      border: `2px solid ${borderColor}`,
      padding: 0,
      maxWidth: 420,
      margin: '0 auto',
      boxShadow: `0 8px 32px ${isPink ? 'rgba(233,30,99,0.2)' : 'rgba(67,160,71,0.2)'}, 0 2px 8px rgba(0,0,0,0.15)`,
      overflow: 'hidden',
      fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
    }}>
      {/* Watermark texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, ${accentColor} 20px, ${accentColor} 21px)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ padding: '16px 16px 12px', textAlign: 'center', borderBottom: `1.5px dashed ${borderColor}55`, position: 'relative' }}>
        <div style={{
          width: 44, height: 44, margin: '0 auto 8px',
          borderRadius: '50%',
          background: `${accentColor}15`,
          border: `1.5px solid ${accentColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: accentColor, fontWeight: 700, fontSize: 16, lineHeight: 1 }}>&#3588;</span>
        </div>
        <div style={{ fontSize: 11, color: accentColor, fontWeight: 600, letterSpacing: 0.5, marginBottom: 2 }}>
          บัตรเลือกตั้ง
        </div>
        <div style={{ fontSize: 14, color: accentColor, fontWeight: 800, lineHeight: 1.4 }}>
          สมาชิกสภาผู้แทนราษฎร
        </div>
        <div style={{ fontSize: 12, color: lightAccent, fontWeight: 600, marginTop: 2 }}>
          {isPink ? 'แบบบัญชีรายชื่อ' : 'แบบแบ่งเขตเลือกตั้ง'}
        </div>
      </div>

      {/* Footer: Barcode / QR area */}
      <div style={{ borderTop: `1.5px dashed ${borderColor}55`, padding: '12px 16px 14px', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 700,
          padding: '2px 10px', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 2px 8px rgba(239,68,68,0.4)', whiteSpace: 'nowrap', zIndex: 2,
        }}>
          <FileWarning size={10} /> จุดที่สืบย้อนได้
        </div>

        {isPink ? (
          <div style={{
            background: 'rgba(255,255,255,0.85)', borderRadius: 8,
            padding: '10px 12px 8px', border: '2px dashed #ef444466', position: 'relative',
          }}>
            <RealBarcode data={ballotNumber} height={36} />
            <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#1a1a1a', letterSpacing: 2, marginTop: 6 }}>
              {ballotNumber}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)', borderRadius: 8,
              padding: 8, border: '2px dashed #ef444466', position: 'relative',
            }}>
              <RealQRCode data={qrCode || '00000'} size={72} />
              <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#1a1a1a', marginTop: 4, letterSpacing: 2 }}>
                {qrCode || '-----'}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 9, color: `${accentColor}99`, marginBottom: 2 }}>เลขที่บัตร</div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#1a1a1a', letterSpacing: 1 }}>
                {ballotNumber}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decoded info strip */}
      <div style={{
        background: isPink ? 'rgba(136,14,79,0.95)' : 'rgba(27,94,32,0.95)',
        padding: '10px 16px',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, marginBottom: 2 }}>เล่มที่</div>
          <div style={{ color: '#fca5a5', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{bookId}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, marginBottom: 2 }}>ลำดับในเล่ม</div>
          <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{posInBook} / 20</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, marginBottom: 2 }}>สืบย้อนได้?</div>
          <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 12 }}>ได้</div>
        </div>
      </div>
    </div>
  )
}

/* ─── PPTV evidence data ─── */
const PPTV_EVIDENCE = [
  { ballot: 'A37805049', party: 'พรรคเพื่อไทย', color: '#e74c3c' },
  { ballot: 'A37805050', party: 'พรรคไทยสร้างไทย', color: '#f39c12' },
  { ballot: 'A37805055', party: 'พรรคประชาชน', color: '#ff6d21' },
  { ballot: 'A37804930', party: 'พรรคภูมิใจไทย', color: '#3498db' },
]

/* ─── Green ballot example QR codes ─── */
const GREEN_EXAMPLES = [
  { qr: 'EH1RQ', label: 'EH1RQ', color: '#22c55e' },
  { qr: 'K7W9D', label: 'K7W9D', color: '#16a34a' },
]

/* ─── Component ─── */
export default function BallotBarcode() {
  const [ballotType, setBallotType] = useState<BallotType>('pink')
  const [input, setInput] = useState('')
  const [greenInput, setGreenInput] = useState('')
  const [greenMode, setGreenMode] = useState<'decode' | 'encode'>('decode')
  const [history, setHistory] = useState<{ input: string; bookId: string; pos: number; formula: string; type: BallotType }[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showMath, setShowMath] = useState(false)
  const [showECT, setShowECT] = useState(false)
  const [showLaw, setShowLaw] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const greenInputRef = useRef<HTMLInputElement>(null)

  /* Pink ballot result */
  const result = useMemo(() => decodeBallot(input), [input])

  /* Green ballot result */
  const greenResult = useMemo(() => {
    if (greenMode === 'decode') {
      return greenDecodeWithBook(greenInput)
    } else {
      // Encode mode: serial → QR
      const qr = greenEncode(greenInput)
      if (!qr) return null
      // Then decode to verify and show book info
      return greenDecodeWithBook(qr)
    }
  }, [greenInput, greenMode])

  const handleDecode = useCallback(() => {
    if (ballotType === 'pink') {
      if (!result) return
      setHistory(prev => {
        if (prev.some(h => h.input === result.input && h.type === 'pink')) return prev
        return [{ input: result.input, bookId: result.bookId, pos: result.posInBook, formula: result.formula, type: 'pink' as BallotType }, ...prev].slice(0, 20)
      })
    } else {
      if (!greenResult) return
      const label = greenMode === 'decode' ? `QR:${greenInput.toUpperCase()}→${greenResult.serial}` : `${greenResult.serial}→QR:${greenResult.qr}`
      setHistory(prev => {
        if (prev.some(h => h.input === label && h.type === 'green')) return prev
        return [{ input: label, bookId: greenResult.bookId, pos: greenResult.posInBook, formula: greenResult.formula, type: 'green' as BallotType }, ...prev].slice(0, 20)
      })
    }
  }, [ballotType, result, greenResult, greenInput, greenMode])

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
    setBallotType('pink')
    const r = decodeBallot(barcode)
    if (r) {
      setHistory(prev => {
        if (prev.some(h => h.input === r.input && h.type === 'pink')) return prev
        return [{ input: r.input, bookId: r.bookId, pos: r.posInBook, formula: r.formula, type: 'pink' as BallotType }, ...prev].slice(0, 20)
      })
    }
  }, [])

  const handleGreenExample = useCallback((qr: string) => {
    setGreenInput(qr)
    setGreenMode('decode')
    setBallotType('green')
    const r = greenDecodeWithBook(qr)
    if (r) {
      const label = `QR:${qr.toUpperCase()}→${r.serial}`
      setHistory(prev => {
        if (prev.some(h => h.input === label && h.type === 'green')) return prev
        return [{ input: label, bookId: r.bookId, pos: r.posInBook, formula: r.formula, type: 'green' as BallotType }, ...prev].slice(0, 20)
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

      {/* ── Ballot Type Toggle ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 6,
        border: '1px solid var(--border)',
      }}>
        <button
          onClick={() => setBallotType('pink')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: ballotType === 'pink' ? 'linear-gradient(135deg, #ec489922, #f472b622)' : 'transparent',
            color: ballotType === 'pink' ? '#f472b6' : 'var(--text-secondary)',
            outline: ballotType === 'pink' ? '2px solid #f472b644' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <ScanBarcode size={16} />
          <span>บัญชีรายชื่อ (บัตรชมพู)</span>
        </button>
        <button
          onClick={() => setBallotType('green')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: ballotType === 'green' ? 'linear-gradient(135deg, #16a34a22, #22c55e22)' : 'transparent',
            color: ballotType === 'green' ? '#22c55e' : 'var(--text-secondary)',
            outline: ballotType === 'green' ? '2px solid #22c55e44' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <QrCode size={16} />
          <span>ส.ส. แบ่งเขต (บัตรเขียว)</span>
        </button>
      </div>

      {/* ── Decoder Form ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 12,
        padding: 20,
        border: `1px solid ${ballotType === 'green' ? '#22c55e33' : 'var(--border)'}`,
        marginBottom: 20,
      }}>

      {/* ── Pink Ballot Decoder ── */}
      {ballotType === 'pink' && (<>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={18} style={{ color: '#f472b6' }} />
          ถอดรหัส: เลขที่บัตร → เล่มที่ <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>(บัตรชมพู)</span>
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
            {/* Ballot Card Visual */}
            <div style={{ marginBottom: 16 }}>
              <BallotCardVisual
                type="pink"
                ballotNumber={result.input}
                bookId={result.bookId}
                posInBook={result.posInBook}
              />
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
              overflowWrap: 'break-word',
              wordBreak: 'break-all',
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
      </>)}

      {/* ── Green Ballot Decoder ── */}
      {ballotType === 'green' && (<>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <QrCode size={18} style={{ color: '#22c55e' }} />
          ถอดรหัส QR Code บัตร ส.ส. แบ่งเขต <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>(บัตรเขียว)</span>
        </h3>

        {/* Mode toggle: Decode / Encode */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <button
            onClick={() => { setGreenMode('decode'); setGreenInput('') }}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: greenMode === 'decode' ? '#22c55e22' : 'transparent',
              border: `1px solid ${greenMode === 'decode' ? '#22c55e' : 'var(--border)'}`,
              color: greenMode === 'decode' ? '#22c55e' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <LockOpen size={12} /> Decode (QR → เลขที่บัตร)
          </button>
          <button
            onClick={() => { setGreenMode('encode'); setGreenInput('') }}
            style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: greenMode === 'encode' ? '#22c55e22' : 'transparent',
              border: `1px solid ${greenMode === 'encode' ? '#22c55e' : 'var(--border)'}`,
              color: greenMode === 'encode' ? '#22c55e' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Lock size={12} /> Encode (เลขที่บัตร → QR)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            {greenMode === 'decode'
              ? <QrCode size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }} />
              : <Hash size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }} />
            }
            <input
              ref={greenInputRef}
              type="text"
              value={greenInput}
              onChange={e => setGreenInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={greenMode === 'decode' ? 'กรอก QR Code 5 ตัวอักษร เช่น K7W9D' : 'กรอกเลขที่บัตร เช่น B12345678'}
              style={{
                width: '100%',
                padding: '10px 12px 10px 34px',
                borderRadius: 8,
                border: '1px solid #22c55e44',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontFamily: 'monospace',
                outline: 'none',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            />
          </div>
          <button
            onClick={handleDecode}
            disabled={!greenResult}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: greenResult ? '#22c55e' : 'var(--bg-primary)',
              color: greenResult ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${greenResult ? '#22c55e' : 'var(--border)'}`,
              cursor: greenResult ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <Search size={14} /> {greenMode === 'decode' ? 'ถอดรหัส' : 'สร้าง QR'}
          </button>
        </div>

        {/* ── Green Result ── */}
        {greenResult && (
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #22c55e33',
            animation: 'fadeIn 0.3s ease',
          }}>
            {/* Ballot Card Visual */}
            <div style={{ marginBottom: 16 }}>
              <BallotCardVisual
                type="green"
                ballotNumber={greenResult.serial}
                bookId={greenResult.bookId}
                posInBook={greenResult.posInBook}
                qrCode={greenResult.qr}
              />
            </div>

            {/* Decode formula */}
            <div style={{
              background: '#1e293b',
              borderRadius: 8,
              padding: '10px 14px',
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.8,
              overflowWrap: 'break-word',
              wordBreak: 'break-all',
            }}>
              <div><span style={{ color: '#94a3b8' }}>// QR → Base36 → ตัวเลข</span></div>
              <div><span style={{ color: '#22c55e' }}>n</span> = parseInt(&quot;{greenResult.qr}&quot;, 36) = <span style={{ color: '#fbbf24' }}>{greenResult.n}</span></div>
              <div><span style={{ color: '#22c55e' }}>i</span> = index(&quot;{greenResult.qr[1]}&quot;) = <span style={{ color: '#fbbf24' }}>{greenResult.i}</span></div>
              <div><span style={{ color: '#22c55e' }}>K</span> = (32,216,237 × {greenResult.i} + 42,413,113) mod 10⁸ = <span style={{ color: '#fbbf24' }}>{greenResult.k.toLocaleString()}</span></div>
              <div><span style={{ color: '#4ade80' }}>serial</span> = ({greenResult.n.toLocaleString()} + {greenResult.k.toLocaleString()}) mod 10⁸ = <span style={{ color: '#4ade80', fontWeight: 700 }}>{greenResult.serial}</span></div>
            </div>
          </div>
        )}

        {/* Quick examples */}
        <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ตัวอย่าง:</span>
          {GREEN_EXAMPLES.map(e => (
            <button
              key={e.qr}
              onClick={() => handleGreenExample(e.qr)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: 'monospace',
                background: greenInput.toUpperCase() === e.qr ? `${e.color}22` : 'var(--bg-primary)',
                border: `1px solid ${greenInput.toUpperCase() === e.qr ? e.color : 'var(--border)'}`,
                color: greenInput.toUpperCase() === e.qr ? e.color : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Info note */}
        <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'start', fontSize: 11, color: 'var(--text-secondary)' }}>
          <Info size={12} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            อัลกอริทึมจาก <a href="https://verify.election.in.th/" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e' }}>verify.election.in.th</a> โดย <a href="https://x.com/killernay" target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e' }}>@killernay</a> — QR Code บัตร ส.ส. แบ่งเขต ใช้ Base36 encoding 5 หลัก + K table (linear congruential)
          </span>
        </div>
      </>)}

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
            <BookOpen size={16} /> ประวัติการถอดรหัส ({history.length})
          </h3>

          {/* Desktop: table */}
          <div className="history-table-desktop" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ประเภท</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ข้อมูล</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>เล่มที่ (M)</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ลำดับในเล่ม</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-secondary)', fontWeight: 600 }}>สูตร</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.input + h.type} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: h.type === 'green' ? '#22c55e22' : '#f472b622',
                        color: h.type === 'green' ? '#22c55e' : '#f472b6',
                      }}>
                        {h.type === 'green' ? 'เขต' : 'PL'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: h.type === 'green' ? '#22c55e' : 'var(--accent)', fontWeight: 600, fontSize: 12 }}>{h.input}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: '#ef4444', fontWeight: 700 }}>{h.bookId}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{h.pos} / 20</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{h.formula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card list */}
          <div className="history-cards-mobile">
            {history.map(h => (
              <div key={h.input + h.type} style={{
                background: 'var(--bg-primary)',
                borderRadius: 10,
                padding: 12,
                border: `1px solid ${h.type === 'green' ? '#22c55e33' : 'var(--border)'}`,
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: h.type === 'green' ? '#22c55e22' : '#f472b622',
                      color: h.type === 'green' ? '#22c55e' : '#f472b6',
                    }}>
                      {h.type === 'green' ? 'เขต' : 'PL'}
                    </span>
                    <span style={{ fontFamily: 'monospace', color: h.type === 'green' ? '#22c55e' : 'var(--accent)', fontWeight: 600, fontSize: 13, letterSpacing: 0.5, wordBreak: 'break-all' }}>
                      {h.input}
                    </span>
                  </div>
                  <div style={{
                    background: '#ef444422',
                    color: '#ef4444',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                  }}>
                    เล่ม {h.bookId}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span>ลำดับ <strong style={{ color: 'var(--text-primary)' }}>{h.pos}/20</strong></span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{h.formula}</span>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            .history-cards-mobile { display: none; }
            @media (max-width: 640px) {
              .history-table-desktop { display: none !important; }
              .history-cards-mobile { display: block; }
            }
          `}</style>
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

        {/* Desktop: table */}
        <div className="pptv-table-desktop" style={{ overflowX: 'auto' }}>
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

        {/* Mobile: card list */}
        <div className="pptv-cards-mobile">
          {PPTV_EVIDENCE.map((e, i) => {
            const d = decodeBallot(e.ballot)!
            return (
              <div key={e.ballot} style={{
                background: 'var(--bg-primary)',
                borderRadius: 10,
                padding: 12,
                border: '1px solid var(--border)',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                      fontSize: 11, fontWeight: 700,
                    }}>{i + 1}</span>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: e.color,
                    }} />
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>{e.party}</span>
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)' }}>{d.posInBook}/20</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}>{e.ballot}</div>
                  <div style={{
                    background: '#ef444422', color: '#ef4444',
                    fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
                    padding: '2px 8px', borderRadius: 5,
                  }}>
                    {d.bookId}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <style>{`
          .pptv-cards-mobile { display: none; }
          @media (max-width: 640px) {
            .pptv-table-desktop { display: none !important; }
            .pptv-cards-mobile { display: block; }
          }
        `}</style>

        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10, display: 'flex', alignItems: 'start', gap: 4 }}>
          <Info size={11} style={{ flexShrink: 0, marginTop: 2 }} /> <span>ใบที่ 1-3 มาจากเล่มเดียวกัน (A1890253) ใบที่ 4 มาจากเล่มก่อนหน้า (A1890247) — ทั้ง 4 ใบมาจากหน่วยเดียวกัน</span>
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', minWidth: 0 }}>
            <Calculator size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} /> <span>อธิบายหลักคณิตศาสตร์</span>
          </span>
          <span style={{ flexShrink: 0 }}>{showMath ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
        </button>

        {showMath && (
          <div style={{ padding: '0 16px 16px', fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
            <div style={{
              background: '#1e293b',
              borderRadius: 8,
              padding: 16,
              fontFamily: 'monospace',
              marginBottom: 14,
              fontSize: 14,
              lineHeight: 2,
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}>
              <div style={{ color: '#94a3b8', marginBottom: 4 }}>{'// กำหนดให้'}</div>
              <div><span style={{ color: '#60a5fa' }}>M</span> <span style={{ color: '#94a3b8' }}>=</span> เล่มที่ <span style={{ color: '#94a3b8' }}>(Book ID)</span></div>
              <div><span style={{ color: '#fbbf24' }}>N</span> <span style={{ color: '#94a3b8' }}>=</span> เลขที่บัตร</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>&nbsp;&nbsp;&nbsp;&nbsp;(Ballot Number จากบาร์โค้ด)</div>
              <div style={{ marginTop: 8, color: '#94a3b8' }}>{'// สูตร'}</div>
              <div style={{ fontSize: 16, color: '#f0f0f0' }}>
                <span style={{ color: '#60a5fa' }}>M</span> = ⌊<span style={{ color: '#fbbf24' }}>N</span> / 20⌋ + 1
              </div>
            </div>

            <p style={{ overflowWrap: 'break-word' }}>
              <strong style={{ color: 'var(--text-primary)' }}>ทำไม 20?</strong> — กกต. ระบุว่าบัตรเลือกตั้ง 1 เล่ม มี <strong style={{ color: 'var(--accent)' }}>20 ฉบับ</strong>
            </p>

            <p style={{ overflowWrap: 'break-word' }}>
              <strong style={{ color: 'var(--text-primary)' }}>แปลว่าอะไร?</strong> — เลขที่บัตร (N) จะเรียงลำดับต่อเนื่องไปเรื่อยๆ ไม่มีซ้ำ แต่ละเล่มจะมี 20 ใบ
            </p>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 12,
              lineHeight: 1.8,
              color: '#94a3b8',
              background: 'var(--bg-primary)',
              borderRadius: 6,
              padding: '8px 12px',
              marginBottom: 8,
            }}>
              เล่ม 1 = บัตร 1–20<br />
              เล่ม 2 = บัตร 21–40<br />
              เล่ม 3 = บัตร 41–60 ...
            </div>

            <p style={{ overflowWrap: 'break-word' }}>
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
              <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2, color: '#94a3b8', overflowWrap: 'break-word', wordBreak: 'break-all' }}>
                <div>บาร์โค้ด: <span style={{ color: 'var(--accent)' }}>A03398985</span></div>
                <div>N = 3398985</div>
                <div>M = ⌊3398985 / 20⌋ + 1</div>
                <div>&nbsp; = ⌊169949.25⌋ + 1</div>
                <div>&nbsp; = 169949 + 1 = <span style={{ color: '#ef4444', fontWeight: 700 }}>169950</span></div>
                <div>เล่มที่ = <span style={{ color: '#ef4444', fontWeight: 700 }}>A0169950</span></div>
                <div>ลำดับในเล่ม = 3398985 mod 20</div>
                <div>&nbsp; = <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>5</span> (ใบที่ 5 จาก 20)</div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontSize: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>JavaScript:</strong>
              <pre style={{
                background: '#1e293b',
                borderRadius: 6,
                padding: 12,
                marginTop: 6,
                fontSize: 12,
                lineHeight: 1.6,
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                overflowWrap: 'break-word',
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', minWidth: 0 }}>
            <Building2 size={16} style={{ color: '#60a5fa', flexShrink: 0 }} /> <span>คำชี้แจงจาก กกต.</span>
          </span>
          <span style={{ flexShrink: 0 }}>{showECT ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', minWidth: 0 }}>
            <Gavel size={16} style={{ color: '#eab308', flexShrink: 0 }} /> <span>กฎหมายที่เกี่ยวข้อง — พ.ร.บ.ประกอบ รธน. เลือกตั้ง ส.ส.</span>
          </span>
          <span style={{ flexShrink: 0 }}>{showLaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: 13 }}>
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
