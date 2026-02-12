'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { BarChart3, Microscope, TrendingDown, CircleDot } from 'lucide-react'
import type { TurnoutAnomalyItem } from '../types'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: TurnoutAnomalyItem }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item">จำนวนผู้มีสิทธิ: {d.eligibleVoters.toLocaleString()}</div>
      <div className="item" style={{ fontWeight: 700, color: d.deviation > 0 ? '#f44853' : '#5ed88a' }}>
        อัตราใช้สิทธิ: {d.turnoutPercent.toFixed(1)}%
      </div>
      <div className="item">ส่วนเบี่ยงเบน: {d.deviation > 0 ? '+' : ''}{d.deviation.toFixed(1)}%</div>
      <div className="item" style={{ color: d.winnerPartyColor }}>{d.winnerParty}</div>
    </div>
  )
}

interface Props {
  data: TurnoutAnomalyItem[]
}

export default function TurnoutAnomaly({ data }: Props) {
  const [viewMode, setViewMode] = useState<'chart' | 'scatter'>('chart')
  const [topN, setTopN] = useState(30)

  const highTurnout = useMemo(() =>
    [...data].sort((a, b) => b.turnoutPercent - a.turnoutPercent).slice(0, topN)
  , [data, topN])

  const lowTurnout = useMemo(() =>
    [...data].sort((a, b) => a.turnoutPercent - b.turnoutPercent).slice(0, topN)
  , [data, topN])

  const avgTurnout = useMemo(() => {
    if (data.length === 0) return 0
    return data.reduce((s, d) => s + d.turnoutPercent, 0) / data.length
  }, [data])

  return (
    <div className="section">
      <div className="section-title">
        <TrendingDown size={20} />
        Turnout Anomaly: เขตที่ % ผู้มาใช้สิทธิผิดปกติ
      </div>
      <div className="section-desc">
        วิเคราะห์อัตราการมาใช้สิทธิ์เลือกตั้งในแต่ละเขต — เขตที่มี turnout สูงหรือต่ำผิดปกติอาจเป็นสัญญาณที่น่าสังเกต
        (เฉลี่ยทั้งประเทศ: {avgTurnout.toFixed(1)}%)
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')}><BarChart3 size={14} /> Bar Chart</button>
        <button className={`tab ${viewMode === 'scatter' ? 'active' : ''}`} onClick={() => setViewMode('scatter')}><Microscope size={14} /> Scatter Plot</button>
      </div>

      <div className="filter-bar" style={{ marginTop: 8 }}>
        <span style={{ color: '#9aa0a6', fontSize: '0.85rem' }}>แสดง:</span>
        {[20, 30, 50].map(n => (
          <button key={n} className={`tab ${topN === n ? 'active' : ''}`} onClick={() => setTopN(n)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            Top {n}
          </button>
        ))}
      </div>

      {viewMode === 'chart' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
          <div>
            <h4 style={{ color: '#f44853', textAlign: 'center', marginBottom: 8 }}><CircleDot size={14} style={{ color: '#f44853', verticalAlign: -2 }} /> Turnout สูงสุด</h4>
            <ResponsiveContainer width="100%" height={Math.max(400, highTurnout.length * 22)}>
              <BarChart data={highTurnout} layout="vertical" margin={{ top: 10, right: 60, left: 130, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="areaName" tick={{ fill: '#e8eaed', fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="turnoutPercent" barSize={14} radius={[0, 4, 4, 0]}>
                  {highTurnout.map((entry, i) => (
                    <Cell key={i} fill={entry.turnoutPercent > avgTurnout + 10 ? '#f44853' : '#ff8a4d'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 style={{ color: '#42b8ff', textAlign: 'center', marginBottom: 8 }}><CircleDot size={14} style={{ color: '#42b8ff', verticalAlign: -2 }} /> Turnout ต่ำสุด</h4>
            <ResponsiveContainer width="100%" height={Math.max(400, lowTurnout.length * 22)}>
              <BarChart data={lowTurnout} layout="vertical" margin={{ top: 10, right: 60, left: 130, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="areaName" tick={{ fill: '#e8eaed', fontSize: 10 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="turnoutPercent" barSize={14} radius={[0, 4, 4, 0]}>
                  {lowTurnout.map((entry, i) => (
                    <Cell key={i} fill={entry.turnoutPercent < avgTurnout - 10 ? '#42b8ff' : '#5ba3e6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'scatter' && (
        <div className="chart-container" style={{ minHeight: 500, marginTop: 16 }}>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis type="number" dataKey="eligibleVoters" tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'ผู้มีสิทธิ (คน)', position: 'bottom', fill: '#9aa0a6', offset: 0 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis type="number" dataKey="turnoutPercent" tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: '% ใช้สิทธิ', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }} />
              <ZAxis range={[30, 30]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="เขตเลือกตั้ง" data={data} fill="#ff8a4d" opacity={0.6}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={Math.abs(entry.deviation) > 10 ? '#f44853' : '#555555'} fillOpacity={Math.abs(entry.deviation) > 10 ? 0.8 : 0.4} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="province-table-container" style={{ marginTop: 24, maxHeight: 500, overflowY: 'auto' }}>
        <table className="province-table">
          <thead><tr><th>อันดับ</th><th>เขต</th><th>จังหวัด</th><th>ผู้มีสิทธิ</th><th>% Turnout</th><th>ส่วนเบี่ยงเบน</th><th>พรรคผู้ชนะ</th></tr></thead>
          <tbody>
            {highTurnout.map((row, i) => (
              <tr key={row.areaCode}>
                <td style={{ fontWeight: 700, color: '#ff8a4d' }}>#{i + 1}</td>
                <td>{row.areaName}</td>
                <td style={{ color: '#9aa0a6' }}>{row.province}</td>
                <td>{row.eligibleVoters.toLocaleString()}</td>
                <td style={{ fontWeight: 700, color: row.turnoutPercent > avgTurnout + 10 ? '#f44853' : '#e8eaed' }}>{row.turnoutPercent.toFixed(1)}%</td>
                <td style={{ color: row.deviation > 0 ? '#f44853' : '#42b8ff' }}>{row.deviation > 0 ? '+' : ''}{row.deviation.toFixed(1)}%</td>
                <td style={{ color: row.winnerPartyColor }}>{row.winnerParty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
