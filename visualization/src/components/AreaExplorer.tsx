import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Search, Trophy, Target, AlertTriangle, CircleCheck, Medal, CornerDownRight } from 'lucide-react'
import type { AreaDetail, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

interface Props {
  data: AreaDetail[]
  nameToCodeMap: NameToCodeMap
}

export default function AreaExplorer({ data, nameToCodeMap }: Props) {
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)

  const filteredAreas = useMemo(() => {
    if (!search) return data.slice(0, 20)
    return data.filter(d =>
      d.areaName.includes(search) || d.province.includes(search) || d.areaCode.includes(search)
    ).slice(0, 30)
  }, [data, search])

  const selectedDetail = useMemo(() => {
    if (!selectedArea) return null
    return data.find(d => d.areaCode === selectedArea) ?? null
  }, [data, selectedArea])

  const chartData = useMemo(() => {
    if (!selectedDetail) return []
    return selectedDetail.combined
      .filter(c => (c.mp || c.pl))
      .map(c => ({
        num: `เบอร์ ${c.num}`,
        number: c.num,
        'คะแนน ส.ส. เขต': c.mp?.voteTotal || 0,
        'คะแนน บัญชีรายชื่อ': c.pl?.voteTotal || 0,
        mpParty: c.mp?.partyName || '-',
        plParty: c.pl?.partyName || '-',
        mpRank: c.mp?.rank || '-',
        plRank: c.pl?.rank || '-',
        isWinner: c.num === selectedDetail.winnerNum,
        isTarget: c.num === selectedDetail.targetPartyNum,
      }))
      .filter(c => c['คะแนน ส.ส. เขต'] > 0 || c['คะแนน บัญชีรายชื่อ'] > 100)
      .slice(0, 25)
  }, [selectedDetail])

  interface ChartTooltipProps {
    active?: boolean
    payload?: Array<{ payload: (typeof chartData)[number] }>
    label?: string
  }

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (!active || !payload) return null
    const d = payload[0]?.payload
    return (
      <div className="custom-tooltip">
        <div className="label">{label}</div>
        <div className="item">ส.ส. เขต: {d?.mpParty} (อันดับ {d?.mpRank}) — {d?.['คะแนน ส.ส. เขต']?.toLocaleString()} คะแนน</div>
        <div className="item">บัญชีรายชื่อ: {d?.plParty} (อันดับ {d?.plRank}) — {d?.['คะแนน บัญชีรายชื่อ']?.toLocaleString()} คะแนน</div>
        {d?.isWinner && <div className="item" style={{ color: '#5ed88a' }}><Trophy size={12} style={{ verticalAlign: -2 }} /> ส.ส. ผู้ชนะ</div>}
        {d?.isTarget && <div className="item" style={{ color: '#f44853' }}><Target size={12} style={{ verticalAlign: -2 }} /> พรรคส้มหล่น</div>}
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title">
        <Search size={20} />
        เจาะลึกรายเขต: เปรียบเทียบ ส.ส. เขต vs บัญชีรายชื่อ
      </div>
      <div className="section-desc">
        เลือกเขตเพื่อดูการเปรียบเทียบคะแนน ส.ส. เขต กับ คะแนนบัญชีรายชื่อ แบบเบอร์ต่อเบอร์
        — หากเบอร์ของ ส.ส. ผู้ชนะ ตรงกับพรรคส้มหล่น ที่ได้คะแนนสูง นั่นคือจุดน่าสงสัย
      </div>

      <div className="filter-bar">
        <input type="text" className="search-input" placeholder="ค้นหาเขต เช่น กรุงเทพ, 1001, บุรีรัมย์..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 350 }} />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {filteredAreas.map(area => (
          <button key={area.areaCode} onClick={() => setSelectedArea(area.areaCode)} style={{
            padding: '8px 16px', background: selectedArea === area.areaCode ? '#ff8a4d' : '#1a1d27',
            border: `1px solid ${area.isSuspicious ? '#f44853' : '#2d3148'}`, borderRadius: 8,
            color: selectedArea === area.areaCode ? '#fff' : '#e8eaed', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            {area.isSuspicious && <><AlertTriangle size={12} style={{ verticalAlign: -2 }} /> </>}{area.areaName}
          </button>
        ))}
      </div>

      {selectedDetail && (
        <>
          <div style={{ padding: 20, background: '#1a1d27', borderRadius: 12, border: `1px solid ${selectedDetail.isSuspicious ? '#f44853' : '#2d3148'}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <PartyLogo partyName={selectedDetail.winnerPartyName} nameToCodeMap={nameToCodeMap} size={40} />
              <h3 style={{ color: '#e8eaed', fontSize: '1.2rem' }}>{selectedDetail.areaName}</h3>
              {selectedDetail.isSuspicious ? <span className="badge suspicious"><AlertTriangle size={12} style={{ verticalAlign: -2 }} /> น่าสงสัย</span> : <span className="badge normal"><CircleCheck size={12} style={{ verticalAlign: -2 }} /> ปกติ</span>}
            </div>
            <div style={{ color: '#9aa0a6', marginTop: 8, fontSize: '0.9rem' }}>
              ส.ส. ผู้ชนะ: <span style={{ color: selectedDetail.winnerPartyColor, fontWeight: 600 }}>{selectedDetail.winnerPartyName}</span> เบอร์ {selectedDetail.winnerNum}
              {selectedDetail.winnerName && <span style={{ color: '#e8eaed', marginLeft: 8 }}>— {selectedDetail.winnerName}</span>}
              {selectedDetail.winnerIs66Winner && <span style={{ background: '#ff8a4d22', color: '#ff8a4d', padding: '2px 8px', borderRadius: 6, marginLeft: 8, fontSize: '0.8rem' }}><Medal size={12} style={{ verticalAlign: -2 }} /> ส.ส. ปี 66</span>}
              {selectedDetail.winnerSwitchedParty === true && <span style={{ background: '#f4485322', color: '#f44853', padding: '2px 8px', borderRadius: 6, marginLeft: 6, fontSize: '0.8rem' }}><CornerDownRight size={12} style={{ verticalAlign: -2 }} /> ย้ายพรรค</span>}
              {selectedDetail.isSuspicious && selectedDetail.targetPartyNum && <span style={{ color: '#f44853', marginLeft: 16 }}>→ พรรคส้มหล่นเบอร์ {selectedDetail.targetPartyNum} ติด TOP 7 ของ PL</span>}
            </div>
          </div>

          <div className="chart-container" style={{ minHeight: 420 }}>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis dataKey="num" tick={{ fill: '#9aa0a6', fontSize: 10 }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fill: '#9aa0a6', fontSize: 12 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} label={{ value: 'คะแนน', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value: string) => <span style={{ color: '#e8eaed', fontSize: 12 }}>{value}</span>} />
                <Bar dataKey="คะแนน ส.ส. เขต" fill="#5ba3e6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="คะแนน บัญชีรายชื่อ" fill="#ff8a4d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="province-table-container" style={{ marginTop: 16, maxHeight: 400, overflowY: 'auto' }}>
            <table className="province-table">
              <thead>
                <tr><th>เบอร์</th><th>ผู้สมัคร ส.ส. เขต</th><th>พรรค</th><th>คะแนน ส.ส.</th><th>อันดับ</th><th>บัญชีรายชื่อ (พรรค)</th><th>คะแนน PL</th><th>หมายเหตุ</th></tr>
              </thead>
              <tbody>
                {selectedDetail.combined
                  .filter(c => c.mp || c.pl)
                  .filter(c => (c.mp?.voteTotal || 0) > 0 || (c.pl?.voteTotal || 0) > 100)
                  .slice(0, 25)
                  .map(c => {
                    const isWinner = c.num === selectedDetail.winnerNum
                    const isTarget = selectedDetail.isSuspicious && c.num === selectedDetail.targetPartyNum
                    return (
                      <tr key={c.num} style={{ background: isTarget ? 'rgba(244,72,83,0.1)' : isWinner ? 'rgba(94,216,138,0.08)' : 'transparent' }}>
                        <td style={{ fontWeight: 700 }}>{c.num}</td>
                        <td style={{ color: '#e8eaed', fontSize: '0.85rem' }}>
                          {c.mp?.candidateName || '-'}
                          {c.mp?.is66Winner && <span style={{ color: '#ff8a4d', marginLeft: 4, fontSize: '0.75rem' }}><Medal size={10} style={{ verticalAlign: -1 }} />66</span>}
                          {c.mp?.switchedParty === true && <span style={{ color: '#f44853', marginLeft: 4, fontSize: '0.75rem' }}><CornerDownRight size={12} /></span>}
                        </td>
                        <td style={{ color: c.mp?.partyColor || '#666', fontSize: '0.85rem' }}>{c.mp?.partyName || '-'}</td>
                        <td>{c.mp?.voteTotal?.toLocaleString() || '-'}</td>
                        <td>{c.mp?.rank || '-'}</td>
                        <td style={{ color: c.pl?.partyColor || '#666', fontSize: '0.85rem' }}>{c.pl?.partyName || '-'}</td>
                        <td>{c.pl?.voteTotal?.toLocaleString() || '-'}</td>
                        <td>
                          {isWinner && <span style={{ color: '#5ed88a' }}><Trophy size={12} style={{ verticalAlign: -2 }} /> ผู้ชนะ</span>}
                          {isTarget && <span style={{ color: '#f44853', marginLeft: 4 }}><Target size={12} style={{ verticalAlign: -2 }} /> ส้มหล่น</span>}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedDetail && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>เลือกเขตด้านบนเพื่อดูรายละเอียด</div>
      )}
    </div>
  )
}
