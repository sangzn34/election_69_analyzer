import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { TargetPartyCount, PartyMetaMap, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill?: string; color?: string; payload?: { partyName: string } }>
  label?: string
  nameToCodeMap: NameToCodeMap
}

const CustomTooltip = ({ active, payload, label, nameToCodeMap }: CustomTooltipProps) => {
  if (!active || !payload) return null
  const partyName = payload[0]?.payload?.partyName
  return (
    <div className="custom-tooltip">
      <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {partyName && <PartyLogo partyName={partyName} nameToCodeMap={nameToCodeMap} size={22} />}
        {label} — {partyName}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="item" style={{ color: p.fill || p.color }}>
          {p.name}: {p.value} เขต
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: TargetPartyCount[]
  partyMeta: PartyMetaMap
  nameToCodeMap: NameToCodeMap
}

export default function TopBenefitingParties({ data, partyMeta, nameToCodeMap }: Props) {
  const chartData = useMemo(() => {
    const grouped: Record<number, { name: string; partyName: string; total: number; details: Record<string, number> }> = {}
    data.forEach(item => {
      const tp = item.targetPartyNum
      if (!grouped[tp]) {
        grouped[tp] = { name: `เบอร์ ${tp}`, partyName: item.targetPartyName, total: 0, details: {} }
      }
      grouped[tp].total += item.count
      const wpName = item.winnerPartyName
      grouped[tp].details[wpName] = (grouped[tp].details[wpName] || 0) + item.count
    })

    const allWinnerParties = [...new Set(data.map(d => d.winnerPartyName))]

    return Object.values(grouped)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(item => {
        const row: Record<string, string | number> = { name: item.name, partyName: item.partyName }
        allWinnerParties.forEach(wp => { row[wp] = item.details[wp] || 0 })
        return row
      })
  }, [data])

  const winnerParties = useMemo(() => {
    const map: Record<string, string> = {}
    data.forEach(item => { map[item.winnerPartyName] = item.winnerPartyColor })
    return Object.entries(map).map(([name, color]) => ({ name, color }))
  }, [data])

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🎯</span>
        10 อันดับพรรคบัญชีรายชื่อที่ได้รับประโยชน์สูงสุด (พรรคส้มหล่น)
      </div>
      <div className="section-desc">
        แสดงพรรคบัญชีรายชื่อที่เบอร์ตรงกับ ส.ส. เขตผู้ชนะ โดยแยกสีตามพรรคของ ส.ส. ที่ชนะ
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis dataKey="name" tick={{ fill: '#9aa0a6', fontSize: 12 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fill: '#9aa0a6', fontSize: 12 }} label={{ value: 'จำนวนเขต', angle: -90, position: 'insideLeft', fill: '#9aa0a6', fontSize: 13 }} />
            <Tooltip content={<CustomTooltip nameToCodeMap={nameToCodeMap} />} />
            <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12 }} formatter={(value) => <span style={{ color: '#e8eaed' }}>{value}</span>} />
            {winnerParties.map(wp => (
              <Bar key={wp.name} dataKey={wp.name} stackId="a" fill={wp.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
