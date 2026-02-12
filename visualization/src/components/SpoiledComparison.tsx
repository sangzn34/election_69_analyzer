import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, ReferenceLine, Legend,
} from 'recharts'
import { AlertTriangle, BarChart3, Table2, Info, GitCompareArrows, Microscope, MapPin, Users } from 'lucide-react'
import PartyLogo from './PartyLogo'
import type { SpoiledComparisonItem, SpoiledComparisonMeta, ElectionComparison, NameToCodeMap } from '../types'

type ViewMode = 'scatter' | 'bar' | 'table' | 'province' | 'party'

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
      <div style={{ fontSize: 11, color: '#999', marginBottom: 16, lineHeight: 1.6 }}>
        เทียบภาพรวมระดับชาติระหว่างเลือกตั้ง 66 (14 พ.ค. 2566) กับเลือกตั้ง 69 + ประชามติ (1 ก.พ. 2569)
        <br />ข้อมูล 66 จาก กกต./Thai PBS API | ข้อมูล 69 คำนวณจากผลรายเขต 400 เขต
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

      <div style={{ fontSize: 10, color: '#777', marginBottom: 12, fontStyle: 'italic', lineHeight: 1.6 }}>
        * เลือกตั้ง 69 (สส.) ไม่สามารถแยก "บัตรเสีย" กับ "ไม่ประสงค์ลงคะแนน" ได้ — ตัวเลข = ผู้มาลงคะแนน − คะแนนผู้สมัครรวมทุกคน
        <br />** ข้อมูลเลือกตั้ง 69 เป็นผลนับคะแนนอย่างไม่เป็นทางการ (ข้อมูล ณ เวลาที่ดึงจาก API กกต.) อาจมีการปรับเปลี่ยนภายหลัง
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
    const map: Record<string, { party: string; count: number; avgDelta: number; avgMp: number; avgRef: number; outliers: number; color: string }> = {}
    data.forEach(d => {
      if (!map[d.winnerParty]) {
        map[d.winnerParty] = { party: d.winnerParty, count: 0, avgDelta: 0, avgMp: 0, avgRef: 0, outliers: 0, color: d.winnerPartyColor }
      }
      map[d.winnerParty].count++
      map[d.winnerParty].avgDelta += d.delta
      map[d.winnerParty].avgMp += d.mpNonValidPercent
      map[d.winnerParty].avgRef += d.refNonValidPercent
      if (d.isOutlier) map[d.winnerParty].outliers++
    })
    return Object.values(map)
      .map(p => ({
        ...p,
        avgDelta: Math.round(p.avgDelta / p.count * 100) / 100,
        avgMp: Math.round(p.avgMp / p.count * 100) / 100,
        avgRef: Math.round(p.avgRef / p.count * 100) / 100,
      }))
      .sort((a, b) => b.avgDelta - a.avgDelta)
  }, [data])

  const provinceStats = useMemo(() => {
    const map: Record<string, {
      province: string; count: number; sumDelta: number; sumMp: number; sumRef: number;
      outliers: number; maxDelta: number; maxDeltaArea: string;
      // dominant party
      partyCount: Record<string, { name: string; color: string; count: number }>
    }> = {}
    data.forEach(d => {
      if (!map[d.province]) {
        map[d.province] = {
          province: d.province, count: 0, sumDelta: 0, sumMp: 0, sumRef: 0,
          outliers: 0, maxDelta: -Infinity, maxDeltaArea: '',
          partyCount: {},
        }
      }
      const p = map[d.province]
      p.count++
      p.sumDelta += d.delta
      p.sumMp += d.mpNonValidPercent
      p.sumRef += d.refNonValidPercent
      if (d.isOutlier) p.outliers++
      if (d.delta > p.maxDelta) { p.maxDelta = d.delta; p.maxDeltaArea = d.areaName }
      if (!p.partyCount[d.winnerParty]) p.partyCount[d.winnerParty] = { name: d.winnerParty, color: d.winnerPartyColor, count: 0 }
      p.partyCount[d.winnerParty].count++
    })
    return Object.values(map)
      .map(p => {
        const topParty = Object.values(p.partyCount).sort((a, b) => b.count - a.count)[0]
        return {
          province: p.province,
          count: p.count,
          avgDelta: Math.round(p.sumDelta / p.count * 100) / 100,
          avgMp: Math.round(p.sumMp / p.count * 100) / 100,
          avgRef: Math.round(p.sumRef / p.count * 100) / 100,
          outliers: p.outliers,
          maxDelta: Math.round(p.maxDelta * 100) / 100,
          maxDeltaArea: p.maxDeltaArea,
          topParty: topParty?.name || '',
          topPartyColor: topParty?.color || '#999',
        }
      })
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
    { id: 'province', label: 'จังหวัด', icon: <MapPin size={14} /> },
    { id: 'party', label: 'แยกตามพรรค', icon: <Users size={14} /> },
  ]

  return (
    <div className="section">
      <h2><AlertTriangle size={20} style={{ verticalAlign: -3 }} /> เปรียบเทียบบัตรไม่สมบูรณ์: เลือกตั้ง สส. vs ประชามติ</h2>
      <div className="section-desc">
        วันที่ 1 ก.พ. 2569 ผู้มีสิทธิ์เลือกตั้งได้รับบัตรลงคะแนน <strong>2 ใบ</strong> — ใบเลือกตั้ง สส. เขต และใบลงประชามติ
        — ผู้ลงคะแนนเป็น<strong>คนกลุ่มเดียวกัน</strong>ในวันเดียวกัน
        <br />หากเขตใดมีอัตราบัตรไม่สมบูรณ์ของ สส. <strong>สูงกว่า</strong>ประชามติมากผิดปกติ
        อาจเป็นสัญญาณที่น่าตั้งคำถาม เช่น มีการจัดตั้งให้กาไม่ถูกช่อง, สับสนเรื่องเบอร์, หรือปัจจัยอื่น
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
          <strong>วิธีการวิเคราะห์:</strong>
          <br />• ใช้ยอด<strong>ผู้มาลงคะแนนจริง</strong>จากข้อมูลประชามติ (totalVotes) เป็นฐาน — เพราะเป็นผู้ลงคะแนน<strong>กลุ่มเดียวกัน</strong>ที่มาหีบเดียวกันในวันเดียวกัน
          <br />• <strong style={{ color: '#f44853' }}>บัตรไม่สมบูรณ์ (สส.)</strong> = ผู้มาลงคะแนน − คะแนนผู้สมัครรวมทุกคน (รวมทั้ง "บัตรเสีย" และ "ไม่ประสงค์ลงคะแนน" เพราะ API ไม่ได้แยกให้)
          <br />• <strong style={{ color: '#42b8ff' }}>บัตรไม่สมบูรณ์ (ประชามติ)</strong> = บัตรเสีย + ไม่ประสงค์ลงคะแนน (ข้อมูลทางการจาก กกต. แยกมาให้)
          <br />• <strong>Δ (delta)</strong> = บัตรไม่สมบูรณ์ สส. − บัตรไม่สมบูรณ์ ประชามติ — ค่า<em>บวก</em>หมายถึงใบ สส. มีบัตรไม่สมบูรณ์<strong>มากกว่า</strong>
          <br />• <strong>Outlier</strong> = เขตที่ Δ สูงกว่า median + 2σ (เกณฑ์ = {meta.outlierThreshold}%) — เป็นค่าทางสถิติ ไม่ได้หมายความว่ามีความผิดปกติเสมอไป
          <br />
          <br /><strong>ทำไมถึงเทียบแบบนี้ได้?</strong> เพราะบัตร 2 ใบถูกกรอกโดยคนเดียวกัน ณ หน่วยเลือกตั้งเดียวกัน — ถ้า "ความสับสน" หรือ "ความตั้งใจไม่ลงคะแนน" เป็นเหตุผลหลัก อัตราควรจะใกล้เคียงกันทั้ง 2 ใบ เขตที่ใบ สส. มีบัตรเสียมากกว่าประชามติจึงเป็นจุดที่น่าสนใจ
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
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            บัตรไม่สมบูรณ์: เลือกตั้ง สส. (แกน Y) vs ประชามติ (แกน X)
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 12, lineHeight: 1.5 }}>
            แต่ละจุด = 1 เขตเลือกตั้ง — จุดที่อยู่<strong style={{ color: '#e8eaed' }}>เหนือเส้นทแยง</strong>คือเขตที่ใบ สส. มีบัตรไม่สมบูรณ์มากกว่าประชามติ
            <br />🔴 จุดสีแดง = Outlier (Δ เกินเกณฑ์) | จุดอื่นสีตามพรรคผู้ชนะ | Hover เพื่อดูรายละเอียด
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
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            เปรียบเทียบอัตราบัตรไม่สมบูรณ์ — Top {Math.min(30, filtered.length)} เขตที่ Δ สูงสุด
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 12, lineHeight: 1.5 }}>
            <span style={{ color: '#f44853' }}>แท่งแดง</span> = อัตราบัตรไม่สมบูรณ์จากใบ สส. |
            <span style={{ color: '#42b8ff' }}> แท่งน้ำเงิน</span> = อัตราบัตรไม่สมบูรณ์จากใบประชามติ
            <br />ยิ่งแท่งแดงยาวกว่าน้ำเงินมากเท่าไหร่ = ใบ สส. ของเขตนั้นมีบัตรไม่สมบูรณ์มากกว่าประชามติมากเท่านั้น
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

      {/* === PROVINCE VIEW === */}
      {viewMode === 'province' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            <MapPin size={14} style={{ verticalAlign: -2 }} /> เฉลี่ย Δ (บัตรไม่สมบูรณ์ สส. − ประชามติ) แยกรายจังหวัด
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 16, lineHeight: 1.5 }}>
            แต่ละแท่ง = ค่าเฉลี่ย Δ ของทุกเขตในจังหวัดนั้น — จังหวัดที่ค่า Δ สูง แปลว่าเขตในจังหวัดนั้นมีแนวโน้มบัตรไม่สมบูรณ์ (สส.) สูงกว่าประชามติ
            <br /><span style={{ color: '#f44853' }}>แท่งแดง</span> = Δ เฉลี่ยสูงกว่าค่าเฉลี่ยทั้งประเทศ ({meta.avgDelta}%) |
            <span style={{ color: '#42b8ff' }}> แท่งน้ำเงิน</span> = ต่ำกว่าค่าเฉลี่ย |
            แท่งทึบ = มีเขต Outlier ในจังหวัด
          </div>

          {/* Province bar chart */}
          <ResponsiveContainer width="100%" height={provinceStats.length * 26 + 40}>
            <BarChart data={provinceStats} layout="vertical" margin={{ top: 5, right: 50, bottom: 5, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#ffffff30" unit="%" />
              <YAxis dataKey="province" type="category" width={90} tick={{ fontSize: 10 }} stroke="#ffffff30" />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="custom-tooltip">
                    <div className="label">{d.province} ({d.count} เขต)</div>
                    <div className="item" style={{ color: '#f44853' }}>เฉลี่ยบัตรไม่สมบูรณ์ (สส.): {d.avgMp}%</div>
                    <div className="item" style={{ color: '#42b8ff' }}>เฉลี่ยบัตรไม่สมบูรณ์ (ประชามติ): {d.avgRef}%</div>
                    <div className="item" style={{ fontWeight: 700 }}>เฉลี่ย Δ: {d.avgDelta > 0 ? '+' : ''}{d.avgDelta}%</div>
                    {d.outliers > 0 && <div className="item" style={{ color: '#ffa502' }}>Outlier: {d.outliers} เขต</div>}
                    <div className="item">พรรคหลัก: {d.topParty}</div>
                  </div>
                )
              }} />
              <Bar dataKey="avgDelta" barSize={14} radius={[0, 4, 4, 0]}>
                {provinceStats.map((p, i) => (
                  <Cell key={i} fill={p.avgDelta > meta.avgDelta ? '#f44853' : '#42b8ff'} opacity={p.outliers > 0 ? 0.9 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Province table */}
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>จังหวัด</th>
                  <th style={{ textAlign: 'center' }}>เขต</th>
                  <th style={{ textAlign: 'right', color: '#f44853' }}>สส. %</th>
                  <th style={{ textAlign: 'right', color: '#42b8ff' }}>ประชามติ %</th>
                  <th style={{ textAlign: 'right' }}>เฉลี่ย Δ</th>
                  <th style={{ textAlign: 'right' }}>สูงสุด Δ</th>
                  <th style={{ textAlign: 'center', color: '#ffa502' }}>Outlier</th>
                  <th>พรรคหลัก</th>
                </tr>
              </thead>
              <tbody>
                {provinceStats.map(p => (
                  <tr key={p.province} style={{ background: p.outliers > 0 ? '#f4485310' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{p.province}</td>
                    <td style={{ textAlign: 'center' }}>{p.count}</td>
                    <td style={{ textAlign: 'right', color: '#f44853' }}>{p.avgMp}%</td>
                    <td style={{ textAlign: 'right', color: '#42b8ff' }}>{p.avgRef}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: p.avgDelta > 0 ? '#f44853' : '#22c55e' }}>
                      {p.avgDelta > 0 ? '+' : ''}{p.avgDelta}%
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 11, color: '#999' }}>
                      +{p.maxDelta}%
                      <span style={{ fontSize: 10, marginLeft: 4, color: '#666' }}>({p.maxDeltaArea})</span>
                    </td>
                    <td style={{ textAlign: 'center', color: '#ffa502', fontWeight: 700 }}>
                      {p.outliers > 0 ? p.outliers : '—'}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <PartyLogo partyName={p.topParty} nameToCodeMap={nameToCodeMap} size={16} />
                        <span style={{ color: p.topPartyColor, fontSize: 11 }}>{p.topParty}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === PARTY VIEW === */}
      {viewMode === 'party' && (
        <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            <Users size={14} style={{ verticalAlign: -2 }} /> บัตรไม่สมบูรณ์ แยกตามพรรคผู้ชนะ
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 16, lineHeight: 1.5 }}>
            รวมเขตที่พรรคเดียวกันชนะ แล้วเปรียบเทียบค่าเฉลี่ยบัตรไม่สมบูรณ์ของใบ สส. vs ประชามติ
            <br />ถ้าพรรคใดมี Δ เฉลี่ยสูง = เขตที่พรรคนั้นชนะมักมีบัตรไม่สมบูรณ์ (สส.) มากกว่าประชามติ
            <br /><span style={{ color: '#f44853' }}>แท่ง/ตัวเลขแดง</span> = ใบ สส. |
            <span style={{ color: '#42b8ff' }}> แท่ง/ตัวเลขน้ำเงิน</span> = ใบประชามติ |
            ช่องว่างระหว่าง 2 แท่ง = ขนาดของ Δ
          </div>

          {/* Party bar chart: grouped bar (avgMp vs avgRef) */}
          <ResponsiveContainer width="100%" height={partyStats.length * 40 + 60}>
            <BarChart data={partyStats} layout="vertical" margin={{ top: 5, right: 50, bottom: 5, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#ffffff30" unit="%" />
              <YAxis dataKey="party" type="category" width={110} tick={{ fontSize: 10 }} stroke="#ffffff30" />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="custom-tooltip">
                    <div className="label">{d.party} ({d.count} เขต)</div>
                    <div className="item" style={{ color: '#f44853' }}>เฉลี่ยบัตรไม่สมบูรณ์ (สส.): {d.avgMp}%</div>
                    <div className="item" style={{ color: '#42b8ff' }}>เฉลี่ยบัตรไม่สมบูรณ์ (ประชามติ): {d.avgRef}%</div>
                    <div className="item" style={{ fontWeight: 700 }}>เฉลี่ย Δ: {d.avgDelta > 0 ? '+' : ''}{d.avgDelta}%</div>
                    {d.outliers > 0 && <div className="item" style={{ color: '#ffa502' }}>Outlier: {d.outliers} เขต</div>}
                  </div>
                )
              }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="avgMp" name="สส. %" fill="#f44853" opacity={0.8} barSize={12} />
              <Bar dataKey="avgRef" name="ประชามติ %" fill="#42b8ff" opacity={0.8} barSize={12} />
            </BarChart>
          </ResponsiveContainer>

          {/* Party detail cards */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {partyStats.map(p => (
              <div key={p.party} style={{
                padding: 14, borderRadius: 10, background: '#ffffff06', border: `1px solid ${p.color}33`,
                fontSize: 12, lineHeight: 1.7,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <PartyLogo partyName={p.party} nameToCodeMap={nameToCodeMap} size={28} />
                  <div>
                    <div style={{ fontWeight: 700, color: p.color, fontSize: 14 }}>{p.party}</div>
                    <div style={{ color: '#999', fontSize: 11 }}>{p.count} เขตที่ชนะ</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ color: '#999', fontSize: 10 }}>สส. (เฉลี่ย)</div>
                    <div style={{ color: '#f44853', fontWeight: 700, fontSize: 16 }}>{p.avgMp}%</div>
                  </div>
                  <div>
                    <div style={{ color: '#999', fontSize: 10 }}>ประชามติ (เฉลี่ย)</div>
                    <div style={{ color: '#42b8ff', fontWeight: 700, fontSize: 16 }}>{p.avgRef}%</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 8, padding: '4px 8px', borderRadius: 6,
                  background: p.avgDelta > meta.avgDelta ? '#f4485315' : '#22c55e15',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: 11, color: '#999' }}>เฉลี่ย Δ: </span>
                  <span style={{ fontWeight: 700, color: p.avgDelta > 0 ? '#f44853' : '#22c55e' }}>
                    {p.avgDelta > 0 ? '+' : ''}{p.avgDelta}%
                  </span>
                  {p.outliers > 0 && (
                    <span style={{ marginLeft: 8, color: '#ffa502', fontSize: 11 }}>
                      ⚠️ {p.outliers} Outlier
                    </span>
                  )}
                </div>
                {/* Mini bar showing MP vs Ref proportionally */}
                <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: '#ffffff10', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(p.avgMp / (p.avgMp + p.avgRef)) * 100}%`, background: '#f44853', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ width: `${(p.avgRef / (p.avgMp + p.avgRef)) * 100}%`, background: '#42b8ff', borderRadius: '0 3px 3px 0' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#777', marginTop: 2 }}>
                  <span>สส. {p.avgMp}%</span>
                  <span>ประชามติ {p.avgRef}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outlier list */}
      {topOutliers.length > 0 && (
        <div style={{ marginTop: 20, background: 'var(--bg-card)', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={16} style={{ color: '#ffa502' }} /> เขตที่ Δ สูงผิดปกติ (Outlier) — Δ &gt; {meta.outlierThreshold}%
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 12, lineHeight: 1.5 }}>
            เขตเหล่านี้มีส่วนต่างบัตรไม่สมบูรณ์ (สส. − ประชามติ) สูงเกินกว่าค่า median + 2σ
            — อาจเกิดจากหลายสาเหตุ เช่น บัตรซับซ้อน, จำนวนผู้สมัครมาก, หรือปัจจัยเฉพาะพื้นที่
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
    </div>
  )
}

