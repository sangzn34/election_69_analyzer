'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Flame, Mountain, Flag, Trophy, Medal } from 'lucide-react'
import type { WinningMarginItem } from '../types'
import AnalysisSummary from './AnalysisSummary'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: WinningMarginItem }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item" style={{ color: d.winnerPartyColor }}><Trophy size={14} style={{ verticalAlign: -2 }} /> {d.winnerParty}: {d.winnerVotes.toLocaleString()} คะแนน</div>
      <div className="item"><Medal size={14} style={{ verticalAlign: -2 }} /> {d.runnerUpParty}: {d.runnerUpVotes.toLocaleString()} คะแนน</div>
      <div className="item" style={{ fontWeight: 700, color: d.marginPercent < 5 ? '#f44853' : '#5ed88a' }}>
        ห่างกัน: {d.margin.toLocaleString()} คะแนน ({d.marginPercent.toFixed(1)}%)
      </div>
    </div>
  )
}

interface Props {
  data: WinningMarginItem[]
}

export default function WinningMargin({ data }: Props) {
  const [viewMode, setViewMode] = useState<'close' | 'landslide'>('close')
  const [topN, setTopN] = useState(30)

  const closeRaces = useMemo(() =>
    [...data].sort((a, b) => a.marginPercent - b.marginPercent).slice(0, topN)
  , [data, topN])

  const landslides = useMemo(() =>
    [...data].sort((a, b) => b.marginPercent - a.marginPercent).slice(0, topN)
  , [data, topN])

  const stats = useMemo(() => {
    const under5 = data.filter(d => d.marginPercent < 5).length
    const under10 = data.filter(d => d.marginPercent < 10).length
    const over50 = data.filter(d => d.marginPercent > 50).length
    const avgMargin = data.reduce((s, d) => s + d.marginPercent, 0) / data.length
    return { under5, under10, over50, avgMargin }
  }, [data])

  const displayData = viewMode === 'close' ? closeRaces : landslides

  return (
    <div className="section">
      <div className="section-title">
        <Flag size={20} />
        Winning Margin: เขตที่สูสีที่สุด vs ชนะขาดลอย
      </div>
      <div className="section-desc">
        วิเคราะห์ส่วนต่างระหว่างอันดับ 1 กับอันดับ 2 ในแต่ละเขต — เขตที่สูสีมากอาจชี้ว่าทุกคะแนนมีผล
        ส่วนเขตที่ชนะขาดลอยอาจเป็นฐานเสียงที่มั่นคง
      </div>

      <div className="summary-grid" style={{ marginBottom: 20 }}>
        <div className="summary-card">
          <div className="value danger">{stats.under5}</div>
          <div className="label">ห่าง {"<"} 5% (สูสีมาก)</div>
        </div>
        <div className="summary-card">
          <div className="value" style={{ color: '#ff8a4d' }}>{stats.under10}</div>
          <div className="label">ห่าง {"<"} 10%</div>
        </div>
        <div className="summary-card">
          <div className="value success">{stats.over50}</div>
          <div className="label">ห่าง {">"} 50% (ขาดลอย)</div>
        </div>
        <div className="summary-card">
          <div className="value">{stats.avgMargin.toFixed(1)}%</div>
          <div className="label">Margin เฉลี่ย</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${viewMode === 'close' ? 'active' : ''}`} onClick={() => setViewMode('close')}><Flame size={14} /> สูสีที่สุด</button>
        <button className={`tab ${viewMode === 'landslide' ? 'active' : ''}`} onClick={() => setViewMode('landslide')}><Mountain size={14} /> ชนะขาดลอย</button>
      </div>

      <div className="filter-bar" style={{ marginTop: 8 }}>
        <span style={{ color: '#9aa0a6', fontSize: '0.85rem' }}>แสดง:</span>
        {[20, 30, 50].map(n => (
          <button key={n} className={`tab ${topN === n ? 'active' : ''}`} onClick={() => setTopN(n)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Top {n}</button>
        ))}
      </div>

      <div className="chart-container" style={{ minHeight: 500, marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={Math.max(500, displayData.length * 24)}>
          <BarChart data={displayData} layout="vertical" margin={{ top: 10, right: 60, left: 160, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <YAxis type="category" dataKey="areaName" tick={{ fill: '#e8eaed', fontSize: 10 }} width={150} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="marginPercent" barSize={14} radius={[0, 4, 4, 0]}>
              {displayData.map((entry, i) => (
                <Cell key={i} fill={viewMode === 'close'
                  ? (entry.marginPercent < 2 ? '#f44853' : entry.marginPercent < 5 ? '#ff8a4d' : '#e0c232')
                  : entry.winnerPartyColor
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="province-table-container" style={{ marginTop: 24, maxHeight: 500, overflowY: 'auto' }}>
        <table className="province-table">
          <thead><tr><th>#</th><th>เขต</th><th>จังหวัด</th><th>อันดับ 1</th><th>คะแนน</th><th>อันดับ 2</th><th>คะแนน</th><th>ส่วนต่าง</th><th>% Margin</th></tr></thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={row.areaCode}>
                <td style={{ fontWeight: 700, color: '#ff8a4d' }}>#{i + 1}</td>
                <td>{row.areaName}</td>
                <td style={{ color: '#9aa0a6' }}>{row.province}</td>
                <td style={{ color: row.winnerPartyColor, fontWeight: 600 }}>{row.winnerParty}</td>
                <td>{row.winnerVotes.toLocaleString()}</td>
                <td style={{ color: '#9aa0a6' }}>{row.runnerUpParty}</td>
                <td>{row.runnerUpVotes.toLocaleString()}</td>
                <td style={{ fontWeight: 700 }}>{row.margin.toLocaleString()}</td>
                <td style={{ fontWeight: 700, color: row.marginPercent < 5 ? '#f44853' : row.marginPercent > 50 ? '#5ed88a' : '#e8eaed' }}>{row.marginPercent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnalysisSummary
        title="วิเคราะห์ Winning Margin"
        methodology="คำนวณ<strong>ส่วนต่างคะแนน (margin)</strong> ระหว่างผู้สมัครอันดับ 1 กับอันดับ 2 ในแต่ละเขต ทั้งจำนวนคะแนนและ % — เขตที่ margin ต่ำ (<5%) ถือว่าสูสีมาก ส่วนเขตที่ margin สูง (>50%) ถือว่าชนะขาดลอย"
        findings={[
          `จากทั้งหมด <strong>${data.length}</strong> เขต Margin เฉลี่ย = <strong>${stats.avgMargin.toFixed(1)}%</strong>`,
          `เขตสูสีมาก (margin <5%): <strong>${stats.under5}</strong> เขต — ทุกคะแนนมีผลต่อชัยชนะ`,
          `เขตสูสี (margin <10%): <strong>${stats.under10}</strong> เขต`,
          `เขตชนะขาดลอย (margin >50%): <strong>${stats.over50}</strong> เขต — เป็นฐานเสียงที่มั่นคง`,
        ]}
        interpretation="เขตที่สูสีมากเป็น <strong>swing areas</strong> ที่การซื้อเสียงแม้เพียงเล็กน้อยก็อาจ<strong>พลิกผล</strong>ได้ — ควรจับตาเป็นพิเศษ ส่วนเขตที่ชนะขาดลอย มักเป็น<strong>ฐานที่มั่น</strong>ของพรรค หรืออาจเป็นเขตที่มี<strong>อิทธิพลท้องถิ่น</strong>สูงจนคู่แข่งไม่สามารถแข่งขันได้"
        limitation="Margin เป็นตัวชี้วัดความ competitive ของเขต ไม่ได้บ่งชี้ว่ามีการทุจริตโดยตรง — เขตที่สูสีอาจสูสีเพราะ<strong>การแข่งขันที่เป็นธรรม</strong>ก็ได้ และเขตที่ชนะขาดลอยอาจมาจาก<strong>ฐานเสียงแท้จริง</strong>ของพรรค"
      />
    </div>
  )
}
