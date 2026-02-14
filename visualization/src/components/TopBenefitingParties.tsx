'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList,
} from 'recharts'
import { Target, Info, Hash, Filter } from 'lucide-react'
import type { TargetPartyCount, VoteBuyingItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ─── Helpers ─── */
function fmt(n: number) { return n.toLocaleString('th-TH') }

/* ─── Mobile hook ─── */
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return isMobile
}

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
  const isMobile = useIsMobile()

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
    const maxLen = isMobile ? 5 : 10
    return top10.map(g => ({
      name: `#${g.partyNum} ${g.partyName.length > maxLen ? g.partyName.slice(0, maxLen - 1) + '…' : g.partyName}`,
      fullName: g.partyName,
      partyNum: g.partyNum,
      totalAreas: g.totalAreas,
      totalPlVotes: g.totalPlVotes,
    }))
  }, [top10, isMobile])

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
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 8 : 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">เขตที่เกิดเบอร์ตรง</div>
          <div className="stat-value" style={{ color: '#f59e0b', fontSize: isMobile ? 20 : undefined }}>{totalSuspicious} <span style={{ fontSize: isMobile ? 11 : 13, opacity: 0.6 }}>/ 400</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">อันดับ 1 ได้ประโยชน์</div>
          <div className="stat-value" style={{ fontSize: isMobile ? 12 : 14 }}>
            เบอร์ {top10[0]?.partyNum} {top10[0]?.partyName || '-'}
          </div>
          <div style={{ fontSize: isMobile ? 11 : 12, color: '#f59e0b' }}>{top10[0]?.totalAreas || 0} เขต</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">คะแนน PL รวม (Top 10)</div>
          <div className="stat-value" style={{ fontSize: isMobile ? 12 : 14, color: '#22c55e' }}>{fmt(top10.reduce((s, g) => s + g.totalPlVotes, 0))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">พรรค PL ที่ได้ประโยชน์</div>
          <div className="stat-value" style={{ fontSize: isMobile ? 20 : undefined }}>{grouped.length} <span style={{ fontSize: isMobile ? 11 : 13, opacity: 0.6 }}>พรรค</span></div>
        </div>
      </div>

      {/* Info box */}
      <div style={{ padding: isMobile ? 10 : 12, borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={16} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: isMobile ? 11 : 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong>เบอร์ตรง ส้มหล่น</strong> = ส.ส.เขตเบอร์ <em>N</em> ชนะ (พรรค A) → ผู้เลือกตั้งกาเบอร์ <em>N</em> ในบัญชีรายชื่อด้วย
          แต่เบอร์ <em>N</em> ใน PL เป็น <strong>คนละพรรค</strong> (พรรค B) → พรรค B ได้คะแนน
        </div>
      </div>

      {/* ── Horizontal bar chart: areas benefited ── */}
      <h3 style={{ marginBottom: 12 }}>
        <Hash size={16} style={{ verticalAlign: -3 }} /> จำนวนเขตที่ได้ประโยชน์ (เบอร์ตรง) — Top 10
      </h3>
      <ResponsiveContainer width="100%" height={Math.max(isMobile ? 340 : 380, top10.length * (isMobile ? 38 : 48) + 60)}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={isMobile ? { left: 10, right: 50, top: 10, bottom: 10 } : { left: 150, right: 60, top: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 11 }} />
          <YAxis type="category" dataKey="name" width={isMobile ? 90 : 140} tick={{ fontSize: isMobile ? 10 : 12 }} />
          <Tooltip content={<BarTooltip />} />
          <Bar
            dataKey="totalAreas"
            radius={[0, 6, 6, 0]}
            barSize={isMobile ? 20 : 28}
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
              style={{ fontSize: isMobile ? 10 : 12, fill: 'var(--text-primary)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
        คลิกแถบเพื่อดูรายละเอียด
      </div>

      {/* ── Detail table / cards: all 10 ── */}
      <h3 style={{ marginBottom: 12, fontSize: isMobile ? 14 : undefined }}>
        <Target size={16} style={{ verticalAlign: -3 }} /> ตาราง Top 10 พรรคส้มหล่น
      </h3>

      {isMobile ? (
        /* ── Mobile: card layout ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {top10.map((g, i) => (
            <div
              key={g.partyName}
              onClick={() => setSelectedParty(g.partyName === selectedParty ? null : g.partyName)}
              style={{
                padding: '10px 12px', borderRadius: 10,
                background: selectedParty === g.partyName ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                border: selectedParty === g.partyName ? '1px solid var(--accent)' : '1px solid var(--border)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: BAR_COLORS[i % BAR_COLORS.length] + '33', border: `2px solid ${BAR_COLORS[i % BAR_COLORS.length]}`, fontWeight: 700, fontSize: 12 }}>
                  {g.partyNum}
                </span>
                <PartyLogo partyCode={nameToCodeMap[g.partyName] || ''} size={20} />
                <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{g.partyName}</span>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 15 }}>{g.totalAreas} <span style={{ fontSize: 11, fontWeight: 400 }}>เขต</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>คะแนน PL: {fmt(g.totalPlVotes)}</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {g.fromParties.slice(0, 3).map(f => (
                    <span key={f.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, padding: '0px 4px', borderRadius: 6, background: f.color + '22', fontSize: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color }} />
                      {f.name}({f.count})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Desktop: table layout ── */
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
      )}

      {/* ── Selected party detail ── */}
      {selectedParty && (() => {
        const targetInfo = grouped.find(g => g.partyName === selectedParty)
        if (!targetInfo) return null
        return (
          <div style={{ marginTop: 24, padding: isMobile ? 12 : 20, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20, gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10, minWidth: 0, flex: 1 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, borderRadius: '50%', background: '#f59e0b22', border: '2px solid #f59e0b', fontWeight: 800, fontSize: isMobile ? 14 : 18, color: '#f59e0b', flexShrink: 0 }}>
                  {targetInfo.partyNum}
                </span>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: isMobile ? 15 : 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedParty}</h3>
                  <div style={{ fontSize: isMobile ? 11 : 13, color: 'var(--text-muted)' }}>
                    <strong style={{ color: '#f59e0b' }}>{targetInfo.totalAreas}</strong> เขต
                    {!isMobile && <>・คะแนน PL รวม <strong style={{ color: '#22c55e' }}>{fmt(targetInfo.totalPlVotes)}</strong></>}
                  </div>
                </div>
              </div>
              <button onClick={() => { setSelectedParty(null); setShowAllAreas(false) }} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '4px 10px', flexShrink: 0 }}>✕</button>
            </div>

            {/* Source parties — horizontal bar list */}
            <div style={{ marginBottom: isMobile ? 14 : 20 }}>
              <div style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>ได้ประโยชน์จากพรรค ส.ส.เขต ที่ชนะ</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 5 : 6 }}>
                {targetInfo.fromParties.map(f => {
                  const pct = (f.count / targetInfo.totalAreas * 100)
                  return (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
                      <div style={{ width: isMobile ? 80 : 120, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <PartyLogo partyCode={nameToCodeMap[f.name] || ''} size={isMobile ? 14 : 18} />
                        <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      </div>
                      <div style={{ flex: 1, height: isMobile ? 16 : 22, background: 'var(--bg-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: f.color, borderRadius: 6, minWidth: 2, opacity: 0.8 }} />
                      </div>
                      <div style={{ width: isMobile ? 55 : 80, textAlign: 'right', fontSize: isMobile ? 11 : 13, fontWeight: 600, flexShrink: 0 }}>
                        {f.count} <span style={{ fontSize: isMobile ? 9 : 11, color: 'var(--text-muted)', fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Area list */}
            <div>
              <div style={{ fontSize: isMobile ? 12 : 13, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600 }}>
                รายชื่อเขตที่เบอร์ตรง ({selectedAreas.length} เขต)
              </div>

              {isMobile ? (
                /* Mobile: card list for areas */
                <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(showAllAreas ? selectedAreas : selectedAreas.slice(0, 8)).map(a => (
                    <div key={a.areaCode} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{a.areaName}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{fmt(a.targetPlVotes)}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{a.province}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 6, background: a.winnerPartyColor + '18' }}>
                          <PartyLogo partyCode={nameToCodeMap[a.winnerPartyName] || a.winnerPartyCode} size={12} />
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{a.winnerPartyName}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: table */
                <div style={{ maxHeight: 360, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <table className="data-table" style={{ fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>เขต</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px' }}>ส.ส.เขตที่ชนะ (พรรค)</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>คะแนน PL ที่ได้</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showAllAreas ? selectedAreas : selectedAreas.slice(0, 10)).map(a => (
                        <tr key={a.areaCode}>
                          <td style={{ padding: '6px 12px' }}>
                            <div>{a.areaName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.province} ({a.areaCode})</div>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 8, background: a.winnerPartyColor + '18' }}>
                              <PartyLogo partyCode={nameToCodeMap[a.winnerPartyName] || a.winnerPartyCode} size={16} />
                              <span style={{ fontWeight: 500 }}>{a.winnerPartyName}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>เบอร์ {a.candidateNum}</span>
                            </span>
                          </td>
                          <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{fmt(a.targetPlVotes)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedAreas.length > (isMobile ? 8 : 10) && (
                <button
                  onClick={() => setShowAllAreas(!showAllAreas)}
                  style={{ marginTop: 10, padding: '6px 16px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--accent)', cursor: 'pointer', fontSize: isMobile ? 12 : 13 }}
                >
                  {showAllAreas ? `แสดง ${isMobile ? 8 : 10} เขต` : `แสดงทั้งหมด (${selectedAreas.length})`}
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* Key Insights */}
      <div style={{ marginTop: 24, padding: isMobile ? 12 : 16, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
        <h4 style={{ marginBottom: 8, fontSize: isMobile ? 13 : undefined }}>
          <Filter size={16} style={{ verticalAlign: -3 }} /> Key Insights
        </h4>
        <ul style={{ fontSize: isMobile ? 12 : 13, lineHeight: isMobile ? 1.8 : 2, color: 'var(--text-secondary)', paddingLeft: isMobile ? 16 : 20 }}>
          {top10.slice(0, 3).map((g, i) => (
            <li key={g.partyName}>
              เบอร์ <strong>{g.partyNum}</strong> — <strong style={{ color: BAR_COLORS[i] }}>{g.partyName}</strong>{' '}
              ได้ประโยชน์ <strong>{g.totalAreas}</strong> เขต
              {!isMobile && g.fromParties[0] && <> (ส่วนใหญ่จาก <strong>{g.fromParties[0].name}</strong> {g.fromParties[0].count} เขต)</>}
            </li>
          ))}
          <li>
            รวม <strong>{totalSuspicious}</strong> เขตจาก 400 ({(totalSuspicious / 4).toFixed(1)}%) เกิดเบอร์ตรงข้ามพรรค
          </li>
          {(() => {
            const fromMap: Record<string, number> = {}
            top10.forEach(g => g.fromParties.forEach(f => { fromMap[f.name] = (fromMap[f.name] || 0) + f.count }))
            const topFrom = Object.entries(fromMap).sort((a, b) => b[1] - a[1])[0]
            return topFrom ? (
              <li>
                <strong>{topFrom[0]}</strong> ทำให้เกิดเบอร์ตรงมากที่สุด ({topFrom[1]} เขต)
              </li>
            ) : null
          })()}
        </ul>
      </div>
    </div>
  )
}
