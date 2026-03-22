// ── 页面路由 ─────────────────────────────────────────
export type Page =
  | 'agents'
  | 'agent-detail'
  | 'groups'
  | 'group-detail'
  | 'risk';

export type CollaborationMode = 'consensus' | 'collaboration' | 'hybrid';

// ── Agent ─────────────────────────────────────────────
export interface Agent {
  agent_id: string;
  capability_weight: number;
  specialization: Record<string, number>;
  role?: string | null;
  historical_accuracy?: number;
  total_evaluations?: number;
  correct_count?: number;
  group_breakdown?: Array<{
    group_id: string;
    accuracy: number;
    evaluations: number;
    correct_count: number;
  }>;
  last_updated?: string;
}

// ── Group ─────────────────────────────────────────────
export interface Group {
  group_id: string;
  group_name: string;
  description?: string;
  mode: CollaborationMode;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

// ── GroupMember ───────────────────────────────────────
export interface GroupMember {
  group_id: string;
  agent_id: string;
  role?: string;
  mode: CollaborationMode;
  capability_weight: number;
  specialization: Record<string, number>;
  added_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

// ── Message ───────────────────────────────────────────
export interface Message {
  message_id: string;
  group_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent';
  content: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// ── Solution ──────────────────────────────────────────
export interface Solution {
  agent_id: string;
  answer: string;
  reasoning: string;
  confidence: number;
  timestamp?: string;
  metadata?: Record<string, any>;
}

// ── ConsensusRound ────────────────────────────────────
export interface ConsensusRound {
  round_number: number;
  agent_responses: Record<string, Solution>;
  consensus_status: 'forming' | 'reached' | 'diverging';
  candidate_answer?: string;
  candidate_confidence?: number;
  stability_counter: number;
  timestamp?: string;
}

// ── KnowledgeGraph ────────────────────────────────────
export interface KGEntity {
  entity_id: string;
  entity_type: string;
  name: string;
  attributes: Record<string, any>;
}

export interface KGRelation {
  relation_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relation_type: string;
  properties: Record<string, any>;
}

export interface KnowledgeGraph {
  graph_id: string;
  source_type: string;
  source_id?: string;
  entities: KGEntity[];
  relations: KGRelation[];
  created_at: string;
  metadata: Record<string, any>;
}

// ── AgentGraph ────────────────────────────────────────
export interface AgentRelationship {
  source_agent_id: string;
  target_agent_id: string;
  influence_weight: number;
  trust_score: number;
  disagreement_count: number;
  agreement_count: number;
  last_interaction?: string;
}

export interface GroupGraph {
  group_id: string;
  nodes: string[];
  edges: AgentRelationship[];
  updated_at: string;
}

// ── GroupConsensusResult ──────────────────────────────
export interface GroupConsensusResult {
  consensus_id: string;
  group_id: string;
  message_id?: string;
  mode: CollaborationMode;
  success: boolean;
  final_solution?: Solution;
  agent_responses: Solution[];
  discussion_rounds: ConsensusRound[];
  consensus_path: string[];
  agent_graph?: GroupGraph;
  knowledge_graph?: KnowledgeGraph;
  weighted_votes?: Record<string, number>;
  total_weight?: number;
  rounds_used: number;
  participating_agents: string[];
  execution_time: number;
  consensus_reached: boolean;
  timestamp: string;
  metadata: Record<string, any>;
}

// ── RiskDecisionResponse ──────────────────────────────
export interface RiskDecisionResponse {
  decision_id: string;
  request_id: string;
  session_id: string;
  decision: 'approve' | 'reject' | 'challenge' | 'review' | 'APPROVE' | 'REJECT' | 'CHALLENGE' | 'REVIEW';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  ttl: number;
  rationale: string;
  risk_indicators: string[];
  challenge_eligible: boolean;
  difficulty_level: string;
  participating_validators: string[];
  weighted_votes?: Record<string, number>;
  rounds_used?: number;
  execution_time: number;
  timestamp: string;
  challenge_id?: string;
  challenge_instructions?: string;
  required_evidence?: string[];
  validator_results?: Array<{
    validator_type?: string;
    validator_id?: string;
    risk_level?: string;
    confidence?: number;
    weight?: number;
    reasoning?: string;
    risk_indicators?: string[];
  }>;
}

export interface RiskEvaluateInput {
  subject_id: string;
  subject_type: string;
  trust_score: number;
  total_transactions: number;
  flagged_count: number;
  action_type: string;
  description: string;
  amount?: number;
  currency?: string;
  counterparty_id?: string;
  geo_location?: string;
  ip_address?: string;
  device_id?: string;
  channel?: string;
  trace_context?: string;
  recent_transaction_count: number;
  recent_transaction_amount: number;
  session_id?: string;
  priority?: string;
  debug_mode?: boolean;
  metadata?: Record<string, any>;
}

export interface RiskSessionSummary {
  session_id: string;
  subject_id: string;
  status: string;
  created_at: string;
  expires_at: string;
  challenge_count: number;
  decision_count: number;
  current_decision_id?: string;
  decisions: Array<{
    decision_id: string;
    decision: string;
    risk_level: string;
    confidence: number;
    timestamp: string;
  }>;
}

export interface RiskSessionListResponse {
  total: number;
  sessions: Array<{
    session_id: string;
    subject_id: string;
    status: string;
    challenge_count: number;
    created_at: string;
  }>;
}

export interface RiskStatsResponse {
  validators: Array<{
    validator_id: string;
    validator_type: string;
    capability_weight: number;
    total_evaluations: number;
    accuracy: number | null;
  }>;
  sessions: {
    total_sessions: number;
    by_status: Record<string, number>;
    challenged_sessions: number;
  };
}
