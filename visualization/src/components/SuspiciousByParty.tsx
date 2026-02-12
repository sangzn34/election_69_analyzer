'use client'

import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { PieChart as PieChartIcon, CircleDot } from 'lucide-react'
import type { SuspiciousByPartyItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

const RADIAN = Math.PI / 180

const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}) => {
  const radius = outerRadius + 24
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.03) return null
  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="custom-tooltip">
      <div className="label">{d.name}</div>
      <div className="item">{d.value} เขต</div>
    </div>
  )
}

interface Props {
  data: SuspiciousByPartyItem[]
  nameToCodeMap: NameToCodeMap
}

export default function SuspiciousByParty({ data, nameToCodeMap }: Props) {
  const parties = data
    .filter(p => p.total >= 5)
    .sort((a, b) => b.total - a.total)

  return (
    <div className="section">
      <div className="section-title">
        <PieChartIcon size={20} />
        สัดส่วนเขตน่าสงสัย แยกตามพรรค ส.ส. ผู้ชนะ
      </div>
      <div className="section-desc">
        วิเคราะห์ว่าในจำนวนเขตที่แต่ละพรรคชนะ มีกี่เปอร์เซ็นต์ที่เข้าข่ายทฤษฎีการซื้อเสียง
      </div>

      <div className="pie-grid">
        {parties.map(party => {
          const pieData = [
            { name: 'น่าสงสัย', value: party.suspicious },
            { name: 'ปกติ', value: party.total - party.suspicious },
          ]
          const colors = [party.color, '#3a3f55']

          return (
            <div key={party.partyName} className="pie-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <PartyLogo partyName={party.partyName} nameToCodeMap={nameToCodeMap} size={36} />
                <h4 style={{ color: party.color, fontSize: '1.15rem' }}>{party.partyName}</h4>
              </div>
              <div className="subtitle" style={{ fontSize: '0.9rem', color: '#bfc4cc' }}>ชนะ {party.total} เขต</div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" labelLine={false} label={renderCustomLabel} stroke="none">
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={colors[idx]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ fontSize: '0.95rem', color: '#e8eaed', marginTop: 8, fontWeight: 600 }}>
                <CircleDot size={14} style={{ color: '#f44853', verticalAlign: -2 }} /> น่าสงสัย {party.suspicious} / {party.total} เขต
                <span style={{ color: party.color, marginLeft: 8, fontSize: '1.05rem' }}>
                  ({party.total > 0 ? ((party.suspicious / party.total) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
