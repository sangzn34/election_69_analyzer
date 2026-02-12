import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Treemap,
} from 'recharts'
import {
  ArrowRightLeft, Search, CornerDownRight, Trophy, UserCheck, UserPlus,
  ArrowRight, Filter, SortAsc, SortDesc, ChevronDown,
} from 'lucide-react'
import type { WinnerRetentionItem, AreaDetail, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ────────────────── Derived type for display ────────────────── */
interface SwitchedMP {
  areaCode: string
  areaName: string
  province: string
  winnerName: string
  fromParty: string
  toParty: string
  toPartyColor: string
  status: string       // ย้ายพรรค+ชนะ | หน้าใหม่ชนะ
  is66Winner: boolean
  votes: number
  votePercent: number
}

interface Props {
  winnerRetention: WinnerRetentionItem[]
  areaDetails: AreaDetail[]
  nameToCodeMap: NameToCodeMap
}

/* ────────────────── Color helpers ────────────────── */
const PARTY_COLORS: Record<string, string> = {}
function getPartyColor(name: string, fallback: string) {
  return PARTY_COLORS[name] || fallback
}

/* ────────────────── Treemap custom content ────────────────── */
interface TreemapContentProps {
  x: number; y: number; width: number; height: number
  name: string; value: number; color: string
}
function TreemapContent({ x, y, width, height, name, value, color }: TreemapContentProps) {
  if (width < 40 || height < 30) return null
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.85} rx={4} stroke="#1a1a2e" strokeWidth={2} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={width < 80 ? 10 : 12} fontWeight={700}>
        {name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#ffffffcc" fontSize={10}>
        {value} คน
      </text>
    </g>
  )
}

/* ════════════════════════════════════════════════════════════════ */
export default function PartySwitcherDetail({ winnerRetention, areaDetails, nameToCodeMap }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPartyTo, setFilterPartyTo] = useState<string>('all')
  const [filterPartyFrom, setFilterPartyFrom] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortKey, setSortKey] = useState<'areaCode' | 'votes' | 'votePercent' | 'province'>('votes')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  /* ── Build enriched data ── */
  const areaMap = useMemo(() => {
    const m: Record<string, AreaDetail> = {}
    for (const a of areaDetails) m[a.areaCode] = a
    return m
  }, [areaDetails])

  const switchedMPs: SwitchedMP[] = useMemo(() => {
    return winnerRetention
      .filter(w => w.switchedParty === true)
      .map(w => {
        const area = areaMap[w.areaCode]
        let votes = 0
        let votePercent = 0
        if (area) {
          const winnerCand = area.combined.find(c => c.num === area.winnerNum)
          if (winnerCand?.mp) {
            votes = winnerCand.mp.voteTotal
            votePercent = winnerCand.mp.votePercent
          }
          // cache color
          if (w.partyName && w.partyColor) PARTY_COLORS[w.partyName] = w.partyColor
        }
        return {
          areaCode: w.areaCode,
          areaName: w.areaName,
          province: area?.province || w.areaName.split(' ')[0],
          winnerName: w.winnerName,
          fromParty: w.party66Ref || '(ไม่ทราบ)',
          toParty: w.partyName,
          toPartyColor: w.partyColor,
          status: w.status,
          is66Winner: w.is66Winner === true,
          votes,
          votePercent,
        }
      })
  }, [winnerRetention, areaMap])

  /* ── Stats ── */
  const stats = useMemo(() => {
    const total = switchedMPs.length
    const incumbent = switchedMPs.filter(m => m.is66Winner).length
    const newFace = total - incumbent
    const byDest: Record<string, { count: number; color: string }> = {}
    const bySrc: Record<string, number> = {}
    const byProvince: Record<string, number> = {}

    for (const m of switchedMPs) {
      byDest[m.toParty] = { count: (byDest[m.toParty]?.count || 0) + 1, color: m.toPartyColor }
      bySrc[m.fromParty] = (bySrc[m.fromParty] || 0) + 1
      byProvince[m.province] = (byProvince[m.province] || 0) + 1
    }

    return { total, incumbent, newFace, byDest, bySrc, byProvince }
  }, [switchedMPs])

  /* ── Chart data ── */
  const destChartData = useMemo(() =>
    Object.entries(stats.byDest)
      .map(([party, { count, color }]) => ({ party, count, color }))
      .sort((a, b) => b.count - a.count)
  , [stats.byDest])

  const srcChartData = useMemo(() =>
    Object.entries(stats.bySrc)
      .map(([party, count]) => ({ party, count }))
      .sort((a, b) => b.count - a.count)
  , [stats.bySrc])

  const flowData = useMemo(() => {
    const map: Record<string, { from: string; to: string; count: number; toColor: string }> = {}
    for (const m of switchedMPs) {
      const key = `${m.fromParty}→${m.toParty}`
      if (!map[key]) map[key] = { from: m.fromParty, to: m.toParty, count: 0, toColor: m.toPartyColor }
      map[key].count++
    }
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [switchedMPs])

  const treemapData = useMemo(() =>
    Object.entries(stats.byProvince)
      .map(([name, value]) => ({ name, value, color: '#42b8ff' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30)
  , [stats.byProvince])

  const pieData = useMemo(() => [
    { name: 'ส.ส. เดิม (66) ย้ายพรรค', value: stats.incumbent, color: '#ffa502' },
    { name: 'หน้าใหม่จากพรรคอื่น', value: stats.newFace, color: '#42b8ff' },
  ], [stats.incumbent, stats.newFace])

  /* ── Filter lists ── */
  const toParties = useMemo(() => [...new Set(switchedMPs.map(m => m.toParty))].sort(), [switchedMPs])
  const fromParties = useMemo(() => [...new Set(switchedMPs.map(m => m.fromParty))].sort(), [switchedMPs])

  /* ── Filtered + sorted table data ── */
  const filteredData = useMemo(() => {
    let result = switchedMPs

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(m =>
        m.winnerName.toLowerCase().includes(q) ||
        m.areaName.toLowerCase().includes(q) ||
        m.province.toLowerCase().includes(q) ||
        m.areaCode.includes(q)
      )
    }

    if (filterPartyTo !== 'all') result = result.filter(m => m.toParty === filterPartyTo)
    if (filterPartyFrom !== 'all') result = result.filter(m => m.fromParty === filterPartyFrom)
    if (filterStatus !== 'all') {
      if (filterStatus === 'incumbent') result = result.filter(m => m.is66Winner)
      else result = result.filter(m => !m.is66Winner)
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'votes') cmp = a.votes - b.votes
      else if (sortKey === 'votePercent') cmp = a.votePercent - b.votePercent
      else if (sortKey === 'province') cmp = a.province.localeCompare(b.province)
      else cmp = a.areaCode.localeCompare(b.areaCode)
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [switchedMPs, searchQuery, filterPartyTo, filterPartyFrom, filterStatus, sortKey, sortDir])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: typeof sortKey }) => {
    if (sortKey !== col) return <ChevronDown size={10} style={{ opacity: 0.3 }} />
    return sortDir === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />
  }

  /* ── Tooltip ── */
  interface BarTooltipPayload { payload: { party: string; count: number } }
  const BarTooltipContent = ({ active, payload }: { active?: boolean; payload?: BarTooltipPayload[] }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return <div className="custom-tooltip"><div className="label">{d.party}</div><div className="item">{d.count} คน</div></div>
  }

  interface FlowTooltipPayload { payload: { from: string; to: string; count: number } }
  const FlowTooltipContent = ({ active, payload }: { active?: boolean; payload?: FlowTooltipPayload[] }) => {
    if (!active || !payload?.[0]) return null
    const d = payload[0].payload
    return (
      <div className="custom-tooltip">
        <div className="label">{d.from} <ArrowRight size={10} style={{ verticalAlign: -1 }} /> {d.to}</div>
        <div className="item">{d.count} คน</div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-title">
        <ArrowRightLeft size={20} /> ส.ส. ที่ย้ายพรรค — รายละเอียด
      </div>
      <div className="section-desc">
        วิเคราะห์ผู้สมัคร ส.ส. เขตที่<strong>ย้ายพรรค</strong>จากการเลือกตั้ง 2566 มาลงในนามพรรคใหม่ปี 2569 แล้ว<strong>ชนะ</strong>
        — ทั้งที่เป็น ส.ส. เดิมที่ย้ายพรรค และหน้าใหม่ที่เคยสังกัดพรรคอื่น
      </div>

      {/* ─── Stat Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#42b8ff' }}>{stats.total}</div>
          <div className="stat-label"><ArrowRightLeft size={12} style={{ verticalAlign: -2 }} /> ย้ายพรรค+ชนะ ทั้งหมด</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffa502' }}>{stats.incumbent}</div>
          <div className="stat-label"><UserCheck size={12} style={{ verticalAlign: -2 }} /> ส.ส. เดิม (66) ย้ายพรรค</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#5ed88a' }}>{stats.newFace}</div>
          <div className="stat-label"><UserPlus size={12} style={{ verticalAlign: -2 }} /> หน้าใหม่จากพรรคอื่น</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#e879f9' }}>{destChartData.length}</div>
          <div className="stat-label"><Trophy size={12} style={{ verticalAlign: -2 }} /> พรรคที่รับย้ายแล้วชนะ</div>
        </div>
      </div>

      {/* ─── Row 1: Destination bar + Pie ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="chart-container">
          <h4 style={{ color: '#e8eaed', marginBottom: 8, textAlign: 'center', fontSize: 13 }}>
            พรรคปลายทาง — รับย้ายแล้วชนะ (จำนวน ส.ส.)
          </h4>
          <ResponsiveContainer width="100%" height={destChartData.length * 42 + 40}>
            <BarChart data={destChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
              <YAxis dataKey="party" type="category" tick={{ fill: '#e8eaed', fontSize: 11 }} width={95} />
              <Tooltip content={<BarTooltipContent />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {destChartData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ color: '#e8eaed', marginBottom: 8, fontSize: 13 }}>สัดส่วน ส.ส. เดิม vs หน้าใหม่</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} label={({ name, value }) => `${name.split(' ')[0]} ${value}`} labelLine={false}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(value: number, name: string) => [`${value} คน`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, marginTop: 4 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                <span style={{ color: '#9aa0a6' }}>{d.name.length > 15 ? d.name.slice(0, 15) + '…' : d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Row 2: Source bar ─── */}
      <div className="chart-container" style={{ marginBottom: 20 }}>
        <h4 style={{ color: '#e8eaed', marginBottom: 8, textAlign: 'center', fontSize: 13 }}>
          พรรคต้นทาง (66) — สูญเสียผู้สมัครไปแล้วชนะ
        </h4>
        <ResponsiveContainer width="100%" height={srcChartData.length * 32 + 40}>
          <BarChart data={srcChartData} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
            <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
            <YAxis dataKey="party" type="category" tick={{ fill: '#e8eaed', fontSize: 11 }} width={155} />
            <Tooltip content={<BarTooltipContent />} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#f4485399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Row 3: Flow Top 15 + Treemap ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="chart-container">
          <h4 style={{ color: '#e8eaed', marginBottom: 8, textAlign: 'center', fontSize: 13 }}>
            TOP 15 กระแสย้ายพรรค (จาก <ArrowRight size={10} style={{ verticalAlign: -1 }} /> ไป)
          </h4>
          <ResponsiveContainer width="100%" height={15 * 30 + 40}>
            <BarChart data={flowData.slice(0, 15).map(f => ({ ...f, label: `${f.from} → ${f.to}` }))} layout="vertical" margin={{ top: 5, right: 30, left: 180, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
              <XAxis type="number" tick={{ fill: '#9aa0a6', fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fill: '#e8eaed', fontSize: 10 }} width={175} />
              <Tooltip content={<FlowTooltipContent />} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {flowData.slice(0, 15).map((f, i) => <Cell key={i} fill={f.toColor} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4 style={{ color: '#e8eaed', marginBottom: 8, textAlign: 'center', fontSize: 13 }}>
            จังหวัดที่มี ส.ส. ย้ายพรรคมากที่สุด
          </h4>
          <ResponsiveContainer width="100%" height={15 * 30 + 40}>
            <Treemap
              data={treemapData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#1a1a2e"
              content={<TreemapContent x={0} y={0} width={0} height={0} name="" value={0} color="" />}
            />
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Table: Full list ─── */}
      <div style={{ marginTop: 8 }}>
        <h4 style={{ color: '#e8eaed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <CornerDownRight size={16} /> รายชื่อ ส.ส. ย้ายพรรคทั้งหมด ({filteredData.length}/{stats.total})
        </h4>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, เขต, จังหวัด..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 8px 8px 30px', background: '#1a1a2e', border: '1px solid #2d3148',
                borderRadius: 8, color: '#e8eaed', fontSize: 12, outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={12} style={{ color: '#9aa0a6' }} />
            <select value={filterPartyTo} onChange={e => setFilterPartyTo(e.target.value)}
              style={{ background: '#1a1a2e', color: '#e8eaed', border: '1px solid #2d3148', borderRadius: 6, padding: '6px 8px', fontSize: 11 }}>
              <option value="all">พรรคปัจจุบัน: ทั้งหมด</option>
              {toParties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <select value={filterPartyFrom} onChange={e => setFilterPartyFrom(e.target.value)}
              style={{ background: '#1a1a2e', color: '#e8eaed', border: '1px solid #2d3148', borderRadius: 6, padding: '6px 8px', fontSize: 11 }}>
              <option value="all">พรรคเดิม (66): ทั้งหมด</option>
              {fromParties.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ background: '#1a1a2e', color: '#e8eaed', border: '1px solid #2d3148', borderRadius: 6, padding: '6px 8px', fontSize: 11 }}>
              <option value="all">สถานะ: ทั้งหมด</option>
              <option value="incumbent">ส.ส. เดิม (66) ย้ายพรรค</option>
              <option value="newface">หน้าใหม่จากพรรคอื่น</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="province-table-container" style={{ maxHeight: 600, overflowY: 'auto' }}>
          <table className="province-table" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => toggleSort('areaCode')}>
                  เขต <SortIcon col="areaCode" />
                </th>
                <th style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => toggleSort('province')}>
                  จังหวัด <SortIcon col="province" />
                </th>
                <th>ชื่อ ส.ส.</th>
                <th>พรรคเดิม (66)</th>
                <th></th>
                <th>พรรคปัจจุบัน (69)</th>
                <th style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }} onClick={() => toggleSort('votes')}>
                  คะแนน <SortIcon col="votes" />
                </th>
                <th style={{ cursor: 'pointer', whiteSpace: 'nowrap', textAlign: 'right' }} onClick={() => toggleSort('votePercent')}>
                  % <SortIcon col="votePercent" />
                </th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((m, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 11 }}>{m.areaCode}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{m.province}</td>
                  <td style={{ fontWeight: 600, color: '#e8eaed', minWidth: 160 }}>{m.winnerName}</td>
                  <td style={{ color: '#9aa0a6' }}>{m.fromParty}</td>
                  <td style={{ textAlign: 'center', color: '#666' }}>
                    <ArrowRight size={12} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <PartyLogo partyName={m.toParty} nameToCodeMap={nameToCodeMap} size={20} />
                      <span style={{ color: m.toPartyColor, fontWeight: 600 }}>{m.toParty}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>
                    {m.votes > 0 ? m.votes.toLocaleString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                    {m.votePercent > 0 ? `${m.votePercent.toFixed(1)}%` : '—'}
                  </td>
                  <td>
                    {m.is66Winner ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#ffa50222', color: '#ffa502' }}>
                        <UserCheck size={10} /> ส.ส. เดิมย้าย
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#42b8ff22', color: '#42b8ff' }}>
                        <UserPlus size={10} /> หน้าใหม่
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, opacity: 0.5 }}>ไม่พบข้อมูลตรงเงื่อนไข</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
