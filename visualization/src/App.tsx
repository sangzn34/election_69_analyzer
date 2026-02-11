import { useState, useEffect, useMemo } from 'react'
import type { ElectionData, NameToCodeMap } from './types'
import {
  BarChart3, Target, PieChart, Globe, MapPin,
  TrendingUp, Microscope, Zap, Hash, Search, ClipboardList,
  ArrowLeftRight, Medal, FlaskConical, TrendingDown, Scissors,
  Flag, Vote, TriangleAlert,
} from 'lucide-react'
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
import EnsembleAnalysis from './components/EnsembleAnalysis'
import { ScrollArea } from './components/ui/ScrollArea'
import { buildPartyNameToCode } from './utils/partyLogo'

type SectionId =
  | 'overview' | 'benefiting' | 'rank' | 'scatter' | 'anomaly'
  | 'candidate' | 'switcher' | 'retention' | 'party' | 'region'
  | 'province' | 'explorer' | 'list'
  | 'turnout' | 'splitting' | 'margin' | 'referendum'
  | 'ensemble'

interface MenuItem {
  id: SectionId
  label: string
  emoji: React.ReactNode
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

function App() {
  const [data, setData] = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}election_data.json`)
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

  const menuGroups: MenuGroup[] = [
    {
      title: 'ภาพรวม',
      items: [
        { id: 'overview' as SectionId, label: 'ภาพรวม', emoji: <BarChart3 size={16} /> },
        { id: 'benefiting' as SectionId, label: 'พรรคส้มหล่น', emoji: <Target size={16} /> },
        { id: 'party' as SectionId, label: 'แยกตามพรรค', emoji: <PieChart size={16} /> },
        { id: 'region' as SectionId, label: 'แยกตามภูมิภาค', emoji: <Globe size={16} /> },
        { id: 'province' as SectionId, label: 'แยกตามจังหวัด', emoji: <MapPin size={16} /> },
      ],
    },
    {
      title: 'วิเคราะห์เชิงลึก',
      items: [
        { id: 'rank' as SectionId, label: 'การกระจายอันดับ', emoji: <TrendingUp size={16} /> },
        { id: 'scatter' as SectionId, label: 'Scatter Plot', emoji: <Microscope size={16} /> },
        { id: 'anomaly' as SectionId, label: 'Anomaly Score', emoji: <Zap size={16} /> },
        { id: 'candidate' as SectionId, label: 'เบอร์ผู้สมัคร', emoji: <Hash size={16} /> },
        { id: 'explorer' as SectionId, label: 'เจาะลึกรายเขต', emoji: <Search size={16} /> },
        { id: 'list' as SectionId, label: 'รายชื่อเขต', emoji: <ClipboardList size={16} /> },
      ],
    },
    {
      title: 'ผู้สมัคร',
      items: [
        { id: 'switcher' as SectionId, label: 'ย้ายพรรค', emoji: <ArrowLeftRight size={16} /> },
        { id: 'retention' as SectionId, label: 'ส.ส.66 รักษาที่นั่ง', emoji: <Medal size={16} /> },
      ],
    },
    {
      title: 'โมเดลใหม่',
      items: [
        ...(data.ensembleAnalysis ? [{ id: 'ensemble' as const, label: 'Ensemble Score', emoji: <FlaskConical size={16} /> }] : []),
        ...(data.turnoutAnomaly ? [{ id: 'turnout' as const, label: 'Turnout ผิดปกติ', emoji: <TrendingDown size={16} /> }] : []),
        ...(data.voteSplitting ? [{ id: 'splitting' as const, label: 'Vote Splitting', emoji: <Scissors size={16} /> }] : []),
        ...(data.winningMargins ? [{ id: 'margin' as const, label: 'Winning Margin', emoji: <Flag size={16} /> }] : []),
        ...(data.referendumCorrelation ? [{ id: 'referendum' as const, label: 'ประชามติ vs เลือกตั้ง', emoji: <Vote size={16} /> }] : []),
      ],
    },
  ].filter(g => g.items.length > 0)

  const activeLabel = menuGroups.flatMap(g => g.items).find(i => i.id === activeSection)

  const handleSelect = (id: SectionId) => {
    setActiveSection(id)
    setMenuOpen(false)
  }

  return (
    <div className="app">
      <header className="header">
        <h1><Vote size={28} style={{ verticalAlign: -4 }} /> วิเคราะห์ทฤษฎีการซื้อเสียง เลือกตั้ง 2569</h1>
        <p>ทฤษฎี "กาเบอร์เดียวกันทั้ง 2 ใบ" — การวิเคราะห์ความสัมพันธ์ระหว่างเบอร์ ส.ส. เขต กับ คะแนนบัญชีรายชื่อ</p>
        <div className="disclaimer">
          <TriangleAlert size={14} style={{ verticalAlign: -2 }} /> ข้อมูลนี้เป็นการวิเคราะห์ทางสถิติเท่านั้น ใช้คำว่า "น่าสงสัย" ไม่ได้ตัดสินว่ามีการซื้อเสียงจริง
        </div>
      </header>

      <SummaryCards summary={data.summary} />

      {/* Mobile menu toggle */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <span className="menu-toggle-icon">{menuOpen ? '✕' : '☰'}</span>
        <span>{activeLabel ? <>{activeLabel.emoji} {activeLabel.label}</> : 'เมนู'}</span>
        <span className="menu-toggle-arrow">{menuOpen ? '▲' : '▼'}</span>
      </button>

      <div className="layout">
        {/* Sidebar */}
        <nav className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <ScrollArea>
            {menuGroups.map(group => (
              <div key={group.title} className="sidebar-group">
                <div className="sidebar-group-title">{group.title}</div>
                {group.items.map(item => (
                  <button
                    key={item.id}
                    className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                    onClick={() => handleSelect(item.id)}
                  >
                    <span className="sidebar-item-emoji">{item.emoji}</span>
                    <span className="sidebar-item-label">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </ScrollArea>
        </nav>

        {/* Content */}
        <main className="content">
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
          {activeSection === 'ensemble' && data.ensembleAnalysis && data.ensemblePartySummary && <EnsembleAnalysis data={data.ensembleAnalysis} partySummary={data.ensemblePartySummary} meta={data.ensembleMeta} nameToCodeMap={nameToCodeMap} />}
        </main>
      </div>
    </div>
  )
}

export default App
