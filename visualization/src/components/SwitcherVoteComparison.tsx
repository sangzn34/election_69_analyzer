'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Search, Filter,
  SortAsc, SortDesc, ArrowRightLeft, Award, ChevronDown,
  Minus, Users,
} from 'lucide-react'
import type { SwitcherVoteComparisonItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ─────────── helpers ─────────── */
function fmt(n: number) {
  return n.toLocaleString('th-TH')
}

function deltaColor(d: number) {
  if (d > 5) return '#22c55e'
  if (d > 0) return '#86efac'
  if (d > -5) return '#fca5a5'
  return '#ef4444'
}

function deltaIcon(d: number) {
  if (d > 0) return <TrendingUp size={14} style={{ color: '#22c55e', verticalAlign: -2 }} />
  if (d < 0) return <TrendingDown size={14} style={{ color: '#ef4444', verticalAlign: -2 }} />
  return <Minus size={14} style={{ color: '#888', verticalAlign: -2 }} />
}

/* ─────────── component ─────────── */
interface Props {
  data: SwitcherVoteComparisonItem[]
  nameToCodeMap: NameToCodeMap
}

type SortKey = 'pctDelta' | 'voteDelta' | 'pct69' | 'pct66' | 'areaCode' | 'name'

export default function SwitcherVoteComparison({ data, nameToCodeMap }: Props) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'switched' | 'same'>('all')
  const [filterParty69, setFilterParty69] = useState('all')
  const [filterWon, setFilterWon] = useState<'all' | 'won66' | 'lost66'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('pctDelta')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showCount, setShowCount] = useState(50)

  /* ── unique party lists ── */
  const parties69 = useMemo(() => {
    const s = new Set(data.map(d => d.party69))
    return Array.from(s).sort()
  }, [data])

  /* ── filtered + sorted ── */
  const filtered = useMemo(() => {
    let items = data
    if (filterType === 'switched') items = items.filter(d => d.switchedParty)
    if (filterType === 'same') items = items.filter(d => !d.switchedParty)
    if (filterParty69 !== 'all') items = items.filter(d => d.party69 === filterParty69)
    if (filterWon === 'won66') items = items.filter(d => d.is66Winner)
    if (filterWon === 'lost66') items = items.filter(d => !d.is66Winner)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.areaCode.includes(q) ||
        d.province.toLowerCase().includes(q) ||
        d.party66.toLowerCase().includes(q) ||
        d.party69.toLowerCase().includes(q)
      )
    }
    items = [...items].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name' || sortKey === 'areaCode') {
        return dir * a[sortKey].localeCompare(b[sortKey])
      }
      return dir * ((a[sortKey] as number) - (b[sortKey] as number))
    })
    return items
  }, [data, filterType, filterParty69, filterWon, search, sortKey, sortDir])

  const showing = filtered.slice(0, showCount)

  /* ── stats ── */
  const stats = useMemo(() => {
    const total = filtered.length
    const switched = filtered.filter(d => d.switchedParty).length
    const gained = filtered.filter(d => d.pctDelta > 0).length
    const lost = filtered.filter(d => d.pctDelta < 0).length
    const avgDelta = total > 0 ? filtered.reduce((s, d) => s + d.pctDelta, 0) / total : 0
    return { total, switched, gained, lost, avgDelta }
  }, [filtered])

  /* ── bar chart: top gainers & losers ── */
  const barData = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.pctDelta - a.pctDelta)
    const top10 = sorted.slice(0, 10)
    const bottom10 = sorted.slice(-10).reverse()
    return { top10, bottom10 }
  }, [filtered])

  /* ── scatter chart: pct66 vs pct69 ── */
  const scatterData = useMemo(() =>
    filtered.map(d => ({
      pct66: d.pct66,
      pct69: d.pct69,
      name: d.name,
      party69: d.party69,
      color: d.party69Color,
      switched: d.switchedParty,
    }))
  , [filtered])

  /* ── sort toggle ── */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'pctDelta' ? 'asc' : 'desc') }
  }

  const SortIcon = sortDir === 'asc' ? SortAsc : SortDesc

  return (
    <section className="card">
      <h2><ArrowRightLeft size={20} style={{ verticalAlign: -3 }} /> เปรียบเทียบคะแนนเสียง 66 vs 69 (รายบุคคล)</h2>
      <p className="card-subtitle">
        ผู้สมัครที่ลง ส.ส. เขตทั้งปี 66 และ 69 ในเขตเดียวกัน — เปรียบเทียบเปอร์เซ็นต์คะแนนที่เปลี่ยนแปลง
      </p>

      {/* ── Summary stats ── */}
      <div className="grid-4" style={{ margin: '16px 0' }}>
        <div className="stat-box">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label"><Users size={13} style={{ verticalAlign: -2 }} /> ผู้สมัครที่ match</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.switched}</div>
          <div className="stat-label"><ArrowRightLeft size={13} style={{ verticalAlign: -2 }} /> ย้ายพรรค</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#22c55e' }}>{stats.gained}</div>
          <div className="stat-label"><TrendingUp size={13} style={{ verticalAlign: -2 }} /> ได้เสียงเพิ่ม</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#ef4444' }}>{stats.lost}</div>
          <div className="stat-label"><TrendingDown size={13} style={{ verticalAlign: -2 }} /> เสียงลด</div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="filter-row" style={{ flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
        <div className="search-box" style={{ flex: '1 1 200px' }}>
          <Search size={14} />
          <input
            placeholder="ค้นหาชื่อ / เขต / จังหวัด / พรรค"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
          <select value={filterType} onChange={e => setFilterType(e.target.value as typeof filterType)}
            style={{ paddingLeft: 28 }}>
            <option value="all">ทุกคน</option>
            <option value="switched">เฉพาะย้ายพรรค</option>
            <option value="same">เฉพาะพรรคเดิม</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <Award size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
          <select value={filterWon} onChange={e => setFilterWon(e.target.value as typeof filterWon)}
            style={{ paddingLeft: 28 }}>
            <option value="all">ทุกสถานะ 66</option>
            <option value="won66">ชนะ 66 (อันดับ 1)</option>
            <option value="lost66">แพ้ 66 (อันดับ 2-3)</option>
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={filterParty69} onChange={e => setFilterParty69(e.target.value)}>
            <option value="all">ทุกพรรค (69)</option>
            {parties69.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }} />
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, margin: '16px 0' }}>
        {/* Top gainers bar */}
        <div className="chart-container" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 8px' }}>
            <TrendingUp size={16} style={{ verticalAlign: -2, color: '#22c55e' }} /> Top 10 เพิ่มขึ้นมากสุด
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData.top10} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis type="number" tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} stroke="#9aa0a6" tick={{ fill: '#9aa0a6' }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#e8eaed' }} />
              <Tooltip
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'เปลี่ยน']}
                contentStyle={{ background: '#1e2130', border: '1px solid #2d3148', borderRadius: 8, color: '#e8eaed' }}
                wrapperStyle={{ outline: 'none' }}
                labelStyle={{ color: '#e8eaed', fontWeight: 600 }}
                itemStyle={{ color: '#9aa0a6' }}
              />
              <Bar dataKey="pctDelta" radius={[0, 4, 4, 0]}>
                {barData.top10.map((d, i) => (
                  <Cell key={i} fill={deltaColor(d.pctDelta)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom losers bar */}
        <div className="chart-container" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: '0 0 8px' }}>
            <TrendingDown size={16} style={{ verticalAlign: -2, color: '#ef4444' }} /> Top 10 ลดลงมากสุด
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData.bottom10} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis type="number" tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} stroke="#9aa0a6" tick={{ fill: '#9aa0a6' }} />
              <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: '#e8eaed' }} />
              <Tooltip
                formatter={(v: number) => [`${v > 0 ? '+' : ''}${v.toFixed(2)}%`, 'เปลี่ยน']}
                contentStyle={{ background: '#1e2130', border: '1px solid #2d3148', borderRadius: 8, color: '#e8eaed' }}
                wrapperStyle={{ outline: 'none' }}
                labelStyle={{ color: '#e8eaed', fontWeight: 600 }}
                itemStyle={{ color: '#9aa0a6' }}
              />
              <Bar dataKey="pctDelta" radius={[4, 0, 0, 4]}>
                {barData.bottom10.map((d, i) => (
                  <Cell key={i} fill={deltaColor(d.pctDelta)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Scatter: pct66 vs pct69 ── */}
      <div className="chart-container" style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 16, margin: '16px 0' }}>
        <h3 style={{ margin: '0 0 8px' }}>คะแนน 66 vs 69 (%) — จุดเหนือเส้นทแยง = ได้เสียงเพิ่ม</h3>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="pct66" type="number" name="% คะแนน 66" domain={[0, 100]}
              label={{ value: '% คะแนน 66', position: 'bottom', fill: '#9aa0a6', fontSize: 12 }}
              stroke="#9aa0a6" tick={{ fill: '#9aa0a6' }} />
            <YAxis dataKey="pct69" type="number" name="% คะแนน 69" domain={[0, 100]}
              label={{ value: '% คะแนน 69', angle: -90, position: 'insideLeft', fill: '#9aa0a6', fontSize: 12 }}
              stroke="#9aa0a6" tick={{ fill: '#9aa0a6' }} />
            <ZAxis range={[30, 30]} />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: '#1e2130', padding: 8, border: '1px solid #2d3148', borderRadius: 8, fontSize: 12, color: '#e8eaed' }}>
                    <div style={{ fontWeight: 700, color: '#e8eaed' }}>{d.name}</div>
                    <div style={{ color: '#9aa0a6' }}>พรรค 69: {d.party69}</div>
                    <div style={{ color: '#9aa0a6' }}>66: {d.pct66.toFixed(1)}% → 69: {d.pct69.toFixed(1)}%</div>
                    <div style={{ color: '#9aa0a6' }}>{d.switched ? '🔄 ย้ายพรรค' : 'พรรคเดิม'}</div>
                  </div>
                )
              }}
            />
            <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#9aa0a6" strokeDasharray="5 5" strokeOpacity={0.6} />
            <Scatter data={scatterData}>
              {scatterData.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={d.switched ? 0.9 : 0.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#9aa0a6', marginTop: 4 }}>
          จุดที่เข้มกว่า = ผู้สมัครที่ย้ายพรรค · จุดเหนือเส้นทแยงมุม = คะแนนเพิ่มขึ้น
        </div>
      </div>

      {/* ── Average delta ── */}
      <div style={{ textAlign: 'center', margin: '8px 0 12px', fontSize: 14, color: 'var(--text-secondary)' }}>
        ค่าเฉลี่ยเปลี่ยนแปลง: <strong style={{ color: stats.avgDelta >= 0 ? '#22c55e' : '#ef4444' }}>
          {stats.avgDelta >= 0 ? '+' : ''}{stats.avgDelta.toFixed(2)}%
        </strong> (จาก {stats.total} คน)
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto', margin: '0 -16px', padding: '0 16px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('areaCode')}>
                เขต {sortKey === 'areaCode' && <SortIcon size={12} />}
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
                ชื่อ {sortKey === 'name' && <SortIcon size={12} />}
              </th>
              <th>พรรค 66</th>
              <th>พรรค 69</th>
              <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('pct66')}>
                % 66 {sortKey === 'pct66' && <SortIcon size={12} />}
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('pct69')}>
                % 69 {sortKey === 'pct69' && <SortIcon size={12} />}
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('pctDelta')}>
                เปลี่ยน {sortKey === 'pctDelta' && <SortIcon size={12} />}
              </th>
              <th style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => toggleSort('voteDelta')}>
                Δ คะแนน {sortKey === 'voteDelta' && <SortIcon size={12} />}
              </th>
            </tr>
          </thead>
          <tbody>
            {showing.map((d, i) => (
              <tr key={i} style={{ borderLeft: `3px solid ${deltaColor(d.pctDelta)}` }}>
                <td>
                  <span style={{ fontWeight: 600 }}>{d.areaCode}</span>
                  <br /><span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.province}</span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{d.name}</span>
                  {d.switchedParty && (
                    <span style={{ marginLeft: 4, fontSize: 10, background: 'var(--accent)', color: '#fff', borderRadius: 4, padding: '1px 4px' }}>ย้าย</span>
                  )}
                  {d.is66Winner && (
                    <span style={{ marginLeft: 4, fontSize: 10, background: '#eab308', color: '#000', borderRadius: 4, padding: '1px 4px' }}>ส.ส.66</span>
                  )}
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <PartyLogo partyName={d.party66} nameToCodeMap={nameToCodeMap} size={16} />
                    <span style={{ color: d.party66Color, fontWeight: 500, fontSize: 12 }}>{d.party66}</span>
                  </span>
                  <br /><span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>อันดับ {d.rank66}</span>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <PartyLogo partyName={d.party69} nameToCodeMap={nameToCodeMap} size={16} />
                    <span style={{ color: d.party69Color, fontWeight: 500, fontSize: 12 }}>{d.party69}</span>
                  </span>
                  <br /><span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>อันดับ {d.rank69}</span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                  {d.pct66.toFixed(1)}%
                  <br /><span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{fmt(d.votes66)}</span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                  {d.pct69.toFixed(1)}%
                  <br /><span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{fmt(d.votes69)}</span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: deltaColor(d.pctDelta), fontSize: 13 }}>
                  {deltaIcon(d.pctDelta)} {d.pctDelta > 0 ? '+' : ''}{d.pctDelta.toFixed(2)}%
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 12, color: d.voteDelta >= 0 ? '#22c55e' : '#ef4444' }}>
                  {d.voteDelta >= 0 ? '+' : ''}{fmt(d.voteDelta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > showCount && (
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <button className="btn" onClick={() => setShowCount(s => s + 50)}>
            แสดงเพิ่ม ({showCount}/{filtered.length})
          </button>
        </div>
      )}

      {/* ── Note ── */}
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6 }}>
        <strong>หมายเหตุ:</strong> ข้อมูลมาจาก API ผลเลือกตั้ง 66 ของ ThaiPBS (top-3 ผู้สมัครต่อเขต) เทียบกับผล 69 ของ กกต.
        จับคู่โดย ชื่อ-นามสกุล + เขตเดียวกัน · ค่า % คำนวณจากคะแนนต่อผู้มาใช้สิทธิ์ในเขตนั้น
      </p>
    </section>
  )
}
