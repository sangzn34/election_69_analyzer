import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart3, CornerDownRight, HeartCrack, Medal, Home, UserPlus, TableProperties, Search, ArrowUpDown } from 'lucide-react'
import type { RetentionSummaryItem, WinnerRetentionItem, Lost66WinnerItem, Summary, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

interface Props {
  retentionSummary: RetentionSummaryItem[]
  winnerRetention: WinnerRetentionItem[]
  lost66Winners: Lost66WinnerItem[]
  summary: Summary
  nameToCodeMap: NameToCodeMap
}

export default function WinnerRetention({ retentionSummary, winnerRetention, lost66Winners, summary, nameToCodeMap }: Props) {
  const [view, setView] = useState<'overview' | 'all' | 'switched' | 'lost'>('overview')
  const [allSearch, setAllSearch] = useState('')
  const [allFilter, setAllFilter] = useState<string>('ทั้งหมด')
  const [allPartyFilter, setAllPartyFilter] = useState<string>('ทั้งหมด')
  type SortKey = 'areaCode' | 'winnerName' | 'partyName' | 'status'
  const [allSort, setAllSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'areaCode', asc: true })

  const chartData = useMemo(() =>
    retentionSummary
      .filter(r => r.total >= 3)
      .map(r => ({
        party: r.party, color: r.color,
        'อยู่พรรคเดิม': r.retained, 'ย้ายพรรคมา': r.switched, 'หน้าใหม่': r.newFace,
        total: r.total, retainedPct: r.total > 0 ? Math.round(r.retained / r.total * 100) : 0,
      }))
  , [retentionSummary])

  const stats = useMemo(() => {
    const totalWinners = winnerRetention.length
    const retained = winnerRetention.filter(w => w.status === 'อยู่พรรคเดิม+ชนะ').length
    const switched = winnerRetention.filter(w => w.status === 'ย้ายพรรค+ชนะ').length
    const newFace = winnerRetention.filter(w => w.status === 'หน้าใหม่ชนะ').length
    return { totalWinners, retained, switched, newFace }
  }, [winnerRetention])

  const switchedWinners = useMemo(() =>
    winnerRetention.filter(w => w.status === 'ย้ายพรรค+ชนะ').sort((a, b) => a.partyName.localeCompare(b.partyName))
  , [winnerRetention])

  /* Unique statuses & parties for filter dropdowns */
  const allStatuses = useMemo(() => {
    const set = new Set(winnerRetention.map(w => w.status))
    return ['ทั้งหมด', ...Array.from(set).sort()]
  }, [winnerRetention])

  const allParties = useMemo(() => {
    const set = new Set(winnerRetention.map(w => w.partyName))
    return ['ทั้งหมด', ...Array.from(set).sort()]
  }, [winnerRetention])

  /* Filtered + sorted "all" data */
  const allTableData = useMemo(() => {
    let rows = winnerRetention
    if (allFilter !== 'ทั้งหมด') rows = rows.filter(r => r.status === allFilter)
    if (allPartyFilter !== 'ทั้งหมด') rows = rows.filter(r => r.partyName === allPartyFilter)
    if (allSearch.trim()) {
      const q = allSearch.trim().toLowerCase()
      rows = rows.filter(r =>
        r.winnerName.toLowerCase().includes(q) ||
        r.areaName.toLowerCase().includes(q) ||
        r.areaCode.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q)
      )
    }
    const sorted = [...rows].sort((a, b) => {
      const va = a[allSort.key] ?? ''
      const vb = b[allSort.key] ?? ''
      const cmp = String(va).localeCompare(String(vb), 'th')
      return allSort.asc ? cmp : -cmp
    })
    return sorted
  }, [winnerRetention, allFilter, allPartyFilter, allSearch, allSort])

  const toggleAllSort = (key: SortKey) => {
    setAllSort(prev => prev.key === key ? { key, asc: !prev.asc } : { key, asc: true })
  }

  const statusBadge = (status: string) => {
    let bg = '#2d3148'; let fg = '#9aa0a6'
    if (status.includes('เดิม')) { bg = 'rgba(94,216,138,0.15)'; fg = '#5ed88a' }
    else if (status.includes('ย้าย')) { bg = 'rgba(244,72,83,0.15)'; fg = '#f44853' }
    else if (status.includes('ใหม่')) { bg = 'rgba(66,184,255,0.15)'; fg = '#42b8ff' }
    return <span style={{ background: bg, color: fg, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{status}</span>
  }

  interface ChartTooltipProps {
    active?: boolean
    payload?: Array<{ payload: Record<string, string | number> }>
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload) return null
    const d = payload[0]?.payload
    return (
      <div className="custom-tooltip">
        <div className="label">{label}</div>
        <div className="item"><Home size={12} style={{ verticalAlign: -2 }} /> อยู่พรรคเดิม: {d?.['อยู่พรรคเดิม']} คน</div>
        <div className="item"><CornerDownRight size={12} style={{ verticalAlign: -2 }} /> ย้ายพรรคมา: {d?.['ย้ายพรรคมา']} คน</div>
        <div className="item"><UserPlus size={12} style={{ verticalAlign: -2 }} /> หน้าใหม่: {d?.['หน้าใหม่']} คน</div>
        <div className="item" style={{ marginTop: 4, fontWeight: 600 }}>รวม: {d?.total} ที่นั่ง</div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title">
        <Medal size={20} />
        ส.ส. ปี 66: ใครรักษาที่นั่งได้ ใครแพ้ ใครย้ายพรรค?
      </div>
      <div className="section-desc">
        วิเคราะห์ผู้ชนะเลือกตั้ง 2569 ว่ามาจากไหน — เป็น ส.ส. เดิมจากปี 66 ที่อยู่พรรคเดิม, ย้ายพรรคมา, หรือเป็นหน้าใหม่
        ผู้สมัครที่เคยชนะปี 66 มีทั้งหมด {summary?.total66Winners || '?'} คน ย้ายพรรค {summary?.switchedCandidates || '?'} คน
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-value" style={{ color: '#ff8a4d' }}>{stats.totalWinners}</div><div className="stat-label">ผู้ชนะทั้งหมด</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#5ed88a' }}>{stats.retained}</div><div className="stat-label"><Home size={12} style={{ verticalAlign: -2 }} /> อยู่พรรคเดิม</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#f44853' }}>{stats.switched}</div><div className="stat-label"><CornerDownRight size={12} style={{ verticalAlign: -2 }} /> ย้ายพรรค+ชนะ</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#42b8ff' }}>{stats.newFace}</div><div className="stat-label"><UserPlus size={12} style={{ verticalAlign: -2 }} /> หน้าใหม่ชนะ</div></div>
      </div>

      <div className="filter-bar">
        <button className={`tab ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}><BarChart3 size={14} /> ภาพรวมตามพรรค</button>
        <button className={`tab ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}><TableProperties size={14} /> ข้อมูลทั้งหมด ({winnerRetention.length})</button>
        <button className={`tab ${view === 'switched' ? 'active' : ''}`} onClick={() => setView('switched')}><CornerDownRight size={14} /> ย้ายพรรค+ชนะ ({stats.switched})</button>
        <button className={`tab ${view === 'lost' ? 'active' : ''}`} onClick={() => setView('lost')}><HeartCrack size={14} /> ส.ส.66 ที่แพ้ ({lost66Winners.length})</button>
      </div>

      {view === 'overview' && (
        <>
          <div className="chart-container" style={{ minHeight: 450 }}>
            <h4 style={{ color: '#e8eaed', marginBottom: 12, textAlign: 'center' }}>ที่มาของผู้ชนะ แยกตามพรรค</h4>
            <ResponsiveContainer width="100%" height={chartData.length * 36 + 60}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 12 }} />
                <YAxis dataKey="party" type="category" tick={{ fill: '#e8eaed', fontSize: 12 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{value}</span>} />
                <Bar dataKey="อยู่พรรคเดิม" stackId="a" fill="#5ed88a" />
                <Bar dataKey="ย้ายพรรคมา" stackId="a" fill="#f44853" />
                <Bar dataKey="หน้าใหม่" stackId="a" fill="#42b8ff" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Retention Summary Table ── */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: '#e8eaed', marginBottom: 12 }}><TableProperties size={16} style={{ verticalAlign: -3 }} /> สรุปตามพรรค</h4>
            <div className="province-table-container" style={{ overflowX: 'auto' }}>
              <table className="province-table">
                <thead>
                  <tr>
                    <th>พรรค</th>
                    <th style={{ textAlign: 'right' }}>ที่นั่งรวม</th>
                    <th style={{ textAlign: 'right' }}><Home size={11} style={{ verticalAlign: -2 }} /> อยู่เดิม</th>
                    <th style={{ textAlign: 'right' }}><CornerDownRight size={11} style={{ verticalAlign: -2 }} /> ย้ายมา</th>
                    <th style={{ textAlign: 'right' }}><UserPlus size={11} style={{ verticalAlign: -2 }} /> หน้าใหม่</th>
                    <th style={{ textAlign: 'right' }}>% รักษาที่นั่ง</th>
                  </tr>
                </thead>
                <tbody>
                  {retentionSummary
                    .slice()
                    .sort((a, b) => b.total - a.total)
                    .map((r, i) => {
                      const pct = r.total > 0 ? (r.retained / r.total * 100) : 0
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <PartyLogo partyName={r.party} nameToCodeMap={nameToCodeMap} size={22} />
                              <span style={{ color: r.color, fontWeight: 600 }}>{r.party}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#e8eaed' }}>{r.total}</td>
                          <td style={{ textAlign: 'right', color: '#5ed88a' }}>{r.retained}</td>
                          <td style={{ textAlign: 'right', color: '#f44853' }}>{r.switched}</td>
                          <td style={{ textAlign: 'right', color: '#42b8ff' }}>{r.newFace}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <div style={{ width: 60, height: 6, background: '#2d3148', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct >= 70 ? '#5ed88a' : pct >= 40 ? '#e0c232' : '#f44853', borderRadius: 3 }} />
                              </div>
                              <span style={{ color: pct >= 70 ? '#5ed88a' : pct >= 40 ? '#e0c232' : '#f44853', fontWeight: 600, fontSize: 12, minWidth: 40 }}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #2d3148' }}>
                    <td style={{ fontWeight: 700, color: '#e8eaed' }}>รวมทั้งหมด</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#ff8a4d' }}>{retentionSummary.reduce((s, r) => s + r.total, 0)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#5ed88a' }}>{retentionSummary.reduce((s, r) => s + r.retained, 0)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#f44853' }}>{retentionSummary.reduce((s, r) => s + r.switched, 0)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#42b8ff' }}>{retentionSummary.reduce((s, r) => s + r.newFace, 0)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#9aa0a6' }}>
                      {(() => {
                        const tot = retentionSummary.reduce((s, r) => s + r.total, 0)
                        const ret = retentionSummary.reduce((s, r) => s + r.retained, 0)
                        return tot > 0 ? `${(ret / tot * 100).toFixed(0)}%` : '-'
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── All winners table ── */}
      {view === 'all' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                placeholder="ค้นหาชื่อ / เขต / พรรค..."
                value={allSearch}
                onChange={e => setAllSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 10px 8px 30px', background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e8eaed', fontSize: 13 }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={allFilter} onChange={e => setAllFilter(e.target.value)}
                style={{ appearance: 'none', padding: '8px 28px 8px 10px', background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e8eaed', fontSize: 13, cursor: 'pointer' }}>
                {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ArrowUpDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' }} />
            </div>
            <div style={{ position: 'relative' }}>
              <select value={allPartyFilter} onChange={e => setAllPartyFilter(e.target.value)}
                style={{ appearance: 'none', padding: '8px 28px 8px 10px', background: '#1a1d27', border: '1px solid #2d3148', borderRadius: 8, color: '#e8eaed', fontSize: 13, cursor: 'pointer' }}>
                {allParties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ArrowUpDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#666' }} />
            </div>
            <span style={{ color: '#9aa0a6', fontSize: 12 }}>แสดง {allTableData.length} จาก {winnerRetention.length} รายการ</span>
          </div>
          <div className="province-table-container" style={{ maxHeight: 600, overflowY: 'auto' }}>
            <table className="province-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAllSort('areaCode')}>
                    เขต {allSort.key === 'areaCode' ? (allSort.asc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAllSort('winnerName')}>
                    ชื่อผู้ชนะ {allSort.key === 'winnerName' ? (allSort.asc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAllSort('partyName')}>
                    พรรค {allSort.key === 'partyName' ? (allSort.asc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleAllSort('status')}>
                    สถานะ {allSort.key === 'status' ? (allSort.asc ? '▲' : '▼') : ''}
                  </th>
                  <th>ย้ายพรรค?</th>
                  <th>พรรคเดิม (66)</th>
                </tr>
              </thead>
              <tbody>
                {allTableData.map((w, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ color: '#e8eaed', fontWeight: 600 }}>{w.areaCode}</span>
                      <br /><span style={{ fontSize: 11, color: '#9aa0a6' }}>{w.areaName}</span>
                    </td>
                    <td style={{ color: '#e8eaed' }}>{w.winnerName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PartyLogo partyName={w.partyName} nameToCodeMap={nameToCodeMap} size={22} />
                        <span style={{ color: w.partyColor, fontWeight: 600 }}>{w.partyName}</span>
                      </div>
                    </td>
                    <td>{statusBadge(w.status)}</td>
                    <td>
                      {w.switchedParty === true
                        ? <span style={{ color: '#f44853' }}><CornerDownRight size={12} style={{ verticalAlign: -2 }} /> ย้าย</span>
                        : w.switchedParty === false
                          ? <span style={{ color: '#5ed88a' }}>อยู่เดิม</span>
                          : <span style={{ color: '#666' }}>-</span>}
                    </td>
                    <td style={{ color: '#9aa0a6' }}>{w.party66Ref || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {allTableData.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: '#9aa0a6' }}>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</div>
          )}
        </>
      )}

      {view === 'switched' && (
        <div className="province-table-container" style={{ maxHeight: 500, overflowY: 'auto' }}>
          <table className="province-table">
            <thead><tr><th>ชื่อ</th><th>เขต</th><th>พรรคปัจจุบัน</th><th>พรรคเดิม (66)</th></tr></thead>
            <tbody>
              {switchedWinners.map((w, i) => (
                <tr key={i}>
                  <td style={{ color: '#e8eaed' }}>{w.winnerName}</td>
                  <td style={{ color: '#9aa0a6', fontSize: '0.85rem' }}>{w.areaName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PartyLogo partyName={w.partyName} nameToCodeMap={nameToCodeMap} size={22} />
                      <span style={{ color: w.partyColor, fontWeight: 600 }}>{w.partyName}</span>
                    </div>
                  </td>
                  <td style={{ color: '#9aa0a6' }}>{w.party66Ref || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'lost' && (
        <>
          <div className="section-desc" style={{ marginBottom: 12 }}>ส.ส. ที่เคยชนะในปี 2566 แต่แพ้ในปี 2569 — ใครตกเก้าอี้?</div>
          <div className="province-table-container" style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table className="province-table">
              <thead><tr><th>ชื่อ</th><th>เขต</th><th>พรรค</th><th>อันดับที่ได้</th><th>คะแนน</th><th>ย้ายพรรค?</th><th>พรรคเดิม</th></tr></thead>
              <tbody>
                {lost66Winners.map((w, i) => (
                  <tr key={i}>
                    <td style={{ color: '#e8eaed' }}>{w.name}</td>
                    <td style={{ color: '#9aa0a6', fontSize: '0.85rem' }}>{w.areaName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PartyLogo partyName={w.partyName} nameToCodeMap={nameToCodeMap} size={22} />
                        <span style={{ color: w.partyColor, fontWeight: 600 }}>{w.partyName}</span>
                      </div>
                    </td>
                    <td style={{ color: w.rank === 2 ? '#e0c232' : w.rank <= 5 ? '#9aa0a6' : '#666', fontWeight: 700 }}>#{w.rank}</td>
                    <td>{w.voteTotal?.toLocaleString()}</td>
                    <td>{w.switchedParty === true ? <span style={{ color: '#f44853' }}><CornerDownRight size={12} style={{ verticalAlign: -2 }} /> ย้าย</span> : <span style={{ color: '#5ed88a' }}>อยู่เดิม</span>}</td>
                    <td style={{ color: '#9aa0a6' }}>{w.party66Ref || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
