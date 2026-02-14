'use client'

import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ZAxis, Cell, ReferenceLine, Line, ComposedChart,
} from 'recharts'
import { Microscope, AlertTriangle, BarChart3, Users, Filter } from 'lucide-react'
import type { MyagkovAnalysis, MyagkovPoint, MyagkovPartyCorrelation, NameToCodeMap } from '../types'
import PartyLogo from './PartyLogo'

/* ─── Tooltip ─── */
interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ payload: MyagkovPoint }>
}

const CustomScatterTooltip = ({ active, payload }: ScatterTooltipProps) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="custom-tooltip">
      <div className="label">{d.areaName}</div>
      <div className="item">Turnout: <strong>{d.turnoutPct.toFixed(1)}%</strong></div>
      <div className="item">Winner Vote Share: <strong style={{ color: d.winnerPartyColor }}>{d.winnerPct.toFixed(1)}%</strong></div>
      <div className="item">Margin: {d.marginPct.toFixed(1)}%</div>
      <div className="item" style={{ color: d.winnerPartyColor }}>พรรค: {d.winnerParty}</div>
      <div className="item" style={{ color: '#9aa0a6' }}>ผู้มีสิทธิ: {d.eligibleVoters.toLocaleString()} คน</div>
    </div>
  )
}

/* ─── Regression line data generator ─── */
function regressionLineData(slope: number, intercept: number, minX: number, maxX: number): Array<{ x: number; y: number }> {
  const step = (maxX - minX) / 50
  const pts: Array<{ x: number; y: number }> = []
  for (let x = minX; x <= maxX; x += step) {
    pts.push({ x: Math.round(x * 100) / 100, y: Math.round((slope * x + intercept) * 100) / 100 })
  }
  return pts
}

/* ─── Interpretation helper ─── */
function interpret(r: number, p: number): { text: string; color: string; emoji: string } {
  if (p >= 0.05) return { text: 'ไม่มีนัยสำคัญ', color: '#9aa0a6', emoji: '✅' }
  if (r > 0.3) return { text: 'Positive ⚠️ น่าสงสัย', color: '#f44853', emoji: '🚩' }
  if (r > 0) return { text: 'Positive เล็กน้อย', color: '#ff8a4d', emoji: '⚠️' }
  if (r > -0.3) return { text: 'Negative เล็กน้อย', color: '#42b8ff', emoji: 'ℹ️' }
  return { text: 'Negative ชัดเจน', color: '#42b8ff', emoji: '📉' }
}

/* ─── Component ─── */
interface Props {
  data: MyagkovAnalysis
  nameToCodeMap: NameToCodeMap
}

type ViewMode = 'all' | 'party' | 'flagged'

export default function TurnoutShareMyagkov({ data, nameToCodeMap }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedParty, setSelectedParty] = useState<string | null>(null)

  const { points, partyCorrelations, flagged, meta } = data

  // Get party list sorted by n
  const parties = useMemo(() =>
    [...partyCorrelations].sort((a, b) => b.n - a.n)
  , [partyCorrelations])

  // If no party selected, pick the first one
  const activeParty = useMemo(() => {
    if (selectedParty) return parties.find(p => p.partyCode === selectedParty) || parties[0]
    return parties[0]
  }, [selectedParty, parties])

  // Filter points for selected party
  const partyPoints = useMemo(() => {
    if (!activeParty) return []
    return points.filter(p => p.winnerPartyCode === activeParty.partyCode)
  }, [points, activeParty])

  // Regression line for active party
  const regrLine = useMemo(() => {
    if (!activeParty || partyPoints.length < 2) return []
    const minT = Math.min(...partyPoints.map(p => p.turnoutPct))
    const maxT = Math.max(...partyPoints.map(p => p.turnoutPct))
    return regressionLineData(activeParty.slope, activeParty.intercept, minT - 2, maxT + 2)
  }, [activeParty, partyPoints])

  // Overall regression line
  const overallRegrLine = useMemo(() => {
    if (points.length < 2) return []
    const ts = points.map(p => p.turnoutPct)
    const ws = points.map(p => p.winnerPct)
    const n = ts.length
    const mx = ts.reduce((a, b) => a + b, 0) / n
    const my = ws.reduce((a, b) => a + b, 0) / n
    const sx2 = ts.reduce((a, t) => a + (t - mx) ** 2, 0)
    const slope = sx2 > 0 ? ts.reduce((a, t, i) => a + (t - mx) * (ws[i] - my), 0) / sx2 : 0
    const intercept = my - slope * mx
    const minT = Math.min(...ts)
    const maxT = Math.max(...ts)
    return regressionLineData(slope, intercept, minT - 2, maxT + 2)
  }, [points])

  const overallInterpret = interpret(meta.overallR, meta.overallP)

  return (
    <div className="section">
      <div className="section-title">
        <Microscope size={20} />
        Myagkov-Ordeshook: Turnout vs Winner Vote-Share
      </div>
      <div className="section-desc">
        ทฤษฎี Myagkov-Ordeshook (2009): ในเลือกตั้งปกติ Turnout ที่สูงขึ้นไม่ควรทำให้พรรคใดพรรคหนึ่งได้ vote share เพิ่มขึ้นอย่างเป็นระบบ
        — หาก <strong>Turnout↑ = Vote Share↑</strong> (positive correlation, r {'>'} 0.3) อาจเป็นสัญญาณ ballot stuffing
      </div>

      {/* ─── Summary Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="summary-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', marginBottom: 4 }}>จำนวนเขต</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#e8eaed' }}>{meta.totalAreas}</div>
        </div>
        <div className="summary-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', marginBottom: 4 }}>Overall r</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: overallInterpret.color }}>{meta.overallR.toFixed(3)}</div>
          <div style={{ fontSize: 10, color: '#9aa0a6' }}>p = {meta.overallP < 0.001 ? '<0.001' : meta.overallP.toFixed(4)}</div>
        </div>
        <div className="summary-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', marginBottom: 4 }}>Turnout เฉลี่ย</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#ff8a4d' }}>{meta.avgTurnout.toFixed(1)}%</div>
        </div>
        <div className="summary-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', marginBottom: 4 }}>Winner % เฉลี่ย</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#42b8ff' }}>{meta.avgWinnerPct.toFixed(1)}%</div>
        </div>
        <div className="summary-card" style={{ textAlign: 'center', padding: '16px 12px' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', marginBottom: 4 }}>🚩 เขตธงแดง</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f44853' }}>{meta.flaggedCount}</div>
          <div style={{ fontSize: 10, color: '#9aa0a6' }}>Turnout {'>'} P85 & Winner {'>'} P85</div>
        </div>
      </div>

      {/* ─── Interpretation Box ─── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 10,
        padding: 16, marginBottom: 20,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={16} style={{ color: '#eab308' }} /> สรุปผลวิเคราะห์
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.8, color: '#bdc1c6' }}>
          <div>{overallInterpret.emoji} <strong>ภาพรวม:</strong> r = {meta.overallR.toFixed(3)} ({overallInterpret.text}) — {
            meta.overallR > 0.2 ? 'มี positive correlation ที่น่าสงสัย' :
            meta.overallR < -0.2 ? 'มี negative correlation (Turnout สูง → winner share ลดลง) ซึ่งเป็นรูปแบบปกติ' :
            'ไม่มี correlation ที่ชัดเจน (ปกติ)'
          }</div>
          {parties.filter(p => p.suspicious).length > 0 ? (
            <div style={{ color: '#f44853', marginTop: 4 }}>
              🚩 พรรคที่มี positive correlation น่าสงสัย: {parties.filter(p => p.suspicious).map(p => p.partyName).join(', ')}
            </div>
          ) : (
            <div style={{ color: '#5ed88a', marginTop: 4 }}>
              ✅ ไม่พบพรรคใดที่มี positive correlation น่าสงสัย (r {'>'} 0.2 + p {'<'} 0.05)
            </div>
          )}
        </div>
      </div>

      {/* ─── Tab Switcher ─── */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${viewMode === 'all' ? 'active' : ''}`} onClick={() => setViewMode('all')}>
          <BarChart3 size={14} /> ภาพรวม
        </button>
        <button className={`tab ${viewMode === 'party' ? 'active' : ''}`} onClick={() => setViewMode('party')}>
          <Filter size={14} /> แยกตามพรรค
        </button>
        <button className={`tab ${viewMode === 'flagged' ? 'active' : ''}`} onClick={() => setViewMode('flagged')}>
          <AlertTriangle size={14} /> เขตธงแดง ({meta.flaggedCount})
        </button>
      </div>

      {/* ═══ VIEW: ALL ═══ */}
      {viewMode === 'all' && (
        <>
          <div className="chart-container" style={{ minHeight: 500, marginTop: 16 }}>
            <h4 style={{ textAlign: 'center', color: '#e8eaed', marginBottom: 8 }}>
              Turnout % vs Winner Vote Share % — ทุกเขต (สีตามพรรค)
            </h4>
            <ResponsiveContainer width="100%" height={500}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                <XAxis
                  type="number" dataKey="turnoutPct"
                  tick={{ fill: '#9aa0a6', fontSize: 11 }}
                  label={{ value: 'Turnout %', position: 'bottom', fill: '#9aa0a6', offset: 10 }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <YAxis
                  type="number" dataKey="winnerPct"
                  tick={{ fill: '#9aa0a6', fontSize: 11 }}
                  label={{ value: 'Winner Vote %', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }}
                  domain={['dataMin - 3', 'dataMax + 3']}
                />
                <ZAxis range={[30, 30]} />
                <Tooltip content={<CustomScatterTooltip />} />
                {/* Avg lines */}
                <ReferenceLine x={meta.avgTurnout} stroke="#555" strokeDasharray="4 4" />
                <ReferenceLine y={meta.avgWinnerPct} stroke="#555" strokeDasharray="4 4" />
                <Scatter name="เขตเลือกตั้ง" data={points} fill="#888">
                  {points.map((entry, i) => (
                    <Cell key={i} fill={entry.winnerPartyColor} fillOpacity={0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#777', marginTop: 4 }}>
              เส้นประ = ค่าเฉลี่ย (Turnout {meta.avgTurnout.toFixed(1)}%, Winner {meta.avgWinnerPct.toFixed(1)}%)
            </div>
          </div>

          {/* Per-party correlation table */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: '#e8eaed', marginBottom: 12 }}>
              <Users size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
              Pearson Correlation แยกตามพรรคผู้ชนะ
            </h4>
            <div className="province-table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="province-table">
                <thead>
                  <tr>
                    <th>พรรค</th>
                    <th>จำนวนเขต</th>
                    <th>r (correlation)</th>
                    <th>p-value</th>
                    <th>ตีความ</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map(pc => {
                    const interp = interpret(pc.r, pc.p)
                    return (
                      <tr key={pc.partyCode}>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <PartyLogo partyCode={pc.partyCode} size={18} />
                            <span style={{ color: pc.partyColor, fontWeight: 600 }}>{pc.partyName}</span>
                          </span>
                        </td>
                        <td>{pc.n}</td>
                        <td style={{ fontWeight: 700, color: interp.color, fontFamily: 'monospace' }}>
                          {pc.r > 0 ? '+' : ''}{pc.r.toFixed(4)}
                        </td>
                        <td style={{ fontFamily: 'monospace', color: pc.p < 0.05 ? '#ff8a4d' : '#9aa0a6' }}>
                          {pc.p < 0.001 ? '<0.001' : pc.p.toFixed(4)}
                        </td>
                        <td>
                          <span style={{ color: interp.color }}>{interp.emoji} {interp.text}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ VIEW: PARTY ═══ */}
      {viewMode === 'party' && (
        <>
          {/* Party selector */}
          <div className="filter-bar" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
            {parties.map(pc => (
              <button
                key={pc.partyCode}
                className={`tab ${activeParty?.partyCode === pc.partyCode ? 'active' : ''}`}
                onClick={() => setSelectedParty(pc.partyCode)}
                style={{
                  padding: '6px 14px', fontSize: '0.8rem',
                  borderColor: activeParty?.partyCode === pc.partyCode ? pc.partyColor : undefined,
                  color: activeParty?.partyCode === pc.partyCode ? pc.partyColor : undefined,
                }}
              >
                <PartyLogo partyCode={pc.partyCode} size={14} />
                {pc.partyName} ({pc.n})
              </button>
            ))}
          </div>

          {activeParty && (
            <>
              {/* Stats card for selected party */}
              <div style={{
                background: 'var(--card-bg)', border: `1px solid ${activeParty.partyColor}33`,
                borderRadius: 10, padding: 16, marginBottom: 16,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9aa0a6' }}>เขตที่ชนะ</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: activeParty.partyColor }}>{activeParty.n}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9aa0a6' }}>r (Pearson)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: interpret(activeParty.r, activeParty.p).color }}>
                    {activeParty.r > 0 ? '+' : ''}{activeParty.r.toFixed(4)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9aa0a6' }}>p-value</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: activeParty.p < 0.05 ? '#ff8a4d' : '#9aa0a6' }}>
                    {activeParty.p < 0.001 ? '<0.001' : activeParty.p.toFixed(4)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#9aa0a6' }}>slope</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#e8eaed' }}>
                    {activeParty.slope > 0 ? '+' : ''}{activeParty.slope.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Scatter + Regression */}
              <div className="chart-container" style={{ minHeight: 500 }}>
                <h4 style={{ textAlign: 'center', color: activeParty.partyColor, marginBottom: 8 }}>
                  <PartyLogo partyCode={activeParty.partyCode} size={18} />
                  {' '}{activeParty.partyName}: Turnout vs Winner Share (n={activeParty.n}, r={activeParty.r.toFixed(3)})
                </h4>
                <ResponsiveContainer width="100%" height={500}>
                  <ComposedChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                    <XAxis
                      type="number" dataKey="x"
                      tick={{ fill: '#9aa0a6', fontSize: 11 }}
                      label={{ value: 'Turnout %', position: 'bottom', fill: '#9aa0a6', offset: 10 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <YAxis
                      type="number"
                      tick={{ fill: '#9aa0a6', fontSize: 11 }}
                      label={{ value: 'Winner Vote %', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }}
                      domain={['dataMin - 3', 'dataMax + 3']}
                    />
                    {/* Regression line */}
                    <Line
                      data={regrLine}
                      dataKey="y"
                      stroke="#f44853"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 3"
                      isAnimationActive={false}
                    />
                    {/* Scatter */}
                    <Scatter
                      name={activeParty.partyName}
                      data={partyPoints.map(p => ({ ...p, x: p.turnoutPct, y: p.winnerPct }))}
                      fill={activeParty.partyColor}
                      fillOpacity={0.7}
                    >
                      <ZAxis range={[40, 40]} />
                    </Scatter>
                    <Tooltip content={<CustomScatterTooltip />} />
                  </ComposedChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#777', marginTop: 4 }}>
                  เส้นประแดง = Regression line (slope = {activeParty.slope.toFixed(3)})
                  {activeParty.r < 0 ? ' — เส้นลาดลง = Turnout สูง → Vote Share ลดลง (ปกติ)' : ''}
                  {activeParty.r > 0.2 && activeParty.p < 0.05 ? ' — ⚠️ Positive: น่าตรวจสอบเพิ่มเติม' : ''}
                </div>
              </div>

              {/* Top/bottom areas for this party */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ color: '#e8eaed', marginBottom: 8 }}>เขตเด่นของ {activeParty.partyName}</h4>
                <div className="province-table-container" style={{ maxHeight: 400, overflowY: 'auto' }}>
                  <table className="province-table">
                    <thead>
                      <tr><th>#</th><th>เขต</th><th>Turnout</th><th>Winner %</th><th>Margin</th></tr>
                    </thead>
                    <tbody>
                      {[...partyPoints].sort((a, b) => b.winnerPct - a.winnerPct).slice(0, 20).map((row, i) => (
                        <tr key={row.areaCode}>
                          <td style={{ fontWeight: 700, color: '#ff8a4d' }}>#{i + 1}</td>
                          <td>{row.areaName}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.turnoutPct.toFixed(1)}%</td>
                          <td style={{ fontWeight: 700, color: activeParty.partyColor, fontFamily: 'monospace' }}>{row.winnerPct.toFixed(1)}%</td>
                          <td style={{ fontFamily: 'monospace', color: row.marginPct > 40 ? '#f44853' : '#9aa0a6' }}>{row.marginPct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ VIEW: FLAGGED ═══ */}
      {viewMode === 'flagged' && (
        <>
          <div style={{
            background: '#2a1a1a', border: '1px solid #f4485333', borderRadius: 10,
            padding: 16, marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: '#f44853', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} /> เขตธงแดง: Turnout {'>'} P85 ({meta.p85Turnout}%) AND Winner Share {'>'} P85 ({meta.p85WinnerPct}%)
            </div>
            <div style={{ fontSize: 12, color: '#bdc1c6', lineHeight: 1.6 }}>
              เขตเหล่านี้มีทั้ง Turnout และ Winner Vote Share สูงกว่า percentile 85 พร้อมกัน
              — ตามโมเดล Myagkov-Ordeshook ถือเป็นจุดที่ควรตรวจสอบเพิ่มเติม
              (แต่ไม่ได้หมายความว่าผิดปกติเสมอไป อาจเป็นเขตที่มีฐานเสียงแข็งแกร่งจริง)
            </div>
          </div>

          {flagged.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#5ed88a' }}>
              ✅ ไม่พบเขตที่เข้าเกณฑ์ธงแดง
            </div>
          ) : (
            <>
              {/* Scatter highlighting flagged */}
              <div className="chart-container" style={{ minHeight: 500, marginBottom: 20 }}>
                <h4 style={{ textAlign: 'center', color: '#e8eaed', marginBottom: 8 }}>
                  🚩 พื้นที่ธงแดง (จุดแดง) vs พื้นที่ปกติ (จุดเทา)
                </h4>
                <ResponsiveContainer width="100%" height={500}>
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3148" />
                    <XAxis
                      type="number" dataKey="turnoutPct"
                      tick={{ fill: '#9aa0a6', fontSize: 11 }}
                      label={{ value: 'Turnout %', position: 'bottom', fill: '#9aa0a6', offset: 10 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <YAxis
                      type="number" dataKey="winnerPct"
                      tick={{ fill: '#9aa0a6', fontSize: 11 }}
                      label={{ value: 'Winner Vote %', angle: -90, position: 'insideLeft', fill: '#9aa0a6' }}
                      domain={['dataMin - 3', 'dataMax + 3']}
                    />
                    <ZAxis range={[30, 30]} />
                    <Tooltip content={<CustomScatterTooltip />} />
                    {/* P85 threshold lines */}
                    <ReferenceLine x={meta.p85Turnout} stroke="#f44853" strokeDasharray="6 3" label={{ value: `P85 Turnout`, fill: '#f44853', fontSize: 10, position: 'top' }} />
                    <ReferenceLine y={meta.p85WinnerPct} stroke="#f44853" strokeDasharray="6 3" label={{ value: `P85 Winner`, fill: '#f44853', fontSize: 10, position: 'right' }} />
                    <Scatter name="ทุกเขต" data={points} fill="#555">
                      {points.map((entry, i) => {
                        const isFlagged = flagged.some(f => f.areaCode === entry.areaCode)
                        return (
                          <Cell
                            key={i}
                            fill={isFlagged ? '#f44853' : '#555555'}
                            fillOpacity={isFlagged ? 0.9 : 0.25}
                            r={isFlagged ? 6 : 3}
                          />
                        )
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Flagged table */}
              <div className="province-table-container" style={{ maxHeight: 500, overflowY: 'auto' }}>
                <table className="province-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>เขต</th>
                      <th>จังหวัด</th>
                      <th>Turnout</th>
                      <th>Winner %</th>
                      <th>Margin</th>
                      <th>พรรค</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flagged.map((row, i) => (
                      <tr key={row.areaCode}>
                        <td style={{ fontWeight: 700, color: '#f44853' }}>#{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.areaName}</td>
                        <td style={{ color: '#9aa0a6' }}>{row.province}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ff8a4d' }}>{row.turnoutPct.toFixed(1)}%</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f44853' }}>{row.winnerPct.toFixed(1)}%</td>
                        <td style={{ fontFamily: 'monospace' }}>{row.marginPct.toFixed(1)}%</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <PartyLogo partyCode={row.winnerPartyCode} size={16} />
                            <span style={{ color: row.winnerPartyColor, fontWeight: 600 }}>{row.winnerParty}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Academic Reference ─── */}
      <div style={{
        marginTop: 24, padding: 14, background: '#1a1d2e', borderRadius: 8,
        fontSize: 11, color: '#777', lineHeight: 1.7,
      }}>
        <strong style={{ color: '#9aa0a6' }}>📚 อ้างอิง:</strong>{' '}
        Myagkov, M., Ordeshook, P. C., & Shakin, D. (2009). <em>The Forensics of Election Fraud: Russia and Ukraine.</em> Cambridge University Press.
        — โมเดลนี้ใช้วิเคราะห์เลือกตั้งรัสเซียและยูเครน โดยดูว่า Turnout ที่สูงขึ้นสัมพันธ์กับ vote share ของพรรคใดพรรคหนึ่งอย่างผิดปกติหรือไม่
      </div>
    </div>
  )
}
