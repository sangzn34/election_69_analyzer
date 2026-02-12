'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { ElectionData, NameToCodeMap } from '../src/types'
import {
  BarChart3, Target, PieChart, Globe, MapPin, Map,
  TrendingUp, Microscope, Zap, Hash, Search, ClipboardList,
  ArrowLeftRight, ArrowRightLeft, Medal, FlaskConical, TrendingDown, Scissors,
  Flag, Vote, TriangleAlert, FileWarning, XCircle, ChevronUp, ChevronDown, X, Menu,
  Newspaper, ScanBarcode,
} from 'lucide-react'
import SummaryCards from '../src/components/SummaryCards'
import TopBenefitingParties from '../src/components/TopBenefitingParties'
import RankDistribution from '../src/components/RankDistribution'
import SuspiciousByParty from '../src/components/SuspiciousByParty'
import ProvinceBreakdown from '../src/components/ProvinceBreakdown'
import SuspiciousAreaList from '../src/components/SuspiciousAreaList'
import ScatterAnalysis from '../src/components/ScatterAnalysis'
import CandidateNumbers from '../src/components/CandidateNumbers'
import RegionBreakdown from '../src/components/RegionBreakdown'
import VoteAnomaly from '../src/components/VoteAnomaly'
import AreaExplorer from '../src/components/AreaExplorer'
import PartySwitcher from '../src/components/PartySwitcher'
import PartySwitcherDetail from '../src/components/PartySwitcherDetail'
import WinnerRetention from '../src/components/WinnerRetention'
import TurnoutAnomaly from '../src/components/TurnoutAnomaly'
import VoteSplitting from '../src/components/VoteSplitting'
import WinningMargin from '../src/components/WinningMargin'
import SpoiledComparison from '../src/components/SpoiledComparison'
import EnsembleAnalysis from '../src/components/EnsembleAnalysis'
import SwitcherVoteComparison from '../src/components/SwitcherVoteComparison'
import MpPlComparison from '../src/components/MpPlComparison'
import BallotImbalance from '../src/components/BallotImbalance'
import BallotBarcode from '../src/components/BallotBarcode'
import ElectionNews from '../src/components/ElectionNews'
import { ScrollArea } from '../src/components/ui/ScrollArea'
import { buildPartyNameToCode } from '../src/utils/partyLogo'

/* Leaflet accesses `window` at import time — must be loaded only on the client */
const ProvinceMap = dynamic(() => import('../src/components/ProvinceMap'), { ssr: false })

type SectionId =
  | 'overview' | 'benefiting' | 'rank' | 'scatter' | 'anomaly'
  | 'candidate' | 'switcher' | 'switcherDetail' | 'switcherVote' | 'retention' | 'party' | 'region'
  | 'province' | 'map' | 'explorer' | 'list'
  | 'turnout' | 'splitting' | 'margin' | 'spoiled'
  | 'ensemble' | 'mpPl' | 'ballotImbalance'
  | 'barcode' | 'news'

interface MenuItem {
  id: SectionId
  label: string
  emoji: React.ReactNode
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const ALL_SECTIONS: SectionId[] = [
  'overview', 'benefiting', 'rank', 'scatter', 'anomaly',
  'candidate', 'switcher', 'switcherDetail', 'switcherVote', 'retention', 'party', 'region',
  'province', 'map', 'explorer', 'list',
  'turnout', 'splitting', 'margin', 'spoiled',
  'ensemble', 'mpPl', 'ballotImbalance',
  'barcode', 'news',
]

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/election_69_analyzer'

function getSectionFromURL(): SectionId {
  if (typeof window === 'undefined') return 'overview'
  const params = new URLSearchParams(window.location.search)
  const s = params.get('section')
  if (s && ALL_SECTIONS.includes(s as SectionId)) return s as SectionId
  return 'overview'
}

export default function HomePage() {
  const [data, setData] = useState<ElectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  /* Read URL on mount */
  useEffect(() => {
    setActiveSection(getSectionFromURL())
  }, [])

  /* Sync URL → state on popstate (browser back/forward) */
  useEffect(() => {
    const onPop = () => setActiveSection(getSectionFromURL())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    fetch(`${BASE_PATH}/election_data.json`)
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

  const handleSelect = useCallback((id: SectionId) => {
    setActiveSection(id)
    setMenuOpen(false)
    const url = new URL(window.location.href)
    if (id === 'overview') {
      url.searchParams.delete('section')
    } else {
      url.searchParams.set('section', id)
    }
    window.history.pushState(null, '', url.toString())
  }, [])

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
        <XCircle size={18} style={{ verticalAlign: -3, marginRight: 4 }} /> ไม่สามารถโหลดข้อมูลได้ กรุณารัน <code>python3 scripts/prepare_data.py</code> ก่อน
      </div>
    )
  }

  const menuGroups: MenuGroup[] = [
    {
      title: 'ประเด็นร้อน',
      items: [
        { id: 'barcode' as SectionId, label: 'บาร์โค้ดบัตรเลือกตั้ง', emoji: <ScanBarcode size={16} /> },
        { id: 'news' as SectionId, label: 'ข่าวความผิดปกติ', emoji: <Newspaper size={16} /> },
      ],
    },
    {
      title: 'ภาพรวม',
      items: [
        { id: 'overview' as SectionId, label: 'ภาพรวม', emoji: <BarChart3 size={16} /> },
        { id: 'benefiting' as SectionId, label: 'พรรคส้มหล่น', emoji: <Target size={16} /> },
        { id: 'party' as SectionId, label: 'แยกตามพรรค', emoji: <PieChart size={16} /> },
        { id: 'region' as SectionId, label: 'แยกตามภูมิภาค', emoji: <Globe size={16} /> },
        { id: 'province' as SectionId, label: 'แยกตามจังหวัด', emoji: <MapPin size={16} /> },
        ...(data.provinceMapData ? [{ id: 'map' as const, label: 'แผนที่เลือกตั้ง', emoji: <Map size={16} /> }] : []),
      ],
    },
    {
      title: 'วิเคราะห์ความผิดปกติ',
      items: [
        ...(data.ensembleAnalysis ? [{ id: 'ensemble' as const, label: 'Ensemble Score', emoji: <FlaskConical size={16} /> }] : []),
        { id: 'scatter' as SectionId, label: 'Scatter Plot', emoji: <Microscope size={16} /> },
        { id: 'anomaly' as SectionId, label: 'Anomaly Score', emoji: <Zap size={16} /> },
        ...(data.turnoutAnomaly ? [{ id: 'turnout' as const, label: 'Turnout ผิดปกติ', emoji: <TrendingDown size={16} /> }] : []),
        ...(data.mpPlComparison ? [{ id: 'mpPl' as const, label: 'ส.ส.เขต vs บัญชีรายชื่อ', emoji: <Vote size={16} /> }] : []),
        ...(data.ballotImbalance ? [{ id: 'ballotImbalance' as const, label: 'บัตรเขย่ง', emoji: <TriangleAlert size={16} /> }] : []),
        ...(data.voteSplitting ? [{ id: 'splitting' as const, label: 'Vote Splitting', emoji: <Scissors size={16} /> }] : []),
        ...(data.winningMargins ? [{ id: 'margin' as const, label: 'Winning Margin', emoji: <Flag size={16} /> }] : []),
        ...(data.spoiledComparison ? [{ id: 'spoiled' as const, label: 'บัตรไม่สมบูรณ์ 66 vs 69', emoji: <FileWarning size={16} /> }] : []),
      ],
    },
    {
      title: 'ข้อมูลผู้สมัคร',
      items: [
        { id: 'candidate' as SectionId, label: 'เบอร์ผู้สมัคร', emoji: <Hash size={16} /> },
        { id: 'rank' as SectionId, label: 'การกระจายอันดับ', emoji: <TrendingUp size={16} /> },
        { id: 'switcher' as SectionId, label: 'ย้ายพรรค', emoji: <ArrowLeftRight size={16} /> },
        { id: 'switcherDetail' as SectionId, label: 'ส.ส. ย้ายพรรค (รายคน)', emoji: <ArrowRightLeft size={16} /> },
        ...(data.switcherVoteComparison ? [{ id: 'switcherVote' as const, label: 'คะแนน 66 vs 69', emoji: <TrendingUp size={16} /> }] : []),
        { id: 'retention' as SectionId, label: 'ส.ส.66 รักษาที่นั่ง', emoji: <Medal size={16} /> },
      ],
    },
    {
      title: 'ค้นหา & สำรวจ',
      items: [
        { id: 'explorer' as SectionId, label: 'เจาะลึกรายเขต', emoji: <Search size={16} /> },
        { id: 'list' as SectionId, label: 'รายชื่อเขต', emoji: <ClipboardList size={16} /> },
      ],
    },
  ].filter(g => g.items.length > 0)

  const activeLabel = menuGroups.flatMap(g => g.items).find(i => i.id === activeSection)

  return (
    <div className="app">
      <header className="header">
        <h1><Vote size={28} style={{ verticalAlign: -4 }} /> วิเคราะห์ทฤษฎีการซื้อเสียง เลือกตั้ง 2569</h1>
        <p>ทฤษฎี &quot;กาเบอร์เดียวกันทั้ง 2 ใบ&quot; — การวิเคราะห์ความสัมพันธ์ระหว่างเบอร์ ส.ส. เขต กับ คะแนนบัญชีรายชื่อ</p>
        <div className="disclaimer">
          <TriangleAlert size={14} style={{ verticalAlign: -2 }} /> ข้อมูลนี้เป็นการวิเคราะห์ทางสถิติเท่านั้น ใช้คำว่า &quot;น่าสงสัย&quot; ไม่ได้ตัดสินว่ามีการซื้อเสียงจริง
        </div>
      </header>

      <SummaryCards summary={data.summary} />

      {/* Mobile menu toggle */}
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        <span className="menu-toggle-icon">{menuOpen ? <X size={16} /> : <Menu size={16} />}</span>
        <span>{activeLabel ? <>{activeLabel.emoji} {activeLabel.label}</> : 'เมนู'}</span>
        <span className="menu-toggle-arrow">{menuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
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
          {activeSection === 'barcode' && <BallotBarcode />}
          {activeSection === 'news' && <ElectionNews />}

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
          {activeSection === 'switcherDetail' && <PartySwitcherDetail winnerRetention={data.winnerRetention} areaDetails={data.areaDetails} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'switcherVote' && data.switcherVoteComparison && <SwitcherVoteComparison data={data.switcherVoteComparison} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'retention' && <WinnerRetention retentionSummary={data.retentionSummary} winnerRetention={data.winnerRetention} lost66Winners={data.lost66Winners} summary={data.summary} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'party' && <SuspiciousByParty data={data.suspiciousByParty} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'region' && <RegionBreakdown data={data.regionSummary} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'province' && <ProvinceBreakdown data={data.provinceSummary} />}
          {activeSection === 'map' && data.provinceMapData && <ProvinceMap data={data.provinceMapData} />}
          {activeSection === 'explorer' && <AreaExplorer data={data.areaDetails} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'list' && <SuspiciousAreaList data={data.voteBuyingAnalysis} nameToCodeMap={nameToCodeMap} />}

          {activeSection === 'turnout' && data.turnoutAnomaly && <TurnoutAnomaly data={data.turnoutAnomaly} />}
          {activeSection === 'splitting' && data.voteSplitting && <VoteSplitting data={data.voteSplitting} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'mpPl' && data.mpPlComparison && <MpPlComparison data={data.mpPlComparison} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'ballotImbalance' && data.ballotImbalance && <BallotImbalance data={data.ballotImbalance} nameToCodeMap={nameToCodeMap} />}
          {activeSection === 'margin' && data.winningMargins && <WinningMargin data={data.winningMargins} />}
          {activeSection === 'spoiled' && data.spoiledComparison && data.spoiledComparisonMeta && <SpoiledComparison data={data.spoiledComparison} meta={data.spoiledComparisonMeta} nameToCodeMap={nameToCodeMap} comparison={data.electionComparison} />}
          {activeSection === 'ensemble' && data.ensembleAnalysis && data.ensemblePartySummary && <EnsembleAnalysis data={data.ensembleAnalysis} partySummary={data.ensemblePartySummary} meta={data.ensembleMeta} nameToCodeMap={nameToCodeMap} nullModel={data.nullModelAnalysis} klimek={data.klimekAnalysis} lastDigit={data.lastDigitAnalysis} secondDigitBenford={data.secondDigitBenfordAnalysis} />}
        </main>
      </div>
    </div>
  )
}
