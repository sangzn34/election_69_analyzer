'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Zap } from 'lucide-react'
import type { VoteAnomalyItem } from '../types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: VoteAnomalyItem }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item">ส.ส. ผู้ชนะ: {d.winnerPartyName} (เบอร์ {d.candidateNum})</div>
      <div className="item" style={{ color: '#f44853' }}>
        พรรคส้มหล่น ({d.targetPartyName}): {d.targetPlVotes?.toLocaleString()} คะแนน ({d.targetPlPercent}%)
      </div>
      <div className="item">อันดับ PL: {d.targetPlRank}</div>
      <div className="item">มัธยฐานพรรคเล็ก: {d.medianSmallPartyVotes?.toLocaleString()} คะแนน</div>
      <div className="item" style={{ color: '#ff8a4d', fontWeight: 700 }}>
        ผิดปกติ {d.anomalyRatio}x (มากกว่ามัธยฐาน {d.anomalyRatio} เท่า)
      </div>
    </div>
  )
}

interface Props {
  data: VoteAnomalyItem[]
}

export default function VoteAnomaly({ data }: Props) {
  const [filterParty, setFilterParty] = useState('all')
  const [topN, setTopN] = useState(30)

  const winnerParties = useMemo(() => {
    const map: Record<string, string> = {}
    data.forEach(d => { map[d.winnerPartyName] = d.winnerPartyColor })
    return Object.entries(map).map(([name, color]) => ({ name, color }))
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (filterParty !== 'all') {
      result = result.filter(d => d.winnerPartyName === filterParty)
    }
    return result.slice(0, topN)
  }, [data, filterParty, topN])

  return (
    <div className="section">
      <div className="section-title">
        <Zap size={20} />
        Anomaly Score: เขตที่คะแนนพรรคส้มหล่นสูงผิดปกติ
      </div>
      <div className="section-desc">
        เปรียบเทียบคะแนนของพรรคส้มหล่น กับ มัธยฐาน (median) ของพรรคเล็กอื่นๆ ในเขตนั้น
        — ถ้า anomaly ratio สูง แปลว่าพรรคนั้นได้คะแนนมากกว่าพรรคเล็กทั่วไปหลายเท่า
      </div>

      <div className="filter-bar">
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${filterParty === 'all' ? 'active' : ''}`} onClick={() => setFilterParty('all')}>ทุกพรรค</button>
          {winnerParties.map(wp => (
            <button key={wp.name} className={`tab ${filterParty === wp.name ? 'active' : ''}`} onClick={() => setFilterParty(wp.name)} style={filterParty === wp.name ? { background: wp.color } : {}}>
              {wp.name}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-bar" style={{ marginTop: 8 }}>
        <span style={{ color: '#9aa0a6', fontSize: '0.85rem' }}>แสดง:</span>
        {[20, 30, 50].map(n => (
          <button key={n} className={`tab ${topN === n ? 'active' : ''}`} onClick={() => setTopN(n)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            Top {n}
          </button>
        ))}
      </div>

      <div className="chart-container" style={{ minHeight: 500 }}>
        <ResponsiveContainer width="100%" height={Math.max(500, filtered.length * 26)}>
          <BarChart data={filtered} layout="vertical" margin={{ top: 10, right: 60, left: 160, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'Anomaly Ratio (เท่าของมัธยฐาน)', position: 'bottom', fill: '#9aa0a6', offset: 0 }} />
            <YAxis type="category" dataKey="areaName" tick={{ fill: '#e8eaed', fontSize: 10 }} width={150} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="anomalyRatio" barSize={14} radius={[0, 4, 4, 0]}>
              {filtered.map((entry, index) => (
                <Cell key={index} fill={entry.winnerPartyColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="province-table-container" style={{ marginTop: 24, maxHeight: 500, overflowY: 'auto' }}>
        <table className="province-table">
          <thead>
            <tr>
              <th>อันดับ</th>
              <th>เขต</th>
              <th>ส.ส. ผู้ชนะ</th>
              <th>เบอร์</th>
              <th>พรรคส้มหล่น</th>
              <th>คะแนน PL</th>
              <th>อันดับ PL</th>
              <th>มัธยฐานพรรคเล็ก</th>
              <th>Anomaly</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={row.areaCode}>
                <td style={{ fontWeight: 700, color: '#ff8a4d' }}>#{i + 1}</td>
                <td>{row.areaName}</td>
                <td style={{ color: row.winnerPartyColor }}>{row.winnerPartyName}</td>
                <td>{row.candidateNum}</td>
                <td>{row.targetPartyName}</td>
                <td style={{ fontWeight: 600 }}>{row.targetPlVotes.toLocaleString()}</td>
                <td>{row.targetPlRank}</td>
                <td>{row.medianSmallPartyVotes.toLocaleString()}</td>
                <td style={{ color: row.anomalyRatio >= 10 ? '#f44853' : '#ff8a4d', fontWeight: 700 }}>
                  {row.anomalyRatio}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
