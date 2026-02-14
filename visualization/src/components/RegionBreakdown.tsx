'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Globe } from 'lucide-react'
import type { RegionSummaryItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'
import AnalysisSummary from './AnalysisSummary'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { region: string; total: number; suspicious: number; suspiciousPercent: number } }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload) return null
  const d = payload[0]?.payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d?.region}</div>
      <div className="item">เขตทั้งหมด: {d?.total}</div>
      <div className="item" style={{ color: '#f44853' }}>น่าสงสัย: {d?.suspicious} ({d?.suspiciousPercent}%)</div>
    </div>
  )
}

interface Props {
  data: RegionSummaryItem[]
  nameToCodeMap: NameToCodeMap
}

export default function RegionBreakdown({ data, nameToCodeMap }: Props) {
  const [viewMode, setViewMode] = useState<'overview' | 'party'>('overview')

  const overviewData = useMemo(() =>
    data.map(d => ({
      region: d.region,
      total: d.total,
      suspicious: d.suspicious,
      normal: d.total - d.suspicious,
      suspiciousPercent: d.suspiciousPercent,
    })).sort((a, b) => b.suspicious - a.suspicious)
  , [data])

  const partyData = useMemo(() => {
    const allParties = new Set<string>()
    const allColors: Record<string, string> = {}
    data.forEach(d => d.parties.forEach(p => {
      allParties.add(p.partyName)
      allColors[p.partyName] = p.color
    }))
    return {
      chartData: data.map(d => {
        const row: Record<string, string | number> = { region: d.region }
        d.parties.forEach(p => { row[p.partyName] = p.suspicious })
        return row
      }).sort((a, b) => {
        const sumA = Object.values(a).filter((v): v is number => typeof v === 'number').reduce((s, v) => s + v, 0)
        const sumB = Object.values(b).filter((v): v is number => typeof v === 'number').reduce((s, v) => s + v, 0)
        return sumB - sumA
      }),
      parties: [...allParties].map(name => ({ name, color: allColors[name] })),
    }
  }, [data])

  return (
    <div className="section">
      <div className="section-title">
        <Globe size={20} />
        วิเคราะห์แยกตามภูมิภาค
      </div>
      <div className="section-desc">แสดงจำนวนเขตน่าสงสัยในแต่ละภูมิภาค พร้อมแยกตามพรรคที่ชนะ</div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${viewMode === 'overview' ? 'active' : ''}`} onClick={() => setViewMode('overview')}>ภาพรวมภูมิภาค</button>
        <button className={`tab ${viewMode === 'party' ? 'active' : ''}`} onClick={() => setViewMode('party')}>แยกตามพรรค (เขตน่าสงสัย)</button>
      </div>

      {viewMode === 'overview' && (
        <div className="chart-container" style={{ minHeight: 400 }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={overviewData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis dataKey="region" tick={{ fill: '#e8eaed', fontSize: 13 }} />
              <YAxis tick={{ fill: '#9aa0a6', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{value}</span>} />
              <Bar dataKey="suspicious" name="น่าสงสัย" stackId="a" fill="#f44853" />
              <Bar dataKey="normal" name="ปกติ" stackId="a" fill="#3a3f55" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {viewMode === 'party' && (
        <div className="chart-container" style={{ minHeight: 400 }}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={partyData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis dataKey="region" tick={{ fill: '#e8eaed', fontSize: 13 }} />
              <YAxis tick={{ fill: '#9aa0a6', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e2130', border: '1px solid #2d3148', borderRadius: 8 }} wrapperStyle={{ outline: 'none' }} labelStyle={{ color: '#e8eaed', fontWeight: 600 }} itemStyle={{ color: '#9aa0a6', fontSize: 12 }} />
              <Legend formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 11 }}>{value}</span>} />
              {partyData.parties.map(p => <Bar key={p.name} dataKey={p.name} stackId="a" fill={p.color} />)}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="pie-grid" style={{ marginTop: 24 }}>
        {data.map(d => (
          <div key={d.region} className="pie-card">
            <h4 style={{ color: '#e8eaed', fontSize: '1.1rem' }}>{d.region}</h4>
            <div className="subtitle" style={{ color: '#bfc4cc' }}>{d.total} เขต</div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#f44853', fontWeight: 600 }}>น่าสงสัย {d.suspicious}</span>
                <span style={{ color: '#e8eaed', fontWeight: 700, fontSize: '1.1rem' }}>{d.suspiciousPercent}%</span>
              </div>
              <div className="progress-bar" style={{ width: '100%', height: 10 }}>
                <div className="progress-bar-fill" style={{ width: `${d.suspiciousPercent}%`, background: d.suspiciousPercent >= 75 ? '#f44853' : d.suspiciousPercent >= 50 ? '#ff9800' : '#5ed88a' }} />
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#9aa0a6' }}>
              {d.parties.slice(0, 4).map(p => (
                <div key={p.partyName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <PartyLogo partyName={p.partyName} nameToCodeMap={nameToCodeMap} size={18} />
                    <span style={{ color: p.color }}>● {p.partyName}</span>
                  </div>
                  <span>{p.suspicious}/{p.total}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnalysisSummary
        title="วิเคราะห์ภูมิภาค"
        methodology="จัดกลุ่มเขตเลือกตั้งตาม<strong>ภูมิภาค</strong> แล้วคำนวณสัดส่วน 'เขตน่าสงสัย' ต่อ 'เขตทั้งหมด' ในแต่ละภูมิภาค — progress bar แสดง % เขตน่าสงสัย พร้อมแสดง breakdown พรรคที่ชนะในเขตน่าสงสัยของแต่ละภาค"
        findings={[
          `แบ่งเป็น <strong>${data.length}</strong> ภูมิภาค`,
          `ภาคที่มี % เขตน่าสงสัยสูงที่สุด: <strong>${data.sort((a, b) => b.suspiciousPercent - a.suspiciousPercent)[0]?.region || '-'}</strong> (${data[0]?.suspiciousPercent || 0}%)`,
          `ภาคที่มี % เขตน่าสงสัยต่ำที่สุด: <strong>${data.sort((a, b) => a.suspiciousPercent - b.suspiciousPercent)[0]?.region || '-'}</strong> (${data[0]?.suspiciousPercent || 0}%)`,
        ]}
        interpretation="ภูมิภาคที่มีเขตน่าสงสัยหนาแน่นอาจบ่งชี้<strong>รูปแบบเชิงภูมิศาสตร์</strong>ของความผิดปกติ — เช่น ภาคที่มีเครือข่ายอิทธิพลท้องถิ่นแข็งแกร่ง หรือภาคที่มีรูปแบบการเมืองเฉพาะตัว ควรดูร่วมกับข้อมูลเชิงลึกของแต่ละเขต"
        limitation="การแบ่งภูมิภาคเป็นหน่วยใหญ่ อาจซ่อนความแตกต่างภายในภาค — เช่น ภาคอีสานมีจำนวนเขตมาก สัดส่วนจึงอาจถูกเฉลี่ย นอกจากนี้ boundary ของภูมิภาคอาจไม่ตรงกับ boundary ของอิทธิพลทางการเมือง"
      />
    </div>
  )
}
