// ─── Party Meta ───
export interface PartyMeta {
  name: string
  num: number
  color: string
}

export type PartyMetaMap = Record<string, PartyMeta>
export type NameToCodeMap = Record<string, string>

// ─── Summary ───
export interface Summary {
  totalAreas: number
  totalSuspicious: number
  suspiciousPercent: number
  total66Winners?: number
  switchedCandidates?: number
}

// ─── Vote Buying Analysis ───
export interface VoteBuyingItem {
  areaCode: string
  areaName: string
  province: string
  isSuspicious: boolean
  winnerPartyCode: string
  winnerPartyName: string
  winnerPartyColor: string
  candidateNum: number
  targetPartyNum: number
  targetPartyName: string
  targetPlRank?: number
  targetPlVotes: number
}

// ─── Suspicious By Party ───
export interface SuspiciousByPartyItem {
  partyName: string
  partyCode: string
  total: number
  suspicious: number
  color: string
}

// ─── Target Party Counts ───
export interface TargetPartyCount {
  targetPartyNum: number
  targetPartyName: string
  winnerPartyName: string
  winnerPartyColor: string
  count: number
}

// ─── Rank Distribution ───
export interface RankDistributionItem {
  partyNum: number
  rank: number
  isSuspicious: boolean
}

// ─── Scatter Data ───
export interface ScatterItem {
  areaCode: string
  areaName: string
  isSuspicious: boolean
  winnerPartyName: string
  winnerPartyColor: string
  candidateNum: number
  mpVotes: number
  mpPercent: number
  plVotes: number
  plPercent: number
  plRank: number
}

// ─── Candidate Numbers ───
export interface CandidateNumberItem {
  partyCode: string
  partyColor: string
  number: number
  won: boolean
  voteTotal: number
}

// ─── Vote Anomaly ───
export interface VoteAnomalyItem {
  areaCode: string
  areaName: string
  winnerPartyName: string
  winnerPartyColor: string
  candidateNum: number
  targetPartyName: string
  targetPlVotes: number
  targetPlPercent: number
  targetPlRank: number
  medianSmallPartyVotes: number
  anomalyRatio: number
}

// ─── Province Summary ───
export interface ProvinceSummaryItem {
  province: string
  totalAreas: number
  suspiciousAreas: number
  suspiciousPercent: number
}

// ─── Region Summary ───
export interface RegionPartyDetail {
  partyName: string
  color: string
  total: number
  suspicious: number
}

export interface RegionSummaryItem {
  region: string
  total: number
  suspicious: number
  suspiciousPercent: number
  parties: RegionPartyDetail[]
}

// ─── Area Explorer ───
export interface CombinedCandidate {
  num: number
  mp?: {
    partyName: string
    partyColor: string
    candidateName: string
    voteTotal: number
    rank: number
    is66Winner?: boolean
    switchedParty?: boolean
  }
  pl?: {
    partyName: string
    partyColor: string
    voteTotal: number
    rank: number
  }
}

export interface AreaDetail {
  areaCode: string
  areaName: string
  province: string
  isSuspicious: boolean
  winnerNum: number
  winnerPartyName: string
  winnerPartyColor: string
  winnerName?: string
  winnerIs66Winner?: boolean
  winnerSwitchedParty?: boolean
  targetPartyNum?: number
  combined: CombinedCandidate[]
}

// ─── Party Switcher ───
export interface PartySwitcherFlow {
  fromParty66: string
  toParty: string
  toColor: string
  count: number
  names: string[]
}

export interface PartySwitcherSourceItem {
  fromParty: string
  count: number
}

export interface PartySwitcherSummaryItem {
  party: string
  color: string
  received: number
  sources: PartySwitcherSourceItem[]
}

// ─── Winner Retention ───
export interface RetentionSummaryItem {
  party: string
  color: string
  total: number
  retained: number
  switched: number
  newFace: number
}

export interface WinnerRetentionItem {
  areaName: string
  winnerName: string
  partyName: string
  partyColor: string
  status: string
  party66Ref?: string
}

export interface Lost66WinnerItem {
  name: string
  areaName: string
  partyName: string
  partyColor: string
  rank: number
  voteTotal: number
  switchedParty?: boolean
  party66Ref?: string
}

// ─── New Data: Constituency ───
export interface ConstituencyCandidate {
  candidateNo: number
  fullname: string
  partyCode: string
  partyName: string
  voteTotal: number
  votePercent: number
  rank: number
}

export interface ConstituencyArea {
  areaCode: string
  areaName: string
  province: string
  totalEligibleVoters: number
  totalStations: number
  stationsReported: number
  win66PartyCode: string
  candidates: ConstituencyCandidate[]
}

// ─── New Data: Party List ───
export interface PartyListResult {
  partyCode: string
  partyName: string
  voteTotal: number
  votePercent: number
}

export interface PartyListArea {
  areaCode: string
  results: PartyListResult[]
}

// ─── New Data: Referendum ───
export interface ReferendumArea {
  areaCode: string
  agree: number
  disagree: number
  goodVotes: number
  badVotes: number
  noVotes: number
  voteProgressPercent: number
}

// ─── New Analysis Types ───
export interface TurnoutAnomalyItem {
  areaCode: string
  areaName: string
  province: string
  turnoutPercent: number
  eligibleVoters: number
  deviation: number
  winnerParty: string
  winnerPartyColor: string
}

export interface VoteSplittingItem {
  areaCode: string
  areaName: string
  province: string
  mpWinnerParty: string
  mpWinnerColor: string
  mpWinnerPercent: number
  plWinnerParty: string
  plWinnerColor: string
  plWinnerPercent: number
  isSplit: boolean
}

export interface WinningMarginItem {
  areaCode: string
  areaName: string
  province: string
  winnerParty: string
  winnerVotes: number
  winnerPercent: number
  winnerPartyColor: string
  runnerUpParty: string
  runnerUpVotes: number
  runnerUpPercent: number
  margin: number
  marginPercent: number
}

export interface ReferendumCorrelationItem {
  areaCode: string
  areaName: string
  province: string
  agreePercent: number
  disagreePercent: number
  turnoutPercent: number
  mpWinnerParty: string
  mpWinnerPercent: number
  winnerPartyColor: string
}

// ─── Full Election Data ───
export interface ElectionData {
  summary: Summary
  partyMeta: PartyMetaMap
  voteBuyingAnalysis: VoteBuyingItem[]
  suspiciousByParty: SuspiciousByPartyItem[]
  targetPartyCounts: TargetPartyCount[]
  rankDistribution: RankDistributionItem[]
  scatterData: ScatterItem[]
  candidateNumbers: CandidateNumberItem[]
  voteAnomaly: VoteAnomalyItem[]
  provinceSummary: ProvinceSummaryItem[]
  regionSummary: RegionSummaryItem[]
  areaDetails: AreaDetail[]
  partySwitcherFlows: PartySwitcherFlow[]
  partySwitcherSummary: PartySwitcherSummaryItem[]
  retentionSummary: RetentionSummaryItem[]
  winnerRetention: WinnerRetentionItem[]
  lost66Winners: Lost66WinnerItem[]
  // New data
  turnoutAnomaly?: TurnoutAnomalyItem[]
  voteSplitting?: VoteSplittingItem[]
  winningMargins?: WinningMarginItem[]
  referendumCorrelation?: ReferendumCorrelationItem[]
}
