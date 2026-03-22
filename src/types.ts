import { 
  Users, 
  BrainCircuit, 
  ShieldAlert, 
  History, 
  LayoutDashboard, 
  Settings, 
  Activity,
  Search,
  Bell,
  User,
  ChevronRight,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Network,
  MessageSquare,
  Zap
} from 'lucide-react';

export type Mode = 'consensus' | 'collaboration' | 'hybrid';
export type Page = 'agents' | 'agent-detail' | 'groups' | 'group-detail' | 'consensus' | 'risk';

export interface Agent {
  agent_id: string;
  capability_weight: number;
  specialization: Record<string, number>;
  role: string;
}

export interface AgentGlobalStats {
  agent_id: string;
  global_accuracy: number;
  total_evaluations: number;
  correct_count: number;
  group_breakdown: {
    group_id: string;
    accuracy: number;
    evaluations: number;
    correct_count: number;
  }[];
  last_updated: string;
}

export interface Group {
  group_id: string;
  group_name: string;
  description: string;
  mode: Mode;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface GroupMember extends Agent {
  group_id: string;
  historical_accuracy: number;
  total_evaluations: number;
  correct_count: number;
  is_active: boolean;
  note?: string;
  added_at: string;
}

export interface ConsensusRound {
  round_number: number;
  consensus_status: 'forming' | 'reached';
  candidate_answer: string;
  candidate_confidence: number;
  stability_counter: number;
  agent_responses: Record<string, {
    answer: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  attributes?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type?: string;
  influence_weight?: number;
  trust_score?: number;
  agreement_count?: number;
  disagreement_count?: number;
  properties?: Record<string, any>;
}

export interface ConsensusResult {
  consensus_id: string;
  group_id: string;
  mode: Mode;
  success: boolean;
  final_solution: {
    agent_id: string;
    answer: string;
    reasoning: string;
    confidence: number;
  };
  agent_responses: {
    agent_id: string;
    answer: string;
    confidence: number;
    reasoning: string;
  }[];
  discussion_rounds: ConsensusRound[];
  consensus_path: string[];
  agent_graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    key_agents: [string, number][];
  };
  knowledge_graph: {
    graph_id: string;
    source_type: string;
    nodes: GraphNode[];
    links: GraphEdge[];
  };
  weighted_votes: Record<string, number>;
  total_weight: number;
  rounds_used: number;
  participating_agents: string[];
  execution_time: number;
  consensus_reached: boolean;
  timestamp: string;
}

export interface RiskEvaluation {
  decision_id: string;
  request_id: string;
  session_id: string;
  decision: 'approve' | 'challenge' | 'reject';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  ttl?: number;
  rationale: string;
  risk_indicators: string[];
  challenge_eligible: boolean;
  challenge_id?: string;
  challenge_instructions?: string;
  required_evidence?: string[];
  participating_validators: string[];
  execution_time: number;
  timestamp: string;
}
