import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { BarChart3, CornerDownRight, HeartCrack } from 'lucide-react'
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
  const [view, setView] = useState<'overview' | 'switched' | 'lost'>('overview')

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
        <div className="item">🏠 อยู่พรรคเดิม: {d?.['อยู่พรรคเดิม']} คน</div>
        <div className="item">↪ ย้ายพรรคมา: {d?.['ย้ายพรรคมา']} คน</div>
        <div className="item">🆕 หน้าใหม่: {d?.['หน้าใหม่']} คน</div>
        <div className="item" style={{ marginTop: 4, fontWeight: 600 }}>รวม: {d?.total} ที่นั่ง</div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🏅</span>
        ส.ส. ปี 66: ใครรักษาที่นั่งได้ ใครแพ้ ใครย้ายพรรค?
      </div>
      <div className="section-desc">
        วิเคราะห์ผู้ชนะเลือกตั้ง 2569 ว่ามาจากไหน — เป็น ส.ส. เดิมจากปี 66 ที่อยู่พรรคเดิม, ย้ายพรรคมา, หรือเป็นหน้าใหม่
        ผู้สมัครที่เคยชนะปี 66 มีทั้งหมด {summary?.total66Winners || '?'} คน ย้ายพรรค {summary?.switchedCandidates || '?'} คน
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-value" style={{ color: '#ff8a4d' }}>{stats.totalWinners}</div><div className="stat-label">ผู้ชนะทั้งหมด</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#5ed88a' }}>{stats.retained}</div><div className="stat-label">🏠 อยู่พรรคเดิม</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#f44853' }}>{stats.switched}</div><div className="stat-label">↪ ย้ายพรรค+ชนะ</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#42b8ff' }}>{stats.newFace}</div><div className="stat-label">🆕 หน้าใหม่ชนะ</div></div>
      </div>

      <div className="filter-bar">
        <button className={`tab ${view === 'overview' ? 'active' : ''}`} onClick={() => setView('overview')}><BarChart3 size={14} /> ภาพรวมตามพรรค</button>
        <button className={`tab ${view === 'switched' ? 'active' : ''}`} onClick={() => setView('switched')}><CornerDownRight size={14} /> ย้ายพรรค+ชนะ ({stats.switched})</button>
        <button className={`tab ${view === 'lost' ? 'active' : ''}`} onClick={() => setView('lost')}><HeartCrack size={14} /> ส.ส.66 ที่แพ้ ({lost66Winners.length})</button>
      </div>

      {view === 'overview' && (
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
                    <td>{w.switchedParty === true ? <span style={{ color: '#f44853' }}>↪ ย้าย</span> : <span style={{ color: '#5ed88a' }}>อยู่เดิม</span>}</td>
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
