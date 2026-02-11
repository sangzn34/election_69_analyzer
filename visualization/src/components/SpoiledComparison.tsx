import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, Legend,
} from 'recharts'
import { AlertTriangle, BarChart3, Table2, Info, GitCompareArrows, Microscope } from 'lucide-react'
import PartyLogo from './PartyLogo'
import type { SpoiledComparisonItem, SpoiledComparisonMeta, ElectionComparison, NameToCodeMap } from '../types'

type ViewMode = 'scatter' | 'bar' | 'table'

interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ payload: SpoiledComparisonItem }>
}

const ScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName} ({d.province})</div>
      <div className="item">🗳️ บัตรไม่สมบูรณ์ (เลือกตั้ง สส.): {d.mpNonValidPercent.toFixed(2)}% ({d.mpNonValidVotes.toLocaleString()} ใบ)</div>
      <div className="item">📋 บัตรไม่สมบูรณ์ (ประชามติ): {d.refNonValidPercent.toFixed(2)}% ({(d.refBadVotes + d.refNoVotes).toLocaleString()} ใบ)</div>
      <div className="item" style={{ color: d.delta > 0 ? '#f44853' : '#42b8ff', fontWeight: 700 }}>
        Δ = {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}% {d.isOutlier ? '⚠️ Outlier' : ''}
      </div>
      <div className="item">📊 Turnout: {d.turnoutPercent}% | บัตรทั้งหมด: {d.totalBallots.toLocaleString()}</div>
      <div className="item" style={{ color: d.winnerPartyColor, fontWeight: 700 }}>
        🏆 ชนะ: {d.winnerParty}
      </div>
    </div>
  )
}

interface BarTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; dataKey: string; payload: SpoiledComparisonItem }>
}

const BarTooltip = ({ active, payload }: BarTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item" style={{ color: '#f44853' }}>เลือกตั้ง สส.: {d.mpNonValidPercent.toFixed(2)}%</div>
      <div className="item" style={{ color: '#42b8ff' }}>ประชามติ: {d.refNonValidPercent.toFixed(2)}%</div>
      <div className="item">Δ = {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}%</div>
    </div>
  )
}

interface Props {
  data: SpoiledComparisonItem[]
  meta: SpoiledComparisonMeta
  nameToCodeMap: NameToCodeMap
  comparison?: ElectionComparison
}

/* ── National Comparison sub-component ── */
function NationalComparison({ data }: { data: ElectionComparison }) {
  const { election66: e66, election69mp: e69mp, election69ref: e69ref, changes } = data

  const barData = [
    { name: 'เลือกตั้ง 66', nonValid: e66.nonValidPercent, turnout: e66.turnoutPercent },
    { name: 'เลือกตั้ง 69 (สส.)', nonValid: e69mp.nonValidPercent, turnout: e69mp.turnoutPercent },
    { name: 'ประชามติ 69', nonValid: e69ref.nonValidPercent, turnout: e69ref.turnoutPercent },
  ]

  const DeltaBadge = ({ value, suffix = '%' }: { value: number; suffix?: string }) => (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: value > 0 ? '#f4485320' : value < 0 ? '#22c55e20' : '#ffffff10',
      color: value > 0 ? '#f44853' : value < 0 ? '#22c55e' : '#999',
    }}>
      {value > 0 ? '▲' : value < 0 ? '▼' : '–'} {Math.abs(value)}{suffix}
    </span>
  )

  interface CompBarTooltipProps {
    active?: boolean
    payload?: Array<{ value: number; name: string; color: string }>
    label?: string
  }
  const CompBarTooltip = ({ active, payload, label }: CompBarTooltipProps) => {
    if (!active || !payload?.length) return null
    return (
      <div className="custom-tooltip">
        <div className="label">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="item" style={{ color: p.color }}>{p.name}: {p.value}%</div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 24, background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
        <GitCompareArrows size={18} /> เปรียบเทียบระดับประเทศ: เลือกตั้ง 66 vs 69
      </div>
      <div style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>
        ข้อมูลเลือกตั้ง 66 จาก กกต. (Thai PBS API) | เลือกตั้ง 69 คำนวณจากข้อมูลรายเขต
      </div>

      {/* Summary comparison table */}
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              <th></th>
              <th style={{ textAlign: 'right' }}>เลือกตั้ง 66</th>
              <th style={{ textAlign: 'right' }}>เลือกตั้ง 69 (สส.)</th>
              <th style={{ textAlign: 'right' }}>ประชามติ 69</th>
              <th style={{ textAlign: 'center' }}>Δ (69 สส. vs 66)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600 }}>ผู้มีสิทธิ์</td>
              <td style={{ textAlign: 'right' }}>{e66.eligible.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{e69mp.eligible.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>—</td>
              <td style={{ textAlign: 'center' }}><DeltaBadge value={Math.round((e69mp.eligible - e66.eligible) / 1000)} suffix="K คน" /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>ผู้มาใช้สิทธิ์</td>
              <td style={{ textAlign: 'right' }}>{e66.totalVotes.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{e69mp.totalVotes.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{e69ref.totalVotes.toLocaleString()}</td>
              <td style={{ textAlign: 'center' }}><DeltaBadge value={changes.turnoutDelta} /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Turnout</td>
              <td style={{ textAlign: 'right' }}>{e66.turnoutPercent}%</td>
              <td style={{ textAlign: 'right' }}>{e69mp.turnoutPercent}%</td>
              <td style={{ textAlign: 'right' }}>{e69ref.turnoutPercent}%</td>
              <td style={{ textAlign: 'center' }}><DeltaBadge value={changes.turnoutDelta} /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>คะแนนดี</td>
              <td style={{ textAlign: 'right' }}>{e66.goodVotes.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{e69mp.goodVotes.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{e69ref.goodVotes.toLocaleString()}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: '#f44853' }}>บัตรเสีย</td>
              <td style={{ textAlign: 'right', color: '#f44853' }}>{e66.badVotes.toLocaleString()} ({e66.spoiledPercent}%)</td>
              <td style={{ textAlign: 'right', color: '#f44853' }}>{e69mp.badVotes.toLocaleString()} ({e69mp.nonValidPercent}%)*</td>
              <td style={{ textAlign: 'right', color: '#f44853' }}>{e69ref.badVotes.toLocaleString()} ({e69ref.spoiledPercent}%)</td>
              <td style={{ textAlign: 'center' }}><DeltaBadge value={changes.spoiledDelta_refVs66} /></td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, color: '#ffa502' }}>ไม่ประสงค์ลงคะแนน</td>
              <td style={{ textAlign: 'right', color: '#ffa502' }}>{e66.noVotes.toLocaleString()} ({e66.noVotePercent}%)</td>
              <td style={{ textAlign: 'right', color: '#999' }}>—</td>
              <td style={{ textAlign: 'right', color: '#ffa502' }}>{e69ref.noVotes.toLocaleString()} ({e69ref.noVotePercent}%)</td>
              <td></td>
            </tr>
            <tr style={{ borderTop: '1px solid #ffffff20', fontWeight: 700 }}>
              <td>รวมบัตรไม่สมบูรณ์</td>
              <td style={{ textAlign: 'right' }}>{(e66.badVotes + e66.noVotes).toLocaleString()} ({e66.nonValidPercent}%)</td>
              <td style={{ textAlign: 'right' }}>{e69mp.badVotes.toLocaleString()} ({e69mp.nonValidPercent}%)</td>
              <td style={{ textAlign: 'right' }}>{(e69ref.badVotes + e69ref.noVotes).toLocaleString()} ({e69ref.nonValidPercent}%)</td>
              <td style={{ textAlign: 'center' }}><DeltaBadge value={changes.nonValidDelta_mpVs66} /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: '#777', marginBottom: 12, fontStyle: 'italic' }}>
        * เลือกตั้ง 69 (สส.) ไม่สามารถแยก "บัตรเสีย" กับ "ไม่ประสงค์ลงคะแนน" ได้ — ตัวเลข = ผู้มาลงคะแนน − คะแนนผู้สมัครรวมทุกคน
      </div>

      {/* Bar charts side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>อัตราบัตรไม่สมบูรณ์ (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#ffffff30" />
              <YAxis tick={{ fontSize: 10 }} stroke="#ffffff30" unit="%" />
              <Tooltip content={<CompBarTooltip />} />
              <Bar dataKey="nonValid" name="บัตรไม่สมบูรณ์" barSize={40}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={['#42b8ff', '#f44853', '#ffa502'][i]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, textAlign: 'center' }}>อัตราการใช้สิทธิ์ (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#ffffff30" />
              <YAxis tick={{ fontSize: 10 }} stroke="#ffffff30" unit="%" domain={[0, 100]} />
              <Tooltip content={<CompBarTooltip />} />
              <Bar dataKey="turnout" name="Turnout" barSize={40}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={['#42b8ff', '#22c55e', '#22c55e'][i]} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key findings delta cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 16 }}>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18, color: changes.turnoutDelta > 0 ? '#22c55e' : '#f44853' }}>
            {changes.turnoutDelta > 0 ? '+' : ''}{changes.turnoutDelta}%
          </div>
          <div className="stat-label">Turnout เปลี่ยนจาก 66</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18, color: changes.nonValidDelta_mpVs66 > 0 ? '#f44853' : '#22c55e' }}>
            {changes.nonValidDelta_mpVs66 > 0 ? '+' : ''}{changes.nonValidDelta_mpVs66}%
          </div>
          <div className="stat-label">บัตรไม่สมบูรณ์ (สส. 69 vs 66)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18, color: changes.nonValidDelta_refVs66 > 0 ? '#f44853' : '#22c55e' }}>
            {changes.nonValidDelta_refVs66 > 0 ? '+' : ''}{changes.nonValidDelta_refVs66}%
          </div>
          <div className="stat-label">บัตรไม่สมบูรณ์ (ประชามติ 69 vs 66)</div>
        </div>
      </div>
    </div>
  )
}

export default function SpoiledComparison({ data, meta, nameToCodeMap, comparison }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('scatter')
  const [sortKey, setSortKey] = useState<'delta' | 'mpNonValidPercent' | 'refNonValidPercent' | 'areaCode'>('delta')
  const [sortAsc, setSortAsc] = useState(false)
  const [showOutliersOnly, setShowOutliersOnly] = useState(false)

  const filtered = useMemo(
    () => showOutliersOnly ? data.filter(d => d.isOutlier) : data,
    [data, showOutliersOnly]
  )

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (typeof va === 'string' && typeof vb === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
    return arr
  }, [filtered, sortKey, sortAsc])

  const topOutliers = useMemo(() => data.filter(d => d.isOutlier).slice(0, 20), [data])

  const partyStats = useMemo(() => {
    const map: Record<string, { party: string; count: number; avgDelta: number; outliers: number; color: string }> = {}
    data.forEach(d => {
      if (!map[d.winnerParty]) {
        map[d.winnerParty] = { party: d.winnerParty, count: 0, avgDelta: 0, outliers: 0, color: d.winnerPartyColor }
      }
      map[d.winnerParty].count++
      map[d.winnerParty].avgDelta += d.delta
      if (d.isOutlier) map[d.winnerParty].outliers++
    })
    return Object.values(map)
      .map(p => ({ ...p, avgDelta: Math.round(p.avgDelta / p.count * 100) / 100 }))
      .sort((a, b) => b.avgDelta - a.avgDelta)
  }, [data])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const views: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'scatter', label: 'Scatter', icon: <Microscope size={14} /> },
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 size={14} /> },
    { id: 'table', label: 'ตาราง', icon: <Table2 size={14} /> },
  ]

  return (
    <div className="section">
      <h2><AlertTriangle size={20} style={{ verticalAlign: -3 }} /> เปรียบเทียบบัตรไม่สมบูรณ์: เลือกตั้ง สส. vs ประชามติ</h2>
      <div className="section-desc">
        เปรียบเทียบอัตราบัตรไม่สมบูรณ์ระหว่าง 2 ใบลงคะแนนที่ผู้มีสิทธิ์คนเดียวกันลงในวันเดียวกัน
        — ถ้าเขตไหนบัตรไม่สมบูรณ์ (สส.) สูงกว่าประชามติผิดปกติ อาจเป็นสัญญาณน่าสนใจ
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{meta.totalAreas}</div>
          <div className="stat-label">เขตเลือกตั้ง</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f44853' }}>{meta.avgMpNonValid}%</div>
          <div className="stat-label">เฉลี่ยบัตรไม่สมบูรณ์ (สส.)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#42b8ff' }}>{meta.avgRefNonValid}%</div>
          <div className="stat-label">เฉลี่ยบัตรไม่สมบูรณ์ (ประชามติ)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{meta.avgDelta > 0 ? '+' : ''}{meta.avgDelta}%</div>
          <div className="stat-label">เฉลี่ย Δ (สส. − ประชามติ)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffa502' }}>{meta.outlierCount}</div>
          <div className="stat-label">เขต Outlier (Δ &gt; {meta.outlierThreshold}%)</div>
        </div>
      </div>

      {/* Methodology note */}
      <div style={{
        padding: 12, marginBottom: 16, background: '#ffffff08', borderRadius: 8,
        border: '1px solid #ffffff15', fontSize: 12, lineHeight: 1.7, display: 'flex', gap: 8,
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong>วิธีการ:</strong> ใช้ยอดผู้มาลงคะแนนจริงจาก <em>ประชามติ</em> (totalVotes) เป็นฐาน เพราะเป็นผู้ลงคะแนนกลุ่มเดียวกัน
          <br />• <strong style={{ color: '#f44853' }}>บัตรไม่สมบูรณ์ (สส.)</strong> = ผู้มาลงคะแนน − คะแนนผู้สมัครรวมทุกคน (รวมบัตรเสีย + ไม่ประสงค์ลงคะแนน)
          <br />• <strong style={{ color: '#42b8ff' }}>บัตรไม่สมบูรณ์ (ประชามติ)</strong> = บัตรเสีย + ไม่ประสงค์ลงคะแนน (ข้อมูลทางการ กกต.)
          <br />• <strong>Δ (delta)</strong> = ส่วนต่าง — ค่า <em>บวก</em> = เลือกตั้ง สส. มีบัตรไม่สมบูรณ์มากกว่าประชามติ, <strong>Outlier</strong> = Δ &gt; median + 2σ ({meta.outlierThreshold}%)
        </div>
      </div>

      {/* === NATIONAL COMPARISON: Election 66 vs 69 === */}
      {comparison && <NationalComparison data={comparison} />}

      {/* View toggle */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {views.map(v => (
          <button key={v.id} className={`tab ${viewMode === v.id ? 'active' : ''}`} onClick={() => setViewMode(v.id)}>
            {v.icon} {v.label}
          </button>
        ))}
        <label style={{ fontSize: 12, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <input type="checkbox" checked={showOutliersOnly} onChange={e => setShowOutliersOnly(e.target.checked)} />
          เฉพาะ Outlier ({meta.outlierCount})
        </label>
      </div>

      {/* === SCATTER VIEW === */}
      {viewMode === 'scatter' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            บัตรไม่สมบูรณ์: เลือกตั้ง สส. (แกน Y) vs ประชามติ (แกน X)
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>
            จุดเหนือเส้นทแยง = เลือกตั้ง สส. มีบัตรไม่สมบูรณ์มากกว่าประชามติ | 🔴 = Outlier
          </div>
          <ResponsiveContainer width="100%" height={450}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
              <XAxis
                dataKey="refNonValidPercent" type="number" name="ประชามติ %"
                label={{ value: 'บัตรไม่สมบูรณ์ ประชามติ (%)', position: 'bottom', offset: 10, fill: '#999', fontSize: 11 }}
                tick={{ fontSize: 10 }} stroke="#ffffff30"
              />
              <YAxis
                dataKey="mpNonValidPercent" type="number" name="เลือกตั้ง สส. %"
                label={{ value: 'บัตรไม่สมบูรณ์ สส. (%)', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 11 }}
                tick={{ fontSize: 10 }} stroke="#ffffff30"
              />
              <Tooltip content={<ScatterTooltip />} />
              {/* Diagonal line y=x */}
              <ReferenceLine
                segment={[{ x: 0, y: 0 }, { x: 25, y: 25 }]}
                stroke="#ffffff40" strokeDasharray="4 4" strokeWidth={1}
              />
              <Scatter data={filtered} fill="#42b8ff">
                {filtered.map((d, i) => (
                  <Cell key={i} fill={d.isOutlier ? '#f44853' : d.winnerPartyColor || '#42b8ff'} opacity={d.isOutlier ? 1 : 0.6} r={d.isOutlier ? 6 : 4} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* === BAR VIEW === */}
      {viewMode === 'bar' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            เปรียบเทียบอัตราบัตรไม่สมบูรณ์ — Top {Math.min(30, filtered.length)} เขตที่ Δ สูงสุด
          </div>
          <ResponsiveContainer width="100%" height={Math.min(30, filtered.length) * 32 + 60}>
            <BarChart
              data={filtered.slice(0, 30)}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#ffffff30" unit="%" />
              <YAxis
                dataKey="areaName" type="category" width={110}
                tick={{ fontSize: 10 }} stroke="#ffffff30"
              />
              <Tooltip content={<BarTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="mpNonValidPercent" name="เลือกตั้ง สส." fill="#f44853" opacity={0.8} barSize={10} />
              <Bar dataKey="refNonValidPercent" name="ประชามติ" fill="#42b8ff" opacity={0.8} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* === TABLE VIEW === */}
      {viewMode === 'table' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('areaCode')}>เขต {sortKey === 'areaCode' ? (sortAsc ? '↑' : '↓') : ''}</th>
                <th>จังหวัด</th>
                <th style={{ cursor: 'pointer', color: '#f44853' }} onClick={() => handleSort('mpNonValidPercent')}>
                  สส. % {sortKey === 'mpNonValidPercent' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th style={{ cursor: 'pointer', color: '#42b8ff' }} onClick={() => handleSort('refNonValidPercent')}>
                  ประชามติ % {sortKey === 'refNonValidPercent' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('delta')}>
                  Δ {sortKey === 'delta' ? (sortAsc ? '↑' : '↓') : ''}
                </th>
                <th>ชนะ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => (
                <tr key={d.areaCode} style={{ background: d.isOutlier ? '#f4485310' : undefined }}>
                  <td>{d.areaCode}</td>
                  <td>{d.areaName}</td>
                  <td style={{ color: '#f44853', fontWeight: d.mpNonValidPercent > 15 ? 700 : 400 }}>
                    {d.mpNonValidPercent.toFixed(2)}%
                  </td>
                  <td style={{ color: '#42b8ff' }}>{d.refNonValidPercent.toFixed(2)}%</td>
                  <td style={{
                    fontWeight: 700,
                    color: d.delta > 0 ? '#f44853' : '#22c55e',
                  }}>
                    {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}%
                    {d.isOutlier && ' ⚠️'}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <PartyLogo partyName={d.winnerParty} nameToCodeMap={nameToCodeMap} size={16} />
                      <span style={{ color: d.winnerPartyColor }}>{d.winnerParty}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Outlier list */}
      {topOutliers.length > 0 && (
        <div style={{ marginTop: 20, background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} style={{ color: '#ffa502' }} /> เขตที่ Δ สูงผิดปกติ (Outlier) — Δ &gt; {meta.outlierThreshold}%
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {topOutliers.map(d => (
              <div key={d.areaCode} style={{
                padding: 10, borderRadius: 8, background: '#f4485310', border: '1px solid #f4485333',
                fontSize: 12, lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  {d.areaName} <span style={{ color: '#999', fontWeight: 400 }}>({d.province})</span>
                </div>
                <div>เลือกตั้ง สส.: <strong style={{ color: '#f44853' }}>{d.mpNonValidPercent.toFixed(2)}%</strong> ({d.mpNonValidVotes.toLocaleString()} ใบ)</div>
                <div>ประชามติ: <strong style={{ color: '#42b8ff' }}>{d.refNonValidPercent.toFixed(2)}%</strong> ({(d.refBadVotes + d.refNoVotes).toLocaleString()} ใบ)</div>
                <div>Δ = <strong style={{ color: '#f44853' }}>+{d.delta.toFixed(2)}%</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  ชนะ: <PartyLogo partyName={d.winnerParty} nameToCodeMap={nameToCodeMap} size={14} />
                  <span style={{ color: d.winnerPartyColor, fontWeight: 600 }}>{d.winnerParty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Party breakdown */}
      <div style={{ marginTop: 20, background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>เฉลี่ย Δ แยกตามพรรคผู้ชนะ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {partyStats.map(p => (
            <div key={p.party} style={{
              padding: 10, borderRadius: 8, background: '#ffffff06', border: '1px solid #ffffff15',
              fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <PartyLogo partyName={p.party} nameToCodeMap={nameToCodeMap} size={24} />
              <div>
                <div style={{ fontWeight: 600, color: p.color }}>{p.party}</div>
                <div>เขต: {p.count} | เฉลี่ย Δ: <strong style={{ color: p.avgDelta > 0 ? '#f44853' : '#22c55e' }}>
                  {p.avgDelta > 0 ? '+' : ''}{p.avgDelta}%
                </strong></div>
                {p.outliers > 0 && <div style={{ color: '#ffa502' }}>⚠️ Outlier: {p.outliers} เขต</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
