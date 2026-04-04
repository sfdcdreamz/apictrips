export type MemberStatus = 'in' | 'tentative' | 'out'
export type VibeBudget = 'budget' | 'mid-range' | 'luxury'
export type VibePace = 'relaxed' | 'moderate' | 'packed'
export type VibeStyle = 'beach' | 'adventure' | 'culture' | 'city' | 'mixed'
export type VibeAccommodation = 'hostel' | 'airbnb' | 'hotel' | 'luxury'

export interface Trip {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  group_size: number
  organiser_id: string
  invite_code: string
  created_at: string
}

export interface Member {
  id: string
  trip_id: string
  name: string
  email: string
  status: MemberStatus
  is_organiser: boolean
  vibe_budget: VibeBudget | null
  vibe_pace: VibePace | null
  vibe_style: VibeStyle | null
  vibe_accommodation: VibeAccommodation | null
  vibe_completed: boolean
  joined_at: string
  user_id?: string | null
  upi_id?: string | null
}

export interface ConflictDetail {
  dimension: 'budget' | 'pace' | 'style' | 'accommodation'
  values: string[]
  message: string
  suggestion?: string
}

export interface ConflictResult {
  has_conflict: boolean
  conflicts: ConflictDetail[]
}

export interface TripWithMemberCount extends Trip {
  member_count: number
}

export type PollStatus = 'open' | 'locked'
export type ExpenseCategory = 'Flights' | 'Stay' | 'Food' | 'Transport' | 'Experiences' | 'Misc'

export interface Poll {
  id: string; trip_id: string; question: string; options: string[]
  deadline: string; status: PollStatus; winning_option: string | null
  created_by: string | null; created_at: string
}
export interface Vote {
  id: string; poll_id: string; member_email: string
  option_chosen: string; voted_at: string
}
export interface PollWithVotes extends Poll { votes: Vote[] }

export interface Pool {
  id: string; trip_id: string; total_amount: number
  per_member_contribution: number; currency: string; created_at: string
}
export interface Expense {
  id: string; pool_id: string; amount: number; category: ExpenseCategory
  description: string; logged_by: string; expense_date: string; created_at: string
  paid_by?: string | null
  split_between?: string[] | null
  receipt_url?: string | null
}

export interface Settlement {
  id: string
  trip_id: string
  from_email: string
  to_email: string
  amount: number
  currency: string
  status: 'pending' | 'confirmed'
  upi_ref?: string | null
  created_at: string
  confirmed_at?: string | null
}

export interface VendorContact {
  id: string
  trip_id: string
  name: string
  role: string
  phone: string | null
  notes: string | null
  added_by: string
  created_at: string
}

export type TripHealthStatus = 'healthy' | 'at-risk' | 'not-started'
export interface TripHealth { status: TripHealthStatus; label: string; reason: string }

export interface ItineraryItem {
  id: string
  trip_id: string
  day_number: number
  day_date: string | null
  time: string | null
  title: string
  description: string | null
  item_type: 'activity' | 'meal' | 'transport' | 'stay'
  status: 'pending' | 'done'
  cost: number
  created_at: string
}
