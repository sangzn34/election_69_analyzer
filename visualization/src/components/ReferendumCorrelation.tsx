import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  BarChart, Bar,
} from 'recharts'
import { Microscope, BarChart3, Table2 } from 'lucide-react'
import PartyLogo from './PartyLogo'
import type { ReferendumCorrelationItem, NameToCodeMap } from '../types'

interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ReferendumCorrelationItem }>
}

const ScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName} ({d.province})</div>
      <div className="item">✅ ลงประชามติ เห็นด้วย: {d.agreePercent.toFixed(1)}%</div>
      <div className="item">❌ ไม่เห็นด้วย: {d.disagreePercent.toFixed(1)}%</div>
      <div className="item">🗳️ Turnout ประชามติ: {d.turnoutPercent.toFixed(1)}%</div>
      <div className="item" style={{ color: d.winnerPartyColor, fontWeight: 700 }}>
        🏆 ชนะ: {d.mpWinnerParty} ({d.mpWinnerPercent.toFixed(1)}%)
      </div>
    </div>
  )
}

interface Props {
  data: ReferendumCorrelationItem[]
  nameToCodeMap: NameToCodeMap
}

export default function ReferendumCorrelation({ data, nameToCodeMap }: Props) {
  const [viewMode, setViewMode] = useState<'scatter' | 'bar' | 'table'>('scatter')

  const stats = useMemo(() => {
    const avgAgree = data.reduce((s, d) => s + d.agreePercent, 0) / data.length
    const avgTurnout = data.reduce((s, d) => s + d.turnoutPercent, 0) / data.length
    const highAgreeHighTurnout = data.filter(d => d.agreePercent > avgAgree && d.turnoutPercent > avgTurnout).length
    const lowAgreeLowTurnout = data.filter(d => d.agreePercent <= avgAgree && d.turnoutPercent <= avgTurnout).length
    return { avgAgree, avgTurnout, highAgreeHighTurnout, lowAgreeLowTurnout }
  }, [data])

  const partyBreakdown = useMemo(() => {
    const map: Record<string, { party: string; count: number; avgAgree: number; color: string }> = {}
    data.forEach(d => {
      if (!map[d.mpWinnerParty]) {
        map[d.mpWinnerParty] = { party: d.mpWinnerParty, count: 0, avgAgree: 0, color: d.winnerPartyColor }
      }
      map[d.mpWinnerParty].count++
      map[d.mpWinnerParty].avgAgree += d.agreePercent
    })
    return Object.values(map)
      .map(p => ({ ...p, avgAgree: p.avgAgree / p.count }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🗳️</span>
        Referendum Correlation: ประชามติ vs เลือกตั้ง
      </div>
      <div className="section-desc">
        เปรียบเทียบผลประชามติกับผลเลือกตั้ง — เขตที่ลงประชามติเห็นด้วยสูง
        จะมีพฤติกรรมการเลือกตั้งแตกต่างจากเขตที่ไม่เห็นด้วยหรือไม่?
      </div>

      <div className="summary-grid" style={{ marginBottom: 20 }}>
        <div className="summary-card">
          <div className="value">{stats.avgAgree.toFixed(1)}%</div>
          <div className="label">เห็นด้วยเฉลี่ย (ประชามติ)</div>
        </div>
        <div className="summary-card">
          <div className="value">{stats.avgTurnout.toFixed(1)}%</div>
          <div className="label">Turnout เฉลี่ย (เลือกตั้ง)</div>
        </div>
        <div className="summary-card">
          <div className="value success">{stats.highAgreeHighTurnout}</div>
          <div className="label">เห็นด้วยสูง + Turnout สูง</div>
        </div>
        <div className="summary-card">
          <div className="value danger">{stats.lowAgreeLowTurnout}</div>
          <div className="label">เห็นด้วยต่ำ + Turnout ต่ำ</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${viewMode === 'scatter' ? 'active' : ''}`} onClick={() => setViewMode('scatter')}><Microscope size={14} /> Scatter</button>
        <button className={`tab ${viewMode === 'bar' ? 'active' : ''}`} onClick={() => setViewMode('bar')}><BarChart3 size={14} /> พรรค</button>
        <button className={`tab ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><Table2 size={14} /> ตาราง</button>
      </div>

      {viewMode === 'scatter' && (
        <div className="chart-container" style={{ minHeight: 440, marginTop: 8 }}>
          <ResponsiveContainer width="100%" height={440}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis
                type="number" dataKey="agreePercent" name="เห็นด้วย%"
                tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'ลงประชามติเห็นด้วย (%)', position: 'insideBottom', offset: -10, fill: '#9aa0a6', fontSize: 12 }}
              />
              <YAxis
                type="number" dataKey="turnoutPercent" name="Turnout%"
                tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'Turnout ประชามติ (%)', angle: -90, position: 'insideLeft', fill: '#9aa0a6', fontSize: 12 }}
              />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={data}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.winnerPartyColor} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'bar' && (
        <div>
          <h4 style={{ color: '#8ab4f8', marginBottom: 12 }}>% เห็นด้วย (ประชามติ) เฉลี่ยแยกตามพรรคที่ชนะ</h4>
          <div className="chart-container" style={{ minHeight: 400 }}>
            <ResponsiveContainer width="100%" height={Math.max(400, partyBreakdown.length * 32)}>
              <BarChart data={partyBreakdown} layout="vertical" margin={{ top: 10, right: 60, left: 160, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
                <YAxis type="category" dataKey="party" tick={{ fill: '#e8eaed', fontSize: 11 }} width={150} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ background: '#1e1e2e', border: '1px solid #3d3d5c', borderRadius: 8, color: '#e8eaed' }} />
                <Bar dataKey="avgAgree" barSize={16} radius={[0, 6, 6, 0]}>
                  {partyBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="province-table-container" style={{ marginTop: 16, maxHeight: 400, overflowY: 'auto' }}>
            <table className="province-table">
              <thead><tr><th>พรรค</th><th>เขตที่ชนะ</th><th>เห็นด้วยเฉลี่ย (%)</th></tr></thead>
              <tbody>
                {partyBreakdown.map(row => (
                  <tr key={row.party}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <PartyLogo partyName={row.party} nameToCodeMap={nameToCodeMap} size={20} />
                        <span style={{ color: row.color, fontWeight: 600 }}>{row.party}</span>
                      </span>
                    </td>
                    <td>{row.count}</td>
                    <td style={{ fontWeight: 700 }}>{row.avgAgree.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="province-table-container" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table className="province-table">
            <thead><tr><th>#</th><th>เขต</th><th>จังหวัด</th><th>เห็นด้วย (%)</th><th>Turnout ประชามติ</th><th>🏆 พรรคชนะ</th><th>คะแนน%</th></tr></thead>
            <tbody>
              {[...data].sort((a, b) => b.agreePercent - a.agreePercent).map((row, i) => (
                <tr key={row.areaCode}>
                  <td>#{i + 1}</td>
                  <td>{row.areaName}</td>
                  <td style={{ color: '#9aa0a6' }}>{row.province}</td>
                  <td style={{ fontWeight: 700, color: row.agreePercent > stats.avgAgree ? '#5ed88a' : '#f44853' }}>
                    {row.agreePercent.toFixed(1)}%
                  </td>
                  <td>{row.turnoutPercent.toFixed(1)}%</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <PartyLogo partyName={row.mpWinnerParty} nameToCodeMap={nameToCodeMap} size={18} />
                      <span style={{ color: row.winnerPartyColor, fontWeight: 600 }}>{row.mpWinnerParty}</span>
                    </span>
                  </td>
                  <td>{row.mpWinnerPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
