export type EvaluatorPhase = 'form' | 'processing' | 'results'

export interface IntakeData {
  // Step 1 — Who You Are
  fullName: string
  email: string
  country: string
  visaStatus: string
  expertiseField: string
  subSpecialization: string
  yearsExperience: number

  // Step 2 — Work & Role
  currentTitle: string
  employerType: string
  isSeniorOrLeadership: string
  managesTeam: string
  citedAsKeyPerson: string
  salaryBracket: string

  // Step 3 — Publications & Research
  hasPublications: boolean
  publicationCount: string
  publicationVenues: string[]
  totalCitations: string
  hasPatents: string
  hasBook: boolean

  // Step 4 — Recognition & Awards
  hasAwards: boolean
  awardDescription: string
  awardScope: string
  onMajorList: boolean
  hasEliteCerts: boolean

  // Step 5 — Judging & Peer Review
  hasJudged: boolean
  judgingCount: string
  judgingScope: string
  hasPeerReviewed: boolean
  peerReviewVenues: string
  hasServedOnPanel: boolean

  // Step 6 — Media & Recognition
  hasPressCorver: boolean
  pressType: string[]
  hasBeenQuoted: boolean
  onlinePresence: string[]

  // Step 7 — Speaking & Community
  hasSpeaking: boolean
  speakingScope: string
  speakingCount: string
  inProfAssociation: boolean
  organizesComm: boolean

  // Step 8 — Original Contributions
  hasMajorContrib: boolean
  contribDescription: string
  hasOpenSource: boolean
  githubStars: string
  hasStandardsWork: boolean

  // Step 9 — Readiness Context
  priorPetition: string
  hasAttorney: string
  targetTimeline: string
  biggestGap: string
}

export interface CriterionEvaluation {
  id: string
  label: string
  status: 'met' | 'partial' | 'not_met'
  confidence: 'high' | 'medium' | 'low'
  evidenceMapping: string[]
  qualityFlag: 'substantive' | 'surface_level' | 'none'
  gapExplanation: string
}

export interface GapItem {
  criterionId: string
  label: string
  priority: 1 | 2 | 3
  effortLevel: 'low' | 'medium' | 'high'
  actions: string[]
}

export interface RoadmapAction {
  text: string
  type: 'judging' | 'publication' | 'speaking' | 'press' | 'documentation'
}

export interface RoadmapMonth {
  month: number
  label: string
  actions: RoadmapAction[]
}

export interface EvaluationResult {
  assessmentId: string
  readinessScore: number
  holisticVerdict: 'strong' | 'developing' | 'early_stage'
  foeStatement: string
  criteria: CriterionEvaluation[]
  topGaps: GapItem[]
  roadmap: RoadmapMonth[]
  estimatedMonths: string
  timelineStatement: string
  paidPlatformBridge: {
    headline: string
    categories: string[]
  }
}
