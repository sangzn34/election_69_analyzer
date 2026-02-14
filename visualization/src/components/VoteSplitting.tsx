'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { Scissors, CheckCircle, ListFilter, CircleCheck } from 'lucide-react'
import type { VoteSplittingItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'
import AnalysisSummary from './AnalysisSummary'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: VoteSplittingItem }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const diff = Math.abs(d.mpWinnerPercent - d.plWinnerPercent)
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item" style={{ color: d.mpWinnerColor }}>ส.ส. เขต: {d.mpWinnerParty} ({d.mpWinnerPercent.toFixed(1)}%)</div>
      <div className="item" style={{ color: d.plWinnerColor }}>PL อันดับ 1: {d.plWinnerParty} ({d.plWinnerPercent.toFixed(1)}%)</div>
      <div className="item" style={{ fontWeight: 700, color: d.isSplit ? '#f44853' : '#5ed88a' }}>
        {d.isSplit ? `Vote Split! (ต่างกัน ${diff.toFixed(1)}%)` : 'ลงคะแนนพรรคเดียวกัน'}
      </div>
    </div>
  )
}

interface Props {
  data: VoteSplittingItem[]
  nameToCodeMap: NameToCodeMap
}

export default function VoteSplitting({ data, nameToCodeMap }: Props) {
  const [filterMode, setFilterMode] = useState<'all' | 'split' | 'same'>('all')
  const [topN, setTopN] = useState(30)

  const stats = useMemo(() => {
    const splitCount = data.filter(d => d.isSplit).length
    return { total: data.length, split: splitCount, same: data.length - splitCount, splitPct: ((splitCount / data.length) * 100).toFixed(1) }
  }, [data])

  const filtered = useMemo(() => {
    let result = data
    if (filterMode === 'split') result = result.filter(d => d.isSplit)
    else if (filterMode === 'same') result = result.filter(d => !d.isSplit)
    return [...result].sort((a, b) => Math.abs(b.mpWinnerPercent - b.plWinnerPercent) - Math.abs(a.mpWinnerPercent - a.plWinnerPercent)).slice(0, topN)
  }, [data, filterMode, topN])

  // Count split areas by MP winner party
  const partyBreakdown = useMemo(() => {
    const map: Record<string, { party: string; color: string; split: number; total: number }> = {}
    data.forEach(d => {
      if (!map[d.mpWinnerParty]) map[d.mpWinnerParty] = { party: d.mpWinnerParty, color: d.mpWinnerColor, split: 0, total: 0 }
      map[d.mpWinnerParty].total++
      if (d.isSplit) map[d.mpWinnerParty].split++
    })
    return Object.values(map).filter(p => p.total >= 5).sort((a, b) => b.split - a.split)
  }, [data])

  return (
    <div className="section">
      <div className="section-title">
        <Scissors size={20} />
        Vote Splitting: เขตที่คนเลือก ส.ส. กับ บัญชีรายชื่อ คนละพรรค
      </div>
      <div className="section-desc">
        วิเคราะห์เขตที่พรรคผู้ชนะ ส.ส. เขต ≠ พรรคอันดับ 1 บัญชีรายชื่อ
        — แสดงว่าประชาชนเลือก "ตัวบุคคล" แยกจาก "พรรค" ซึ่งอาจเป็นสัญญาณของการตัดสินใจอิสระ หรือ ผลของทฤษฎีซื้อเสียง
      </div>

      <div className="summary-grid" style={{ marginBottom: 20 }}>
        <div className="summary-card">
          <div className="value">{stats.total}</div>
          <div className="label">เขตทั้งหมด</div>
        </div>
        <div className="summary-card">
          <div className="value danger">{stats.split}</div>
          <div className="label"><Scissors size={14} style={{ verticalAlign: -2 }} /> เลือกคนละพรรค</div>
        </div>
        <div className="summary-card">
          <div className="value success">{stats.same}</div>
          <div className="label"><CircleCheck size={14} style={{ verticalAlign: -2 }} /> เลือกพรรคเดียวกัน</div>
        </div>
        <div className="summary-card">
          <div className="value danger">{stats.splitPct}%</div>
          <div className="label">% Vote Splitting</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${filterMode === 'all' ? 'active' : ''}`} onClick={() => setFilterMode('all')}><ListFilter size={14} /> ทั้งหมด</button>
        <button className={`tab ${filterMode === 'split' ? 'active' : ''}`} onClick={() => setFilterMode('split')}><Scissors size={14} /> เลือกคนละพรรค</button>
        <button className={`tab ${filterMode === 'same' ? 'active' : ''}`} onClick={() => setFilterMode('same')}><CheckCircle size={14} /> พรรคเดียวกัน</button>
      </div>

      {/* Party breakdown bar chart */}
      <div className="chart-container" style={{ minHeight: 400 }}>
        <h4 style={{ color: '#e8eaed', marginBottom: 12, textAlign: 'center' }}>จำนวนเขต Vote Split แยกตามพรรค ส.ส. ผู้ชนะ</h4>
        <ResponsiveContainer width="100%" height={partyBreakdown.length * 32 + 60}>
          <BarChart data={partyBreakdown} layout="vertical" margin={{ top: 10, right: 50, left: 120, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 12 }} />
            <YAxis dataKey="party" type="category" tick={{ fill: '#e8eaed', fontSize: 12 }} width={110} />
            <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2d3148', borderRadius: 8 }} wrapperStyle={{ outline: 'none' }} labelStyle={{ color: '#e8eaed', fontWeight: 600 }} itemStyle={{ color: '#9aa0a6' }} />
            <Legend formatter={(v: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{v}</span>} />
            <Bar dataKey="split" name="Vote Split" stackId="a" fill="#f44853" />
            <Bar dataKey="total" name="ทั้งหมด" radius={[0, 4, 4, 0]}>
              {partyBreakdown.map((p, i) => <Cell key={i} fill={p.color} fillOpacity={0.3} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="province-table-container" style={{ marginTop: 24, maxHeight: 500, overflowY: 'auto' }}>
        <table className="province-table">
          <thead><tr><th>#</th><th>เขต</th><th>ส.ส. ผู้ชนะ</th><th>% ส.ส.</th><th>PL อันดับ 1</th><th>% PL</th><th>ผลต่าง</th><th>สถานะ</th></tr></thead>
          <tbody>
            {filtered.map((row, i) => {
              const diff = Math.abs(row.mpWinnerPercent - row.plWinnerPercent)
              return (
                <tr key={row.areaCode} style={{ background: row.isSplit ? 'rgba(244,72,83,0.05)' : 'transparent' }}>
                  <td style={{ fontWeight: 700, color: '#ff8a4d' }}>#{i + 1}</td>
                  <td>{row.areaName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PartyLogo partyName={row.mpWinnerParty} nameToCodeMap={nameToCodeMap} size={20} />
                      <span style={{ color: row.mpWinnerColor }}>{row.mpWinnerParty}</span>
                    </div>
                  </td>
                  <td>{row.mpWinnerPercent.toFixed(1)}%</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PartyLogo partyName={row.plWinnerParty} nameToCodeMap={nameToCodeMap} size={20} />
                      <span style={{ color: row.plWinnerColor }}>{row.plWinnerParty}</span>
                    </div>
                  </td>
                  <td>{row.plWinnerPercent.toFixed(1)}%</td>
                  <td style={{ fontWeight: 700, color: diff > 20 ? '#f44853' : '#ff8a4d' }}>{diff.toFixed(1)}%</td>
                  <td>{row.isSplit ? <span style={{ color: '#f44853' }}><Scissors size={12} style={{ verticalAlign: -2 }} /> Split</span> : <span style={{ color: '#5ed88a' }}><CircleCheck size={12} style={{ verticalAlign: -2 }} /></span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AnalysisSummary
        title="วิเคราะห์ Vote Splitting"
        methodology="เปรียบเทียบ<strong>พรรคของ ส.ส. ผู้ชนะ (MP)</strong> กับ <strong>พรรคอันดับ 1 บัญชีรายชื่อ (PL)</strong> ในแต่ละเขต — ถ้าไม่ใช่พรรคเดียวกันแสดงว่าเกิด 'Vote Splitting' คือประชาชนเลือกตัวบุคคลแยกจากพรรค ข้อมูลนี้แยกตามพรรค ส.ส. ผู้ชนะเพื่อดูว่าพรรคไหนมีเขต split มากที่สุด"
        findings={[
          `จาก <strong>${stats.total}</strong> เขต มี Vote Splitting <strong>${stats.split}</strong> เขต (<strong>${stats.splitPct}%</strong>)`,
          `เขตที่ไม่มี split (เลือกพรรคเดียวกัน): <strong>${stats.same}</strong> เขต`,
          `พรรคที่มี split มากที่สุด: <strong>${partyBreakdown[0]?.party || '-'}</strong> (${partyBreakdown[0]?.split || 0} เขต จาก ${partyBreakdown[0]?.total || 0} เขต)`,
          `Vote Splitting สูงบ่งชี้ว่าผู้ลงคะแนนตัดสินใจเลือก<strong>ตัวบุคคล</strong>แยกจาก<strong>นโยบายพรรค</strong>`,
        ]}
        interpretation="Vote Splitting ในระดับสูงอาจบ่งชี้: (1) ผู้สมัคร ส.ส. มี<strong>ฐานเสียงส่วนตัว</strong>ที่แข็งแกร่ง, (2) มี<strong>การซื้อเสียง</strong>เฉพาะบัตร ส.ส. แต่ผู้ลงคะแนนเลือกพรรคที่ชอบจริงในบัตร PL, หรือ (3) ผู้สมัครของพรรคอื่นใน ส.ส. เขตมี<strong>ชื่อเสียง/ผลงาน</strong>ที่ดีกว่าพรรคตัวเอง — พรรคที่มี split สูง ควรตั้งคำถามว่าชัยชนะมาจากตัวบุคคลหรือจากพรรค"
        limitation="การวิเคราะห์ใช้เฉพาะอันดับ 1 ของแต่ละระบบ ไม่ได้ดูสัดส่วนคะแนนทั้งหมด — บางเขตอาจมี margin ที่แคบมากจนการ split ไม่มีนัยสำคัญทางสถิติ"
      />
    </div>
  )
}
