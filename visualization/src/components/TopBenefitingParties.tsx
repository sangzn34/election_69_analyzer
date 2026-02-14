'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList, PieChart, Pie, Legend,
} from 'recharts'
import { Target, Info, ArrowRight, Hash, Filter } from 'lucide-react'
import type { TargetPartyCount, VoteBuyingItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ─── Helpers ─── */
function fmt(n: number) { return n.toLocaleString('th-TH') }

/* ─── Grouped data: aggregate by PL party ─── */
interface GroupedTarget {
  partyNum: number
  partyName: string
  totalAreas: number
  totalPlVotes: number
  fromParties: { name: string; color: string; count: number }[]
}

/* ─── Tooltip ─── */
interface BarTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { fullName: string; partyNum: number; totalAreas: number; totalPlVotes: number } }>
}
const BarTooltip = ({ active, payload }: BarTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label" style={{ fontWeight: 700 }}>เบอร์ {d.partyNum} — {d.fullName}</div>
      <div className="item">เขตที่ได้ประโยชน์: <strong>{d.totalAreas}</strong> เขต</div>
      <div className="item">คะแนน PL รวม: <strong>{fmt(d.totalPlVotes)}</strong></div>
    </div>
  )
}

/* ─── Props ─── */
interface Props {
  data: TargetPartyCount[]
  vba: VoteBuyingItem[]
  nameToCodeMap: NameToCodeMap
}

export default function TopBenefitingParties({ data, vba, nameToCodeMap }: Props) {
  const [selectedParty, setSelectedParty] = useState<string | null>(null)
  const [showAllAreas, setShowAllAreas] = useState(false)

  /* ── Group targetPartyCounts by PL party ── */
  const grouped = useMemo((): GroupedTarget[] => {
    const map: Record<string, GroupedTarget> = {}
    data.forEach(item => {
      const key = item.targetPartyName
      if (!map[key]) {
        map[key] = {
          partyNum: item.targetPartyNum,
          partyName: item.targetPartyName,
          totalAreas: 0,
          totalPlVotes: 0,
          fromParties: [],
        }
      }
      map[key].totalAreas += item.count
      // Track which winning party it came from
      const existing = map[key].fromParties.find(f => f.name === item.winnerPartyName)
      if (existing) {
        existing.count += item.count
      } else {
        map[key].fromParties.push({ name: item.winnerPartyName, color: item.winnerPartyColor, count: item.count })
      }
    })

    // Add PL votes from vba
    const plVotesByTarget: Record<string, number> = {}
    vba.forEach(a => {
      if (a.isSuspicious) {
        plVotesByTarget[a.targetPartyName] = (plVotesByTarget[a.targetPartyName] || 0) + a.targetPlVotes
      }
    })
    Object.values(map).forEach(g => {
      g.totalPlVotes = plVotesByTarget[g.partyName] || 0
      g.fromParties.sort((a, b) => b.count - a.count)
    })

    return Object.values(map).sort((a, b) => b.totalAreas - a.totalAreas)
  }, [data, vba])

  const top10 = grouped.slice(0, 10)

  /* ── Chart data ── */
  const chartData = useMemo(() => {
    return top10.map(g => ({
      name: `#${g.partyNum} ${g.partyName.length > 10 ? g.partyName.slice(0, 9) + '…' : g.partyName}`,
      fullName: g.partyName,
      partyNum: g.partyNum,
      totalAreas: g.totalAreas,
      totalPlVotes: g.totalPlVotes,
    }))
  }, [top10])

  /* ── Pie data: who benefits from which winning party ── */
  const pieData = useMemo(() => {
    if (!selectedParty) return []
    const target = grouped.find(g => g.partyName === selectedParty)
    if (!target) return []
    return target.fromParties.map(f => ({
      name: f.name,
      value: f.count,
      fill: f.color,
    }))
  }, [selectedParty, grouped])

  /* ── Per-area detail for selected party ── */
  const selectedAreas = useMemo(() => {
    if (!selectedParty) return []
    return vba
      .filter(a => a.isSuspicious && a.targetPartyName === selectedParty)
      .sort((a, b) => b.targetPlVotes - a.targetPlVotes)
  }, [selectedParty, vba])

  /* ── Summary stats ── */
  const totalSuspicious = useMemo(() => vba.filter(a => a.isSuspicious).length, [vba])

  /* ── COLORS for bar ── */
  const BAR_COLORS = ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#14b8a6', '#22c55e', '#84cc16']

  return (
    <div className="section">
      {/* Header */}
      <div className="section-header">
        <h2><Target size={20} style={{ verticalAlign: -4 }} /> 10 อันดับพรรคบัญชีรายชื่อที่ได้รับประโยชน์สูงสุด (เบอร์ตรง ส้มหล่น)</h2>
        <p>พรรคบัญชีรายชื่อที่มี<strong>เบอร์เดียวกัน</strong>กับ ส.ส.เขตผู้ชนะ แต่<strong>คนละพรรค</strong> — ได้ประโยชน์จากผู้เลือกตั้งที่กาเบอร์เดียวกันทั้งสองใบ</p>
      </div>

      {/* Summary cards */}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">เขตที่เกิดเบอร์ตรง</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>{totalSuspicious} <span style={{ fontSize: 13, opacity: 0.6 }}>/ 400</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">อันดับ 1 ได้ประโยชน์</div>
          <div className="stat-value" style={{ fontSize: 14 }}>
            เบอร์ {top10[0]?.partyNum} {top10[0]?.partyName || '-'}
          </div>
          <div style={{ fontSize: 12, color: '#f59e0b' }}>{top10[0]?.totalAreas || 0} เขต</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">คะแนน PL รวม (Top 10)</div>
          <div className="stat-value" style={{ fontSize: 14, color: '#22c55e' }}>{fmt(top10.reduce((s, g) => s + g.totalPlVotes, 0))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">พรรค PL ที่ได้ประโยชน์</div>
          <div className="stat-value">{grouped.length} <span style={{ fontSize: 13, opacity: 0.6 }}>พรรค</span></div>
        </div>
      </div>

      {/* Info box */}
      <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>เบอร์ตรง ส้มหล่น</strong> = ผู้สมัคร ส.ส.เขตเบอร์ <em>N</em> ชนะ (พรรค A) → ผู้เลือกตั้งมักกาเบอร์ <em>N</em> ในบัตรบัญชีรายชื่อด้วย
          แต่เบอร์ <em>N</em> ในบัญชีรายชื่อเป็น <strong>คนละพรรค</strong> (พรรค B) → พรรค B ได้คะแนนโดยไม่ได้ตั้งใจ
        </div>
      </div>

      {/* ── Horizontal bar chart: areas benefited ── */}
      <h3 style={{ marginBottom: 12 }}>
        <Hash size={16} style={{ verticalAlign: -3 }} /> จำนวนเขตที่ได้ประโยชน์ (เบอร์ตรง) — Top 10
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(380, top10.length * 48 + 60)}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ left: 150, right: 60, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
          <Tooltip content={<BarTooltip />} />
          <Bar
            dataKey="totalAreas"
            radius={[0, 6, 6, 0]}
            barSize={28}
            cursor="pointer"
            onClick={(d) => setSelectedParty(d.fullName === selectedParty ? null : d.fullName)}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} opacity={0.85} />
            ))}
            <LabelList
              dataKey="totalAreas"
              position="right"
              formatter={(v: number) => `${v} เขต`}
              style={{ fontSize: 12, fill: 'var(--text-primary)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
        คลิกแถบเพื่อดูรายละเอียด
      </div>

      {/* ── Detail table: all 10 ── */}
      <h3 style={{ marginBottom: 12 }}>
        <Target size={16} style={{ verticalAlign: -3 }} /> ตาราง Top 10 พรรคส้มหล่น
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', padding: '8px', width: 36 }}>#</th>
              <th style={{ textAlign: 'center', padding: '8px', width: 50 }}>เบอร์</th>
              <th style={{ textAlign: 'left', padding: '8px 12px' }}>พรรค PL (ได้ประโยชน์)</th>
              <th style={{ textAlign: 'center', padding: '8px' }}>เขต</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>คะแนน PL รวม</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>ได้จากพรรค ส.ส.เขต</th>
            </tr>
          </thead>
          <tbody>
            {top10.map((g, i) => (
              <tr
                key={g.partyName}
                onClick={() => setSelectedParty(g.partyName === selectedParty ? null : g.partyName)}
                style={{ cursor: 'pointer', background: selectedParty === g.partyName ? 'var(--bg-tertiary)' : undefined }}
              >
                <td style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 700, color: i < 3 ? '#f59e0b' : 'var(--text-muted)' }}>
                  {i + 1}
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: BAR_COLORS[i % BAR_COLORS.length] + '33', border: `2px solid ${BAR_COLORS[i % BAR_COLORS.length]}`, fontWeight: 700, fontSize: 13 }}>
                    {g.partyNum}
                  </span>
                </td>
                <td style={{ padding: '6px 12px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PartyLogo partyCode={nameToCodeMap[g.partyName] || ''} size={22} />
                    {g.partyName}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 700, color: '#f59e0b' }}>{g.totalAreas}</td>
                <td style={{ textAlign: 'right', padding: '6px 8px' }}>{fmt(g.totalPlVotes)}</td>
                <td style={{ padding: '6px 8px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {g.fromParties.slice(0, 4).map(f => (
                      <span key={f.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 8, background: f.color + '22', border: `1px solid ${f.color}44`, fontSize: 11 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                        {f.name} ({f.count})
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Selected party detail ── */}
      {selectedParty && (
        <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>
              เบอร์ {grouped.find(g => g.partyName === selectedParty)?.partyNum} — {selectedParty}
            </h3>
            <button onClick={() => setSelectedParty(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
            {/* Pie: from which winning parties */}
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>ได้ประโยชน์จากพรรค ส.ส.เขต</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: 'var(--text-muted)' }}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Area list */}
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                รายชื่อเขต ({selectedAreas.length} เขต)
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>เขต</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>ส.ส.เขตชนะ</th>
                      <th style={{ textAlign: 'center', padding: '4px 4px', width: 30 }}></th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>PL เบอร์ตรง</th>
                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>คะแนน PL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showAllAreas ? selectedAreas : selectedAreas.slice(0, 15)).map(a => (
                      <tr key={a.areaCode}>
                        <td style={{ padding: '3px 8px', whiteSpace: 'nowrap' }}>
                          {a.areaName}
                          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>({a.areaCode})</span>
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 8, background: a.winnerPartyColor + '22', fontSize: 11 }}>
                            <PartyLogo partyCode={nameToCodeMap[a.winnerPartyName] || a.winnerPartyCode} size={14} />
                            <span style={{ color: a.winnerPartyColor }}>{a.winnerPartyName}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}><ArrowRight size={12} style={{ color: 'var(--text-muted)' }} /></td>
                        <td style={{ padding: '3px 8px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 8, background: '#f59e0b22', fontSize: 11 }}>
                            <PartyLogo partyCode={nameToCodeMap[a.targetPartyName] || ''} size={14} />
                            <span style={{ color: '#f59e0b' }}>{a.targetPartyName}</span>
                          </span>
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 500 }}>{fmt(a.targetPlVotes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selectedAreas.length > 15 && (
                <button
                  onClick={() => setShowAllAreas(!showAllAreas)}
                  style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
                >
                  {showAllAreas ? 'แสดง 15 เขต' : `แสดงทั้งหมด (${selectedAreas.length})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: 8 }}>
          <Filter size={16} style={{ verticalAlign: -3 }} /> Key Insights
        </h4>
        <ul style={{ fontSize: 13, lineHeight: 2, color: 'var(--text-secondary)', paddingLeft: 20 }}>
          {top10.slice(0, 3).map((g, i) => (
            <li key={g.partyName}>
              เบอร์ <strong>{g.partyNum}</strong> — <strong style={{ color: BAR_COLORS[i] }}>{g.partyName}</strong>{' '}
              ได้ประโยชน์จากเบอร์ตรงใน <strong>{g.totalAreas}</strong> เขต
              {g.fromParties[0] && <> (ส่วนใหญ่จาก <strong>{g.fromParties[0].name}</strong> {g.fromParties[0].count} เขต)</>}
            </li>
          ))}
          <li>
            รวม <strong>{totalSuspicious}</strong> เขตจาก 400 ({(totalSuspicious / 4).toFixed(1)}%) ที่เกิดปรากฏการณ์เบอร์ตรงข้ามพรรค
          </li>
          {(() => {
            const fromMap: Record<string, number> = {}
            top10.forEach(g => g.fromParties.forEach(f => { fromMap[f.name] = (fromMap[f.name] || 0) + f.count }))
            const topFrom = Object.entries(fromMap).sort((a, b) => b[1] - a[1])[0]
            return topFrom ? (
              <li>
                <strong>{topFrom[0]}</strong> เป็นพรรค ส.ส.เขตที่ทำให้เกิดเบอร์ตรงมากที่สุด ({topFrom[1]} เขตใน Top 10)
              </li>
            ) : null
          })()}
        </ul>
      </div>
    </div>
  )
}
