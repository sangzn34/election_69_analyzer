import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { ProvinceSummaryItem } from '../types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ProvinceSummaryItem }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload) return null
  const d = payload[0]?.payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d?.province}</div>
      <div className="item">เขตทั้งหมด: {d?.totalAreas}</div>
      <div className="item" style={{ color: '#f11824' }}>น่าสงสัย: {d?.suspiciousAreas} ({d?.suspiciousPercent}%)</div>
    </div>
  )
}

interface Props {
  data: ProvinceSummaryItem[]
}

export default function ProvinceBreakdown({ data }: Props) {
  const [sortBy, setSortBy] = useState<'suspicious' | 'percent' | 'name'>('suspicious')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = data.filter(d => d.suspiciousAreas > 0)
    if (search) result = result.filter(d => d.province.includes(search))
    if (sortBy === 'suspicious') result.sort((a, b) => b.suspiciousAreas - a.suspiciousAreas)
    else if (sortBy === 'percent') result.sort((a, b) => b.suspiciousPercent - a.suspiciousPercent)
    else result.sort((a, b) => a.province.localeCompare(b.province, 'th'))
    return result
  }, [data, sortBy, search])

  const chartData = useMemo(() => filtered.slice(0, 20), [filtered])

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🗺️</span>
        จังหวัดที่พบเขตน่าสงสัย
      </div>
      <div className="section-desc">แสดงจำนวนเขตที่น่าสงสัยในแต่ละจังหวัด (แสดง Top 20)</div>

      <div className="filter-bar">
        <input type="text" className="search-input" placeholder="🔍 ค้นหาจังหวัด..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${sortBy === 'suspicious' ? 'active' : ''}`} onClick={() => setSortBy('suspicious')}>เรียงตามจำนวน</button>
          <button className={`tab ${sortBy === 'percent' ? 'active' : ''}`} onClick={() => setSortBy('percent')}>เรียงตาม %</button>
          <button className={`tab ${sortBy === 'name' ? 'active' : ''}`} onClick={() => setSortBy('name')}>เรียงตามชื่อ</button>
        </div>
      </div>

      <div className="chart-container" style={{ minHeight: 500 }}>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 12 }} />
            <YAxis type="category" dataKey="province" tick={{ fill: '#e8eaed', fontSize: 11 }} width={90} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="suspiciousAreas" fill="#f11824" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="province-table-container" style={{ marginTop: 24, maxHeight: 400, overflowY: 'auto' }}>
        <table className="province-table">
          <thead>
            <tr><th>จังหวัด</th><th>เขตทั้งหมด</th><th>เขตน่าสงสัย</th><th>เปอร์เซ็นต์</th><th>สัดส่วน</th></tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.province}>
                <td>{row.province}</td>
                <td>{row.totalAreas}</td>
                <td style={{ color: '#f11824', fontWeight: 600 }}>{row.suspiciousAreas}</td>
                <td>{row.suspiciousPercent}%</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${row.suspiciousPercent}%`, background: row.suspiciousPercent >= 75 ? '#f11824' : row.suspiciousPercent >= 50 ? '#ff9800' : '#4ec86f' }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
