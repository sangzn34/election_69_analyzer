import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { PartySwitcherFlow, PartySwitcherSummaryItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

interface Props {
  flows: PartySwitcherFlow[]
  summary: PartySwitcherSummaryItem[]
  nameToCodeMap: NameToCodeMap
}

export default function PartySwitcher({ flows, summary, nameToCodeMap }: Props) {
  const [view, setView] = useState<'summary' | 'flows'>('summary')
  const [selectedParty, setSelectedParty] = useState<string | null>(null)

  const summaryChartData = useMemo(() =>
    summary.map(s => ({ party: s.party, color: s.color, received: s.received }))
  , [summary])

  const selectedSources = useMemo(() => {
    if (!selectedParty) return []
    const party = summary.find(s => s.party === selectedParty)
    if (!party) return []
    return party.sources.sort((a, b) => b.count - a.count)
  }, [summary, selectedParty])

  const topFlows = useMemo(() => flows.slice(0, 25), [flows])

  interface SummaryTooltipProps { active?: boolean; payload?: Array<{ payload: { party: string; received: number } }> }
  const CustomTooltip = ({ active, payload }: SummaryTooltipProps) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return <div className="custom-tooltip"><div className="label">{d.party}</div><div className="item">รับย้ายมา: {d.received} คน</div></div>
  }

  interface FlowTooltipProps { active?: boolean; payload?: Array<{ payload: { label: string; count: number; names?: string[] } }> }
  const FlowTooltip = ({ active, payload }: FlowTooltipProps) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="custom-tooltip">
        <div className="label">{d.label}</div>
        <div className="item">{d.count} คน</div>
        {d.names && d.names.length > 0 && <div className="item" style={{ fontSize: '0.8rem', marginTop: 4, color: '#9aa0a6' }}>เช่น {d.names.join(', ')}</div>}
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🔄</span>
        การย้ายพรรค: ผู้สมัครย้ายจากพรรค 2566 → พรรค 2569
      </div>
      <div className="section-desc">
        วิเคราะห์การเคลื่อนย้ายของผู้สมัครจากพรรคในการเลือกตั้ง 2566 ไปยังพรรคใหม่ในการเลือกตั้ง 2569
        — พรรคไหนดูดผู้สมัครมากที่สุด? ดูดจากพรรคไหน?
      </div>

      <div className="filter-bar">
        <button className={`tab ${view === 'summary' ? 'active' : ''}`} onClick={() => setView('summary')}>📊 ภาพรวมพรรครับย้าย</button>
        <button className={`tab ${view === 'flows' ? 'active' : ''}`} onClick={() => setView('flows')}>🔀 รายละเอียดการย้าย</button>
      </div>

      {view === 'summary' && (
        <>
          <div className="chart-container" style={{ minHeight: 400 }}>
            <h4 style={{ color: '#e8eaed', marginBottom: 12, textAlign: 'center' }}>จำนวนผู้สมัครที่ย้ายเข้ามา แยกตามพรรค (ปัจจุบัน)</h4>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={summaryChartData} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 12 }} />
                <YAxis dataKey="party" type="category" tick={{ fill: '#e8eaed', fontSize: 12 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="received" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(d: { party: string }) => setSelectedParty(d.party)}>
                  {summaryChartData.map((entry, idx) => (
                    <Cell key={idx} fill={selectedParty === entry.party ? '#fff' : entry.color} fillOpacity={selectedParty === entry.party ? 1 : 0.85} stroke={selectedParty === entry.party ? entry.color : 'none'} strokeWidth={2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {selectedParty && selectedSources.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ color: '#e8eaed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PartyLogo partyName={selectedParty} nameToCodeMap={nameToCodeMap} size={32} />
                📥 {selectedParty} รับย้ายมาจาก:
              </h4>
              <div className="province-table-container" style={{ maxHeight: 350 }}>
                <table className="province-table">
                  <thead><tr><th>พรรคเดิม (ปี 66)</th><th>จำนวนผู้สมัครที่ย้ายมา</th></tr></thead>
                  <tbody>
                    {selectedSources.map((s, i) => (
                      <tr key={i}>
                        <td style={{ color: '#e8eaed' }}>{s.fromParty}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: `${Math.min(s.count / selectedSources[0].count * 100, 100)}%`, minWidth: 20, height: 18, background: summary.find(x => x.party === selectedParty)?.color || '#ff8a4d', borderRadius: 4, opacity: 0.7 }} />
                            <span>{s.count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {view === 'flows' && (
        <>
          <div className="chart-container" style={{ minHeight: 500 }}>
            <h4 style={{ color: '#e8eaed', marginBottom: 12, textAlign: 'center' }}>TOP กระแสการย้ายพรรค (จาก → ไป)</h4>
            <ResponsiveContainer width="100%" height={topFlows.length * 28 + 40}>
              <BarChart data={topFlows.map(f => ({ label: `${f.fromParty66} → ${f.toParty}`, count: f.count, color: f.toColor, names: f.names }))} layout="vertical" margin={{ top: 10, right: 30, left: 200, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 12 }} />
                <YAxis dataKey="label" type="category" tick={{ fill: '#e8eaed', fontSize: 11 }} width={190} />
                <Tooltip content={<FlowTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {topFlows.map((f, idx) => <Cell key={idx} fill={f.toColor} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="province-table-container" style={{ marginTop: 16, maxHeight: 400, overflowY: 'auto' }}>
            <table className="province-table">
              <thead><tr><th>พรรคเดิม (66)</th><th>→</th><th>พรรคปัจจุบัน (69)</th><th>จำนวน</th><th>ตัวอย่างผู้สมัคร</th></tr></thead>
              <tbody>
                {topFlows.map((f, i) => (
                  <tr key={i}>
                    <td style={{ color: '#9aa0a6' }}>{f.fromParty66}</td>
                    <td style={{ color: '#666' }}>→</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <PartyLogo partyName={f.toParty} nameToCodeMap={nameToCodeMap} size={22} />
                        <span style={{ color: f.toColor, fontWeight: 600 }}>{f.toParty}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{f.count}</td>
                    <td style={{ color: '#9aa0a6', fontSize: '0.8rem' }}>{f.names.join(', ')}</td>
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
