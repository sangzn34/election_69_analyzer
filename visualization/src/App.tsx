import { useState, useEffect, useMemo } from 'react'
import type { ElectionData, NameToCodeMap } from './types'
import SummaryCards from './components/SummaryCards'
import TopBenefitingParties from './components/TopBenefitingParties'
import RankDistribution from './components/RankDistribution'
import SuspiciousByParty from './components/SuspiciousByParty'
import ProvinceBreakdown from './components/ProvinceBreakdown'
import SuspiciousAreaList from './components/SuspiciousAreaList'
import ScatterAnalysis from './components/ScatterAnalysis'
import CandidateNumbers from './components/CandidateNumbers'
import RegionBreakdown from './components/RegionBreakdown'
import VoteAnomaly from './components/VoteAnomaly'
import AreaExplorer from './components/AreaExplorer'
import PartySwitcher from './components/PartySwitcher'
import WinnerRetention from './components/WinnerRetention'
import TurnoutAnomaly from './components/TurnoutAnomaly'
import VoteSplitting from './components/VoteSplitting'
import WinningMargin from './components/WinningMargin'
import ReferendumCorrelation from './components/ReferendumCorrelation'
import { buildPartyNameToCode } from './utils/partyLogo'

type SectionId =
  | 'overview' | 'benefiting' | 'rank' | 'scatter' | 'anomaly'
  | 'candidate' | 'switcher' | 'retention' | 'party' | 'region'
  | 'province' | 'explorer' | 'list'
  | 'turnout' | 'splitting' | 'margin' | 'referendum'

interface Section {
  id: SectionId
  label: string
}

function App() {
  const [data, setData] = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  useEffect(() => {
    fetch('/election_data.json')
      .then(res => res.json())
      .then((d: ElectionData) => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load data:', err)
        setLoading(false)
      })
  }, [])

  const nameToCodeMap: NameToCodeMap = useMemo(
    () => (data ? buildPartyNameToCode(data.partyMeta) : {}),
    [data]
  )

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        กำลังโหลดข้อมูล...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="loading">
        ❌ ไม่สามารถโหลดข้อมูลได้ กรุณารัน <code>python3 scripts/prepare_data.py</code> ก่อน
      </div>
    )
  }

  const sections: Section[] = [
    { id: 'overview', label: '📊 ภาพรวม' },
    { id: 'benefiting', label: '🎯 พรรคส้มหล่น' },
    { id: 'rank', label: '📈 การกระจายอันดับ' },
    { id: 'scatter', label: '🔬 Scatter Plot' },
    { id: 'anomaly', label: '⚡ Anomaly Score' },
    { id: 'candidate', label: '🔢 เบอร์ผู้สมัคร' },
    { id: 'switcher', label: '🔄 ย้ายพรรค' },
    { id: 'retention', label: '🏅 ส.ส.66 รักษาที่นั่ง' },
    { id: 'party', label: '🥧 แยกตามพรรค' },
    { id: 'region', label: '🌍 แยกตามภูมิภาค' },
    { id: 'province', label: '🗺️ แยกตามจังหวัด' },
    { id: 'explorer', label: '🔎 เจาะลึกรายเขต' },
    { id: 'list', label: '📋 รายชื่อเขต' },
    ...(data.turnoutAnomaly ? [{ id: 'turnout' as const, label: '📉 Turnout ผิดปกติ' }] : []),
    ...(data.voteSplitting ? [{ id: 'splitting' as const, label: '✂️ Vote Splitting' }] : []),
    ...(data.winningMargins ? [{ id: 'margin' as const, label: '🏁 Winning Margin' }] : []),
    ...(data.referendumCorrelation ? [{ id: 'referendum' as const, label: '🗳️ ประชามติ vs เลือกตั้ง' }] : []),
  ]

  return (
    <div className="app">
      <header className="header">
        <h1>🗳️ วิเคราะห์ทฤษฎีการซื้อเสียง เลือกตั้ง 2569</h1>
        <p>ทฤษฎี "กาเบอร์เดียวกันทั้ง 2 ใบ" — การวิเคราะห์ความสัมพันธ์ระหว่างเบอร์ ส.ส. เขต กับ คะแนนบัญชีรายชื่อ</p>
        <div className="disclaimer">
          ⚠️ ข้อมูลนี้เป็นการวิเคราะห์ทางสถิติเท่านั้น ใช้คำว่า "น่าสงสัย" ไม่ได้ตัดสินว่ามีการซื้อเสียงจริง
        </div>
      </header>

      <SummaryCards summary={data.summary} />

      <div className="tabs">
        {sections.map(s => (
          <button key={s.id} className={`tab ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'overview' && (
        <>
          <TopBenefitingParties data={data.targetPartyCounts} partyMeta={data.partyMeta} nameToCodeMap={nameToCodeMap} />
          <SuspiciousByParty data={data.suspiciousByParty} nameToCodeMap={nameToCodeMap} />
          <RegionBreakdown data={data.regionSummary} nameToCodeMap={nameToCodeMap} />
        </>
      )}

      {activeSection === 'benefiting' && <TopBenefitingParties data={data.targetPartyCounts} partyMeta={data.partyMeta} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'rank' && <RankDistribution data={data.rankDistribution} />}
      {activeSection === 'scatter' && <ScatterAnalysis data={data.scatterData} />}
      {activeSection === 'anomaly' && <VoteAnomaly data={data.voteAnomaly} />}
      {activeSection === 'candidate' && <CandidateNumbers data={data.candidateNumbers} />}
      {activeSection === 'switcher' && <PartySwitcher flows={data.partySwitcherFlows} summary={data.partySwitcherSummary} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'retention' && <WinnerRetention retentionSummary={data.retentionSummary} winnerRetention={data.winnerRetention} lost66Winners={data.lost66Winners} summary={data.summary} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'party' && <SuspiciousByParty data={data.suspiciousByParty} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'region' && <RegionBreakdown data={data.regionSummary} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'province' && <ProvinceBreakdown data={data.provinceSummary} />}
      {activeSection === 'explorer' && <AreaExplorer data={data.areaDetails} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'list' && <SuspiciousAreaList data={data.voteBuyingAnalysis} nameToCodeMap={nameToCodeMap} />}

      {activeSection === 'turnout' && data.turnoutAnomaly && <TurnoutAnomaly data={data.turnoutAnomaly} />}
      {activeSection === 'splitting' && data.voteSplitting && <VoteSplitting data={data.voteSplitting} nameToCodeMap={nameToCodeMap} />}
      {activeSection === 'margin' && data.winningMargins && <WinningMargin data={data.winningMargins} />}
      {activeSection === 'referendum' && data.referendumCorrelation && <ReferendumCorrelation data={data.referendumCorrelation} nameToCodeMap={nameToCodeMap} />}
    </div>
  )
}

export default App
