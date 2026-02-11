import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie,
} from 'recharts'
import {
  Star, CircleAlert, CircleDot, Map as MapIcon, BarChart3, Trophy, Microscope,
  Radar as RadarIcon, Table2, Target, Tag, TriangleAlert, FlaskConical,
  TrendingUp, Vote, Users, Scale, Trash2, Crown, Ban, Building2,
  Sparkles, Thermometer, ShieldCheck, RefreshCw, Gauge,
} from 'lucide-react'
import type { EnsembleAnalysisItem, EnsemblePartySummaryItem, EnsembleMeta, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ─── Tooltip: Area Detail ─── */
interface AreaTooltipProps {
  active?: boolean
  payload?: Array<{ payload: EnsembleAnalysisItem }>
}

const AreaTooltip = ({ active, payload }: AreaTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item" style={{ fontWeight: 700, fontSize: 16, color: riskColor(d.riskLevel) }}>
        <Target size={14} style={{ verticalAlign: -2 }} /> Final: {d.finalScore} {d.pValue < 0.05 && <span style={{ fontSize: 11, color: '#42b8ff' }}><Star size={10} style={{ verticalAlign: -1 }} /> p={d.pValue}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 4, flexWrap: 'wrap' }}>
        <span style={{ ...confidenceStyle(d.confidence) }}>{confidenceLabel(d.confidence)}</span>
        <span style={{ opacity: 0.5 }}>popW: {d.populationWeight}x</span>
        {d.spatialCluster !== 'ns' && (
          <span style={{ color: clusterColor(d.spatialCluster), fontWeight: 700 }}>
            <MapIcon size={11} style={{ verticalAlign: -1 }} /> {d.spatialCluster}
          </span>
        )}
        {d.semiSupervisedLabel !== 'unlabeled' && (
          <span style={{ color: labelColor(d.semiSupervisedLabel), fontWeight: 600 }}>
            <Tag size={11} style={{ verticalAlign: -1 }} /> {d.semiSupervisedLabel}
          </span>
        )}
      </div>
      <div className="item" style={{ color: d.winnerPartyColor }}>พรรค MP: {d.winnerParty}</div>
      <hr style={{ borderColor: '#333', margin: '4px 0' }} />
      <div className="item"><BarChart3 size={11} style={{ verticalAlign: -1 }} /> Gap: {d.gapScore}% (s:{d.gapScaled})</div>
      <div className="item" style={{ fontSize: 11, opacity: 0.7 }}>
        &nbsp;&nbsp;MP {d.gapMpVotes.toLocaleString()} → PL {d.gapPlVotes.toLocaleString()}
      </div>
      <div className="item"><TrendingUp size={11} style={{ verticalAlign: -1 }} /> PL Dev: {d.plDeviationScore.toFixed(0)} (z={d.plDeviationZScore})</div>
      {d.plDevPartyName && (
        <div className="item" style={{ fontSize: 11, opacity: 0.7 }}>
          &nbsp;&nbsp;{d.plDevPartyName}: {d.plDevVotes.toLocaleString()} (base {d.plDevBaseline.toLocaleString()})
        </div>
      )}
      <div className="item"><Vote size={11} style={{ verticalAlign: -1 }} /> Turnout: {d.turnoutScore.toFixed(0)} (dev {d.turnoutDeviation > 0 ? '+' : ''}{d.turnoutDeviation}%)</div>
      <div className="item"><Users size={11} style={{ verticalAlign: -1 }} /> Comp: {d.concentrationScore.toFixed(0)} ({d.candidateCount} คน)</div>
      <div className="item"><Scale size={11} style={{ verticalAlign: -1 }} /> Cons: {d.consistencyScore.toFixed(0)} (diff {d.consistencyDiff}%)</div>
      <div className="item"><Trash2 size={11} style={{ verticalAlign: -1 }} /> Spoiled: {d.spoiledScore.toFixed(0)} ({d.spoiledRatio}%)</div>
      <div className="item"><Crown size={11} style={{ verticalAlign: -1 }} /> Dominance: {d.dominanceScore.toFixed(0)} (HHI:{d.dominanceHHI}, win:{d.dominanceWinnerShare}%)</div>
      <div className="item"><Ban size={11} style={{ verticalAlign: -1 }} /> No-Vote: {d.noVoteScore.toFixed(0)} ({d.noVoteRatio}%)</div>
      <div className="item"><Building2 size={11} style={{ verticalAlign: -1 }} /> VPS: {d.votersPerStationScore.toFixed(0)} ({d.votersPerStation.toLocaleString()} คน/หน่วย)</div>
      {d.focusAreaTags && d.focusAreaTags.length > 0 && (
        <div className="item" style={{ fontSize: 10, marginTop: 2 }}>
          <Tag size={10} style={{ verticalAlign: -1 }} /> {d.focusAreaTags.map(t => FOCUS_AREA_LABELS[t] || t).join(', ')}
        </div>
      )}
      {d.isOfficialSpoiledData && (
        <div className="item" style={{ fontSize: 10, color: '#5ed88a' }}><ShieldCheck size={10} style={{ verticalAlign: -1 }} /> ข้อมูลบัตรเสียจากทางการ กกต.</div>
      )}
      {d.win66PartyName && (
        <div className="item" style={{ fontSize: 10, opacity: 0.7 }}><RefreshCw size={10} style={{ verticalAlign: -1 }} /> ปี 66: {d.win66PartyName}</div>
      )}
    </div>
  )
}

/* ─── Tooltip: Party Summary ─── */
interface PartyTooltipProps {
  active?: boolean
  payload?: Array<{ payload: EnsemblePartySummaryItem }>
}

const PartyTooltip = ({ active, payload }: PartyTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.partyName}</div>
      <div className="item">เขตที่ชนะ: {d.totalAreas}</div>
      <div className="item" style={{ fontWeight: 700 }}>Score เฉลี่ย: {d.avgScore} | median: {d.medianScore}</div>
      <div className="item" style={{ color: '#42b8ff' }}><Star size={10} style={{ verticalAlign: -1 }} /> Significant (p&lt;0.05): {d.significantCount} ({pct(d.significantCount, d.totalAreas)}%)</div>
      <div className="item" style={{ color: '#e879f9' }}><MapIcon size={10} style={{ verticalAlign: -1 }} /> Hotspot (HH): {d.hotspotCount}</div>
      <div className="item" style={{ color: '#f44853' }}><CircleDot size={10} style={{ verticalAlign: -1 }} /> High Risk (≥50): {d.highRiskCount} ({pct(d.highRiskCount, d.totalAreas)}%)</div>
      <div className="item" style={{ color: '#ffa502' }}><CircleAlert size={10} style={{ verticalAlign: -1 }} /> Medium (30-49): {d.mediumRiskCount} ({pct(d.mediumRiskCount, d.totalAreas)}%)</div>
      <div className="item" style={{ color: '#5ed88a' }}><ShieldCheck size={10} style={{ verticalAlign: -1 }} /> Low (&lt;30): {d.lowRiskCount} ({pct(d.lowRiskCount, d.totalAreas)}%)</div>
    </div>
  )
}

/* ─── Helpers ─── */
function riskColor(level: string) {
  if (level === 'high') return '#f44853'
  if (level === 'medium') return '#ffa502'
  return '#5ed88a'
}

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0
}

function confidenceLabel(conf: string) {
  if (conf === 'very-high') return '★★★ p<0.01'
  if (conf === 'high') return '★★ p<0.05'
  if (conf === 'moderate') return '★ p<0.10'
  return '— ไม่มีนัยสำคัญ'
}

function confidenceStyle(conf: string): React.CSSProperties {
  if (conf === 'very-high') return { color: '#42b8ff', fontWeight: 700, fontSize: 11 }
  if (conf === 'high') return { color: '#5ed88a', fontWeight: 600, fontSize: 11 }
  if (conf === 'moderate') return { color: '#ffa502', fontSize: 11 }
  return { color: '#666', fontSize: 11 }
}

function clusterColor(cluster: string) {
  if (cluster === 'HH') return '#f44853'
  if (cluster === 'LL') return '#42b8ff'
  if (cluster === 'HL') return '#ffa502'
  if (cluster === 'LH') return '#5ed88a'
  return '#666'
}

function clusterLabel(cluster: string) {
  if (cluster === 'HH') return 'Hotspot (High-High)'
  if (cluster === 'LL') return 'Coldspot (Low-Low)'
  if (cluster === 'HL') return 'Outlier (High-Low)'
  if (cluster === 'LH') return 'Outlier (Low-High)'
  return 'Not Significant'
}

function labelColor(label: string) {
  if (label === 'suspect') return '#f44853'
  if (label === 'elevated') return '#ffa502'
  if (label === 'normal') return '#5ed88a'
  return '#666'
}

const FEATURE_LABELS: Record<string, string> = {
  gap: 'MP-PL Gap',
  plDev: 'PL Deviation',
  turnout: 'Turnout',
  competition: 'Competition',
  consistency: 'Consistency',
  spoiled: 'Spoiled Ballot',
  dominance: 'Winner Dominance',
  noVote: 'No-Vote Ratio',
  vps: 'Voters/Station',
}

const FEATURE_COLORS: Record<string, string> = {
  gap: '#42b8ff',
  plDev: '#ffa502',
  turnout: '#5ed88a',
  competition: '#e879f9',
  consistency: '#fb923c',
  spoiled: '#ef4444',
  dominance: '#a78bfa',
  noVote: '#f472b6',
  vps: '#22d3ee',
}

const FOCUS_AREA_LABELS: Record<string, string> = {
  'hot-area': '🔥 พื้นที่ร้อน',
  'mueang': '🏙️ เมือง',
  'powerhouse': '💪 ฐานเสียง',
  'thailand-cambodia-border': '🇰🇭 ชายแดนไทย-กัมพูชา',
  'three-southern-border': '🕌 สามจังหวัดชายแดนใต้',
}

const FOCUS_AREA_COLORS: Record<string, string> = {
  'hot-area': '#f44853',
  'mueang': '#42b8ff',
  'powerhouse': '#ffa502',
  'thailand-cambodia-border': '#5ed88a',
  'three-southern-border': '#e879f9',
}

/* ─── Component ─── */
interface Props {
  data: EnsembleAnalysisItem[]
  partySummary: EnsemblePartySummaryItem[]
  meta?: EnsembleMeta
  nameToCodeMap: NameToCodeMap
}

type ViewMode = 'party-summary' | 'top-areas' | 'scatter' | 'radar' | 'spatial' | 'table'

export default function EnsembleAnalysis({ data, partySummary, meta, nameToCodeMap }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('party-summary')
  const [topN, setTopN] = useState(30)
  const [filterParty, setFilterParty] = useState<string>('all')
  const [filterFocusArea, setFilterFocusArea] = useState<string>('all')

  // ─── Summary stats ───
  const stats = useMemo(() => {
    const high = data.filter(d => d.riskLevel === 'high').length
    const medium = data.filter(d => d.riskLevel === 'medium').length
    const low = data.filter(d => d.riskLevel === 'low').length
    const avg = data.length > 0 ? data.reduce((s, d) => s + d.finalScore, 0) / data.length : 0
    const significant = data.filter(d => d.pValue < 0.05).length
    const hotspots = data.filter(d => d.spatialCluster === 'HH').length
    return { high, medium, low, avg, total: data.length, significant, hotspots }
  }, [data])

  // ─── Unique parties for filter ───
  const parties = useMemo(() => {
    const seen = new Map<string, { name: string; color: string }>()
    for (const d of data) {
      if (!seen.has(d.winnerPartyCode)) {
        seen.set(d.winnerPartyCode, { name: d.winnerParty, color: d.winnerPartyColor })
      }
    }
    return Array.from(seen.entries())
      .map(([code, info]) => ({ code, ...info }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  // ─── Unique focus area tags ───
  const focusAreaTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const d of data) {
      for (const tag of d.focusAreaTags || []) tagSet.add(tag)
    }
    return Array.from(tagSet).sort()
  }, [data])

  // ─── Filtered data ───
  const filtered = useMemo(() => {
    let result = data
    if (filterParty !== 'all') result = result.filter(d => d.winnerPartyCode === filterParty)
    if (filterFocusArea !== 'all') result = result.filter(d => (d.focusAreaTags || []).includes(filterFocusArea))
    return result
  }, [data, filterParty, filterFocusArea])

  // ─── Top areas ───
  const topAreas = useMemo(() =>
    [...filtered].sort((a, b) => b.finalScore - a.finalScore).slice(0, topN),
    [filtered, topN]
  )

  // ─── Scatter data ───
  const scatterData = useMemo(() =>
    filtered.map(d => ({
      ...d,
      x: d.gapScore,
      y: d.plDeviationScore,
    })),
    [filtered]
  )

  // ─── Radar data per party (9 axes) ───
  const radarData = useMemo(() => {
    const byParty = new Map<string, {
      gap: number[]; dev: number[]; turnout: number[]; conc: number[]
      cons: number[]; spoiled: number[]; dom: number[]; noVote: number[]; vps: number[]; color: string; name: string
    }>()
    for (const d of data) {
      if (!byParty.has(d.winnerPartyCode)) {
        byParty.set(d.winnerPartyCode, {
          gap: [], dev: [], turnout: [], conc: [], cons: [], spoiled: [], dom: [], noVote: [], vps: [],
          color: d.winnerPartyColor, name: d.winnerParty,
        })
      }
      const p = byParty.get(d.winnerPartyCode)!
      p.gap.push(d.gapScaled)
      p.dev.push(d.plDeviationScore)
      p.turnout.push(d.turnoutScore)
      p.conc.push(d.concentrationScore)
      p.cons.push(d.consistencyScore)
      p.spoiled.push(d.spoiledScore)
      p.dom.push(d.dominanceScore)
      p.noVote.push(d.noVoteScore)
      p.vps.push(d.votersPerStationScore)
    }
    const result: Array<{
      party: string; color: string
      gapAvg: number; devAvg: number; turnoutAvg: number; concAvg: number
      consAvg: number; spoiledAvg: number; domAvg: number; noVoteAvg: number; vpsAvg: number
    }> = []
    for (const [, v] of byParty) {
      if (v.gap.length >= 10) {
        const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        result.push({
          party: v.name, color: v.color,
          gapAvg: avg(v.gap), devAvg: avg(v.dev), turnoutAvg: avg(v.turnout),
          concAvg: avg(v.conc), consAvg: avg(v.cons),
          spoiledAvg: avg(v.spoiled), domAvg: avg(v.dom), noVoteAvg: avg(v.noVote), vpsAvg: avg(v.vps),
        })
      }
    }
    return result.sort((a, b) => b.gapAvg - a.gapAvg)
  }, [data])

  // ─── Radar chart data format (9 axes) ───
  const radarChartData = useMemo(() => [
    { subject: 'Gap', ...Object.fromEntries(radarData.map(r => [r.party, r.gapAvg])) },
    { subject: 'PL Dev', ...Object.fromEntries(radarData.map(r => [r.party, r.devAvg])) },
    { subject: 'Turnout', ...Object.fromEntries(radarData.map(r => [r.party, r.turnoutAvg])) },
    { subject: 'Comp', ...Object.fromEntries(radarData.map(r => [r.party, r.concAvg])) },
    { subject: 'Cons', ...Object.fromEntries(radarData.map(r => [r.party, r.consAvg])) },
    { subject: 'Spoiled', ...Object.fromEntries(radarData.map(r => [r.party, r.spoiledAvg])) },
    { subject: 'Dominance', ...Object.fromEntries(radarData.map(r => [r.party, r.domAvg])) },
    { subject: 'No-Vote', ...Object.fromEntries(radarData.map(r => [r.party, r.noVoteAvg])) },
    { subject: 'VPS', ...Object.fromEntries(radarData.map(r => [r.party, r.vpsAvg])) },
  ], [radarData])

  // ─── Spatial cluster summary ───
  const spatialSummary = useMemo(() => {
    const clusters = { HH: 0, LL: 0, HL: 0, LH: 0, ns: 0 }
    for (const d of data) {
      clusters[d.spatialCluster] = (clusters[d.spatialCluster] || 0) + 1
    }
    return clusters
  }, [data])

  // ─── Entropy weight pie data ───
  const entropyPieData = useMemo(() => {
    const w = meta?.entropyWeights || data[0]?.entropyWeights || {}
    return Object.entries(w).map(([key, value]) => ({
      name: FEATURE_LABELS[key] || key,
      value: Math.round(value * 1000) / 10,
      fill: FEATURE_COLORS[key] || '#888',
    }))
  }, [meta, data])

  return (
    <div className="section">
      <div className="section-title">
        <span className="emoji">🧪</span>
        Ensemble Suspicion Score V4: Official กกต. Data + Focus Areas
      </div>
      <div className="section-desc">
        คำนวณ Suspicion Score จาก <strong>9 ตัวชี้วัด</strong> + <strong>ข้อมูลทางการ กกต.</strong> (บัตรเสีย, ผู้ไม่ไปใช้สิทธิ์) +
        <strong> Focus Area Filters</strong> + <strong>Entropy Weight</strong> +
        <strong> Permutation Test</strong> + <strong>Moran&apos;s I</strong> +
        <strong> Semi-supervised Labels</strong>
      </div>

      {/* ─── V3 Methodology ─── */}
      <div style={{
        margin: '16px 0 20px', padding: 20, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 10, border: '1px solid #2a2a4a', lineHeight: 1.9,
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📖</span> Ensemble V4 — What&apos;s New?
        </div>

        <div style={{ fontSize: 13, marginBottom: 12 }}>
          <strong>V4</strong> อัปเกรดจาก V3: ตัวชี้วัดเป็น <strong>9 ตัว</strong> (เพิ่ม No-Vote Ratio + Voters/Station),
          ใช้ <strong>ข้อมูลทางการ กกต.</strong> (บัตรเสียจริง แทน proxy), เพิ่ม <strong>Focus Area Filters</strong>
          (พื้นที่ร้อน, เมือง, ฐานเสียง, ชายแดน) จาก ThaiPBS, และข้อมูล <strong>พรรคผู้ชนะปี 66</strong>
        </div>

        <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>ตัวชี้วัด 9 ตัว + น้ำหนัก Entropy:</div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16,
        }}>
          {entropyPieData.map(item => (
            <div key={item.name} style={{ background: '#ffffff08', borderRadius: 8, padding: '10px 12px', border: `1px solid ${item.fill}33` }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: item.fill }}>●</span> {item.name}
                <span style={{ opacity: 0.5, fontWeight: 400, marginLeft: 4 }}>({item.value}%)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Entropy pie chart */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 180, height: 180 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={entropyPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={75} innerRadius={35} paddingAngle={2} label={({ value }) => `${value}%`}
                  labelLine={false} style={{ fontSize: 9 }}
                >
                  {entropyPieData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: 12, lineHeight: 2, flex: 1 }}>
            <div><strong>Entropy Weight Method:</strong></div>
            <div style={{ opacity: 0.8, fontSize: 11 }}>
              คำนวณ Information Entropy ของแต่ละ feature → feature ที่มี variation สูง (entropy ต่ำ)
              ได้น้ำหนักมากกว่า ≠ กำหนดเองแบบ V2 (40/25/15/10/10)
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}><Sparkles size={14} style={{ verticalAlign: -2 }} /> สิ่งที่ V4 เพิ่มจาก V3:</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#f472b610', border: '1px solid #f472b633', borderRadius: 6 }}>
            <strong><Ban size={11} style={{ verticalAlign: -2 }} /> No-Vote Ratio</strong> — สัดส่วนผู้ไม่ไปใช้สิทธิ์ (ข้อมูลทางการ กกต.)
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#ef444410', border: '1px solid #ef444433', borderRadius: 6 }}>
            <strong><ShieldCheck size={11} style={{ verticalAlign: -2 }} /> Official Spoiled</strong> — ใช้บัตรเสียจริงจาก กกต. แทน proxy
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#ffa50210', border: '1px solid #ffa50233', borderRadius: 6 }}>
            <strong><Tag size={11} style={{ verticalAlign: -2 }} /> Focus Areas</strong> — กรองตามพื้นที่ร้อน, เมือง, ฐานเสียง, ชายแดน
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#42b8ff10', border: '1px solid #42b8ff33', borderRadius: 6 }}>
            <strong><RefreshCw size={11} style={{ verticalAlign: -2 }} /> Win66 Party</strong> — เทียบพรรคผู้ชนะปี 66 vs ปี 69
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#22d3ee10', border: '1px solid #22d3ee33', borderRadius: 6 }}>
            <strong><Building2 size={11} style={{ verticalAlign: -2 }} /> Voters/Station</strong> — ผู้มีสิทธิ์/หน่วยเลือกตั้ง (proxy ความเป็นเมือง/ชนบท)
          </div>
        </div>

        {meta && (
          <>
          <div style={{
            fontSize: 12, padding: '10px 14px', background: '#ffffff08', borderRadius: 6,
            border: '1px solid #ffffff15', display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8,
          }}>
            <div><FlaskConical size={11} style={{ verticalAlign: -2 }} /> Version: <strong>{meta.version}</strong></div>
            <div><BarChart3 size={11} style={{ verticalAlign: -2 }} /> Features: <strong>{meta.features}</strong></div>
            <div><Sparkles size={11} style={{ verticalAlign: -2 }} /> Permutations: <strong>{meta.permutationIterations.toLocaleString()}</strong></div>
            <div><MapIcon size={11} style={{ verticalAlign: -2 }} /> Global Moran&apos;s I: <strong>{meta.globalMoranI}</strong></div>
            <div><Thermometer size={11} style={{ verticalAlign: -2, color: '#f44853' }} /> Hotspots: <strong>{meta.hotspots}</strong></div>
            <div><Thermometer size={11} style={{ verticalAlign: -2, color: '#42b8ff' }} /> Coldspots: <strong>{meta.coldspots}</strong></div>
            <div><Star size={11} style={{ verticalAlign: -2, color: '#ffa502' }} /> p&lt;0.01: <strong>{meta.pLt001}</strong></div>
            <div><Star size={11} style={{ verticalAlign: -2 }} /> p&lt;0.05: <strong>{meta.pLt005}</strong></div>
            <div><Tag size={11} style={{ verticalAlign: -2, color: '#f44853' }} /> Suspect: <strong>{meta.suspectLabels}</strong></div>
            <div><Tag size={11} style={{ verticalAlign: -2, color: '#ffa502' }} /> Elevated: <strong>{meta.elevatedLabels}</strong></div>
            <div><ShieldCheck size={11} style={{ verticalAlign: -2, color: '#5ed88a' }} /> Official บัตรเสีย: <strong>{meta.officialSpoiledCount}</strong> เขต</div>
          </div>

          {/* Focus area tag counts */}
          {meta.focusAreaCounts && Object.keys(meta.focusAreaCounts).length > 0 && (
            <div style={{
              fontSize: 12, padding: '10px 14px', background: '#ffffff08', borderRadius: 6,
              border: '1px solid #ffffff15', marginTop: 8,
              display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600 }}><Tag size={12} style={{ verticalAlign: -2 }} /> Focus Areas:</span>
              {Object.entries(meta.focusAreaCounts).map(([tag, count]) => (
                <span key={tag} style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 11,
                  background: (FOCUS_AREA_COLORS[tag] || '#888') + '22',
                  color: FOCUS_AREA_COLORS[tag] || '#888',
                  fontWeight: 600,
                }}>
                  {FOCUS_AREA_LABELS[tag] || tag} ({count})
                </span>
              ))}
            </div>
          )}
          </>
        )}

        <div style={{ fontSize: 12, padding: '10px 12px', background: '#f4485315', borderRadius: 6, border: '1px solid #f4485333', marginTop: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <TriangleAlert size={14} style={{ flexShrink: 0, marginTop: 1, color: '#f44853' }} />
          <span><strong>ข้อควรระวัง:</strong> Score สูงไม่ได้พิสูจน์ว่ามีการซื้อเสียง — เป็นเพียงสัญญาณทางสถิติ
          ดู p-value, Spatial cluster, และ Semi-supervised label ประกอบ</span>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="overview-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#42b8ff' }}>{stats.significant}</div>
          <div className="stat-label"><Star size={12} style={{ verticalAlign: -2 }} /> Significant (p&lt;0.05)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#f44853' }}>{stats.high}</div>
          <div className="stat-label"><CircleDot size={12} style={{ verticalAlign: -2, color: '#f44853' }} /> High Risk (≥50)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ffa502' }}>{stats.medium}</div>
          <div className="stat-label"><CircleAlert size={12} style={{ verticalAlign: -2, color: '#ffa502' }} /> Medium (30-49)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#5ed88a' }}>{stats.low}</div>
          <div className="stat-label"><ShieldCheck size={12} style={{ verticalAlign: -2, color: '#5ed88a' }} /> Low (&lt;30)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#e879f9' }}>{stats.hotspots}</div>
          <div className="stat-label"><MapIcon size={12} style={{ verticalAlign: -2, color: '#e879f9' }} /> HH Hotspots</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.avg.toFixed(1)}</div>
          <div className="stat-label"><Gauge size={12} style={{ verticalAlign: -2 }} /> Score เฉลี่ย</div>
        </div>
      </div>

      {/* ─── View Toggle ─── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {([
          ['party-summary', 'สรุปรายพรรค', <BarChart3 size={14} key="i1" />],
          ['top-areas', 'เขตน่าสงสัยสูงสุด', <Trophy size={14} key="i2" />],
          ['scatter', 'Gap vs Deviation', <Microscope size={14} key="i3" />],
          ['radar', 'Radar 9 แกน', <RadarIcon size={14} key="i4" />],
          ['spatial', 'Spatial Cluster', <MapIcon size={14} key="i5" />],
          ['table', 'ตาราง', <Table2 size={14} key="i6" />],
        ] as [ViewMode, string, React.ReactNode][]).map(([mode, label, icon]) => (
          <button
            key={mode}
            className={`tab ${viewMode === mode ? 'active' : ''}`}
            onClick={() => setViewMode(mode)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ─── Party filter (for area views) ─── */}
      {(viewMode === 'top-areas' || viewMode === 'scatter' || viewMode === 'table' || viewMode === 'spatial') && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ opacity: 0.7 }}>กรองพรรค:</span>
          <select
            value={filterParty}
            onChange={e => setFilterParty(e.target.value)}
            style={{
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px',
            }}
          >
            <option value="all">ทั้งหมด ({data.length} เขต)</option>
            {parties.map(p => (
              <option key={p.code} value={p.code}>
                {p.name} ({data.filter(d => d.winnerPartyCode === p.code).length} เขต)
              </option>
            ))}
          </select>
          <span style={{ opacity: 0.7, marginLeft: 8 }}>พื้นที่:</span>
          <select
            value={filterFocusArea}
            onChange={e => setFilterFocusArea(e.target.value)}
            style={{
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px',
            }}
          >
            <option value="all">ทุกพื้นที่</option>
            {focusAreaTags.map(tag => (
              <option key={tag} value={tag}>
                {FOCUS_AREA_LABELS[tag] || tag} ({data.filter(d => (d.focusAreaTags || []).includes(tag)).length})
              </option>
            ))}
          </select>
          {viewMode === 'top-areas' && (
            <select
              value={topN}
              onChange={e => setTopN(Number(e.target.value))}
              style={{
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 8px',
              }}
            >
              {[20, 30, 50, 100].map(n => (
                <option key={n} value={n}>Top {n}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ═══ VIEW: Party Summary ═══ */}
      {viewMode === 'party-summary' && (
        <div>
          <div className="chart-container" style={{ height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={partySummary} layout="vertical" margin={{ left: 100, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" domain={[0, 100]} stroke="#888" />
                <YAxis type="category" dataKey="partyName" width={90} stroke="#888" tick={{ fontSize: 12 }} />
                <Tooltip content={<PartyTooltip />} />
                <Bar dataKey="avgScore" name="Score เฉลี่ย" radius={[0, 4, 4, 0]}>
                  {partySummary.map((p, i) => (
                    <Cell key={i} fill={p.partyColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stacked risk bar */}
          <div style={{ marginTop: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 14 }}>
              สัดส่วน Risk Level แยกรายพรรค
            </h3>
            {partySummary.map(p => (
              <div key={p.partyCode} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <PartyLogo partyCode={p.partyCode} partyName={p.partyName} nameToCodeMap={nameToCodeMap} size={22} />
                  <span style={{ fontSize: 13, minWidth: 120 }}>{p.partyName} ({p.totalAreas})</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>avg {p.avgScore} | med {p.medianScore}</span>
                  <span style={{ fontSize: 11, color: '#42b8ff' }}>★ sig: {p.significantCount}</span>
                  {p.hotspotCount > 0 && <span style={{ fontSize: 11, color: '#e879f9' }}>🗺️ HH: {p.hotspotCount}</span>}
                </div>
                <div style={{ display: 'flex', height: 18, borderRadius: 4, overflow: 'hidden', background: '#1a1a2e' }}>
                  {p.highRiskCount > 0 && (
                    <div style={{
                      width: `${pct(p.highRiskCount, p.totalAreas)}%`,
                      background: '#f44853',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 700, minWidth: 20,
                    }}>
                      {p.highRiskCount}
                    </div>
                  )}
                  {p.mediumRiskCount > 0 && (
                    <div style={{
                      width: `${pct(p.mediumRiskCount, p.totalAreas)}%`,
                      background: '#ffa502',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#000', fontWeight: 700, minWidth: 20,
                    }}>
                      {p.mediumRiskCount}
                    </div>
                  )}
                  {p.lowRiskCount > 0 && (
                    <div style={{
                      width: `${pct(p.lowRiskCount, p.totalAreas)}%`,
                      background: '#5ed88a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#000', fontWeight: 700, minWidth: 20,
                    }}>
                      {p.lowRiskCount}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, opacity: 0.6 }}>
              <span>🔴 High (≥50)</span> <span>🟡 Medium (30-49)</span> <span>🟢 Low (&lt;30)</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW: Top Areas ═══ */}
      {viewMode === 'top-areas' && (
        <div className="chart-container" style={{ height: Math.max(400, topAreas.length * 28 + 60) }}>
          <ResponsiveContainer>
            <BarChart data={topAreas} layout="vertical" margin={{ left: 140, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" domain={[0, 100]} stroke="#888" />
              <YAxis
                type="category"
                dataKey="areaName"
                width={130}
                stroke="#888"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<AreaTooltip />} />
              <Bar dataKey="finalScore" name="Final Score" radius={[0, 4, 4, 0]}>
                {topAreas.map((d, i) => (
                  <Cell key={i} fill={riskColor(d.riskLevel)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ═══ VIEW: Scatter ═══ */}
      {viewMode === 'scatter' && (
        <div className="chart-container" style={{ height: 500 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                type="number" dataKey="x" name="MP-PL Gap %" domain={[0, 100]} stroke="#888"
                label={{ value: 'MP-PL Gap (%)', position: 'insideBottom', offset: -5, fill: '#888' }}
              />
              <YAxis
                type="number" dataKey="y" name="PL Deviation" domain={[0, 100]} stroke="#888"
                label={{ value: 'PL Deviation Score', angle: -90, position: 'insideLeft', fill: '#888' }}
              />
              <ZAxis type="number" dataKey="finalScore" range={[30, 300]} />
              <Tooltip content={<AreaTooltip />} />
              <Scatter data={scatterData}>
                {scatterData.map((d, i) => (
                  <Cell key={i} fill={d.winnerPartyColor} fillOpacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ textAlign: 'center', fontSize: 11, opacity: 0.5, marginTop: 4 }}>
            ขนาดจุด = Final Score | สี = พรรคผู้ชนะ MP
          </div>
        </div>
      )}

      {/* ═══ VIEW: Radar (7 axes) ═══ */}
      {viewMode === 'radar' && (
        <div>
          <div className="chart-container" style={{ height: 450 }}>
            <ResponsiveContainer>
              <RadarChart data={radarChartData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" stroke="#888" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#555" />
                {radarData.map(r => (
                  <Radar
                    key={r.party} name={r.party} dataKey={r.party}
                    stroke={r.color} fill={r.color} fillOpacity={0.15} strokeWidth={2}
                  />
                ))}
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            {radarData.map(r => (
              <div key={r.party} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: r.color }} />
                {r.party}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ VIEW: Spatial Cluster ═══ */}
      {viewMode === 'spatial' && (
        <div>
          {/* Cluster summary cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            {(['HH', 'LL', 'HL', 'LH', 'ns'] as const).map(cl => (
              <div key={cl} style={{
                background: 'var(--bg-card)', borderRadius: 8, padding: '12px 16px',
                border: `2px solid ${clusterColor(cl)}44`, flex: '1 1 120px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: clusterColor(cl) }}>
                  {spatialSummary[cl]}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                  {clusterLabel(cl)}
                </div>
              </div>
            ))}
          </div>

          {meta && (
            <div style={{
              padding: 12, background: 'var(--bg-card)', borderRadius: 8, marginBottom: 16,
              border: '1px solid var(--border-color)', fontSize: 13,
            }}>
              🗺️ <strong>Global Moran&apos;s I = {meta.globalMoranI}</strong>
              <span style={{ opacity: 0.7, marginLeft: 8 }}>
                ({meta.globalMoranI > 0 ? 'Positive spatial autocorrelation — suspicious areas tend to cluster' : 'No significant spatial pattern'})
              </span>
            </div>
          )}

          {/* Spatial cluster table */}
          <h3 style={{ fontSize: 14, marginBottom: 12, color: '#f44853' }}>
            🔥 Spatial Clusters — เขตที่มีรูปแบบทางภูมิศาสตร์
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>เขต</th>
                  <th>จังหวัด</th>
                  <th>พรรค</th>
                  <th style={{ textAlign: 'center' }}>Final</th>
                  <th style={{ textAlign: 'center' }}>Moran&apos;s I</th>
                  <th style={{ textAlign: 'center' }}>Spatial Lag</th>
                  <th style={{ textAlign: 'center' }}>p-value</th>
                  <th style={{ textAlign: 'center' }}>Label</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .filter(d => d.spatialCluster !== 'ns')
                  .sort((a, b) => {
                    const order: Record<string, number> = { HH: 0, HL: 1, LH: 2, LL: 3, ns: 4 }
                    return (order[a.spatialCluster] ?? 4) - (order[b.spatialCluster] ?? 4) || b.finalScore - a.finalScore
                  })
                  .slice(0, 80)
                  .map((d, i) => (
                    <tr key={d.areaCode} style={{ borderLeft: `3px solid ${clusterColor(d.spatialCluster)}` }}>
                      <td style={{ textAlign: 'center', opacity: 0.5 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{d.areaName}</td>
                      <td>{d.province}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <PartyLogo partyCode={d.winnerPartyCode} size={18} />
                          <span style={{ color: d.winnerPartyColor }}>{d.winnerParty}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: riskColor(d.riskLevel) }}>
                        {d.finalScore}
                      </td>
                      <td style={{ textAlign: 'center', color: clusterColor(d.spatialCluster) }}>
                        {d.moranI.toFixed(2)} ({d.spatialCluster})
                      </td>
                      <td style={{ textAlign: 'center' }}>{d.spatialLag.toFixed(1)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ ...confidenceStyle(d.confidence) }}>
                          {d.pValue < 0.001 ? '&lt;0.001' : d.pValue.toFixed(3)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                          background: labelColor(d.semiSupervisedLabel) + '22',
                          color: labelColor(d.semiSupervisedLabel),
                        }}>
                          {d.semiSupervisedLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ VIEW: Table ═══ */}
      {viewMode === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>#</th>
                <th>เขต</th>
                <th>จังหวัด</th>
                <th>พรรค</th>
                <th style={{ textAlign: 'center' }}>Final</th>
                <th style={{ textAlign: 'center' }}>p</th>
                <th style={{ textAlign: 'center' }}>Risk</th>
                <th style={{ textAlign: 'center' }}>Gap</th>
                <th style={{ textAlign: 'center' }}>Dev</th>
                <th style={{ textAlign: 'center' }}>Turn</th>
                <th style={{ textAlign: 'center' }}>Comp</th>
                <th style={{ textAlign: 'center' }}>Cons</th>
                <th style={{ textAlign: 'center' }}>Spoil</th>
                <th style={{ textAlign: 'center' }}>Dom</th>
                <th style={{ textAlign: 'center' }}>NoV</th>
                <th style={{ textAlign: 'center' }}>VPS</th>
                <th style={{ textAlign: 'center' }}>Moran</th>
                <th style={{ textAlign: 'center' }}>Label</th>
                <th style={{ textAlign: 'center' }}>Tags</th>
              </tr>
            </thead>
            <tbody>
              {[...filtered].sort((a, b) => b.finalScore - a.finalScore).slice(0, 100).map((d, i) => (
                <tr key={d.areaCode} style={{ borderLeft: `3px solid ${riskColor(d.riskLevel)}` }}>
                  <td style={{ textAlign: 'center', opacity: 0.5 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{d.areaName}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{d.province}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <PartyLogo partyCode={d.winnerPartyCode} size={16} />
                      <span style={{ color: d.winnerPartyColor, whiteSpace: 'nowrap' }}>{d.winnerParty}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: riskColor(d.riskLevel) }}>
                    {d.finalScore}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ ...confidenceStyle(d.confidence), fontSize: 10 }}>
                      {d.pValue < 0.001 ? '<.001' : d.pValue.toFixed(3)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 700,
                      background: riskColor(d.riskLevel) + '22', color: riskColor(d.riskLevel),
                    }}>
                      {d.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{d.gapScore}%</td>
                  <td style={{ textAlign: 'center' }}>{d.plDeviationScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {d.turnoutDeviation > 0 ? '+' : ''}{d.turnoutDeviation}%
                  </td>
                  <td style={{ textAlign: 'center' }}>{d.concentrationScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>{d.consistencyScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>{d.spoiledScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>{d.dominanceScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>{d.noVoteScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>{d.votersPerStationScore.toFixed(0)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {d.spatialCluster !== 'ns' ? (
                      <span style={{ color: clusterColor(d.spatialCluster), fontWeight: 700, fontSize: 10 }}>
                        {d.spatialCluster}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: 10 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {d.semiSupervisedLabel !== 'unlabeled' ? (
                      <span style={{
                        padding: '1px 5px', borderRadius: 8, fontSize: 9, fontWeight: 600,
                        background: labelColor(d.semiSupervisedLabel) + '22',
                        color: labelColor(d.semiSupervisedLabel),
                      }}>
                        {d.semiSupervisedLabel === 'suspect' ? '🚨' : d.semiSupervisedLabel === 'elevated' ? '⬆️' : '✅'}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: 10 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {d.focusAreaTags && d.focusAreaTags.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                        {d.focusAreaTags.map(tag => (
                          <span key={tag} style={{
                            padding: '1px 4px', borderRadius: 6, fontSize: 8, fontWeight: 600,
                            background: (FOCUS_AREA_COLORS[tag] || '#888') + '22',
                            color: FOCUS_AREA_COLORS[tag] || '#888',
                            whiteSpace: 'nowrap',
                          }}>
                            {tag === 'hot-area' ? '🔥' : tag === 'mueang' ? '🏙️' : tag === 'powerhouse' ? '💪' : tag === 'thailand-cambodia-border' ? '🇰🇭' : '🕌'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ opacity: 0.3, fontSize: 10 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Methodology Note ─── */}
      <div style={{
        marginTop: 24, padding: 16, background: 'var(--bg-card)',
        borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12, lineHeight: 1.8,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FlaskConical size={16} /> V4 Methodology
        </div>
        <div>
          <strong>V4 Upgrade:</strong> ใช้ข้อมูลทางการจาก กกต. (badVotePercent, noVotePercent, totalEligibleVoters)
          แทนการประมาณค่า proxy + เพิ่มตัวชี้วัดที่ 8: <strong>No-Vote Ratio</strong> + ตัวชี้วัดที่ 9: <strong>Voters/Station</strong>
          (proxy ความเป็นเมือง/ชนบท: เขตที่มีผู้มีสิทธิ์/หน่วยเลือกตั้งสูงผิดปกติ ตรวจสอบยากขึ้น)
          + <strong>Focus Area Filters</strong> จาก ThaiPBS
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Entropy Weight Method:</strong> คำนวณ Information Entropy ของ 9 features →
          feature ที่มี variation สูง (entropy ต่ำ, divergence สูง) ได้น้ำหนักมากกว่าอัตโนมัติ
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Moran&apos;s I (Spatial Autocorrelation):</strong> วัดว่าเขตที่มี score สูง/ต่ำ
          อยู่ใกล้กันทางภูมิศาสตร์หรือไม่ <strong>HH (High-High)</strong> = hotspot ที่น่าสงสัยทั้ง cluster,
          <strong> LL</strong> = coldspot (ปกติทั้ง cluster), <strong>HL/LH</strong> = outlier
          Global Moran&apos;s I &gt; 0 = มี positive spatial autocorrelation
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Semi-supervised Labels:</strong> ใช้ top 5% (+ p&lt;0.10) เป็น pseudo-label &quot;suspect&quot;,
          bottom 25% เป็น &quot;normal&quot; แล้วทำ label propagation:
          ถ้าเพื่อนบ้านของเขตหนึ่ง ≥30% เป็น suspect และ p&lt;0.15 → &quot;elevated&quot;
          ช่วยจับ edge cases ที่ score ไม่สูงมากแต่อยู่ใน cluster น่าสงสัย
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Final Score:</strong> Raw Score × Population Weight × Spatial Boost × Label Boost
          — HH hotspot +10%, suspect +5%, elevated +3%
        </div>
      </div>
    </div>
  )
}
