'use client'

import { useMemo, useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend,
} from 'recharts'
import { Microscope } from 'lucide-react'
import type { ScatterItem } from '../types'
import AnalysisSummary from './AnalysisSummary'

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
        <Microscope size={20} />
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
        <ResponsiveContainer width="100%" height={520}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" dataKey="mpVotes" name="คะแนน ส.ส." tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'คะแนน ส.ส. เขตผู้ชนะ', position: 'bottom', fill: '#9aa0a6', offset: -5, fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="number" dataKey="plVotes" name="คะแนน PL" tick={{ fill: '#9aa0a6', fontSize: 11 }} label={{ value: 'คะแนน PL พรรคส้มหล่น', angle: -90, position: 'insideLeft', fill: '#9aa0a6', fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
            <ZAxis range={[40, 40]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{value}</span>} />
            {showOnly !== 'suspicious' && <Scatter name="เขตปกติ" data={normalData} fill="#555555" opacity={0.5} />}
            {showOnly !== 'normal' && <Scatter name="เขตน่าสงสัย" data={suspiciousData} fill="#f44853" opacity={0.8} />}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <AnalysisSummary
        methodology="สร้าง Scatter Plot ระหว่างคะแนน ส.ส.เขตผู้ชนะ (แกน X) กับคะแนนบัญชีรายชื่อ (PL) ของพรรคเบอร์ตรง (แกน Y) — หากมี correlation สูง แสดงว่าคะแนน PL ของพรรคเบอร์ตรงมีความสัมพันธ์กับคะแนน ส.ส. ผู้ชนะอย่างมีนัยสำคัญ"
        findings={[
          `จุดสีแดง (เขตน่าสงสัย) มี <strong>${suspiciousData.length}</strong> เขต จากทั้งหมด <strong>${data.length}</strong> เขต`,
          'ในหลายเขต คะแนน PL ของพรรคเล็กเบอร์ตรง สูงผิดปกติเมื่อเทียบกับคะแนน ส.ส.เขต — บ่งชี้ว่าผู้เลือกตั้งอาจกาเบอร์เดียวกันทั้งสองใบ',
          'หากจุดสีแดงเรียงตัวเป็นเส้นตรง (linear trend) แสดงว่ามี correlation สูงระหว่างคะแนน ส.ส.เขตกับคะแนน PL — ซึ่งไม่ควรเกิดขึ้นหากผู้ลงคะแนนตัดสินใจ ส.ส.เขต กับ PL อิสระต่อกัน',
        ]}
        interpretation="Scatter Plot ช่วยให้เห็นภาพว่าเขตที่ ส.ส.เขตได้คะแนนสูง มักทำให้พรรค PL เบอร์ตรงได้คะแนนสูงตามไปด้วย ซึ่งสอดคล้องกับสมมติฐาน 'กาเบอร์เดียวกันทั้งสองใบ' — ยิ่ง correlation สูงเท่าไร ยิ่งน่าสงสัยว่าผู้เลือกตั้งไม่ได้ตัดสินใจเลือกพรรค PL อย่างอิสระ"
        limitation="Correlation ≠ Causation — ปัจจัยอื่น เช่น ฐานเสียงท้องถิ่น หรือการรณรงค์หาเสียงอาจส่งผลด้วย"
      />
    </div>
  )
}
