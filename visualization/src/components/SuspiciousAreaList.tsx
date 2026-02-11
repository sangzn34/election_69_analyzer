import { useState, useMemo } from 'react'
import type { VoteBuyingItem, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

interface Props {
  data: VoteBuyingItem[]
  nameToCodeMap: NameToCodeMap
}

export default function SuspiciousAreaList({ data, nameToCodeMap }: Props) {
  const [search, setSearch] = useState('')
  const [filterParty, setFilterParty] = useState('all')

  const winnerParties = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {}
    data.forEach(d => {
      if (d.isSuspicious) map[d.winnerPartyCode] = { name: d.winnerPartyName, color: d.winnerPartyColor }
    })
    return Object.entries(map)
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [data])

  const filtered = useMemo(() =>
    data
      .filter(d => d.isSuspicious)
      .filter(d => {
        if (search && !d.areaName.includes(search) && !d.province.includes(search)) return false
        if (filterParty !== 'all' && d.winnerPartyCode !== filterParty) return false
        return true
      })
      .sort((a, b) => a.areaName.localeCompare(b.areaName, 'th'))
  , [data, search, filterParty])

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">📋</span>
        รายชื่อเขตที่น่าสงสัย ({filtered.length} เขต)
      </div>
      <div className="section-desc">รายชื่อเขตที่ ส.ส. ผู้ชนะมีเบอร์ตรงกับพรรคบัญชีรายชื่อที่ติด TOP 7 (และไม่ใช่พรรคต้นสังกัด)</div>

      <div className="filter-bar">
        <input type="text" className="search-input" placeholder="🔍 ค้นหาเขตหรือจังหวัด..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${filterParty === 'all' ? 'active' : ''}`} onClick={() => setFilterParty('all')}>ทั้งหมด</button>
          {winnerParties.map(wp => (
            <button key={wp.code} className={`tab ${filterParty === wp.code ? 'active' : ''}`} onClick={() => setFilterParty(wp.code)} style={filterParty === wp.code ? { background: wp.color } : {}}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <PartyLogo partyName={wp.name} nameToCodeMap={nameToCodeMap} size={18} />
                {wp.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="suspicious-list">
        {filtered.map(item => (
          <div key={item.areaCode} className="suspicious-item">
            <PartyLogo partyName={item.winnerPartyName} nameToCodeMap={nameToCodeMap} size={28} />
            <div>
              <div className="area-name">{item.areaName}</div>
              <div className="area-detail">
                ส.ส. เบอร์ {item.candidateNum} ({item.winnerPartyName}) →
                พรรคส้มหล่น: เบอร์ {item.targetPartyNum} ({item.targetPartyName})
                {item.targetPlRank && ` อันดับ ${item.targetPlRank}`}
                {item.targetPlVotes > 0 && ` (${item.targetPlVotes.toLocaleString()} คะแนน)`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>ไม่พบข้อมูลที่ตรงกับเงื่อนไข</div>
      )}
    </div>
  )
}
