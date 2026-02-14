'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Search, X, Info, Award, Users,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown,
} from 'lucide-react'
import type { MpPlComparison as MpPlComparisonData, MpPlPartySummary, MpPlAreaItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'
import AnalysisSummary from './AnalysisSummary'

/* ─── Helpers ─── */
function fmt(n: number) { return n.toLocaleString('th-TH') }
function fmtPct(n: number) { return `${n > 0 ? '+' : ''}${n.toFixed(1)}%` }
function fmtDiff(n: number) { return `${n > 0 ? '+' : ''}${n.toLocaleString('th-TH')}` }

function diffColor(d: number) {
  if (d > 100000) return '#22c55e'
  if (d > 0) return '#86efac'
  if (d > -100000) return '#fca5a5'
  return '#ef4444'
}

function diffIcon(d: number) {
  if (d > 0) return <ArrowUpRight size={14} style={{ color: '#22c55e', verticalAlign: -2 }} />
  if (d < 0) return <ArrowDownRight size={14} style={{ color: '#ef4444', verticalAlign: -2 }} />
  return <Minus size={14} style={{ color: '#888', verticalAlign: -2 }} />
}

/* ─── Tab type ─── */
type TabMode = 'overview' | 'party' | 'area'

/* ─── Props ─── */
interface Props {
  data: MpPlComparisonData
  nameToCodeMap: NameToCodeMap
}

export default function MpPlComparison({ data, nameToCodeMap }: Props) {
  const [tab, setTab] = useState<TabMode>('overview')
  const [searchArea, setSearchArea] = useState('')
  const [showCount, setShowCount] = useState(30)
  const [selectedParty, setSelectedParty] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'diff' | 'diffPercent' | 'totalPlVotes' | 'totalMpVotes'>('diff')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const { partySummary, perArea, meta } = data

  /* ── Filter parties with meaningful data ── */
  const significantParties = useMemo(() => {
    return partySummary.filter(p => p.totalMpVotes > 0 || p.totalPlVotes > 10000)
  }, [partySummary])

  /* ── Top 10 ส้มหล่น (PL > MP gainers) ── */
  const top10Gainers = useMemo(() => {
    return significantParties
      .filter(p => p.diff > 0 && p.totalMpVotes > 0)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 10)
  }, [significantParties])

  /* ── Top 10 losers (MP > PL) ── */
  const top10Losers = useMemo(() => {
    return significantParties
      .filter(p => p.diff < 0)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 10)
  }, [significantParties])

  /* ── Chart data: top N by absolute diff ── */
  const chartData = useMemo(() => {
    return significantParties
      .filter(p => p.totalMpVotes >= 10000 || p.totalPlVotes >= 10000)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 20)
      .map(p => ({
        name: p.partyName.length > 12 ? p.partyName.slice(0, 11) + '…' : p.partyName,
        fullName: p.partyName,
        mpVotes: p.totalMpVotes,
        plVotes: p.totalPlVotes,
        diff: p.diff,
        color: p.partyColor,
      }))
  }, [significantParties])

  /* ── Diff bar chart: just the difference ── */
  const diffChartData = useMemo(() => {
    return significantParties
      .filter(p => Math.abs(p.diff) >= 5000 && (p.totalMpVotes >= 5000 || p.totalPlVotes >= 5000))
      .sort((a, b) => b.diff - a.diff)
      .map(p => ({
        name: p.partyName.length > 14 ? p.partyName.slice(0, 13) + '…' : p.partyName,
        fullName: p.partyName,
        diff: p.diff,
        color: p.diff > 0 ? '#22c55e' : '#ef4444',
        partyColor: p.partyColor,
      }))
  }, [significantParties])

  /* ── Sorted party table ── */
  const sortedParties = useMemo(() => {
    const items = [...significantParties].filter(p => p.totalMpVotes > 0)
    items.sort((a, b) => sortDir === 'desc'
      ? (b[sortKey] as number) - (a[sortKey] as number)
      : (a[sortKey] as number) - (b[sortKey] as number)
    )
    return items
  }, [significantParties, sortKey, sortDir])

  /* ── Filtered areas ── */
  const filteredAreas = useMemo(() => {
    let items = perArea
    if (searchArea) {
      const q = searchArea.toLowerCase()
      items = items.filter(a =>
        a.areaName.includes(q) || a.province.includes(q) || a.areaCode.includes(q)
      )
    }
    if (selectedParty) {
      items = items.filter(a => a.parties.some(p => p.partyName === selectedParty))
    }
    return items
  }, [perArea, searchArea, selectedParty])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }
  const sortIcon = (key: typeof sortKey) => sortKey === key
    ? (sortDir === 'desc' ? '↓' : '↑') : ''

  /* ── Party clicked in table → filter areas ── */
  const handlePartyClick = (partyName: string) => {
    setSelectedParty(prev => prev === partyName ? null : partyName)
    setTab('area')
  }

  return (
    <div className="section">
      <div className="section-title"><Users size={20} /> เปรียบเทียบคะแนน ส.ส. เขต vs บัญชีรายชื่อ</div>
      <div className="section-desc">
        เปรียบเทียบคะแนนเสียงที่แต่ละพรรคได้รับจาก<strong>ระบบ ส.ส. เขต</strong> กับ <strong>ระบบบัญชีรายชื่อ</strong> ในแต่ละเขตเลือกตั้ง
        — พรรคที่ได้คะแนนบัญชีรายชื่อมากกว่า ส.ส. เขต อย่างมีนัย = <strong>"ส้มหล่น"</strong> (ได้คะแนนพรรคเพิ่มโดยไม่ต้องมีผู้สมัครที่แข็งแกร่ง)
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          <Award size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> ภาพรวม & ส้มหล่น Top 10
        </button>
        <button className={`tab ${tab === 'party' ? 'active' : ''}`} onClick={() => setTab('party')}>
          <TrendingUp size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> เปรียบเทียบรายพรรค
        </button>
        <button className={`tab ${tab === 'area' ? 'active' : ''}`} onClick={() => setTab('area')}>
          <Search size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> เจาะรายเขต
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="overview-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-number">{meta.totalAreas}</div>
          <div className="stat-label">เขตเลือกตั้ง</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--success)' }}>{meta.partiesPlHigher}</div>
          <div className="stat-label">พรรค PL {'>'} MP</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--danger)' }}>{meta.partiesPlLower}</div>
          <div className="stat-label">พรรค MP {'>'} PL</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ fontSize: 14, color: 'var(--accent)' }}>{meta.topGainer}</div>
          <div className="stat-label">ส้มหล่นสูงสุด</div>
        </div>
      </div>

      {/* ═══════════ TAB: OVERVIEW ═══════════ */}
      {tab === 'overview' && (
        <div>
          {/* ── Explanation box ── */}
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 12, padding: 18,
            border: '1px solid var(--border)', marginBottom: 24,
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'start', marginBottom: 12 }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  🍊 "พรรคส้มหล่น" คืออะไร?
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '0 0 8px' }}>
                    ในการเลือกตั้งแบบ <strong>บัตร 2 ใบ</strong> ผู้มีสิทธิ์จะเลือก <strong>ส.ส. เขต</strong> (เลือกตัวบุคคล) 
                    กับ <strong>บัญชีรายชื่อ</strong> (เลือกพรรค) แยกกัน —
                    ถ้าทุกคนเลือกพรรคเดียวกันทั้งสองบัตร คะแนนเสียงทั้งสองระบบควรใกล้เคียงกัน
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>🟢 พรรค "ส้มหล่น"</span> = พรรคที่ได้คะแนน <strong>บัญชีรายชื่อมากกว่า</strong> คะแนน ส.ส.เขต อย่างชัดเจน — 
                    หมายถึงมี<em>ผู้เลือก</em>จำนวนมากที่ <u>ไม่ได้เลือกผู้สมัคร ส.ส. ของพรรคนั้น</u> แต่ยังเลือกพรรคนั้นในบัญชีรายชื่อ
                    (อาจเพราะชื่นชอบนโยบายพรรคแต่ไม่ชอบตัวผู้สมัคร, หรือพรรคไม่ส่งผู้สมัครในเขตนั้น)
                  </p>
                  <p style={{ margin: '0 0 8px' }}>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 พรรคที่ "เสียเปรียบ"</span> = พรรคที่ได้คะแนน <strong>ส.ส.เขตมากกว่า</strong>บัญชีรายชื่อ — 
                    หมายถึงผู้สมัครได้คะแนนเป็นส่วนตัวจากตัวบุคคล แต่ผู้เลือกไม่ได้เลือกพรรคนั้นในบัญชีรายชื่อ
                    (อาจเพราะเป็น "ส.ส. บารมี" ที่แข็งแกร่งในพื้นที่ แต่แบรนด์พรรคไม่แข็ง)
                  </p>
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>💡 Insight:</span> ส่วนต่างนี้สะท้อน <strong>"split-ticket voting"</strong> — 
                    การที่ผู้มีสิทธิ์เลือก ส.ส. เขตจากพรรคหนึ่ง แต่เลือกบัญชีรายชื่อให้อีกพรรคหนึ่ง
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Chart: MP vs PL side by side ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            คะแนน ส.ส. เขต vs บัญชีรายชื่อ (20 พรรคหลัก)
          </h3>
          <div style={{ width: '100%', height: 420, marginBottom: 32 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)}
                  stroke="#555"
                  fontSize={11}
                />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2d3148', borderRadius: 8, fontSize: 12 }}
                  wrapperStyle={{ outline: 'none' }}
                  labelStyle={{ color: '#e8eaed', fontWeight: 700, marginBottom: 4 }}
                  itemStyle={{ color: '#9aa0a6' }}
                  formatter={(value: number, name: string) => [fmt(value), name === 'mpVotes' ? 'ส.ส. เขต' : 'บัญชีรายชื่อ']}
                  labelFormatter={(label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName ?? label}
                />
                <Legend
                  formatter={(value: string) => value === 'mpVotes' ? 'ส.ส. เขต' : 'บัญชีรายชื่อ'}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="mpVotes" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="plVotes" fill="#f97316" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Chart: Diff waterfall ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            ส่วนต่างคะแนน (บัญชีรายชื่อ − ส.ส.เขต)
          </h3>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span style={{ color: '#22c55e' }}>🟢 แท่งเขียว</span> = ได้บัญชีรายชื่อมากกว่า (ส้มหล่น)
            &nbsp;·&nbsp;
            <span style={{ color: '#ef4444' }}>🔴 แท่งแดง</span> = ได้ ส.ส.เขตมากกว่า
          </div>
          <div style={{ width: '100%', height: Math.max(300, diffChartData.length * 24 + 60), marginBottom: 32 }}>
            <ResponsiveContainer>
              <BarChart data={diffChartData} layout="vertical" margin={{ left: 0, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => {
                    const abs = Math.abs(v)
                    return (v < 0 ? '-' : '+') + (abs >= 1e6 ? `${(abs / 1e6).toFixed(1)}M` : abs >= 1e3 ? `${(abs / 1e3).toFixed(0)}K` : String(abs))
                  }}
                  stroke="#555"
                  fontSize={11}
                />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#9aa0a6', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2d3148', borderRadius: 8, fontSize: 12 }}
                  wrapperStyle={{ outline: 'none' }}
                  labelStyle={{ color: '#e8eaed', fontWeight: 600 }}
                  itemStyle={{ color: '#9aa0a6' }}
                  formatter={(value: number) => [fmtDiff(value) + ' เสียง', 'ส่วนต่าง PL − MP']}
                  labelFormatter={(label: string, payload: Array<{ payload?: { fullName?: string } }>) => payload?.[0]?.payload?.fullName ?? label}
                />
                <ReferenceLine x={0} stroke="#555" strokeWidth={2} />
                <Bar dataKey="diff" radius={[0, 4, 4, 0]} barSize={14}>
                  {diffChartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Top 10 ส้มหล่น ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            🍊 10 อันดับพรรคบัญชีรายชื่อที่ได้รับประโยชน์สูงสุด (พรรคส้มหล่น)
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            พรรคเหล่านี้ได้คะแนนบัญชีรายชื่อสูงกว่าคะแนน ส.ส.เขตมากที่สุด
            — ผู้มีสิทธิ์เลือกตั้งจำนวนมาก "แยกบัตร" มาเลือกพรรคเหล่านี้ในบัญชีรายชื่อ
            แม้ไม่ได้เลือกผู้สมัคร ส.ส.เขตของพรรคนั้น
          </p>
          <div style={{ display: 'grid', gap: 10, marginBottom: 32 }}>
            {top10Gainers.map((p, i) => (
              <div
                key={p.partyCode}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-secondary)', borderRadius: 12, padding: '12px 16px',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}
                onClick={() => handlePartyClick(p.partyName)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${p.partyColor}33, ${p.partyColor})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <PartyLogo partyCode={nameToCodeMap[p.partyName]} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.partyName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>ส.ส.เขต: {fmt(p.totalMpVotes)}</span>
                    <span>บัญชี: {fmt(p.totalPlVotes)}</span>
                    <span>PL เกินใน {p.areasPlHigher} เขต</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#22c55e' }}>
                    +{fmt(p.diff)}
                  </div>
                  <div style={{ fontSize: 11, color: '#86efac' }}>
                    {fmtPct(p.diffPercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Top 10 losers ── */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            🔴 10 อันดับพรรคที่เสียเปรียบจากบัญชีรายชื่อ
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
            พรรคเหล่านี้ได้คะแนน ส.ส.เขตมากกว่าบัญชีรายชื่อ
            — แสดงว่าผู้สมัครแข็งแกร่งเป็นส่วนตัว แต่ผู้เลือกตั้งเลือกพรรคอื่นในบัญชีรายชื่อ
          </p>
          <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            {top10Losers.map((p, i) => (
              <div
                key={p.partyCode}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-secondary)', borderRadius: 12, padding: '12px 16px',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}
                onClick={() => handlePartyClick(p.partyName)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `linear-gradient(135deg, #ef444433, #ef4444)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <PartyLogo partyCode={nameToCodeMap[p.partyName]} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.partyName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
                    <span>ส.ส.เขต: {fmt(p.totalMpVotes)}</span>
                    <span>บัญชี: {fmt(p.totalPlVotes)}</span>
                    <span>MP เกินใน {p.areasPlLower} เขต</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#ef4444' }}>
                    {fmtDiff(p.diff)}
                  </div>
                  <div style={{ fontSize: 11, color: '#fca5a5' }}>
                    {fmtPct(p.diffPercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════ TAB: PARTY TABLE ═══════════ */}
      {tab === 'party' && (
        <div>
          <div style={{ maxHeight: 600, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table className="province-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>พรรค</th>
                  <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('totalMpVotes')}>
                    คะแนน ส.ส.เขต {sortIcon('totalMpVotes')}
                  </th>
                  <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('totalPlVotes')}>
                    คะแนนบัญชีรายชื่อ {sortIcon('totalPlVotes')}
                  </th>
                  <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('diff')}>
                    ส่วนต่าง {sortIcon('diff')}
                  </th>
                  <th style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('diffPercent')}>
                    %ต่าง {sortIcon('diffPercent')}
                  </th>
                  <th style={{ width: 130 }}>สัดส่วน</th>
                </tr>
              </thead>
              <tbody>
                {sortedParties.map((p, i) => (
                  <tr
                    key={p.partyCode}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handlePartyClick(p.partyName)}
                  >
                    <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <PartyLogo partyCode={nameToCodeMap[p.partyName]} size={20} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.partyName}</span>
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {fmt(p.totalMpVotes)}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {fmt(p.totalPlVotes)}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: diffColor(p.diff), fontSize: 13 }}>
                      {diffIcon(p.diff)} {fmtDiff(p.diff)}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: p.diff > 0 ? '#86efac' : p.diff < 0 ? '#fca5a5' : '#888', fontSize: 12 }}>
                      {fmtPct(p.diffPercent)}
                    </td>
                    <td>
                      {/* MP vs PL bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ flex: 1, position: 'relative', height: 14, background: 'var(--bg-primary)', borderRadius: 4, overflow: 'hidden' }}>
                          {(() => {
                            const total = Math.max(p.totalMpVotes, p.totalPlVotes)
                            const mpW = total > 0 ? (p.totalMpVotes / total) * 100 : 0
                            const plW = total > 0 ? (p.totalPlVotes / total) * 100 : 0
                            return (
                              <>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: 7, width: `${mpW}%`, background: '#60a5fa', borderRadius: '4px 4px 0 0' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, height: 7, width: `${plW}%`, background: '#f97316', borderRadius: '0 0 4px 4px' }} />
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>สัดส่วน: <span style={{ color: '#60a5fa' }}>■</span> ส.ส.เขต &nbsp; <span style={{ color: '#f97316' }}>■</span> บัญชีรายชื่อ</span>
            <span>คลิกพรรคเพื่อดูรายเขต →</span>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: AREA BREAKDOWN ═══════════ */}
      {tab === 'area' && (
        <div>
          {/* Search & filter */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="ค้นหาเขต / จังหวัด..."
                value={searchArea}
                onChange={e => setSearchArea(e.target.value)}
                style={{
                  width: '100%', padding: '7px 30px 7px 30px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg-primary)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                }}
              />
              {searchArea && (
                <button onClick={() => setSearchArea('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                  <X size={14} />
                </button>
              )}
            </div>
            {selectedParty && (
              <button
                onClick={() => setSelectedParty(null)}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  background: 'var(--accent)', border: 'none', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <X size={12} /> กรองพรรค: {selectedParty}
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {filteredAreas.length} เขต
            </span>
          </div>

          {/* Area cards */}
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredAreas.slice(0, showCount).map(area => {
              const relevantParties = selectedParty
                ? area.parties.filter(p => p.partyName === selectedParty)
                : area.parties.slice(0, 5)
              return (
                <div key={area.areaCode} style={{
                  background: 'var(--bg-secondary)', borderRadius: 12, padding: 14,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {area.areaName}
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
                          ({area.areaCode})
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                        ส.ส.ชนะ: <span style={{ color: area.mpWinnerColor, fontWeight: 600 }}>{area.mpWinnerParty}</span>
                        &nbsp;·&nbsp; MP รวม: {fmt(area.totalMpVotes)} · PL รวม: {fmt(area.totalPlVotes)}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right', fontWeight: 700, fontSize: 13,
                      color: area.totalDiff > 0 ? '#22c55e' : area.totalDiff < 0 ? '#ef4444' : '#888',
                    }}>
                      {fmtDiff(area.totalDiff)}
                    </div>
                  </div>
                  {/* Per-party breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {relevantParties.map(p => {
                      const maxVote = Math.max(p.mpVotes, p.plVotes, 1)
                      return (
                        <div key={p.partyCode} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: p.partyColor, flexShrink: 0 }} />
                          <span style={{ width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.partyName}
                          </span>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 24, fontSize: 10, color: '#60a5fa' }}>MP</span>
                              <div style={{ flex: 1, height: 6, background: 'var(--bg-primary)', borderRadius: 3 }}>
                                <div style={{ width: `${(p.mpVotes / maxVote) * 100}%`, height: 6, background: '#60a5fa', borderRadius: 3, minWidth: 1 }} />
                              </div>
                              <span style={{ width: 50, textAlign: 'right', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.mpVotes)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 24, fontSize: 10, color: '#f97316' }}>PL</span>
                              <div style={{ flex: 1, height: 6, background: 'var(--bg-primary)', borderRadius: 3 }}>
                                <div style={{ width: `${(p.plVotes / maxVote) * 100}%`, height: 6, background: '#f97316', borderRadius: 3, minWidth: 1 }} />
                              </div>
                              <span style={{ width: 50, textAlign: 'right', fontSize: 10, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.plVotes)}</span>
                            </div>
                          </div>
                          <span style={{
                            width: 60, textAlign: 'right', fontWeight: 600, fontSize: 11,
                            fontVariantNumeric: 'tabular-nums',
                            color: p.diff > 0 ? '#22c55e' : p.diff < 0 ? '#ef4444' : '#888',
                          }}>
                            {fmtDiff(p.diff)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredAreas.length > showCount && (
            <button
              onClick={() => setShowCount(s => s + 30)}
              style={{
                margin: '16px auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 8,
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer',
              }}
            >
              <ChevronDown size={14} /> แสดงเพิ่ม ({filteredAreas.length - showCount} เขตที่เหลือ)
            </button>
          )}
        </div>
      )}

      <AnalysisSummary
        title="วิเคราะห์ MP vs PL"
        methodology="รวมคะแนนเสียง<strong>ระบบ ส.ส. เขต (MP)</strong> กับ <strong>ระบบบัญชีรายชื่อ (PL)</strong> ของแต่ละพรรคในแต่ละเขต แล้วคำนวณ<strong>ส่วนต่าง (diff = PL − MP)</strong> — พรรคที่ได้ PL มากกว่า MP อย่างมากถือว่าเป็น 'ส้มหล่น' (ได้คะแนนพรรคเพิ่มโดยไม่ได้มี ส.ส. เขตที่แข็งแกร่ง)"
        findings={[
          `วิเคราะห์จาก <strong>${meta.totalAreas}</strong> เขตเลือกตั้ง`,
          `พรรคที่ PL > MP (ส้มหล่น): <strong>${meta.partiesPlHigher}</strong> พรรค | MP > PL: <strong>${meta.partiesPlLower}</strong> พรรค`,
          `ส้มหล่นสูงสุด: <strong>${meta.topGainer}</strong> (PL สูงกว่า MP มากที่สุด)`,
          `Top 10 ส้มหล่น: ${top10Gainers.slice(0, 3).map(p => `<strong>${p.partyName}</strong> (+${fmt(p.diff)})`).join(', ')}`,
        ]}
        interpretation="พรรคที่มี PL >> MP อย่างชัดเจนแสดงว่า 'แบรนด์พรรค' แข็งกว่า 'ตัวผู้สมัคร' — ผู้ลงคะแนนเลือกพรรคในบัตร PL แต่ไม่เลือก ส.ส. ของพรรคนั้น ในทางกลับกัน พรรคที่ MP >> PL แสดงว่า<strong>ตัวผู้สมัคร</strong>มีฐานเสียงส่วนตัวที่แข็งกว่าพรรค — ซึ่งอาจเกี่ยวข้องกับ<strong>เครือข่ายท้องถิ่น</strong>หรือ<strong>การซื้อเสียง</strong>"
        limitation="ข้อมูลเป็นผลรวมระดับเขตและระดับพรรค ไม่ได้ลงลึกระดับผู้สมัครรายบุคคล — พรรคที่มีผู้สมัครน้อยเขตจะมีตัวเลขต่ำเมื่อเทียบกับพรรคใหญ่ ควรดู % diff ร่วมกับจำนวนเขตที่ลงสมัคร"
      />
    </div>
  )
}
