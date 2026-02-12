import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { RankDistributionItem } from '../types'

const PARTY_COLORS: Record<number, { name: string; color: string }> = {
  1: { name: 'ไทยทรัพย์ทวี', color: '#e91e63' },
  2: { name: 'เพื่อชาติไทย', color: '#9c27b0' },
  3: { name: 'ใหม่', color: '#2196f3' },
  4: { name: 'มิติใหม่', color: '#00bcd4' },
  5: { name: 'รวมใจไทย', color: '#4caf50' },
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill?: string }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null
  return (
    <div className="custom-tooltip">
      <div className="label">อันดับที่ {label}</div>
      {payload.map((p, i) => (
        <div key={i} className="item" style={{ color: p.fill }}>
          {p.name}: {p.value} เขต
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: RankDistributionItem[]
}

export default function RankDistribution({ data }: Props) {
  const [selectedParty, setSelectedParty] = useState(1)

  const chartData = useMemo(() => {
    const filtered = data.filter(d => d.partyNum === selectedParty)
    const rankCounts: Record<number, { rank: number; suspicious: number; normal: number }> = {}
    filtered.forEach(item => {
      const rank = item.rank
      if (!rankCounts[rank]) rankCounts[rank] = { rank, suspicious: 0, normal: 0 }
      if (item.isSuspicious) {
        rankCounts[rank].suspicious += 1
      } else {
        rankCounts[rank].normal += 1
      }
    })
    const result = []
    for (let i = 1; i <= 50; i++) {
      result.push(rankCounts[i] || { rank: i, suspicious: 0, normal: 0 })
    }
    return result
  }, [data, selectedParty])

  return (
    <div className="section">
      <div className="section-title">
        <TrendingUp size={20} />
        การกระจายตัวของอันดับคะแนนบัญชีรายชื่อ
      </div>
      <div className="section-desc">
        แสดงว่าพรรคเบอร์ 1-5 ได้อันดับที่เท่าไหร่ในแต่ละเขต โดยสีแดงคือเขตที่ ส.ส. ผู้ชนะมีเบอร์ตรงกัน
      </div>

      <div className="tabs">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            className={`tab ${selectedParty === num ? 'active' : ''}`}
            onClick={() => setSelectedParty(num)}
          >
            เบอร์ {num} ({PARTY_COLORS[num].name})
          </button>
        ))}
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="rank" tick={{ fill: '#9aa0a6', fontSize: 10 }} interval={0} label={{ value: 'อันดับในเขต', position: 'bottom', fill: '#9aa0a6', fontSize: 13, offset: -5 }} />
            <YAxis tick={{ fill: '#9aa0a6', fontSize: 12 }} label={{ value: 'จำนวนเขต', angle: -90, position: 'insideLeft', fill: '#9aa0a6', fontSize: 13 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 12 }} formatter={(value) => <span style={{ color: '#e8eaed' }}>{value}</span>} />
            <Bar dataKey="suspicious" name={`ส.ส. ผู้ชนะได้เบอร์ ${selectedParty} (จุดสังเกต)`} stackId="a" fill="#f11824" />
            <Bar dataKey="normal" name={`ส.ส. ผู้ชนะไม่ใช่เบอร์ ${selectedParty}`} stackId="a" fill="#555555" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
