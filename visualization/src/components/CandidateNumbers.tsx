'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Hash } from 'lucide-react'
import type { CandidateNumberItem } from '../types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill?: string; payload?: Record<string, unknown> }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null
  return (
    <div className="custom-tooltip">
      <div className="label">เบอร์ {label}</div>
      {payload.map((p, i) => (
        <div key={i} className="item" style={{ color: p.fill }}>
          {p.name}: {p.value} เขต
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: CandidateNumberItem[]
}

export default function CandidateNumbers({ data }: Props) {
  const parties = [
    { code: 'PARTY-0046', name: 'ประชาชน' },
    { code: 'PARTY-0037', name: 'ภูมิใจไทย' },
    { code: 'PARTY-0027', name: 'ประชาธิปัตย์' },
    { code: 'PARTY-0009', name: 'เพื่อไทย' },
    { code: 'PARTY-0042', name: 'กล้าธรรม' },
  ]
  const [selectedParty, setSelectedParty] = useState('PARTY-0046')

  const chartData = useMemo(() => {
    const filtered = data.filter(d => d.partyCode === selectedParty)
    const maxNum = Math.max(...filtered.map(d => d.number), 20)
    const result = []
    for (let i = 1; i <= maxNum; i++) {
      const wins = filtered.filter(d => d.number === i && d.won).length
      const losses = filtered.filter(d => d.number === i && !d.won).length
      result.push({ number: i, ชนะ: wins, ไม่ชนะ: losses, total: wins + losses })
    }
    return result.filter(d => d.total > 0)
  }, [data, selectedParty])

  const partyColor = useMemo(() => {
    const item = data.find(d => d.partyCode === selectedParty)
    return item?.partyColor || '#ff8a4d'
  }, [data, selectedParty])

  const stats = useMemo(() => {
    const filtered = data.filter(d => d.partyCode === selectedParty)
    const totalWins = filtered.filter(d => d.won).length
    const totalContests = filtered.length
    const avgVotes = totalContests > 0
      ? Math.round(filtered.reduce((s, d) => s + d.voteTotal, 0) / totalContests)
      : 0
    return { totalWins, totalContests, avgVotes, winRate: totalContests > 0 ? ((totalWins / totalContests) * 100).toFixed(1) : '0' }
  }, [data, selectedParty])

  return (
    <div className="section">
      <div className="section-title">
        <Hash size={20} />
        ความถี่ของหมายเลขผู้สมัคร ส.ส. เขต
      </div>
      <div className="section-desc">
        แสดงว่าผู้สมัครของแต่ละพรรคจับฉลากได้เบอร์อะไรบ้างใน 400 เขต และเบอร์ไหนที่ชนะบ่อย
        — สังเกตเบอร์ 1-5 ว่ามี win rate สูงผิดปกติหรือไม่
      </div>

      <div className="tabs">
        {parties.map(p => (
          <button key={p.code} className={`tab ${selectedParty === p.code ? 'active' : ''}`} onClick={() => setSelectedParty(p.code)}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="summary-grid" style={{ marginBottom: 20 }}>
        <div className="summary-card">
          <div className="value" style={{ fontSize: '1.8rem', color: partyColor }}>{stats.totalWins}</div>
          <div className="label">เขตที่ชนะ</div>
        </div>
        <div className="summary-card">
          <div className="value" style={{ fontSize: '1.8rem' }}>{stats.totalContests}</div>
          <div className="label">จำนวนผู้สมัคร (เขต)</div>
        </div>
        <div className="summary-card">
          <div className="value" style={{ fontSize: '1.8rem', color: partyColor }}>{stats.winRate}%</div>
          <div className="label">Win Rate</div>
        </div>
        <div className="summary-card">
          <div className="value" style={{ fontSize: '1.8rem' }}>{stats.avgVotes.toLocaleString()}</div>
          <div className="label">คะแนนเฉลี่ย</div>
        </div>
      </div>

      <div className="chart-container" style={{ minHeight: 420 }}>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'หมายเลขผู้สมัคร', position: 'bottom', fill: '#9aa0a6', offset: -5 }} />
            <YAxis tick={{ fill: '#9aa0a6', fontSize: 12 }} label={{ value: 'จำนวนเขต', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{value}</span>} />
            <Bar dataKey="ชนะ" stackId="a" fill={partyColor} />
            <Bar dataKey="ไม่ชนะ" stackId="a" fill="#444444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
