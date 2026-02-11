import { useMemo, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend,
} from 'recharts'
import type { ScatterItem } from '../types'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ScatterItem }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item">ส.ส. ผู้ชนะ: {d.winnerPartyName} (เบอร์ {d.candidateNum})</div>
      <div className="item">คะแนน ส.ส.: {d.mpVotes?.toLocaleString()} ({d.mpPercent}%)</div>
      <div className="item" style={{ color: '#f44853' }}>คะแนน PL พรรคส้มหล่น: {d.plVotes?.toLocaleString()} ({d.plPercent}%)</div>
      <div className="item">อันดับ PL: {d.plRank}</div>
    </div>
  )
}

interface Props {
  data: ScatterItem[]
}

export default function ScatterAnalysis({ data }: Props) {
  const [showOnly, setShowOnly] = useState<'all' | 'suspicious' | 'normal'>('all')

  const filtered = useMemo(() => {
    if (showOnly === 'suspicious') return data.filter(d => d.isSuspicious)
    if (showOnly === 'normal') return data.filter(d => !d.isSuspicious)
    return data
  }, [data, showOnly])

  const suspiciousData = useMemo(() => filtered.filter(d => d.isSuspicious), [filtered])
  const normalData = useMemo(() => filtered.filter(d => !d.isSuspicious), [filtered])

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🔬</span>
        Scatter Plot: คะแนน ส.ส. ผู้ชนะ vs คะแนน PL พรรคส้มหล่น
      </div>
      <div className="section-desc">
        แสดงความสัมพันธ์ระหว่างคะแนน ส.ส. เขตผู้ชนะ (แกน X) กับคะแนนบัญชีรายชื่อของพรรคที่มีเบอร์ตรงกัน (แกน Y)
        — หากจุดสีแดง (เขตน่าสงสัย) กระจุกตัวเป็นเส้นตรง แสดงว่ามี correlation สูง
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${showOnly === 'all' ? 'active' : ''}`} onClick={() => setShowOnly('all')}>ทั้งหมด</button>
        <button className={`tab ${showOnly === 'suspicious' ? 'active' : ''}`} onClick={() => setShowOnly('suspicious')}>เขตน่าสงสัย</button>
        <button className={`tab ${showOnly === 'normal' ? 'active' : ''}`} onClick={() => setShowOnly('normal')}>เขตปกติ</button>
      </div>

      <div className="chart-container" style={{ minHeight: 500 }}>
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" dataKey="mpVotes" name="คะแนน ส.ส." tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'คะแนน ส.ส. เขตผู้ชนะ', position: 'bottom', fill: '#9aa0a6', offset: 0 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="number" dataKey="plVotes" name="คะแนน PL" tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'คะแนน PL พรรคส้มหล่น', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <ZAxis range={[40, 40]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{value}</span>} />
            {showOnly !== 'suspicious' && <Scatter name="เขตปกติ" data={normalData} fill="#555555" opacity={0.5} />}
            {showOnly !== 'normal' && <Scatter name="เขตน่าสงสัย" data={suspiciousData} fill="#f44853" opacity={0.8} />}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
