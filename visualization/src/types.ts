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

// ─── Province Map Data ───
export interface ProvinceMapParty {
  partyCode: string
  partyName: string
  partyColor: string
  seats: number
}

export interface ProvinceMapItem {
  provinceThai: string
  provinceEng: string
  totalSeats: number
  suspiciousCount: number
  dominantParty: string
  dominantPartyCode: string
  dominantPartyColor: string
  dominantPartySeats: number
  parties: ProvinceMapParty[]
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
    votePercent?: number
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
  fromCode66: string
  fromColor66: string
  toParty: string
  toPartyCode: string
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
  areaCode: string
  areaName: string
  winnerName: string
  partyName: string
  partyColor: string
  is66Winner?: boolean
  switchedParty?: boolean | null
  party66Ref?: string
  status: string
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

// ─── Ensemble Suspicion Score ───
export interface EnsembleAnalysisItem {
  areaCode: string
  areaName: string
  province: string
  suspicionScore: number
  rawScore: number
  finalScore: number
  riskLevel: 'high' | 'medium' | 'low'
  // Components (8 indicators)
  gapScore: number
  gapScaled: number
  gapMpVotes: number
  gapPlVotes: number
  plDeviationScore: number
  plDeviationZScore: number
  plDevPartyName: string
  plDevVotes: number
  plDevBaseline: number
  turnoutScore: number
  turnoutDeviation: number
  concentrationScore: number
  candidateCount: number
  consistencyScore: number
  consistencyDiff: number
  spoiledScore: number
  spoiledRatio: number
  dominanceScore: number
  dominanceHHI: number
  dominanceWinnerShare: number
  // No-Vote indicator
  noVoteScore: number
  noVoteRatio: number
  // Voters per Station
  votersPerStationScore: number
  votersPerStation: number
  // Benford's Law (1st-digit)
  benfordScore: number
  benfordChi2: number
  benfordPValue: number
  benfordDigitCounts: Record<string, number>
  benfordTotalNumbers: number
  // Population & Statistics
  eligibleVoters: number
  populationWeight: number
  pValue: number
  confidence: 'very-high' | 'high' | 'moderate' | 'low'
  // Spatial
  moranI: number
  spatialCluster: 'HH' | 'LL' | 'HL' | 'LH' | 'ns'
  spatialLag: number
  // Semi-supervised
  semiSupervisedLabel: 'suspect' | 'elevated' | 'normal' | 'unlabeled'
  // Entropy weights (same for all, stored for display)
  entropyWeights: Record<string, number>
  // Winner info
  winnerParty: string
  winnerPartyCode: string
  winnerPartyColor: string
  // Focus area tags & previous election info
  focusAreaTags: string[]
  win66PartyCode: string
  win66PartyName: string
  isOfficialSpoiledData: boolean
}

export interface EnsemblePartySummaryItem {
  partyCode: string
  partyName: string
  partyColor: string
  totalAreas: number
  avgScore: number
  medianScore: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  significantCount: number
  hotspotCount: number
}

export interface BenfordDigitItem {
  digit: number
  expected: number
  observed: number
  count: number
}

export interface EnsembleMeta {
  totalAreas: number
  features: number
  entropyWeights: Record<string, number>
  globalMoranI: number
  permutationIterations: number
  hotspots: number
  coldspots: number
  pLt001: number
  pLt005: number
  suspectLabels: number
  elevatedLabels: number
  focusAreaCounts: Record<string, number>
  officialSpoiledCount: number
  // Benford's Law (1st-digit)
  benfordGlobalChi2: number
  benfordGlobalPValue: number
  benfordGlobalDistribution: BenfordDigitItem[]
  benfordTotalNumbers: number
  benfordConformCount: number
  benfordDeviateCount: number
}

// ─── Monte Carlo Null Model (Twin-Number Effect) ───
export interface NullModelNumberResult {
  number: number
  partyName: string
  partyColor: string
  n: number
  nationalShare: number
  observedMeanShare: number
  lift: number
  liftPercent: number
  se: number
  zScore: number
  absZ: number
  pValueMC: number
  isBonferroniSig: boolean
  nullZMean: number
  nullZStd: number
}

export interface NullModelHistogramBin {
  binStart: number
  binEnd: number
  binMid: number
  count: number
  density: number
}

export interface NullModelStructuralBias {
  number: number
  partyName: string
  partyColor: string
  n: number
  se: number
  absZ: number
  nationalSharePct: number
  lift: number
  expectedAbsZUnderNull: number
  zRatio: number
}

export interface NullModelMeta {
  nIterations: number
  nAreas: number
  nPartyNumbers: number
  observedMaxAbsZ: number
  mcPValueGlobal: number
  bonferroniAlpha: number
  bonferroniZCritical: number
  significantNumbers: number[]
  nSignificant: number
  nullMaxZPercentiles: Record<string, number>
}

export interface NullModelAnalysis {
  perNumber: NullModelNumberResult[]
  maxZHistogram: NullModelHistogramBin[]
  structuralBias: NullModelStructuralBias[]
  meta: NullModelMeta
}

// ─── Klimek Fingerprint ───
export interface KlimekPoint {
  areaCode: string
  areaName: string
  province: string
  turnout: number
  winnerShare: number
  winnerParty: string
  winnerPartyColor: string
  eligibleVoters: number
  totalVotes: number
  winnerVotes: number
  suspicionScore: number
}

export interface KlimekHeatmapBin {
  turnoutBin: number
  shareBin: number
  count: number
  turnoutRange: [number, number]
  shareRange: [number, number]
}

export interface KlimekMeta {
  totalPoints: number
  meanTurnout?: number
  stdTurnout?: number
  meanWinnerShare?: number
  stdWinnerShare?: number
  minTurnout?: number
  maxTurnout?: number
  minWinnerShare?: number
  maxWinnerShare?: number
  correlation?: number
  highHighCount?: number
  bins: number
}

export interface KlimekAnalysis {
  points: KlimekPoint[]
  heatmap: KlimekHeatmapBin[]
  meta: KlimekMeta
}

// ─── Last-Digit Uniformity Test ───
export interface DigitDistributionItem {
  digit: number
  expected: number
  observed: number
  count: number
}

export interface DigitTestPerArea {
  areaCode: string
  chi2: number
  pValue: number
  digitCounts: Record<string, number>
  totalNumbers: number
  scaledScore: number
}

export interface LastDigitAnalysis {
  globalDistribution: DigitDistributionItem[]
  globalChi2: number
  globalPValue: number
  totalNumbers: number
  conformCount: number
  deviateCount: number
  perArea: DigitTestPerArea[]
}

// ─── 2nd-Digit Benford's Law (Mebane) ───
export interface SecondDigitBenfordAnalysis {
  globalDistribution: DigitDistributionItem[]
  globalChi2: number
  globalPValue: number
  totalNumbers: number
  conformCount: number
  deviateCount: number
  perArea: DigitTestPerArea[]
}

// ─── Spoiled Ballot Comparison (MP vs Referendum) ───
export interface SpoiledComparisonItem {
  areaCode: string
  areaName: string
  province: string
  mpNonValidPercent: number
  mpNonValidVotes: number
  mpValidVotes: number
  refNonValidPercent: number
  refBadVotes: number
  refNoVotes: number
  refGoodVotes: number
  delta: number
  totalBallots: number
  eligibleVoters: number
  turnoutPercent: number
  winnerParty: string
  winnerPartyColor: string
  isOutlier: boolean
}

export interface SpoiledComparisonMeta {
  totalAreas: number
  avgMpNonValid: number
  avgRefNonValid: number
  avgDelta: number
  medianDelta: number
  stdevDelta: number
  outlierThreshold: number
  outlierCount: number
}

// ─── National Election Comparison (66 vs 69) ───
export interface ElectionSummaryData {
  label: string
  eligible: number
  totalVotes: number
  goodVotes: number
  badVotes: number
  noVotes: number
  turnoutPercent: number
  spoiledPercent: number
  noVotePercent: number
  nonValidPercent: number
}

export interface ElectionComparison {
  election66: ElectionSummaryData
  election69mp: ElectionSummaryData
  election69ref: ElectionSummaryData
  changes: {
    turnoutDelta: number
    nonValidDelta_mpVs66: number
    nonValidDelta_refVs66: number
    spoiledDelta_refVs66: number
  }
}

// ─── Switcher Vote Comparison (66 vs 69 individual votes) ───
export interface SwitcherVoteComparisonItem {
  areaCode: string
  areaName: string
  province: string
  name: string
  party66: string
  party66Color: string
  party69: string
  party69Color: string
  switchedParty: boolean
  is66Winner: boolean
  rank66: number
  votes66: number
  pct66: number
  rank69: number
  votes69: number
  pct69: number
  voteDelta: number
  pctDelta: number
  portrait66: string
}

// ─── MP vs Party-List Comparison (ส้มหล่น) ───
export interface MpPlPartyCompare {
  partyCode: string
  partyName: string
  partyColor: string
  mpVotes: number
  plVotes: number
  diff: number
  diffPercent: number
}

export interface MpPlPartySummary extends MpPlPartyCompare {
  totalMpVotes: number
  totalPlVotes: number
  areasPlHigher: number
  areasPlLower: number
}

export interface MpPlAreaItem {
  areaCode: string
  areaName: string
  province: string
  totalMpVotes: number
  totalPlVotes: number
  totalDiff: number
  mpWinnerParty: string
  mpWinnerColor: string
  parties: MpPlPartyCompare[]
}

export interface MpPlComparisonMeta {
  totalAreas: number
  totalPartiesWithMp: number
  totalPartiesWithPl: number
  partiesPlHigher: number
  partiesPlLower: number
  topGainer: string
  topLoser: string
}

export interface MpPlComparison {
  partySummary: MpPlPartySummary[]
  perArea: MpPlAreaItem[]
  meta: MpPlComparisonMeta
}

// ─── Ballot Imbalance (บัตรเขย่ง) ───
export interface BallotImbalancePartyDiff {
  partyCode: string
  partyName: string
  partyColor: string
  mpVotes: number
  plVotes: number
  diff: number
}

export interface BallotImbalanceAreaItem {
  areaCode: string
  areaName: string
  province: string
  mpTotalVotes: number
  plTotalVotes: number
  diff: number
  absDiff: number
  diffPercent: number
  direction: 'mp' | 'pl' | 'equal'
  eligibleVoters: number
  turnoutPercent: number
  winnerParty: string
  winnerPartyColor: string
  zScore: number
  isOutlier: boolean
  topPartyDiffs: BallotImbalancePartyDiff[]
}

export interface BallotImbalanceHistogramBucket {
  bucket: number
  count: number
}

export interface BallotImbalanceProvince {
  province: string
  mpTotal: number
  plTotal: number
  diff: number
  diffPercent: number
  areas: number
  outliers: number
}

export interface BallotImbalanceMaxItem {
  areaCode: string
  areaName: string
  diffPercent: number
  diff: number
}

export interface BallotImbalanceMeta {
  totalAreas: number
  meanDiffPercent: number
  stdDiffPercent: number
  outlierCount: number
  mpHigherCount: number
  plHigherCount: number
  maxMpHigher: BallotImbalanceMaxItem | null
  maxPlHigher: BallotImbalanceMaxItem | null
}

export interface BallotImbalance {
  perArea: BallotImbalanceAreaItem[]
  histogram: BallotImbalanceHistogramBucket[]
  byProvince: BallotImbalanceProvince[]
  meta: BallotImbalanceMeta
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
  provinceMapData?: ProvinceMapItem[]
  regionSummary: RegionSummaryItem[]
  areaDetails: AreaDetail[]
  partySwitcherFlows: PartySwitcherFlow[]
  partySwitcherSummary: PartySwitcherSummaryItem[]
  retentionSummary: RetentionSummaryItem[]
  winnerRetention: WinnerRetentionItem[]
  lost66Winners: Lost66WinnerItem[]
  // Switcher Vote Comparison (66 vs 69)
  switcherVoteComparison?: SwitcherVoteComparisonItem[]
  // New data
  turnoutAnomaly?: TurnoutAnomalyItem[]
  voteSplitting?: VoteSplittingItem[]
  winningMargins?: WinningMarginItem[]
  // Spoiled Ballot Comparison
  spoiledComparison?: SpoiledComparisonItem[]
  spoiledComparisonMeta?: SpoiledComparisonMeta
  // National Election Comparison (66 vs 69)
  electionComparison?: ElectionComparison
  // Ensemble model
  ensembleAnalysis?: EnsembleAnalysisItem[]
  ensemblePartySummary?: EnsemblePartySummaryItem[]
  ensembleMeta?: EnsembleMeta
  // Monte Carlo Null Model
  nullModelAnalysis?: NullModelAnalysis
  // Klimek Fingerprint
  klimekAnalysis?: KlimekAnalysis
  // Last-Digit Uniformity Test
  lastDigitAnalysis?: LastDigitAnalysis
  // 2nd-Digit Benford's Law (Mebane)
  secondDigitBenfordAnalysis?: SecondDigitBenfordAnalysis
  // MP vs Party-List Comparison (ส้มหล่น)
  mpPlComparison?: MpPlComparison
  // Ballot Imbalance (บัตรเขย่ง)
  ballotImbalance?: BallotImbalance
}
