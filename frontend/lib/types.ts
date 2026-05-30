export type CriterionType =
  | 'awards'
  | 'memberships'
  | 'press'
  | 'judging'
  | 'original_contributions'
  | 'scholarly_articles'
  | 'artistic_exhibitions'
  | 'critical_role'
  | 'high_salary'
  | 'commercial_success'

export type StrengthTier = 'strong' | 'medium' | 'weak'

export type OpportunityType =
  | 'cfp'
  | 'judging'
  | 'speaking'
  | 'award'
  | 'podcast'
  | 'grant'
  | 'peer_review'

export type OpportunityMode = 'online' | 'in_person' | 'hybrid'

export type OutcomeStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export type SalaryBand = 'under_150k' | '150k_200k' | '200k_300k' | '300k_plus'

export type FilingUrgency = 'aggressive' | 'building' | 'balanced'

export type DiscoveryWeights = {
  judging: number
  cfp: number
  speaking: number
  awards: number
  review: number
  podcast: number
}

export type StrategyWeights = {
  discovery_weights: DiscoveryWeights
  actions_per_day: number
  filing_urgency: FilingUrgency
}

export const DEFAULT_STRATEGY_WEIGHTS: StrategyWeights = {
  discovery_weights: {
    judging: 1.0, cfp: 1.0, speaking: 1.0,
    awards: 1.0, review: 1.0, podcast: 1.0,
  },
  actions_per_day: 3,
  filing_urgency: 'balanced',
}

export const CRITERION_LABELS: Record<CriterionType, string> = {
  awards: 'Awards & Prizes',
  memberships: 'Memberships',
  press: 'Press & Media',
  judging: 'Judging Others',
  original_contributions: 'Original Contributions',
  scholarly_articles: 'Scholarly Articles',
  artistic_exhibitions: 'Artistic Exhibitions',
  critical_role: 'Critical Role',
  high_salary: 'High Salary',
  commercial_success: 'Commercial Success',
}

export const SALARY_BAND_LABELS: Record<SalaryBand, string> = {
  under_150k: 'Under $150K',
  '150k_200k': '$150K – $200K',
  '200k_300k': '$200K – $300K',
  '300k_plus': '$300K+',
}

export const ALL_CRITERIA = Object.keys(CRITERION_LABELS) as CriterionType[]

export type EducationEntry = {
  degree: string
  field: string
  institution: string
  year: string
}

export type Profile = {
  id: string
  user_id: string
  domain: string
  role: string
  salary_band: SalaryBand
  country_of_origin: string
  target_field: string
  strategy_weights: StrategyWeights
  focused_criteria: CriterionType[] | null
  education: EducationEntry[]
  created_at: string
  updated_at: string
}

export type Evidence = {
  id: string
  user_id: string
  criterion: CriterionType
  title: string
  description: string | null
  url: string | null
  score: number | null
  strength_tier: StrengthTier | null
  verified: boolean
  created_at: string
  updated_at: string
}

export type Opportunity = {
  id: string
  user_id: string
  type: OpportunityType
  title: string
  description: string | null
  url: string | null
  deadline: string | null
  criterion: CriterionType | null
  priority_score: number | null
  country: string | null
  is_us: boolean
  delivery_mode: OpportunityMode
  dismissed: boolean
  applied: boolean
  created_at: string
}

export type Outcome = {
  id: string
  user_id: string
  opportunity_id: string
  status: OutcomeStatus
  notes: string | null
  decided_at: string | null
  created_at: string
}

export type DailyPlanAction = {
  rank: number
  title: string
  why: string
  criterion: string
  evidence_gain: number
  deadline: string
  time_required: string
  done: boolean
  carried_forward: boolean
}

export type DailyPlan = {
  id: string
  user_id: string
  plan_date: string
  actions: DailyPlanAction[]
  generated_at: string
}

export type ReflectionItem = {
  type: 'win' | 'loss' | 'insight' | 'change'
  text: string
}

export type WeeklyReflection = {
  id: string
  user_id: string
  week_start: string
  reflections: ReflectionItem[]
  generated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          domain: string
          role: string
          salary_band: SalaryBand
          country_of_origin: string
          target_field: string
          strategy_weights: StrategyWeights
          focused_criteria: CriterionType[] | null
          education: EducationEntry[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: string
          role: string
          salary_band: SalaryBand
          country_of_origin: string
          target_field: string
          strategy_weights?: StrategyWeights
          focused_criteria?: CriterionType[] | null
          education?: EducationEntry[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          domain?: string
          role?: string
          salary_band?: SalaryBand
          country_of_origin?: string
          target_field?: string
          strategy_weights?: StrategyWeights
          focused_criteria?: CriterionType[] | null
          education?: EducationEntry[]
          updated_at?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          id: string
          user_id: string
          criterion: CriterionType
          title: string
          description: string | null
          url: string | null
          score: number | null
          strength_tier: StrengthTier | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          criterion: CriterionType
          title: string
          description?: string | null
          url?: string | null
          score?: number | null
          strength_tier?: StrengthTier | null
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          criterion?: CriterionType
          title?: string
          description?: string | null
          url?: string | null
          score?: number | null
          strength_tier?: StrengthTier | null
          verified?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          id: string
          user_id: string
          type: OpportunityType
          title: string
          description: string | null
          url: string | null
          deadline: string | null
          criterion: CriterionType | null
          priority_score: number | null
          country: string | null
          is_us: boolean
          delivery_mode: OpportunityMode
          dismissed: boolean
          applied: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: OpportunityType
          title: string
          description?: string | null
          url?: string | null
          deadline?: string | null
          criterion?: CriterionType | null
          priority_score?: number | null
          country?: string | null
          is_us?: boolean
          delivery_mode?: OpportunityMode
          dismissed?: boolean
          applied?: boolean
          created_at?: string
        }
        Update: {
          type?: OpportunityType
          title?: string
          description?: string | null
          url?: string | null
          deadline?: string | null
          criterion?: CriterionType | null
          priority_score?: number | null
          country?: string | null
          is_us?: boolean
          delivery_mode?: OpportunityMode
          dismissed?: boolean
          applied?: boolean
        }
        Relationships: []
      }
      outcomes: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          status: OutcomeStatus
          notes: string | null
          decided_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          opportunity_id: string
          status?: OutcomeStatus
          notes?: string | null
          decided_at?: string | null
          created_at?: string
        }
        Update: {
          status?: OutcomeStatus
          notes?: string | null
          decided_at?: string | null
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          id: string
          user_id: string
          plan_date: string
          actions: DailyPlanAction[]
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_date: string
          actions: DailyPlanAction[]
          generated_at?: string
        }
        Update: {
          plan_date?: string
          actions?: DailyPlanAction[]
          generated_at?: string
        }
        Relationships: []
      }
      weekly_reflections: {
        Row: {
          id: string
          user_id: string
          week_start: string
          reflections: ReflectionItem[]
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          reflections: ReflectionItem[]
          generated_at?: string
        }
        Update: {
          week_start?: string
          reflections?: ReflectionItem[]
          generated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      criterion_type: CriterionType
      strength_tier_type: StrengthTier
      opportunity_type: OpportunityType
      outcome_status_type: OutcomeStatus
      salary_band_type: SalaryBand
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
