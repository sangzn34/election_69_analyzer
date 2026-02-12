'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import {
  AlertTriangle, Info, Search, X, ChevronDown,
  ArrowUpRight, ArrowDownRight, Minus, Scale, Filter,
  Share2, Link2, Check,
} from 'lucide-react'
import type { BallotImbalance as BallotImbalanceData, BallotImbalanceAreaItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ─── Helpers ─── */
function fmt(n: number) { return n.toLocaleString('th-TH') }
function fmtPct(n: number, sign = true) { return `${sign && n > 0 ? '+' : ''}${n.toFixed(2)}%` }

function diffColor(pct: number) {
  const abs = Math.abs(pct)
  if (abs > 10) return '#ef4444'
  if (abs > 5) return '#f97316'
  if (abs > 2) return '#eab308'
  return '#22c55e'
}

function directionLabel(d: string) {
  if (d === 'mp') return 'MP > PL'
  if (d === 'pl') return 'PL > MP'
  return 'เท่ากัน'
}

/* ─── Tab ─── */
type TabMode = 'overview' | 'areas' | 'province'

/* ─── URL helpers ─── */
function getParamFromURL(key: string): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

function buildShareURL(params: Record<string, string>): string {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  url.searchParams.set('section', 'ballotImbalance')
  for (const [k, v] of Object.entries(params)) {
    if (v && v !== 'all' && v !== 'false' && v !== 'overview') {
      url.searchParams.set(k, v)
    } else {
      url.searchParams.delete(k)
    }
  }
  return url.toString()
}

function syncURL(params: Record<string, string>) {
  if (typeof window === 'undefined') return
  const url = buildShareURL(params)
  window.history.replaceState(null, '', url)
}

/* ─── Copy-to-clipboard with toast ─── */
function useCopyToast() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copy = useCallback((text: string, id = '__global__') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopiedId(null), 2000)
    })
  }, [])
  return { copiedId, copy }
}

/* ─── Props ─── */
interface Props {
  data: BallotImbalanceData
  nameToCodeMap: NameToCodeMap
}

export default function BallotImbalanceView({ data, nameToCodeMap }: Props) {
  /* ── Read initial state from URL query params ── */
  const initTab = (getParamFromURL('biTab') as TabMode) || 'overview'
  const initSearch = getParamFromURL('biSearch') || ''
  const initOutlier = getParamFromURL('biOutlier') === '1'
  const initDir = (getParamFromURL('biDir') as 'all' | 'mp' | 'pl') || 'all'
  const initArea = getParamFromURL('biArea') || ''

  const [tab, setTab] = useState<TabMode>(initArea ? 'areas' : initTab)
  const [search, setSearch] = useState(initArea || initSearch)
  const [showCount, setShowCount] = useState(30)
  const [filterOutlier, setFilterOutlier] = useState(initOutlier)
  const [filterDirection, setFilterDirection] = useState<'all' | 'mp' | 'pl'>(initDir)
  const [highlightArea, setHighlightArea] = useState<string>(initArea)

  const highlightRef = useRef<HTMLTableRowElement | null>(null)
  const { copiedId, copy } = useCopyToast()

  const { perArea, histogram, byProvince, meta } = data

  /* ── Sync state → URL (replaceState so no extra history entries) ── */
  useEffect(() => {
    syncURL({
      biTab: tab,
      biSearch: highlightArea ? '' : search,   // don't store search if from biArea
      biOutlier: filterOutlier ? '1' : 'false',
      biDir: filterDirection,
      biArea: highlightArea,
    })
  }, [tab, search, filterOutlier, filterDirection, highlightArea])

  /* ── Scroll to highlighted area row ── */
  useEffect(() => {
    if (highlightArea && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightArea, tab])

  /* ── Build share URL for current view ── */
  const currentShareURL = useMemo(() => buildShareURL({
    biTab: tab,
    biSearch: search,
    biOutlier: filterOutlier ? '1' : 'false',
    biDir: filterDirection,
  }), [tab, search, filterOutlier, filterDirection])

  /* ── Build share URL for a single area ── */
  const areaShareURL = useCallback((areaCode: string) => buildShareURL({
    biTab: 'areas',
    biArea: areaCode,
  }), [])

  /* ── Scatter data: MP total vs PL total ── */
  const scatterData = useMemo(() =>
    perArea.map(a => ({
      x: a.mpTotalVotes,
      y: a.plTotalVotes,
      name: a.areaName,
      diffPct: a.diffPercent,
      isOutlier: a.isOutlier,
      fill: a.isOutlier ? '#ef4444' : '#60a5fa55',
      z: a.isOutlier ? 80 : 40,
    }))
  , [perArea])

  /* ── Filtered areas ── */
  const filteredAreas = useMemo(() => {
    let items = perArea
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(a =>
        a.areaName.includes(q) || a.province.includes(q) || a.areaCode.includes(q)
      )
    }
    if (filterOutlier) items = items.filter(a => a.isOutlier)
    if (filterDirection === 'mp') items = items.filter(a => a.diff > 0)
    if (filterDirection === 'pl') items = items.filter(a => a.diff < 0)
    return items
  }, [perArea, search, filterOutlier, filterDirection])

  /* ── Histogram with colors ── */
  const histogramColored = useMemo(() =>
    histogram.map(h => ({
      ...h,
      label: `${h.bucket}%`,
      fill: Math.abs(h.bucket) > 2 * meta.stdDiffPercent ? '#ef4444' : Math.abs(h.bucket) > meta.stdDiffPercent ? '#eab308' : '#22c55e',
    }))
  , [histogram, meta.stdDiffPercent])

  /* ── Top outlier areas for waterfall chart ── */
  const topOutliers = useMemo(() =>
    perArea
      .filter(a => Math.abs(a.diffPercent) > 5)
      .sort((a, b) => b.diffPercent - a.diffPercent)
      .map(a => ({
        name: a.areaName.length > 18 ? a.areaName.slice(0, 17) + '…' : a.areaName,
        fullName: a.areaName,
        diffPct: a.diffPercent,
        diff: a.diff,
        color: a.diffPercent > 0 ? '#f97316' : '#60a5fa',
      }))
  , [perArea])

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div className="section-title"><Scale size={20} /> บัตรเขย่ง — เปรียบเทียบจำนวนบัตรเลือก ส.ส. กับ บัญชีรายชื่อ</div>
          <div className="section-desc">
            เปรียบเทียบ<strong>จำนวนคะแนนรวม</strong>ของบัตรเลือก ส.ส. เขต กับ บัตรบัญชีรายชื่อ ในแต่ละเขตเลือกตั้ง —
            ถ้าผู้มีสิทธิ์ทุกคนกรอกบัตรทั้ง 2 ใบ จำนวนคะแนนรวมทั้งสองระบบ<strong>ควรใกล้เคียงกัน</strong>
          </div>
        </div>
        <button
          onClick={() => copy(currentShareURL)}
          title="คัดลอกลิงก์แชร์"
          style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
            background: copiedId === '__global__' ? '#22c55e22' : 'var(--bg-secondary)',
            border: copiedId === '__global__' ? '1px solid #22c55e' : '1px solid var(--border)',
            color: copiedId === '__global__' ? '#22c55e' : 'var(--accent)',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {copiedId === '__global__' ? <Check size={14} /> : <Share2 size={14} />}
          {copiedId === '__global__' ? 'คัดลอกแล้ว!' : 'แชร์หน้านี้'}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          <Info size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> ภาพรวม
        </button>
        <button className={`tab ${tab === 'areas' ? 'active' : ''}`} onClick={() => setTab('areas')}>
          <Search size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> รายเขต ({meta.totalAreas})
        </button>
        <button className={`tab ${tab === 'province' ? 'active' : ''}`} onClick={() => setTab('province')}>
          <Filter size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> รายจังหวัด
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="overview-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-number">{meta.totalAreas}</div>
          <div className="stat-label">เขตเลือกตั้ง</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--danger)' }}>{meta.outlierCount}</div>
          <div className="stat-label">เขตผิดปกติ (|z|{'>'}2)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ fontSize: 15, color: 'var(--text-primary)' }}>
            {fmtPct(meta.meanDiffPercent)} ± {meta.stdDiffPercent.toFixed(2)}%
          </div>
          <div className="stat-label">ค่าเฉลี่ย ± σ (%)</div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 14 }}>
            <span style={{ color: '#f97316' }}>{meta.mpHigherCount} <span style={{ fontSize: 10 }}>MP{'>'}</span></span>
            <span style={{ color: '#60a5fa' }}>{meta.plHigherCount} <span style={{ fontSize: 10 }}>PL{'>'}</span></span>
          </div>
          <div className="stat-label">จำนวนเขต</div>
        </div>
      </div>

      {/* ═══════════ TAB: OVERVIEW ═══════════ */}
      {tab === 'overview' && (
        <div>
          {/* ── Explanation ── */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 12, padding: 18,
            border: '1px solid var(--border)', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  ⚖️ "บัตรเขย่ง" คืออะไร?
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '0 0 8px' }}>
                    ในการเลือกตั้งแบบ<strong>บัตร 2 ใบ</strong> ผู้มีสิทธิ์จะได้รับบัตร 2 ใบ:
                    บัตร <strong style={{ color: '#f97316' }}>ส.ส. เขต</strong> (เลือกตัวบุคคล) กับ บัตร <strong style={{ color: '#60a5fa' }}>บัญชีรายชื่อ</strong> (เลือกพรรค)
                    — ถ้าผู้มีสิทธิ์ทุกคนลงคะแนนทั้ง 2 บัตร จำนวนคะแนนรวม (valid votes) ของบัตรทั้งสองควร<strong>ใกล้เคียงกัน</strong>
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    <strong>"บัตรเขย่ง"</strong> = เขตที่จำนวนคะแนนรวมของบัตร 2 ใบ <u>ต่างกันมาก</u> ซึ่งอาจเกิดจาก:
                  </p>
                  <ul style={{ margin: '0 0 8px', paddingLeft: 20 }}>
                    <li><span style={{ color: '#f97316', fontWeight: 600 }}>MP {'>'} PL มาก</span> — อาจมีการยัดบัตร ส.ส.เขต หรือผู้เลือกจำนวนมากไม่กรอกบัตรบัญชีรายชื่อ</li>
                    <li><span style={{ color: '#60a5fa', fontWeight: 600 }}>PL {'>'} MP มาก</span> — อาจมีการยัดบัตรบัญชีรายชื่อ หรือผู้เลือกจำนวนมากไม่กรอกบัตร ส.ส.เขต</li>
                    <li>อาจเกิดจากปัจจัยปกติ เช่น บัตรเสีย ไม่ประสงค์ลงคะแนน (no-vote) ที่แตกต่างกันระหว่าง 2 ระบบ</li>
                  </ul>
                  <p style={{ margin: 0 }}>
                    <strong>💡 วิธีอ่าน:</strong> ค่า z-score ที่ |z| {'>'} 2 (เกิน 2 ส่วนเบี่ยงเบนมาตรฐาน) ถือว่า<strong>ผิดปกติทางสถิติ</strong>
                    — ควรตรวจสอบรายละเอียดเพิ่มเติม
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Histogram ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            การกระจายตัวของ %ส่วนต่าง (MP − PL) / ค่าเฉลี่ย
          </h3>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span style={{ color: '#22c55e' }}>🟢 ปกติ</span> (&lt;1σ) &nbsp;·&nbsp;
            <span style={{ color: '#eab308' }}>🟡 เฝ้าระวัง</span> (1-2σ) &nbsp;·&nbsp;
            <span style={{ color: '#ef4444' }}>🔴 ผิดปกติ</span> (&gt;2σ)
          </div>
          <div style={{ width: '100%', height: 280, marginBottom: 32 }}>
            <ResponsiveContainer>
              <BarChart data={histogramColored} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d4168" />
                <XAxis
                  dataKey="label"
                  stroke="#aaa"
                  fontSize={11}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  tick={{ fill: '#ccc' }}
                />
                <YAxis stroke="#aaa" fontSize={12} tick={{ fill: '#ccc' }} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #3d4168', borderRadius: 8, fontSize: 13, color: '#e0e0e0' }}
                  wrapperStyle={{ outline: 'none' }}
                  labelStyle={{ color: '#e8eaed', fontWeight: 600 }}
                  itemStyle={{ color: '#9aa0a6' }}
                  formatter={(value: number) => [`${value} เขต`, 'จำนวน']}
                  labelFormatter={(label: string) => `ส่วนต่าง ${label}`}
                />
                <ReferenceLine x={`${Math.round(meta.meanDiffPercent)}%`} stroke="#fff" strokeDasharray="3 3" label={{ value: 'μ', fill: '#fff', fontSize: 11 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogramColored.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Scatter: MP total vs PL total ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            Scatter Plot: คะแนนรวม ส.ส.เขต vs บัญชีรายชื่อ
          </h3>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            จุดที่อยู่บนเส้นทแยงมุม = คะแนนเท่ากัน · <span style={{ color: '#ef4444' }}>● จุดแดง</span> = เขตผิดปกติ (|z|{'>'}2)
          </div>
          <div style={{ width: '100%', height: 400, marginBottom: 32 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3d4168" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="ส.ส.เขต"
                  stroke="#aaa"
                  fontSize={12}
                  tick={{ fill: '#ccc' }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                  label={{ value: 'คะแนนรวม ส.ส.เขต', position: 'insideBottom', offset: -5, fill: '#ccc', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="บัญชีรายชื่อ"
                  stroke="#aaa"
                  fontSize={12}
                  tick={{ fill: '#ccc' }}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                  label={{ value: 'คะแนนรวมบัญชีรายชื่อ', angle: -90, position: 'insideLeft', fill: '#ccc', fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="z" range={[30, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #3d4168', borderRadius: 8, fontSize: 13, color: '#e0e0e0' }}
                  wrapperStyle={{ outline: 'none' }}
                  labelStyle={{ color: '#e8eaed', fontWeight: 600 }}
                  itemStyle={{ color: '#9aa0a6' }}
                  formatter={(value: number, name: string) => [fmt(value), name]}
                  labelFormatter={(_: unknown, payload: Array<{ payload?: { name?: string; diffPct?: number } }>) => {
                    const p = payload?.[0]?.payload
                    return p ? `${p.name} (Δ${fmtPct(p.diffPct ?? 0)})` : ''
                  }}
                />
                {/* Diagonal reference: y = x */}
                <ReferenceLine
                  segment={[{ x: 30000, y: 30000 }, { x: 120000, y: 120000 }]}
                  stroke="#888"
                  strokeDasharray="5 5"
                  label={{ value: 'MP = PL', fill: '#bbb', fontSize: 11 }}
                />
                <Scatter data={scatterData} isAnimationActive={false}>
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* ── Top outlier waterfall ── */}
          {topOutliers.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
                <AlertTriangle size={16} style={{ verticalAlign: -2, marginRight: 4, color: '#ef4444' }} />
                เขตที่มีส่วนต่างเกิน ±5%
              </h3>
              <div style={{ width: '100%', height: Math.max(250, topOutliers.length * 28 + 60), marginBottom: 24 }}>
                <ResponsiveContainer>
                  <BarChart data={topOutliers} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3d4168" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#aaa"
                      fontSize={12}
                      tick={{ fill: '#ccc' }}
                      tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                    />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#e0e0e0', fontSize: 12, fontWeight: 500 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e2130', border: '1px solid #3d4168', borderRadius: 8, fontSize: 13, color: '#e0e0e0' }}
                      wrapperStyle={{ outline: 'none' }}
                      labelStyle={{ color: '#e8eaed', fontWeight: 600 }}
                      itemStyle={{ color: '#9aa0a6' }}
                      formatter={(value: number) => [`${fmtPct(value)}`, 'ส่วนต่าง %']}
                      labelFormatter={(_: string, payload: Array<{ payload?: { fullName?: string; diff?: number } }>) => {
                        const p = payload?.[0]?.payload
                        return p ? `${p.fullName} (${fmt(p.diff ?? 0)} เสียง)` : ''
                      }}
                    />
                    <ReferenceLine x={0} stroke="#888" strokeWidth={2} />
                    <Bar dataKey="diffPct" radius={[0, 4, 4, 0]} barSize={16}>
                      {topOutliers.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ── Max outlier callouts ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
            {meta.maxMpHigher && (
              <div style={{
                background: 'var(--bg-secondary)', borderRadius: 12, padding: 16,
                border: '2px solid #f9731644',
              }}>
                <div style={{ fontSize: 11, color: '#f97316', fontWeight: 600, marginBottom: 6 }}>
                  <ArrowUpRight size={14} style={{ verticalAlign: -2 }} /> MP สูงกว่า PL มากที่สุด
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{meta.maxMpHigher.areaName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  MP สูงกว่า {fmt(meta.maxMpHigher.diff)} เสียง ({fmtPct(meta.maxMpHigher.diffPercent)})
                </div>
              </div>
            )}
            {meta.maxPlHigher && (
              <div style={{
                background: 'var(--bg-secondary)', borderRadius: 12, padding: 16,
                border: '2px solid #60a5fa44',
              }}>
                <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 6 }}>
                  <ArrowDownRight size={14} style={{ verticalAlign: -2 }} /> PL สูงกว่า MP มากที่สุด
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{meta.maxPlHigher.areaName}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  PL สูงกว่า {fmt(Math.abs(meta.maxPlHigher.diff))} เสียง ({fmtPct(meta.maxPlHigher.diffPercent)})
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TAB: AREAS ═══════════ */}
      {tab === 'areas' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="ค้นหาเขต / จังหวัด..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 30px 7px 30px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={filterOutlier} onChange={e => setFilterOutlier(e.target.checked)} style={{ accentColor: 'var(--danger)' }} />
              เฉพาะผิดปกติ
            </label>
            <select
              value={filterDirection}
              onChange={e => setFilterDirection(e.target.value as typeof filterDirection)}
              style={{
                padding: '6px 10px', borderRadius: 8, fontSize: 12,
                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', outline: 'none',
              }}
            >
              <option value="all">ทั้งหมด</option>
              <option value="mp">MP {'>'} PL</option>
              <option value="pl">PL {'>'} MP</option>
            </select>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {filteredAreas.length} เขต
            </span>
          </div>

          {/* Table */}
          <div style={{ maxHeight: 600, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table className="province-table">
              <thead>
                <tr>
                  <th>เขต</th>
                  <th style={{ textAlign: 'right' }}>MP รวม</th>
                  <th style={{ textAlign: 'right' }}>PL รวม</th>
                  <th style={{ textAlign: 'right' }}>ส่วนต่าง</th>
                  <th style={{ textAlign: 'right' }}>Δ%</th>
                  <th style={{ textAlign: 'center' }}>z</th>
                  <th>ชนะ</th>
                  <th style={{ width: 100 }}>เทียบ</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.slice(0, showCount).map(a => {
                  const isHighlighted = highlightArea === a.areaCode
                  return (
                  <tr
                    key={a.areaCode}
                    ref={isHighlighted ? highlightRef : undefined}
                    style={{
                      background: isHighlighted
                        ? 'rgba(96,165,250,0.15)'
                        : a.isOutlier ? 'rgba(239,68,68,0.06)' : undefined,
                      outline: isHighlighted ? '2px solid #60a5fa' : undefined,
                      borderRadius: isHighlighted ? 8 : undefined,
                      transition: 'background 0.3s, outline 0.3s',
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: a.isOutlier ? 700 : 400, fontSize: 13 }}>
                        {a.isOutlier && <AlertTriangle size={12} style={{ color: '#ef4444', verticalAlign: -1, marginRight: 4 }} />}
                        {a.areaName}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{a.areaCode}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                      {fmt(a.mpTotalVotes)}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
                      {fmt(a.plTotalVotes)}
                    </td>
                    <td style={{
                      textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12,
                      fontWeight: 600, color: a.diff > 0 ? '#f97316' : a.diff < 0 ? '#60a5fa' : '#888',
                    }}>
                      {a.diff > 0 ? <ArrowUpRight size={12} style={{ verticalAlign: -1 }} /> :
                       a.diff < 0 ? <ArrowDownRight size={12} style={{ verticalAlign: -1 }} /> :
                       <Minus size={12} style={{ verticalAlign: -1 }} />}
                      {fmt(Math.abs(a.diff))}
                    </td>
                    <td style={{
                      textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12,
                      fontWeight: 700, color: diffColor(a.diffPercent),
                    }}>
                      {fmtPct(a.diffPercent)}
                    </td>
                    <td style={{
                      textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 11,
                      fontWeight: a.isOutlier ? 700 : 400,
                      color: a.isOutlier ? '#ef4444' : 'var(--text-secondary)',
                    }}>
                      {a.zScore.toFixed(1)}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <PartyLogo partyCode={nameToCodeMap[a.winnerParty]} size={16} />
                        <span style={{ fontSize: 11 }}>{a.winnerParty}</span>
                      </span>
                    </td>
                    <td>
                      {/* Mini comparison bar */}
                      <div style={{ position: 'relative', height: 14, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                        {(() => {
                          const max = Math.max(a.mpTotalVotes, a.plTotalVotes)
                          return (
                            <>
                              <div style={{ position: 'absolute', top: 0, left: 0, height: 7, width: `${(a.mpTotalVotes / max) * 100}%`, background: '#f97316', borderRadius: '4px 4px 0 0' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, height: 7, width: `${(a.plTotalVotes / max) * 100}%`, background: '#60a5fa', borderRadius: '0 0 4px 4px' }} />
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => copy(areaShareURL(a.areaCode), a.areaCode)}
                        title={`แชร์ข้อมูล ${a.areaName}`}
                        style={{
                          padding: '3px 6px', borderRadius: 6, cursor: 'pointer',
                          background: copiedId === a.areaCode ? '#22c55e22' : 'transparent',
                          border: copiedId === a.areaCode ? '1px solid #22c55e' : '1px solid transparent',
                          color: copiedId === a.areaCode ? '#22c55e' : 'var(--text-secondary)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {copiedId === a.areaCode ? <Check size={12} /> : <Link2 size={12} />}
                      </button>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              เทียบ: <span style={{ color: '#f97316' }}>■</span> MP &nbsp; <span style={{ color: '#60a5fa' }}>■</span> PL
            </div>
            {filteredAreas.length > showCount && (
              <button
                onClick={() => setShowCount(s => s + 30)}
                style={{
                  padding: '6px 16px', borderRadius: 8, fontSize: 12,
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <ChevronDown size={14} /> แสดงเพิ่ม ({filteredAreas.length - showCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TAB: PROVINCE ═══════════ */}
      {tab === 'province' && (
        <div>
          <div style={{ maxHeight: 600, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table className="province-table">
              <thead>
                <tr>
                  <th>จังหวัด</th>
                  <th style={{ textAlign: 'right' }}>MP รวม</th>
                  <th style={{ textAlign: 'right' }}>PL รวม</th>
                  <th style={{ textAlign: 'right' }}>ส่วนต่าง</th>
                  <th style={{ textAlign: 'right' }}>Δ%</th>
                  <th style={{ textAlign: 'center' }}>เขต</th>
                  <th style={{ textAlign: 'center' }}>ผิดปกติ</th>
                </tr>
              </thead>
              <tbody>
                {byProvince.map(p => (
                  <tr key={p.province} style={{ background: p.outliers > 0 ? 'rgba(239,68,68,0.06)' : undefined }}>
                    <td style={{ fontWeight: p.outliers > 0 ? 700 : 400, fontSize: 13 }}>
                      {p.outliers > 0 && <AlertTriangle size={12} style={{ color: '#ef4444', verticalAlign: -1, marginRight: 4 }} />}
                      {p.province}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{fmt(p.mpTotal)}</td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{fmt(p.plTotal)}</td>
                    <td style={{
                      textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 600,
                      color: p.diff > 0 ? '#f97316' : p.diff < 0 ? '#60a5fa' : '#888',
                    }}>
                      {p.diff > 0 ? '+' : ''}{fmt(p.diff)}
                    </td>
                    <td style={{
                      textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12,
                      fontWeight: 700, color: diffColor(p.diffPercent),
                    }}>
                      {fmtPct(p.diffPercent)}
                    </td>
                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>{p.areas}</td>
                    <td style={{
                      textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontSize: 12,
                      fontWeight: p.outliers > 0 ? 700 : 400,
                      color: p.outliers > 0 ? '#ef4444' : 'var(--text-secondary)',
                    }}>
                      {p.outliers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
