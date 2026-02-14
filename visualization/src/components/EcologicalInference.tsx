'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, LabelList,
} from 'recharts'
import { ArrowRight, ArrowLeftRight, Shield, Filter, Grid3X3, TrendingUp, ClipboardList, Search, Lightbulb, Repeat } from 'lucide-react'
import type { EcologicalInference, EcoRetention, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'
import AnalysisSummary from './AnalysisSummary'

/* ─── Views ─── */
type ViewMode = 'matrix' | 'retention' | 'changed'

/* ─── Heatmap color helpers ─── */
function heatColor(pct: number): string {
  if (pct >= 80) return '#1a237e'
  if (pct >= 60) return '#283593'
  if (pct >= 40) return '#3949ab'
  if (pct >= 20) return '#5c6bc0'
  if (pct >= 10) return '#7986cb'
  if (pct > 0) return '#9fa8da'
  return 'transparent'
}

function heatTextColor(pct: number): string {
  return pct >= 20 ? '#fff' : pct > 0 ? '#1a1a2e' : '#666'
}

/* ─── Tooltip for retention bar ─── */
interface RetentionTooltipProps {
  active?: boolean
  payload?: Array<{ payload: EcoRetention }>
}
const RetentionTooltip = ({ active, payload }: RetentionTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label" style={{ color: d.partyColor }}>{d.party}</div>
      <div className="item">ปี 66: <strong>{d.seats66}</strong> เขต</div>
      <div className="item">ปี 69: <strong>{d.seats69}</strong> เขต</div>
      <div className="item">รักษาที่นั่ง: <strong>{d.retained}</strong> ({d.retainPct}%)</div>
      <div className="item">ได้ใหม่: <strong style={{ color: '#4caf50' }}>+{d.gained}</strong></div>
      <div className="item">เสียไป: <strong style={{ color: '#f44336' }}>-{d.lost}</strong></div>
      <div className="item">สุทธิ: <strong style={{ color: d.net >= 0 ? '#4caf50' : '#f44336' }}>{d.net >= 0 ? '+' : ''}{d.net}</strong></div>
    </div>
  )
}

/* ─── Main Component ─── */
export default function EcologicalInferenceView({
  data,
  nameToCodeMap,
}: {
  data: EcologicalInference
  nameToCodeMap: NameToCodeMap
}) {
  const [view, setView] = useState<ViewMode>('matrix')
  const [filterParty, setFilterParty] = useState<string>('all')
  const [filterProvince, setFilterProvince] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'province' | 'party66' | 'party69'>('province')

  const { matrixRows, colLabels, retention, changedAreas, meta } = data

  /* ── Only show rows/cols that actually have seats in 66 ── */
  const activeMatrixRows = useMemo(() => matrixRows.filter(r => r.total66 > 0), [matrixRows])
  const activeColLabels = useMemo(() => {
    // Only show columns where at least one row has count > 0
    const activeCols = new Set<string>()
    activeMatrixRows.forEach(row => row.cells.forEach(c => { if (c.count > 0) activeCols.add(c.party69) }))
    return colLabels.filter(cl => activeCols.has(cl.party))
  }, [colLabels, activeMatrixRows])

  /* ── Unique provinces from changed areas ── */
  const provinces = useMemo(() => {
    const set = new Set(changedAreas.map(a => a.province))
    return ['all', ...Array.from(set).sort()]
  }, [changedAreas])

  /* ── Unique parties for filtering ── */
  const parties = useMemo(() => {
    const set = new Set<string>()
    changedAreas.forEach(a => { set.add(a.party66Name); set.add(a.party69Name) })
    return ['all', ...Array.from(set).sort()]
  }, [changedAreas])

  /* ── Filtered changed areas ── */
  const filteredChanged = useMemo(() => {
    let list = changedAreas
    if (filterProvince !== 'all') list = list.filter(a => a.province === filterProvince)
    if (filterParty !== 'all') list = list.filter(a => a.party66Name === filterParty || a.party69Name === filterParty)
    if (sortBy === 'party66') list = [...list].sort((a, b) => a.party66Name.localeCompare(b.party66Name))
    else if (sortBy === 'party69') list = [...list].sort((a, b) => a.party69Name.localeCompare(b.party69Name))
    else list = [...list].sort((a, b) => a.province.localeCompare(b.province) || a.areaCode.localeCompare(b.areaCode))
    return list
  }, [changedAreas, filterProvince, filterParty, sortBy])

  /* ── Net change bar data ── */
  const netBarData = useMemo(() =>
    retention.map(r => ({ ...r, fill: r.partyColor })).sort((a, b) => b.net - a.net),
  [retention])

  return (
    <div className="section">
      {/* Header */}
      <div className="section-header">
        <h2><ArrowLeftRight size={20} style={{ verticalAlign: -4 }} /> Ecological Inference — Transition Matrix (66 → 69)</h2>
        <p>วิเคราะห์การย้ายฐานเสียง: พรรคที่ชนะเขตในปี 66 → ในปี 69 เปลี่ยนไปเป็นพรรคอะไร</p>
      </div>

      {/* Summary cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">เขตที่วิเคราะห์</div>
          <div className="stat-value">{meta.totalAreas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">เปลี่ยนพรรค</div>
          <div className="stat-value" style={{ color: '#f44853' }}>{meta.changedAreas} <span style={{ fontSize: 14, opacity: 0.7 }}>({meta.changedPct}%)</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">รักษาเดิม</div>
          <div className="stat-value" style={{ color: '#4caf50' }}>{meta.retainedAreas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">พรรคที่รักษาได้ดีสุด</div>
          <div className="stat-value" style={{ fontSize: 14 }}>
            {retention.filter(r => r.seats66 >= 5).sort((a, b) => b.retainPct - a.retainPct)[0]?.party || '-'}
            {' '}
            <span style={{ color: '#4caf50' }}>
              {retention.filter(r => r.seats66 >= 5).sort((a, b) => b.retainPct - a.retainPct)[0]?.retainPct || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Tab buttons — use .tabs / .tab pattern from CSS */}
      <div className="tabs">
        <button className={`tab ${view === 'matrix' ? 'active' : ''}`} onClick={() => setView('matrix')}>
          <Grid3X3 size={14} style={{ verticalAlign: -2 }} /> Transition Matrix
        </button>
        <button className={`tab ${view === 'retention' ? 'active' : ''}`} onClick={() => setView('retention')}>
          <Shield size={14} style={{ verticalAlign: -2 }} /> รักษาที่นั่ง &amp; Net Change
        </button>
        <button className={`tab ${view === 'changed' ? 'active' : ''}`} onClick={() => setView('changed')}>
          <Repeat size={14} style={{ verticalAlign: -2 }} /> เขตเปลี่ยนพรรค ({meta.changedAreas})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: Transition Matrix (heatmap table) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === 'matrix' && (
        <div style={{ overflowX: 'auto' }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            แถว = พรรคที่ชนะปี 66 / คอลัมน์ = พรรคที่ชนะปี 69 / ตัวเลข = จำนวนเขต (%)
          </p>
          <table className="data-table" style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 2 }}>
                  พรรค 66 ↓ / 69 →
                </th>
                {activeColLabels.map(cl => (
                  <th key={cl.party} style={{ padding: '6px 8px', textAlign: 'center', fontSize: 12, borderBottom: `3px solid ${cl.color}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <PartyLogo partyCode={nameToCodeMap[cl.party] || ''} size={20} />
                      <span>{cl.party}</span>
                    </div>
                  </th>
                ))}
                <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 12 }}>อื่น</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 12 }}>รวม</th>
              </tr>
            </thead>
            <tbody>
              {activeMatrixRows.map(row => {
                // Filter cells to only show active columns
                const activeCells = row.cells.filter(c => activeColLabels.some(cl => cl.party === c.party69))
                // Compute "other" as total - sum of active cells
                const activeCellsTotal = activeCells.reduce((s, c) => s + c.count, 0)
                const otherCount = row.total66 - activeCellsTotal
                const otherPct = row.total66 > 0 ? Math.round(otherCount / row.total66 * 1000) / 10 : 0
                return (
                  <tr key={row.party66}>
                    <td style={{
                      padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap',
                      borderLeft: `4px solid ${row.party66Color}`,
                      position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PartyLogo partyCode={nameToCodeMap[row.party66] || ''} size={20} />
                        {row.party66}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>({row.total66})</span>
                      </div>
                    </td>
                    {activeCells.map(cell => {
                      const isDiagonal = cell.party69 === row.party66
                      return (
                        <td key={cell.party69} style={{
                          padding: '6px 8px', textAlign: 'center',
                          background: heatColor(cell.pct),
                          color: heatTextColor(cell.pct),
                          fontWeight: isDiagonal ? 700 : 400,
                          border: isDiagonal ? '2px solid #ffd700' : '1px solid var(--border)',
                          fontSize: 12,
                          transition: 'background 0.2s',
                        }}>
                          {cell.count > 0 ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{cell.count}</div>
                              <div style={{ fontSize: 10, opacity: 0.8 }}>({cell.pct}%)</div>
                            </div>
                          ) : (
                            <span style={{ opacity: 0.3 }}>-</span>
                          )}
                        </td>
                      )
                    })}
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      {otherCount > 0 ? `${otherCount} (${otherPct}%)` : '-'}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>
                      {row.total66}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <Lightbulb size={12} style={{ verticalAlign: -2 }} /> ขอบทอง = แนวทแยง (รักษาที่นั่งเดิม) / สีเข้ม = สัดส่วนสูง
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: Retention & Net Change */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === 'retention' && (
        <div>
          {/* Retention % bar chart */}
          <h3 style={{ marginBottom: 12 }}><Shield size={16} style={{ verticalAlign: -3 }} /> อัตราการรักษาที่นั่ง (Retention Rate)</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            เฉพาะพรรคที่มี ≥ 5 เขตในปี 66 — สัดส่วนที่ยังชนะเขตเดิมได้ในปี 69
          </p>
          <ResponsiveContainer width="100%" height={Math.max(300, retention.filter(r => r.seats66 >= 5).length * 48 + 60)}>
            <BarChart
              layout="vertical"
              data={retention.filter(r => r.seats66 >= 5).sort((a, b) => b.retainPct - a.retainPct)}
              margin={{ left: 120, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="party" width={110} tick={{ fontSize: 13 }} />
              <Tooltip content={<RetentionTooltip />} />
              <Bar dataKey="retainPct" radius={[0, 4, 4, 0]} barSize={28}>
                {retention.filter(r => r.seats66 >= 5).sort((a, b) => b.retainPct - a.retainPct).map((r, i) => (
                  <Cell key={i} fill={r.partyColor} opacity={0.85} />
                ))}
                <LabelList dataKey="retainPct" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 12, fill: 'var(--text-primary)' }} />
              </Bar>
              <ReferenceLine x={50} stroke="#f44853" strokeDasharray="3 3" label={{ value: '50%', fill: '#f44853', fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>

          {/* Net seat change */}
          <h3 style={{ marginTop: 32, marginBottom: 12 }}><TrendingUp size={16} style={{ verticalAlign: -3 }} /> Net Seat Change (ที่นั่งเพิ่ม/ลด 66→69)</h3>
          <ResponsiveContainer width="100%" height={Math.max(300, netBarData.length * 36 + 60)}>
            <BarChart
              layout="vertical"
              data={netBarData}
              margin={{ left: 120, right: 40, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="party" width={110} tick={{ fontSize: 13 }} />
              <Tooltip content={<RetentionTooltip />} />
              <Bar dataKey="net" radius={[0, 4, 4, 0]} barSize={24}>
                {netBarData.map((r, i) => (
                  <Cell key={i} fill={r.net >= 0 ? '#4caf50' : '#f44336'} opacity={0.8} />
                ))}
                <LabelList
                  dataKey="net"
                  position="right"
                  formatter={(v: number) => (v >= 0 ? `+${v}` : `${v}`)}
                  style={{ fontSize: 12, fill: 'var(--text-primary)' }}
                />
              </Bar>
              <ReferenceLine x={0} stroke="var(--text-muted)" />
            </BarChart>
          </ResponsiveContainer>

          {/* Retention summary table */}
          <h3 style={{ marginTop: 32, marginBottom: 12 }}><ClipboardList size={16} style={{ verticalAlign: -3 }} /> สรุปทุกพรรค</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>พรรค</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>เขต 66</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>เขต 69</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>รักษา</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Retain%</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>ได้ใหม่</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>เสีย</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                {retention.map(r => (
                  <tr key={r.party}>
                    <td style={{ padding: '6px 12px', fontWeight: 600, borderLeft: `4px solid ${r.partyColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PartyLogo partyCode={nameToCodeMap[r.party] || r.partyCode} size={20} />
                        {r.party}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{r.seats66}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 600 }}>{r.seats69}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px' }}>{r.retained}</td>
                    <td style={{
                      textAlign: 'center', padding: '6px 8px', fontWeight: 600,
                      color: r.retainPct >= 70 ? '#4caf50' : r.retainPct >= 40 ? '#ff9800' : '#f44336',
                    }}>
                      {r.retainPct}%
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 8px', color: '#4caf50' }}>+{r.gained}</td>
                    <td style={{ textAlign: 'center', padding: '6px 8px', color: '#f44336' }}>-{r.lost}</td>
                    <td style={{
                      textAlign: 'center', padding: '6px 8px', fontWeight: 700,
                      color: r.net > 0 ? '#4caf50' : r.net < 0 ? '#f44336' : 'var(--text-muted)',
                    }}>
                      {r.net > 0 ? '+' : ''}{r.net}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VIEW: Changed Areas (per-area detail) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {view === 'changed' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} />
              <select
                value={filterProvince}
                onChange={e => setFilterProvince(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                {provinces.map(p => (
                  <option key={p} value={p}>{p === 'all' ? 'ทุกจังหวัด' : p}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowLeftRight size={14} />
              <select
                value={filterParty}
                onChange={e => setFilterParty(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13 }}
              >
                {parties.map(p => (
                  <option key={p} value={p}>{p === 'all' ? 'ทุกพรรค' : p}</option>
                ))}
              </select>
            </div>
            <div className="tabs" style={{ marginBottom: 0, padding: 2 }}>
              {(['province', 'party66', 'party69'] as const).map(s => (
                <button key={s} className={`tab ${sortBy === s ? 'active' : ''}`}
                  style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => setSortBy(s)}>
                  {s === 'province' ? 'จังหวัด' : s === 'party66' ? 'พรรค 66' : 'พรรค 69'}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              แสดง {filteredChanged.length} / {changedAreas.length} เขต
            </span>
          </div>

          {/* Changed areas table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 12px' }}>เขต</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>จังหวัด</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>พรรค 66</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px', width: 30 }}></th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>พรรค 69</th>
                </tr>
              </thead>
              <tbody>
                {filteredChanged.map(a => (
                  <tr key={a.areaCode}>
                    <td style={{ padding: '6px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {a.areaName}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>({a.areaCode})</span>
                    </td>
                    <td style={{ padding: '6px 8px', fontSize: 12, color: 'var(--text-secondary)' }}>{a.province}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: a.party66Color + '22', border: `1px solid ${a.party66Color}44` }}>
                        <PartyLogo partyCode={nameToCodeMap[a.party66Name] || a.party66Code} size={16} />
                        <span style={{ fontSize: 12, color: a.party66Color, fontWeight: 500 }}>{a.party66Name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '6px 4px' }}>
                      <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: a.party69Color + '22', border: `1px solid ${a.party69Color}44` }}>
                        <PartyLogo partyCode={nameToCodeMap[a.party69Name] || a.party69Code} size={16} />
                        <span style={{ fontSize: 12, color: a.party69Color, fontWeight: 500 }}>{a.party69Name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Key Insight */}
      <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: 8 }}><Search size={16} style={{ verticalAlign: -3 }} /> Key Insights</h4>
        <ul style={{ fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)', paddingLeft: 20 }}>
          {retention.filter(r => r.seats66 >= 5).sort((a, b) => b.retainPct - a.retainPct).slice(0, 1).map(r => (
            <li key={r.party}>
              <strong style={{ color: r.partyColor }}>{r.party}</strong> รักษาที่นั่งเดิมได้ดีที่สุด ({r.retainPct}% จาก {r.seats66} เขต)
            </li>
          ))}
          {retention.filter(r => r.net > 0).sort((a, b) => b.net - a.net).slice(0, 1).map(r => (
            <li key={r.party}>
              <strong style={{ color: r.partyColor }}>{r.party}</strong> ได้ที่นั่งเพิ่มมากที่สุด (
              <span style={{ color: '#4caf50' }}>+{r.net}</span> เขต, จาก {r.seats66} → {r.seats69})
            </li>
          ))}
          {retention.filter(r => r.net < 0).sort((a, b) => a.net - b.net).slice(0, 1).map(r => (
            <li key={r.party}>
              <strong style={{ color: r.partyColor }}>{r.party}</strong> เสียที่นั่งมากที่สุด (
              <span style={{ color: '#f44336' }}>{r.net}</span> เขต, จาก {r.seats66} → {r.seats69})
            </li>
          ))}
          <li>
            รวม <strong>{meta.changedAreas}</strong> เขตที่เปลี่ยนพรรค ({meta.changedPct}%) จากทั้งหมด {meta.totalAreas} เขต
          </li>
        </ul>
      </div>

      <AnalysisSummary
        title="วิเคราะห์ Ecological Inference"
        methodology="ใช้เทคนิค <strong>Ecological Inference</strong> ประมาณการว่าผู้ลงคะแนนที่เลือกพรรค A ในปี 66 ไป<strong>ลงคะแนนให้พรรคใดในปี 69</strong> — สร้าง transition matrix จากการเปรียบเทียบสัดส่วนคะแนนรายเขตระหว่างสองสมัย และคำนวณ retention rate (% ที่ยังเลือกพรรคเดิม)"
        findings={[
          `วิเคราะห์จาก <strong>${meta.totalAreas}</strong> เขตเลือกตั้ง ทั้งเลือกตั้ง 66 และ 69`,
          `เขตที่เปลี่ยนพรรคผู้ชนะ: <strong>${meta.changedAreas}</strong> เขต (<strong>${meta.changedPct}%</strong>)`,
          `Retention rate สูง = พรรครักษาฐานเสียงได้ดี | Net > 0 = ได้เขตเพิ่ม`,
          `Transition matrix แสดงกระแสการเปลี่ยนย้ายพรรค — flow สูง = มีคนย้ายข้างจำนวนมาก`,
        ]}
        interpretation="Transition matrix ช่วยเข้าใจ<strong>กระแสการเมือง</strong>: พรรคที่มี retention สูงแสดงว่า<strong>ฐานเสียงมั่นคง</strong> ส่วนพรรคที่เสีย flow มากอาจเป็นเพราะ<strong>ผู้นำเปลี่ยน, นโยบายเปลี่ยน, หรือคู่แข่งที่แข็งแกร่งขึ้น</strong> — เขตที่เปลี่ยนพรรคมากอาจเป็น swing areas ที่ควรจับตา"
        limitation="Ecological Inference เป็นการ<strong>ประมาณ</strong>จากข้อมูลระดับเขต (aggregate) ไม่ใช่ข้อมูลระดับบุคคล — ผลลัพธ์อาจมี ecological fallacy (สรุปพฤติกรรมบุคคลจากข้อมูลกลุ่ม) ความแม่นยำขึ้นอยู่กับสมมติฐานของโมเดล"
      />
    </div>
  )
}
