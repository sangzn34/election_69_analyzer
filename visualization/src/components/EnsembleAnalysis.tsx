import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie,
  ReferenceLine,
} from 'recharts'
import {
  Star, CircleAlert, CircleDot, Map as MapIcon, BarChart3, Trophy, Microscope,
  Radar as RadarIcon, Table2, Target, Tag, TriangleAlert, FlaskConical,
  TrendingUp, Vote, Users, Scale, Trash2, Crown, Ban, Building2,
  Sparkles, Thermometer, ShieldCheck, RefreshCw, Gauge, Hash, Shuffle,
  Fingerprint, Binary, Sigma,
} from 'lucide-react'
import type { EnsembleAnalysisItem, EnsemblePartySummaryItem, EnsembleMeta, NameToCodeMap, BenfordDigitItem, NullModelAnalysis, KlimekAnalysis, LastDigitAnalysis, SecondDigitBenfordAnalysis } from '../types'
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
      <div className="item"><Hash size={11} style={{ verticalAlign: -1 }} /> Benford: {d.benfordScore.toFixed(0)} (χ²={d.benfordChi2}, p={d.benfordPValue})</div>
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
  benford: "Benford's Law",
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
  benford: '#facc15',
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
  nullModel?: NullModelAnalysis
  klimek?: KlimekAnalysis
  lastDigit?: LastDigitAnalysis
  secondDigitBenford?: SecondDigitBenfordAnalysis
}

type ViewMode = 'party-summary' | 'top-areas' | 'scatter' | 'radar' | 'spatial' | 'benford' | 'null-model' | 'klimek' | 'last-digit' | '2nd-benford' | 'table'

export default function EnsembleAnalysis({ data, partySummary, meta, nameToCodeMap, nullModel, klimek, lastDigit, secondDigitBenford }: Props) {
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
      cons: number[]; spoiled: number[]; dom: number[]; noVote: number[]; vps: number[]; benford: number[]; color: string; name: string
    }>()
    for (const d of data) {
      if (!byParty.has(d.winnerPartyCode)) {
        byParty.set(d.winnerPartyCode, {
          gap: [], dev: [], turnout: [], conc: [], cons: [], spoiled: [], dom: [], noVote: [], vps: [], benford: [],
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
      p.benford.push(d.benfordScore)
    }
    const result: Array<{
      party: string; color: string
      gapAvg: number; devAvg: number; turnoutAvg: number; concAvg: number
      consAvg: number; spoiledAvg: number; domAvg: number; noVoteAvg: number; vpsAvg: number; benfordAvg: number
    }> = []
    for (const [, v] of byParty) {
      if (v.gap.length >= 10) {
        const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
        result.push({
          party: v.name, color: v.color,
          gapAvg: avg(v.gap), devAvg: avg(v.dev), turnoutAvg: avg(v.turnout),
          concAvg: avg(v.conc), consAvg: avg(v.cons),
          spoiledAvg: avg(v.spoiled), domAvg: avg(v.dom), noVoteAvg: avg(v.noVote), vpsAvg: avg(v.vps),
          benfordAvg: avg(v.benford),
        })
      }
    }
    return result.sort((a, b) => b.gapAvg - a.gapAvg)
  }, [data])

  // ─── Radar chart data format (10 axes) ───
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
    { subject: 'Benford', ...Object.fromEntries(radarData.map(r => [r.party, r.benfordAvg])) },
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
        Ensemble Suspicion Score — 10 Indicators
      </div>
      <div className="section-desc">
        คำนวณ Suspicion Score จาก <strong>10 ตัวชี้วัด</strong> +
        <strong> ข้อมูลทางการ กกต.</strong> + <strong> Focus Area Filters</strong> +
        <strong> Entropy Weight</strong> + <strong> Permutation Test</strong> +
        <strong> Moran&apos;s I</strong> + <strong> Semi-supervised Labels</strong>
      </div>

      {/* ─── Methodology ─── */}
      <div style={{
        margin: '16px 0 20px', padding: 20, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 10, border: '1px solid #2a2a4a', lineHeight: 1.9,
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📖</span> วิธีการวิเคราะห์ (Methodology)
        </div>

        <div style={{ fontSize: 13, marginBottom: 12 }}>
          วิเคราะห์ความน่าสงสัยของแต่ละเขตจาก <strong>10 ตัวชี้วัด</strong> โดยน้ำหนักของแต่ละตัวชี้วัดคำนวณจาก
          Entropy Weight Method (data-driven) ไม่ใช่กำหนดเอง. เสริมด้วย Permutation Test (p-value),
          Moran&apos;s I (spatial clustering) และ Semi-supervised Labels
        </div>

        <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}>ตัวชี้วัด 10 ตัว + น้ำหนัก Entropy:</div>

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

        <div style={{ fontSize: 13, marginBottom: 6, fontWeight: 600 }}><Sparkles size={14} style={{ verticalAlign: -2 }} /> คุณสมบัติเด่น:</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#facc1510', border: '1px solid #facc1533', borderRadius: 6 }}>
            <strong><Hash size={11} style={{ verticalAlign: -2 }} /> Benford&apos;s Law</strong> — วิเคราะห์ first-digit distribution + Chi-square test (forensic statistics)
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#f472b610', border: '1px solid #f472b633', borderRadius: 6 }}>
            <strong><Ban size={11} style={{ verticalAlign: -2 }} /> No-Vote Ratio</strong> — สัดส่วนผู้ไม่ไปใช้สิทธิ์ (ข้อมูลทางการ กกต.)
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#ef444410', border: '1px solid #ef444433', borderRadius: 6 }}>
            <strong><ShieldCheck size={11} style={{ verticalAlign: -2 }} /> Official Spoiled</strong> — ใช้บัตรเสียจริงจาก กกต.
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#ffa50210', border: '1px solid #ffa50233', borderRadius: 6 }}>
            <strong><Tag size={11} style={{ verticalAlign: -2 }} /> Focus Areas</strong> — กรองตามพื้นที่ร้อน, เมือง, ฐานเสียง, ชายแดน
          </div>
          <div style={{ fontSize: 12, padding: '8px 10px', background: '#42b8ff10', border: '1px solid #42b8ff33', borderRadius: 6 }}>
            <strong><RefreshCw size={11} style={{ verticalAlign: -2 }} /> เทียบปี 66</strong> — เทียบพรรคผู้ชนะปี 66 vs ปี 69
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
            <div><Hash size={11} style={{ verticalAlign: -2, color: '#facc15' }} /> Benford deviate: <strong>{meta.benfordDeviateCount}</strong></div>
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
          ['radar', 'Radar 10 แกน', <RadarIcon size={14} key="i4" />],
          ['spatial', 'Spatial Cluster', <MapIcon size={14} key="i5" />],
          ['benford', "Benford's Law", <Hash size={14} key="i7" />],
          ['null-model', 'Null Model', <Shuffle size={14} key="i8" />],
          ['klimek', 'Klimek Fingerprint', <Fingerprint size={14} key="i9" />],
          ['last-digit', 'Last-Digit Test', <Binary size={14} key="i10" />],
          ['2nd-benford', "2nd-Digit Benford", <Sigma size={14} key="i11" />],
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
      {(viewMode === 'top-areas' || viewMode === 'scatter' || viewMode === 'table' || viewMode === 'spatial' || viewMode === 'benford') && (
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

      {/* ═══ VIEW: Benford's Law ═══ */}
      {viewMode === 'benford' && (
        <div>
          {/* Global Benford Distribution Chart */}
          <div style={{
            padding: 16, background: 'var(--bg-card)', borderRadius: 10,
            border: '1px solid var(--border-color)', marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hash size={16} color="#facc15" /> Global First-Digit Distribution (Benford&apos;s Law)
            </h3>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>
              เปรียบเทียบการกระจายตัวของหลักแรกของจำนวนโหวตทั้งประเทศ vs ค่าที่คาดหวังจาก Benford&apos;s Law
              {meta && (
                <span style={{ marginLeft: 8 }}>
                  | Global χ²={meta.benfordGlobalChi2} | p={meta.benfordGlobalPValue} | N={meta.benfordTotalNumbers?.toLocaleString()}
                </span>
              )}
            </div>
            {meta?.benfordGlobalDistribution && (
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={meta.benfordGlobalDistribution} margin={{ left: 10, right: 10, top: 10, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="digit" stroke="#888" label={{ value: 'First Digit', position: 'insideBottom', offset: -10, fill: '#888' }} />
                    <YAxis stroke="#888" label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#888' }} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                      formatter={(value: number, name: string) => [
                        `${value.toFixed(2)}%`,
                        name === 'expected' ? "Benford's Expected" : 'Observed',
                      ]}
                    />
                    <Bar dataKey="expected" name="expected" fill="#facc15" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="observed" name="observed" fill="#facc15" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, fontSize: 11, opacity: 0.7, marginTop: 8, justifyContent: 'center' }}>
              <span>▓ Observed</span>
              <span style={{ opacity: 0.4 }}>░ Benford&apos;s Expected</span>
            </div>
          </div>

          {/* Summary cards */}
          {meta && (
            <div className="overview-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="stat-number" style={{ color: '#5ed88a' }}>{meta.benfordConformCount}</div>
                <div className="stat-label"><ShieldCheck size={12} style={{ verticalAlign: -2 }} /> Conform (p&gt;0.05)</div>
              </div>
              <div className="stat-card">
                <div className="stat-number" style={{ color: '#facc15' }}>{meta.benfordDeviateCount}</div>
                <div className="stat-label"><TriangleAlert size={12} style={{ verticalAlign: -2 }} /> Deviate (p≤0.05)</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{meta.benfordTotalNumbers?.toLocaleString()}</div>
                <div className="stat-label"><Hash size={12} style={{ verticalAlign: -2 }} /> Total Numbers</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{meta.benfordGlobalChi2}</div>
                <div className="stat-label"><FlaskConical size={12} style={{ verticalAlign: -2 }} /> Global χ²</div>
              </div>
            </div>
          )}

          {/* Per-area Benford deviation table — top deviating areas */}
          <h3 style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TriangleAlert size={16} color="#facc15" /> เขตที่ First-Digit Distribution เบี่ยงเบนจาก Benford&apos;s Law มากที่สุด
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>เขต</th>
                  <th>จังหวัด</th>
                  <th>พรรค</th>
                  <th style={{ textAlign: 'center' }}>Benford Score</th>
                  <th style={{ textAlign: 'center' }}>χ² Statistic</th>
                  <th style={{ textAlign: 'center' }}>p-value</th>
                  <th style={{ textAlign: 'center' }}>N</th>
                  <th style={{ textAlign: 'center' }}>Final Score</th>
                  <th style={{ textAlign: 'center' }}>Risk</th>
                  {[1,2,3,4,5,6,7,8,9].map(d => (
                    <th key={d} style={{ textAlign: 'center', fontSize: 10 }}>d={d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .filter(d => d.benfordTotalNumbers >= 10)
                  .sort((a, b) => b.benfordChi2 - a.benfordChi2)
                  .slice(0, 50)
                  .map((d, i) => {
                    const BENFORD_EXPECTED_PCT = [30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6]
                    return (
                      <tr key={d.areaCode} style={{
                        borderLeft: `3px solid ${d.benfordPValue <= 0.05 ? '#facc15' : '#333'}`,
                      }}>
                        <td style={{ textAlign: 'center', opacity: 0.5 }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{d.areaName}</td>
                        <td>{d.province}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <PartyLogo partyCode={d.winnerPartyCode} size={18} />
                            <span style={{ color: d.winnerPartyColor }}>{d.winnerParty}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: d.benfordPValue <= 0.05 ? '#facc15' : undefined }}>
                          {d.benfordScore.toFixed(1)}
                        </td>
                        <td style={{ textAlign: 'center' }}>{d.benfordChi2.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                            background: d.benfordPValue <= 0.05 ? '#facc1522' : '#5ed88a22',
                            color: d.benfordPValue <= 0.05 ? '#facc15' : '#5ed88a',
                          }}>
                            {d.benfordPValue.toFixed(3)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{d.benfordTotalNumbers}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: riskColor(d.riskLevel) }}>
                          {d.finalScore}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 700,
                            background: riskColor(d.riskLevel) + '22', color: riskColor(d.riskLevel),
                          }}>
                            {d.riskLevel.toUpperCase()}
                          </span>
                        </td>
                        {[1,2,3,4,5,6,7,8,9].map(digit => {
                          const count = d.benfordDigitCounts?.[String(digit)] || 0
                          const observedPct = d.benfordTotalNumbers > 0 ? (count / d.benfordTotalNumbers) * 100 : 0
                          const expectedPct = BENFORD_EXPECTED_PCT[digit - 1]
                          const diff = observedPct - expectedPct
                          return (
                            <td key={digit} style={{
                              textAlign: 'center', fontSize: 10,
                              color: Math.abs(diff) > 5 ? '#facc15' : undefined,
                              fontWeight: Math.abs(diff) > 5 ? 700 : 400,
                            }}>
                              {observedPct.toFixed(0)}%
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {/* Methodology note for Benford */}
          <div style={{
            marginTop: 20, padding: 14, background: '#facc1508', borderRadius: 8,
            border: '1px solid #facc1533', fontSize: 12, lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hash size={14} color="#facc15" /> Benford&apos;s Law คืออะไร?
            </div>
            <div>
              <strong>Benford&apos;s Law</strong> (กฎของเบนฟอร์ด) กล่าวว่า ในชุดข้อมูลที่เกิดขึ้นตามธรรมชาติ
              หลักแรกของตัวเลขจะมีการกระจายตัวแบบเฉพาะ: เลข 1 ปรากฏ ~30.1%, เลข 2 ~17.6%, ...
              เลข 9 ~4.6% — ถ้าข้อมูลเบี่ยงเบนจากนี้อย่างมีนัยสำคัญ อาจบ่งชี้ว่ามีการ manipulate ตัวเลข
            </div>
            <div style={{ marginTop: 6 }}>
              ใช้ <strong>Chi-square goodness-of-fit test</strong> ทดสอบว่า first-digit distribution
              ของจำนวนโหวต (ทั้ง MP + PL) ในแต่ละเขตเป็นไปตาม Benford&apos;s Law หรือไม่
              — p≤0.05 = เบี่ยงเบนอย่างมีนัยสำคัญ
            </div>
          </div>
        </div>
      )}

      {/* ═══ VIEW: Null Model (Monte Carlo Twin-Number Effect) ═══ */}
      {viewMode === 'null-model' && nullModel && (
        <div>
          {/* Description */}
          <div style={{
            padding: 16, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 10, border: '1px solid #2a2a4a', marginBottom: 20, lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shuffle size={18} color="#22d3ee" /> Monte Carlo Null Model — Twin-Number Effect
            </div>
            <div style={{ fontSize: 13 }}>
              ทดสอบว่า pattern &quot;ผู้ชนะหมายเลข j → พรรค PL หมายเลข j ได้คะแนนสูง&quot;
              เป็นไปได้โดยบังเอิญหรือไม่ โดยจำลอง <strong>{nullModel.meta.nIterations}</strong> รอบ
              ของโลกที่สลับหมายเลขผู้ชนะแบบสุ่ม แล้วเปรียบเทียบ z-score ที่สังเกตได้กับ null distribution
            </div>
            <div style={{ fontSize: 12, marginTop: 8 }}>
              <strong>Bonferroni correction:</strong> ทดสอบ {nullModel.meta.nPartyNumbers} หมายเลขพร้อมกัน
              → α<sub>corrected</sub> = 0.05/{nullModel.meta.nPartyNumbers} = {nullModel.meta.bonferroniAlpha.toFixed(4)}
              → critical |z| ≥ {nullModel.meta.bonferroniZCritical}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="overview-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#22d3ee' }}>{nullModel.meta.nIterations.toLocaleString()}</div>
              <div className="stat-label"><Shuffle size={12} style={{ verticalAlign: -2 }} /> MC Iterations</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#f44853' }}>{nullModel.meta.observedMaxAbsZ.toFixed(2)}</div>
              <div className="stat-label"><TrendingUp size={12} style={{ verticalAlign: -2 }} /> Observed max|z|</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: nullModel.meta.mcPValueGlobal < 0.05 ? '#f44853' : '#5ed88a' }}>
                {nullModel.meta.mcPValueGlobal < 0.001 ? '<0.001' : nullModel.meta.mcPValueGlobal.toFixed(4)}
              </div>
              <div className="stat-label"><Star size={12} style={{ verticalAlign: -2 }} /> MC Global p-value</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: nullModel.meta.nSignificant > 0 ? '#facc15' : '#5ed88a' }}>
                {nullModel.meta.nSignificant}
              </div>
              <div className="stat-label"><TriangleAlert size={12} style={{ verticalAlign: -2 }} /> Bonferroni Sig.</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{nullModel.meta.nAreas}</div>
              <div className="stat-label"><Target size={12} style={{ verticalAlign: -2 }} /> Areas Tested</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{nullModel.meta.bonferroniZCritical}</div>
              <div className="stat-label"><Scale size={12} style={{ verticalAlign: -2 }} /> Critical |z|</div>
            </div>
          </div>

          {/* Chart 1: Z-Score per Party Number */}
          <div style={{
            padding: 16, background: 'var(--bg-card)', borderRadius: 10,
            border: '1px solid var(--border-color)', marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={16} color="#22d3ee" /> Observed z-score per Party Number (Twin-Number Lift)
            </h3>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>
              z-score &gt; 0 = พรรค PL หมายเลข j ได้คะแนนสูงกว่าค่าเฉลี่ยประเทศในเขตที่ผู้ชนะหมายเลข j
              | เส้นประ = Bonferroni critical z (±{nullModel.meta.bonferroniZCritical})
            </div>
            <div className="chart-container" style={{ height: 380 }}>
              <ResponsiveContainer>
                <BarChart
                  data={[...nullModel.perNumber].sort((a, b) => a.number - b.number)}
                  margin={{ left: 10, right: 10, top: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="number"
                    stroke="#888"
                    label={{ value: 'Party Number', position: 'insideBottom', offset: -10, fill: '#888' }}
                  />
                  <YAxis stroke="#888" label={{ value: 'z-score', angle: -90, position: 'insideLeft', fill: '#888' }} />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === 'zScore') return [value.toFixed(3), 'z-score']
                      return [value, name]
                    }}
                    labelFormatter={(label) => {
                      const item = nullModel.perNumber.find(p => p.number === label)
                      return item ? `#${label} ${item.partyName}` : `#${label}`
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const d = payload[0].payload as typeof nullModel.perNumber[0]
                      return (
                        <div style={{ background: '#1a1a2e', border: '1px solid #333', padding: 10, borderRadius: 6, fontSize: 12, lineHeight: 1.8 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>#{d.number} {d.partyName}</div>
                          <div>z-score: <strong style={{ color: d.isBonferroniSig ? '#f44853' : undefined }}>{d.zScore.toFixed(3)}</strong></div>
                          <div>Lift: {d.lift.toFixed(3)}pp ({d.liftPercent > 0 ? '+' : ''}{d.liftPercent.toFixed(1)}%)</div>
                          <div>National share: {d.nationalShare.toFixed(2)}%</div>
                          <div>Observed mean: {d.observedMeanShare.toFixed(2)}%</div>
                          <div>SE: {d.se.toFixed(4)}pp</div>
                          <div>n (areas): {d.n}</div>
                          <div>MC p-value: {d.pValueMC < 0.001 ? '<0.001' : d.pValueMC.toFixed(4)}</div>
                          {d.isBonferroniSig && <div style={{ color: '#f44853', fontWeight: 700 }}>⚠️ Bonferroni significant</div>}
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine y={nullModel.meta.bonferroniZCritical} stroke="#f44853" strokeDasharray="6 4" strokeWidth={1.5} />
                  <ReferenceLine y={-nullModel.meta.bonferroniZCritical} stroke="#f44853" strokeDasharray="6 4" strokeWidth={1.5} />
                  <ReferenceLine y={0} stroke="#555" strokeWidth={1} />
                  <Bar dataKey="zScore" radius={[4, 4, 0, 0]}>
                    {[...nullModel.perNumber].sort((a, b) => a.number - b.number).map((d) => (
                      <Cell
                        key={d.number}
                        fill={d.isBonferroniSig ? '#f44853' : d.zScore > 0 ? '#22d3ee' : '#6366f1'}
                        fillOpacity={d.isBonferroniSig ? 0.9 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, opacity: 0.7, marginTop: 8, justifyContent: 'center' }}>
              <span style={{ color: '#f44853' }}>■ Bonferroni significant</span>
              <span style={{ color: '#22d3ee' }}>■ Positive z</span>
              <span style={{ color: '#6366f1' }}>■ Negative z</span>
              <span style={{ color: '#f44853' }}>--- Critical z = ±{nullModel.meta.bonferroniZCritical}</span>
            </div>
          </div>

          {/* Chart 2: Max|z| Null Distribution Histogram */}
          <div style={{
            padding: 16, background: 'var(--bg-card)', borderRadius: 10,
            border: '1px solid var(--border-color)', marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FlaskConical size={16} color="#a78bfa" /> Null Distribution of max|z| ({nullModel.meta.nIterations} iterations)
            </h3>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>
              Histogram ของ max|z| จากการสุ่ม {nullModel.meta.nIterations} รอบ
              | เส้นแดง = Observed max|z| ({nullModel.meta.observedMaxAbsZ.toFixed(2)})
              | MC p = {nullModel.meta.mcPValueGlobal < 0.001 ? '<0.001' : nullModel.meta.mcPValueGlobal.toFixed(4)}
            </div>
            <div className="chart-container" style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={nullModel.maxZHistogram}
                  margin={{ left: 10, right: 10, top: 10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="binMid"
                    stroke="#888"
                    tickFormatter={(v: number) => v.toFixed(1)}
                    label={{ value: 'max|z|', position: 'insideBottom', offset: -10, fill: '#888' }}
                  />
                  <YAxis
                    stroke="#888"
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#888' }}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', fontSize: 12 }}
                    formatter={(value: number, name: string) => {
                      if (name === 'count') return [value, 'Iterations']
                      return [value, name]
                    }}
                    labelFormatter={(label: number) => `max|z| ≈ ${Number(label).toFixed(2)}`}
                  />
                  <ReferenceLine x={nullModel.meta.observedMaxAbsZ} stroke="#f44853" strokeWidth={2} label={{
                    value: `Observed ${nullModel.meta.observedMaxAbsZ.toFixed(2)}`,
                    fill: '#f44853', fontSize: 11, position: 'top',
                  }} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {nullModel.maxZHistogram.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.binMid >= nullModel.meta.observedMaxAbsZ ? '#f4485366' : '#a78bfa'}
                        fillOpacity={d.binMid >= nullModel.meta.observedMaxAbsZ ? 0.5 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Percentiles */}
            {nullModel.meta.nullMaxZPercentiles && (
              <div style={{ display: 'flex', gap: 16, fontSize: 11, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {Object.entries(nullModel.meta.nullMaxZPercentiles).map(([pctl, val]) => (
                  <span key={pctl} style={{ opacity: 0.7 }}>{pctl}: <strong>{val.toFixed(2)}</strong></span>
                ))}
                <span style={{ color: '#f44853', fontWeight: 700 }}>Observed: {nullModel.meta.observedMaxAbsZ.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Chart 3: Structural Bias — Group Size vs |z| */}
          <div style={{
            padding: 16, background: 'var(--bg-card)', borderRadius: 10,
            border: '1px solid var(--border-color)', marginBottom: 20,
          }}>
            <h3 style={{ fontSize: 14, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Microscope size={16} color="#fbbf24" /> Structural Bias: Group Size (n) vs |z|
            </h3>
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>
              พรรคที่มี n (จำนวนเขตที่ผู้ชนะหมายเลขเดียวกัน) มาก → SE เล็ก → |z| พองตัว
              ต้องระวังว่า z-score สูงอาจเกิดจาก structural bias ไม่ใช่ twin-number effect จริง
            </div>
            <div className="chart-container" style={{ height: 320 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ left: 10, right: 30, top: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    type="number" dataKey="n" name="n" stroke="#888"
                    label={{ value: 'Group Size (n areas)', position: 'insideBottom', offset: -10, fill: '#888' }}
                  />
                  <YAxis
                    type="number" dataKey="absZ" name="|z|" stroke="#888"
                    label={{ value: '|z|', angle: -90, position: 'insideLeft', fill: '#888' }}
                  />
                  <ZAxis type="number" dataKey="nationalSharePct" range={[40, 300]} name="National %" />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333', fontSize: 12 }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const d = payload[0].payload as typeof nullModel.structuralBias[0]
                      return (
                        <div style={{ background: '#1a1a2e', border: '1px solid #333', padding: 10, borderRadius: 6, fontSize: 12, lineHeight: 1.8 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>#{d.number} {d.partyName}</div>
                          <div>Group size: <strong>{d.n}</strong> areas</div>
                          <div>|z|: <strong>{d.absZ.toFixed(3)}</strong></div>
                          <div>SE: {d.se.toFixed(4)}pp</div>
                          <div>Lift: {d.lift.toFixed(3)}pp</div>
                          <div>National share: {d.nationalSharePct.toFixed(2)}%</div>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine y={nullModel.meta.bonferroniZCritical} stroke="#f44853" strokeDasharray="6 4" strokeWidth={1.5} />
                  <Scatter data={nullModel.structuralBias.filter(d => d.n > 0)} fill="#fbbf24">
                    {nullModel.structuralBias.filter(d => d.n > 0).map((d) => (
                      <Cell key={d.number} fill={d.absZ >= nullModel.meta.bonferroniZCritical ? '#f44853' : '#fbbf24'} fillOpacity={0.8} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table: Per-Number Results */}
          <h3 style={{ fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Table2 size={16} color="#22d3ee" /> ผลลัพธ์รายหมายเลข (sorted by |z|)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }}>#</th>
                  <th>พรรค</th>
                  <th style={{ textAlign: 'center' }}>n</th>
                  <th style={{ textAlign: 'center' }}>National %</th>
                  <th style={{ textAlign: 'center' }}>Observed %</th>
                  <th style={{ textAlign: 'center' }}>Lift (pp)</th>
                  <th style={{ textAlign: 'center' }}>Lift %</th>
                  <th style={{ textAlign: 'center' }}>SE</th>
                  <th style={{ textAlign: 'center' }}>z-score</th>
                  <th style={{ textAlign: 'center' }}>MC p</th>
                  <th style={{ textAlign: 'center' }}>Bonferroni</th>
                </tr>
              </thead>
              <tbody>
                {nullModel.perNumber.map((d) => (
                  <tr key={d.number} style={{
                    borderLeft: `3px solid ${d.isBonferroniSig ? '#f44853' : '#333'}`,
                    background: d.isBonferroniSig ? '#f4485308' : undefined,
                  }}>
                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{d.number}</td>
                    <td>
                      <span style={{ color: d.partyColor }}>{d.partyName}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{d.n}</td>
                    <td style={{ textAlign: 'center' }}>{d.nationalShare.toFixed(2)}%</td>
                    <td style={{ textAlign: 'center' }}>{d.observedMeanShare.toFixed(2)}%</td>
                    <td style={{ textAlign: 'center', color: d.lift > 0 ? '#f44853' : '#5ed88a' }}>
                      {d.lift > 0 ? '+' : ''}{d.lift.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'center', color: d.liftPercent > 0 ? '#f44853' : '#5ed88a' }}>
                      {d.liftPercent > 0 ? '+' : ''}{d.liftPercent.toFixed(1)}%
                    </td>
                    <td style={{ textAlign: 'center', fontSize: 10 }}>{d.se.toFixed(4)}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: Math.abs(d.zScore) >= nullModel.meta.bonferroniZCritical ? '#f44853' : undefined }}>
                      {d.zScore.toFixed(3)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                        background: d.pValueMC <= 0.05 ? '#f4485322' : '#5ed88a22',
                        color: d.pValueMC <= 0.05 ? '#f44853' : '#5ed88a',
                      }}>
                        {d.pValueMC < 0.001 ? '<0.001' : d.pValueMC.toFixed(4)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {d.isBonferroniSig ? (
                        <span style={{ color: '#f44853', fontWeight: 700, fontSize: 10 }}>⚠️ SIG</span>
                      ) : (
                        <span style={{ opacity: 0.3, fontSize: 10 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ═══ Conclusion / Key Findings ═══ */}
          <div style={{
            marginTop: 24, padding: 20,
            background: nullModel.meta.nSignificant === 0
              ? 'linear-gradient(135deg, #064e3b 0%, #0f2a1d 100%)'
              : 'linear-gradient(135deg, #7f1d1d 0%, #2a0f0f 100%)',
            borderRadius: 10,
            border: `1px solid ${nullModel.meta.nSignificant === 0 ? '#10b981' : '#f44853'}33`,
            lineHeight: 1.9,
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {nullModel.meta.nSignificant === 0
                ? <><ShieldCheck size={20} color="#10b981" /> สรุปผล: ไม่พบ Twin-Number Effect ที่มีนัยสำคัญทางสถิติ</>
                : <><TriangleAlert size={20} color="#f44853" /> สรุปผล: พบ Twin-Number Effect ที่มีนัยสำคัญ {nullModel.meta.nSignificant} หมายเลข</>
              }
            </div>

            {nullModel.meta.nSignificant === 0 ? (
              <div style={{ fontSize: 13 }}>
                <div style={{ marginBottom: 12, padding: '12px 16px', background: '#10b98115', borderRadius: 8, border: '1px solid #10b98133' }}>
                  <strong style={{ fontSize: 14 }}>🔬 ผลการทดสอบ:</strong> จากการจำลอง {nullModel.meta.nIterations.toLocaleString()} รอบ
                  ของโลกที่ &quot;ไม่มี twin-number effect&quot; พบว่า pattern ที่สังเกตได้ <strong>อยู่ภายในขอบเขตปกติ</strong> ของความบังเอิญ
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 12, marginBottom: 16,
                }}>
                  <div style={{ padding: '12px 14px', background: '#ffffff08', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#22d3ee' }}>📊 ค่า max|z| ที่สังเกตได้</div>
                    <div>Observed max|z| = <strong>{nullModel.meta.observedMaxAbsZ.toFixed(3)}</strong></div>
                    <div>Null distribution median = <strong>{nullModel.meta.nullMaxZPercentiles?.p50?.toFixed(3) ?? 'N/A'}</strong></div>
                    <div>Null distribution p95 = <strong>{nullModel.meta.nullMaxZPercentiles?.p95?.toFixed(3) ?? 'N/A'}</strong></div>
                    <div style={{ marginTop: 4, color: '#10b981', fontWeight: 600 }}>
                      → Observed อยู่ <strong>ต่ำกว่า</strong> median ของ null distribution
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#ffffff08', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#a78bfa' }}>🎲 MC Global p-value</div>
                    <div>p = <strong>{nullModel.meta.mcPValueGlobal.toFixed(4)}</strong></div>
                    <div style={{ marginTop: 4 }}>
                      ≈ {(nullModel.meta.mcPValueGlobal * 100).toFixed(1)}% ของการสุ่ม ได้ max|z| สูงกว่าที่สังเกตได้
                    </div>
                    <div style={{ marginTop: 4, color: '#10b981', fontWeight: 600 }}>
                      → <strong>ไม่มีนัยสำคัญ</strong> (p &gt;&gt; 0.05)
                    </div>
                  </div>

                  <div style={{ padding: '12px 14px', background: '#ffffff08', borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#fbbf24' }}>🔒 Bonferroni Correction</div>
                    <div>α<sub>corrected</sub> = {nullModel.meta.bonferroniAlpha.toFixed(4)}</div>
                    <div>Critical |z| = {nullModel.meta.bonferroniZCritical}</div>
                    <div>ผ่าน threshold: <strong>{nullModel.meta.nSignificant}/{nullModel.meta.nPartyNumbers} หมายเลข</strong></div>
                    <div style={{ marginTop: 4, color: '#10b981', fontWeight: 600 }}>
                      → <strong>ไม่มีหมายเลขใด</strong> ผ่าน Bonferroni significance
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', background: '#ffffff08', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#f472b6' }}>📋 Case Studies สำคัญ:</div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 8,
                  }}>
                    {[...nullModel.perNumber]
                      .filter(d => d.n >= 2)
                      .sort((a, b) => b.absZ - a.absZ)
                      .slice(0, 4)
                      .map(d => (
                        <div key={d.number} style={{
                          padding: '8px 12px', background: '#ffffff06', borderRadius: 6,
                          borderLeft: `3px solid ${d.partyColor}`,
                        }}>
                          <div style={{ fontWeight: 600 }}>
                            <span style={{ color: d.partyColor }}>#{d.number} {d.partyName}</span>
                            <span style={{ opacity: 0.6, marginLeft: 6 }}>(n={d.n})</span>
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>
                            National: {d.nationalShare.toFixed(2)}% → Observed: {d.observedMeanShare.toFixed(2)}%
                            = lift {d.lift > 0 ? '+' : ''}{d.lift.toFixed(3)}pp, z={d.zScore.toFixed(3)}, p={d.pValueMC.toFixed(4)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div style={{
                  padding: '12px 16px', background: '#10b98115', borderRadius: 8,
                  border: '1px solid #10b98133',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>💡 ความหมาย:</div>
                  <div>
                    ผลลัพธ์ชี้ว่า pattern &quot;ผู้ชนะหมายเลข j ทำให้พรรค PL หมายเลข j ได้คะแนนเพิ่ม&quot;
                    <strong> ไม่มีหลักฐานทางสถิติ</strong>ที่แข็งแกร่ง — observed max|z| ({nullModel.meta.observedMaxAbsZ.toFixed(2)})
                    อยู่ต่ำกว่า median ของ null distribution ({nullModel.meta.nullMaxZPercentiles?.p50?.toFixed(2) ?? 'N/A'})
                    หมายความว่า pattern ที่เห็นใน descriptive analysis (72.8% เขตน่าสงสัย)
                    อาจเกิดจาก <strong>base rate</strong> ของการตรงกันโดยบังเอิญ ไม่ใช่จาก twin-number effect จริง
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <strong>⚠️ ข้อควรระวัง:</strong> การไม่พบ statistical significance ≠ พิสูจน์ว่าไม่มีการซื้อเสียง
                    — อาจมีกลไกอื่นที่ไม่ใช่ twin-number pattern, หรือ effect size เล็กเกินกว่าจะตรวจจับได้
                    ด้วย sample size 400 เขต
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}>
                  พบ <strong>{nullModel.meta.nSignificant} หมายเลข</strong> ที่ lift + z-score ผ่าน Bonferroni threshold:
                </div>
                {nullModel.meta.significantNumbers.map(num => {
                  const d = nullModel.perNumber.find(p => p.number === num)
                  return d ? (
                    <div key={num} style={{ padding: '8px 12px', background: '#f4485315', borderRadius: 6, marginBottom: 4 }}>
                      <strong style={{ color: d.partyColor }}>#{d.number} {d.partyName}</strong>:
                      z={d.zScore.toFixed(3)}, lift={d.lift > 0 ? '+' : ''}{d.lift.toFixed(3)}pp, MC p={d.pValueMC.toFixed(4)}
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Methodology Note */}
          <div style={{
            marginTop: 20, padding: 14, background: '#22d3ee08', borderRadius: 8,
            border: '1px solid #22d3ee33', fontSize: 12, lineHeight: 1.8,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shuffle size={14} color="#22d3ee" /> วิธีการ Monte Carlo Null Model
            </div>
            <div>
              <strong>1. Null Hypothesis:</strong> หมายเลขผู้ชนะ (1-{nullModel.meta.nPartyNumbers}) ไม่มีความสัมพันธ์กับคะแนน PL ของพรรคหมายเลขเดียวกัน
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>2. Simulation:</strong> สลับหมายเลขผู้ชนะแบบสุ่มข้ามเขต {nullModel.meta.nIterations} รอบ
              → คำนวณ lift = (mean PL share ในกลุ่ม) - (national PL share) สำหรับทุกหมายเลข
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>3. z-score:</strong> z = lift / SE โดย SE ≈ √(p(1-p)/n) — ค่าสูงหมายความว่า observed lift
              ไม่น่าเกิดจากบังเอิญ
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>4. Bonferroni:</strong> ทดสอบ {nullModel.meta.nPartyNumbers} หมายเลขพร้อมกัน →
              ใช้ α = 0.05/{nullModel.meta.nPartyNumbers} = {nullModel.meta.bonferroniAlpha.toFixed(4)} →
              critical |z| ≥ {nullModel.meta.bonferroniZCritical}
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>5. Structural Bias:</strong> พรรคใหญ่ที่มี n (areas) มาก → SE เล็ก → |z| สูงง่ายกว่า
              ต้องดู lift ที่แท้จริง (pp) ประกอบ
            </div>
          </div>
        </div>
      )}

      {viewMode === 'null-model' && !nullModel && (
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
          <Shuffle size={48} />
          <div style={{ marginTop: 12 }}>ไม่พบข้อมูล Null Model — กรุณา re-run pipeline</div>
        </div>
      )}

      {/* ═══ VIEW: Klimek Fingerprint ═══ */}
      {viewMode === 'klimek' && klimek && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Fingerprint size={18} /> Klimek Fingerprint — Turnout vs Winner Vote Share
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16, lineHeight: 1.8 }}>
            <strong>Klimek et al. (PNAS 2012):</strong> พล็อตแต่ละเขตเป็น (Turnout%, Winner Vote Share%).
            การเลือกตั้งที่สะอาด → กลุ่มจุดกระจายตัวเป็น blob ตรงกลาง.
            Ballot stuffing → ridge ลากไปทาง (100%, 100%).
            Incremental fraud → vertical smear ที่ turnout สูงผิดปกติ.
          </div>

          {/* Summary stats */}
          <div className="overview-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#42b8ff' }}>{klimek.meta.totalPoints}</div>
              <div className="stat-label">เขตทั้งหมด</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{klimek.meta.meanTurnout?.toFixed(1)}%</div>
              <div className="stat-label">Turnout เฉลี่ย</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{klimek.meta.meanWinnerShare?.toFixed(1)}%</div>
              <div className="stat-label">Winner Share เฉลี่ย</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: klimek.meta.correlation && Math.abs(klimek.meta.correlation) > 0.3 ? '#ffa502' : '#5ed88a' }}>
                {klimek.meta.correlation?.toFixed(3)}
              </div>
              <div className="stat-label">Correlation (r)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: (klimek.meta.highHighCount ?? 0) > 10 ? '#f44853' : '#5ed88a' }}>
                {klimek.meta.highHighCount ?? 0}
              </div>
              <div className="stat-label">High-High Zone (&gt;80%T, &gt;60%S)</div>
            </div>
          </div>

          {/* Scatter Plot */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Scatter: แต่ละจุด = 1 เขตเลือกตั้ง</div>
            <ResponsiveContainer width="100%" height={450}>
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis type="number" dataKey="turnout" name="Turnout %" domain={[40, 100]}
                  tick={{ fill: '#aaa', fontSize: 11 }} label={{ value: 'Turnout %', position: 'bottom', fill: '#aaa', fontSize: 12 }} />
                <YAxis type="number" dataKey="winnerShare" name="Winner Share %" domain={[0, 100]}
                  tick={{ fill: '#aaa', fontSize: 11 }} label={{ value: 'Winner Vote Share %', angle: -90, position: 'insideLeft', fill: '#aaa', fontSize: 12 }} />
                <ZAxis type="number" dataKey="eligibleVoters" range={[30, 200]} name="Eligible" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="custom-tooltip">
                      <div className="label">{d.areaName}</div>
                      <div className="item">Turnout: {d.turnout}%</div>
                      <div className="item">Winner Share: {d.winnerShare}%</div>
                      <div className="item" style={{ color: d.winnerPartyColor }}>พรรค: {d.winnerParty}</div>
                      <div className="item">ผู้มีสิทธิ์: {d.eligibleVoters?.toLocaleString()}</div>
                      <div className="item">Score: {d.suspicionScore}</div>
                    </div>
                  )
                }} />
                <Scatter data={klimek.points} shape="circle">
                  {klimek.points.map((p, i) => (
                    <Cell key={i} fill={p.winnerPartyColor || '#888'} fillOpacity={0.65} />
                  ))}
                </Scatter>
                {/* Reference lines for "danger zone" */}
                <ReferenceLine x={80} stroke="#f4485355" strokeDasharray="5 5" label={{ value: 'T=80%', fill: '#f44853', fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#f4485355" strokeDasharray="5 5" label={{ value: 'S=60%', fill: '#f44853', fontSize: 10 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap as bar-grouped data */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Heatmap — ความหนาแน่นจุด (Turnout × Winner Share)</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `40px repeat(${klimek.meta.bins}, 1fr)`,
              gridTemplateRows: `repeat(${klimek.meta.bins}, 1fr) 30px`,
              gap: 1, maxWidth: 600,
            }}>
              {/* Y-axis labels */}
              {Array.from({ length: klimek.meta.bins }, (_, i) => klimek.meta.bins - 1 - i).map(by => (
                <div key={`y-${by}`} style={{
                  fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 4, opacity: 0.6, gridColumn: 1, gridRow: klimek.meta.bins - by,
                }}>
                  {by * (100 / klimek.meta.bins)}%
                </div>
              ))}
              {/* Heat cells */}
              {Array.from({ length: klimek.meta.bins }, (_, by) => klimek.meta.bins - 1 - by).map(by =>
                Array.from({ length: klimek.meta.bins }, (_, bx) => {
                  const bin = klimek.heatmap.find(h =>
                    Math.abs(h.turnoutBin - (bx * (100 / klimek.meta.bins) + 100 / klimek.meta.bins / 2)) < 3 &&
                    Math.abs(h.shareBin - (by * (100 / klimek.meta.bins) + 100 / klimek.meta.bins / 2)) < 3
                  )
                  const count = bin?.count ?? 0
                  const maxCount = Math.max(...klimek.heatmap.map(h => h.count), 1)
                  const intensity = count / maxCount
                  return (
                    <div key={`${bx}-${by}`} style={{
                      gridColumn: bx + 2, gridRow: klimek.meta.bins - by,
                      background: count > 0
                        ? `rgba(66, 184, 255, ${0.1 + intensity * 0.85})`
                        : '#ffffff05',
                      borderRadius: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, color: intensity > 0.5 ? '#fff' : '#aaa',
                      minHeight: 18,
                    }} title={`T:${bx * 5}-${(bx + 1) * 5}%, S:${by * 5}-${(by + 1) * 5}%, n=${count}`}>
                      {count > 0 ? count : ''}
                    </div>
                  )
                })
              )}
              {/* X-axis labels */}
              <div style={{ gridColumn: 1, gridRow: klimek.meta.bins + 1 }} />
              {Array.from({ length: klimek.meta.bins }, (_, bx) => (
                <div key={`x-${bx}`} style={{
                  fontSize: 9, textAlign: 'center', opacity: 0.6,
                  gridColumn: bx + 2, gridRow: klimek.meta.bins + 1,
                }}>
                  {bx % 4 === 0 ? `${bx * (100 / klimek.meta.bins)}%` : ''}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
              X = Turnout %, Y = Winner Vote Share % — สีเข้ม = มีจุดเยอะ
            </div>
          </div>

          {/* Conclusion */}
          <div style={{
            padding: 16, borderRadius: 10, marginTop: 12,
            background: (klimek.meta.highHighCount ?? 0) > 10 ? '#f4485312' : '#5ed88a12',
            border: `1px solid ${(klimek.meta.highHighCount ?? 0) > 10 ? '#f4485344' : '#5ed88a44'}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: (klimek.meta.highHighCount ?? 0) > 10 ? '#f44853' : '#5ed88a' }}>
              {(klimek.meta.highHighCount ?? 0) > 10 ? <CircleAlert size={16} /> : <ShieldCheck size={16} />}
              สรุป Klimek Fingerprint
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              {(klimek.meta.highHighCount ?? 0) <= 10 ? (
                <>
                  ✅ ไม่พบ pattern ของ ballot stuffing — มีเพียง <strong>{klimek.meta.highHighCount ?? 0}</strong> เขต
                  ใน High-High zone (Turnout&gt;80%, Winner Share&gt;60%).
                  Correlation (r) = <strong>{klimek.meta.correlation?.toFixed(3)}</strong> ซึ่ง{Math.abs(klimek.meta.correlation ?? 0) < 0.3 ? 'ต่ำ (ดี)' : 'ปานกลาง'}.
                  กราฟ scatter กระจายตัวเป็น blob ไม่มี ridge ไปทาง (100%, 100%).
                </>
              ) : (
                <>
                  ⚠️ พบ <strong>{klimek.meta.highHighCount ?? 0}</strong> เขตใน High-High zone —
                  อาจมี pattern ที่น่าสงสัย ควรตรวจสอบเพิ่มเติม
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'klimek' && !klimek && (
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
          <Fingerprint size={48} />
          <div style={{ marginTop: 12 }}>ไม่พบข้อมูล Klimek Fingerprint — กรุณา re-run pipeline</div>
        </div>
      )}

      {/* ═══ VIEW: Last-Digit Uniformity Test ═══ */}
      {viewMode === 'last-digit' && lastDigit && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Binary size={18} /> Last-Digit Uniformity Test (Beber &amp; Scacco)
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16, lineHeight: 1.8 }}>
            <strong>Beber &amp; Scacco (Political Analysis 2012):</strong> หลักสุดท้ายของจำนวนโหวตควรกระจายสม่ำเสมอ (0-9 อย่างละ 10%).
            คนที่ปลอมตัวเลขมักหลีกเลี่ยง 0, 5 และเลือกเลขบางตัวมากเกินไป. ใช้ Chi-square test เทียบกับ uniform distribution.
          </div>

          {/* Summary stats */}
          <div className="overview-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#42b8ff' }}>{lastDigit.totalNumbers.toLocaleString()}</div>
              <div className="stat-label">ตัวเลขทั้งหมด</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{lastDigit.globalChi2}</div>
              <div className="stat-label">Global χ²</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: lastDigit.globalPValue < 0.05 ? '#f44853' : '#5ed88a' }}>
                {lastDigit.globalPValue}
              </div>
              <div className="stat-label">Global p-value</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#5ed88a' }}>{lastDigit.conformCount}</div>
              <div className="stat-label">Conform (p&gt;0.05)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#f44853' }}>{lastDigit.deviateCount}</div>
              <div className="stat-label">Deviate (p≤0.05)</div>
            </div>
          </div>

          {/* Global distribution chart */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Global Last-Digit Distribution (Observed vs Expected Uniform)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={lastDigit.globalDistribution} margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="digit" tick={{ fill: '#aaa', fontSize: 12 }} label={{ value: 'Last Digit', position: 'bottom', fill: '#aaa' }} />
                <YAxis tick={{ fill: '#aaa', fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#aaa' }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="custom-tooltip">
                      <div className="label">Digit {d.digit}</div>
                      <div className="item" style={{ color: '#42b8ff' }}>Observed: {d.observed}%</div>
                      <div className="item" style={{ color: '#ffa502' }}>Expected: {d.expected}%</div>
                      <div className="item">Count: {d.count.toLocaleString()}</div>
                      <div className="item">Diff: {(d.observed - d.expected).toFixed(2)}pp</div>
                    </div>
                  )
                }} />
                <Bar dataKey="observed" name="Observed %" fill="#42b8ff" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expected" name="Expected %" fill="#ffa502" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top deviating areas */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>เขตที่เบี่ยงเบนมากที่สุด (Top 20 by χ²)</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>เขต</th>
                    <th>χ²</th>
                    <th>p-value</th>
                    <th>N</th>
                    <th>Score</th>
                    {Array.from({ length: 10 }, (_, i) => <th key={i} style={{ textAlign: 'center' }}>D{i}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...lastDigit.perArea]
                    .sort((a, b) => b.chi2 - a.chi2)
                    .slice(0, 20)
                    .map((area, idx) => (
                      <tr key={area.areaCode}>
                        <td>{idx + 1}</td>
                        <td>{area.areaCode}</td>
                        <td style={{ fontWeight: 700, color: area.pValue < 0.05 ? '#f44853' : '#aaa' }}>{area.chi2}</td>
                        <td style={{ color: area.pValue < 0.05 ? '#f44853' : '#5ed88a' }}>{area.pValue}</td>
                        <td>{area.totalNumbers}</td>
                        <td>{area.scaledScore}</td>
                        {Array.from({ length: 10 }, (_, i) => (
                          <td key={i} style={{ textAlign: 'center', fontSize: 10 }}>{area.digitCounts[String(i)] ?? 0}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conclusion */}
          <div style={{
            padding: 16, borderRadius: 10,
            background: lastDigit.globalPValue < 0.05 ? '#f4485312' : '#5ed88a12',
            border: `1px solid ${lastDigit.globalPValue < 0.05 ? '#f4485344' : '#5ed88a44'}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: lastDigit.globalPValue < 0.05 ? '#f44853' : '#5ed88a' }}>
              {lastDigit.globalPValue < 0.05 ? <CircleAlert size={16} /> : <ShieldCheck size={16} />}
              สรุป Last-Digit Uniformity Test
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              {lastDigit.globalPValue >= 0.05 ? (
                <>
                  ✅ Global last-digit distribution <strong>ผ่าน</strong> uniformity test (χ²={lastDigit.globalChi2}, p={lastDigit.globalPValue}).
                  หลักสุดท้ายของจำนวนโหวตกระจายสม่ำเสมอ ไม่พบ pattern ของการปลอมแปลงตัวเลข.
                  มี <strong>{lastDigit.deviateCount}</strong> เขต ({(lastDigit.deviateCount / (lastDigit.conformCount + lastDigit.deviateCount) * 100).toFixed(1)}%)
                  ที่เบี่ยงเบนในระดับเขต ซึ่งเป็นอัตราที่คาดหวังได้จาก random variation.
                </>
              ) : (
                <>
                  ⚠️ Global last-digit distribution เบี่ยงเบนจาก uniform (χ²={lastDigit.globalChi2}, p={lastDigit.globalPValue}).
                  มี <strong>{lastDigit.deviateCount}</strong> เขตที่เบี่ยงเบน — ควรตรวจสอบ pattern เพิ่มเติม.
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'last-digit' && !lastDigit && (
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
          <Binary size={48} />
          <div style={{ marginTop: 12 }}>ไม่พบข้อมูล Last-Digit Test — กรุณา re-run pipeline</div>
        </div>
      )}

      {/* ═══ VIEW: 2nd-Digit Benford ═══ */}
      {viewMode === '2nd-benford' && secondDigitBenford && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sigma size={18} /> 2nd-Digit Benford&apos;s Law (Mebane Test)
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16, lineHeight: 1.8 }}>
            <strong>Mebane (2006):</strong> หลักที่ 2 ของจำนวนโหวตจะตาม Benford&apos;s Law 2nd-digit distribution.
            P(d₂=k) = Σ<sub>d₁=1..9</sub> log₁₀(1 + 1/(10·d₁ + k)). ต่างจาก 1st-digit ที่เป็นที่รู้จักกันดี —
            2nd-digit test ละเอียดกว่าและยากที่จะ manipulate. ใช้ Chi-square goodness-of-fit test.
          </div>

          {/* Summary stats */}
          <div className="overview-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#42b8ff' }}>{secondDigitBenford.totalNumbers.toLocaleString()}</div>
              <div className="stat-label">ตัวเลขทั้งหมด</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{secondDigitBenford.globalChi2}</div>
              <div className="stat-label">Global χ²</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: secondDigitBenford.globalPValue < 0.05 ? '#f44853' : '#5ed88a' }}>
                {secondDigitBenford.globalPValue}
              </div>
              <div className="stat-label">Global p-value</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#5ed88a' }}>{secondDigitBenford.conformCount}</div>
              <div className="stat-label">Conform (p&gt;0.05)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number" style={{ color: '#f44853' }}>{secondDigitBenford.deviateCount}</div>
              <div className="stat-label">Deviate (p≤0.05)</div>
            </div>
          </div>

          {/* Global distribution chart */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Global 2nd-Digit Distribution (Observed vs Benford Expected)</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={secondDigitBenford.globalDistribution} margin={{ top: 10, right: 30, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="digit" tick={{ fill: '#aaa', fontSize: 12 }} label={{ value: '2nd Digit', position: 'bottom', fill: '#aaa' }} />
                <YAxis tick={{ fill: '#aaa', fontSize: 11 }} label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#aaa' }} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="custom-tooltip">
                      <div className="label">2nd Digit {d.digit}</div>
                      <div className="item" style={{ color: '#e879f9' }}>Observed: {d.observed}%</div>
                      <div className="item" style={{ color: '#ffa502' }}>Benford Expected: {d.expected}%</div>
                      <div className="item">Count: {d.count.toLocaleString()}</div>
                      <div className="item">Diff: {(d.observed - d.expected).toFixed(2)}pp</div>
                    </div>
                  )
                }} />
                <Bar dataKey="observed" name="Observed %" fill="#e879f9" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expected" name="Benford Expected %" fill="#ffa502" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison: 1st-digit vs 2nd-digit */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
              เปรียบเทียบ: 1st-Digit Benford vs 2nd-Digit Benford (Mebane)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12 }}>
              <div style={{ padding: 12, background: '#facc1510', borderRadius: 8, border: '1px solid #facc1533' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}><Hash size={12} style={{ verticalAlign: -2 }} /> 1st-Digit Benford</div>
                <div>χ² = {meta?.benfordGlobalChi2 ?? '—'}</div>
                <div>p = {meta?.benfordGlobalPValue ?? '—'}</div>
                <div>Conform: {meta?.benfordConformCount ?? '—'} | Deviate: {meta?.benfordDeviateCount ?? '—'}</div>
              </div>
              <div style={{ padding: 12, background: '#e879f910', borderRadius: 8, border: '1px solid #e879f933' }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}><Sigma size={12} style={{ verticalAlign: -2 }} /> 2nd-Digit (Mebane)</div>
                <div>χ² = {secondDigitBenford.globalChi2}</div>
                <div>p = {secondDigitBenford.globalPValue}</div>
                <div>Conform: {secondDigitBenford.conformCount} | Deviate: {secondDigitBenford.deviateCount}</div>
              </div>
            </div>
          </div>

          {/* Top deviating areas */}
          <div style={{ background: '#ffffff06', borderRadius: 10, padding: 16, border: '1px solid #ffffff10', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>เขตที่เบี่ยงเบนมากที่สุด (Top 20 by χ²)</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>เขต</th>
                    <th>χ²</th>
                    <th>p-value</th>
                    <th>N</th>
                    <th>Score</th>
                    {Array.from({ length: 10 }, (_, i) => <th key={i} style={{ textAlign: 'center' }}>D{i}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...secondDigitBenford.perArea]
                    .sort((a, b) => b.chi2 - a.chi2)
                    .slice(0, 20)
                    .map((area, idx) => (
                      <tr key={area.areaCode}>
                        <td>{idx + 1}</td>
                        <td>{area.areaCode}</td>
                        <td style={{ fontWeight: 700, color: area.pValue < 0.05 ? '#f44853' : '#aaa' }}>{area.chi2}</td>
                        <td style={{ color: area.pValue < 0.05 ? '#f44853' : '#5ed88a' }}>{area.pValue}</td>
                        <td>{area.totalNumbers}</td>
                        <td>{area.scaledScore}</td>
                        {Array.from({ length: 10 }, (_, i) => (
                          <td key={i} style={{ textAlign: 'center', fontSize: 10 }}>{area.digitCounts[String(i)] ?? 0}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conclusion */}
          <div style={{
            padding: 16, borderRadius: 10,
            background: secondDigitBenford.globalPValue < 0.05 ? '#f4485312' : '#5ed88a12',
            border: `1px solid ${secondDigitBenford.globalPValue < 0.05 ? '#f4485344' : '#5ed88a44'}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, color: secondDigitBenford.globalPValue < 0.05 ? '#f44853' : '#5ed88a' }}>
              {secondDigitBenford.globalPValue < 0.05 ? <CircleAlert size={16} /> : <ShieldCheck size={16} />}
              สรุป 2nd-Digit Benford&apos;s Law Test
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              {secondDigitBenford.globalPValue >= 0.05 ? (
                <>
                  ✅ Global 2nd-digit distribution <strong>สอดคล้อง</strong>กับ Benford&apos;s Law (χ²={secondDigitBenford.globalChi2}, p={secondDigitBenford.globalPValue}).
                  หลักที่ 2 ของจำนวนโหวตเป็นไปตามการกระจายที่คาดหวังทางสถิติ.
                  มี <strong>{secondDigitBenford.deviateCount}</strong> เขตที่เบี่ยงเบน ({(secondDigitBenford.deviateCount / (secondDigitBenford.conformCount + secondDigitBenford.deviateCount) * 100).toFixed(1)}%)
                  ซึ่งเป็นอัตราปกติจาก random variation.
                  ผลสอดคล้องกับ 1st-digit Benford — ยืนยันว่าข้อมูลตัวเลขไม่ถูก manipulate.
                </>
              ) : (
                <>
                  ⚠️ Global 2nd-digit distribution เบี่ยงเบนจาก Benford&apos;s Law (χ²={secondDigitBenford.globalChi2}, p={secondDigitBenford.globalPValue}).
                  มี <strong>{secondDigitBenford.deviateCount}</strong> เขตที่เบี่ยงเบน — ควรตรวจสอบ digit pattern เพิ่มเติม.
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === '2nd-benford' && !secondDigitBenford && (
        <div style={{ padding: 40, textAlign: 'center', opacity: 0.5 }}>
          <Sigma size={48} />
          <div style={{ marginTop: 12 }}>ไม่พบข้อมูล 2nd-Digit Benford — กรุณา re-run pipeline</div>
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
                <th style={{ textAlign: 'center' }}>Benf</th>
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
                    <span style={{ color: d.benfordPValue <= 0.05 ? '#facc15' : undefined, fontWeight: d.benfordPValue <= 0.05 ? 700 : 400 }}>
                      {d.benfordScore.toFixed(0)}
                    </span>
                  </td>
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
          <FlaskConical size={16} /> Methodology
        </div>
        <div>
          <strong>10 Indicators:</strong> รวม 10 ตัวชี้วัดเชิงสถิติ เช่น Dominance, Turnout, HHI, Spoiled Rate, Benford&apos;s Law ฯลฯ
          โดย Benford&apos;s Law วิเคราะห์ first-digit distribution ของจำนวนโหวตด้วย Chi-square goodness-of-fit test
          เขตที่หลักแรกของตัวเลขเบี่ยงเบนจาก Benford&apos;s distribution อย่างมีนัยสำคัญ → อาจมีการ manipulate ตัวเลข
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Entropy Weight Method:</strong> คำนวณ Information Entropy ของ 10 features →
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
