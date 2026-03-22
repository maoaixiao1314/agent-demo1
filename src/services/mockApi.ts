import type {
  Agent, Group, GroupConsensusResult, RiskDecisionResponse
} from '../types';

export const MOCK_AGENTS: Agent[] = [
  { agent_id: 'agent_credit',     capability_weight: 0.90, specialization: { credit: 0.95, fraud: 0.70 }, role: 'credit_analyst' },
  { agent_id: 'agent_fraud',      capability_weight: 0.85, specialization: { fraud: 0.90, credit: 0.60 }, role: 'fraud_analyst' },
  { agent_id: 'agent_compliance', capability_weight: 0.95, specialization: { compliance: 0.98 },           role: 'compliance_officer' },
];

export const MOCK_GROUPS: Group[] = [
  {
    group_id: 'group-xyz789', group_name: 'Financial Risk Team',
    description: 'Credit and fraud assessment group', mode: 'consensus',
    created_by: 'user_123', created_at: '2026-03-22T10:00:00Z',
    updated_at: '2026-03-22T10:00:00Z', metadata: {},
  },
];

export const MOCK_CONSENSUS_RESULT: GroupConsensusResult = {
  consensus_id: 'consensus-a1b2c3d4', group_id: 'group-xyz789', mode: 'consensus', success: true,
  final_solution: { agent_id: 'consensus', answer: 'BBB', reasoning: '2/3 agents agreed on BBB rating', confidence: 0.82 },
  agent_responses: [
    { agent_id: 'agent_credit',     answer: 'BBB', confidence: 0.85, reasoning: '信用评分 720，历史良好' },
    { agent_id: 'agent_fraud',      answer: 'A',   confidence: 0.65, reasoning: '交易模式正常但金额偏大' },
    { agent_id: 'agent_compliance', answer: 'BBB', confidence: 0.80, reasoning: '无 AML 标记' },
  ],
  discussion_rounds: [
    {
      round_number: 1, consensus_status: 'forming', candidate_answer: 'BBB',
      candidate_confidence: 0.82, stability_counter: 1,
      agent_responses: {
        agent_credit:     { agent_id: 'agent_credit',     answer: 'BBB', confidence: 0.85, reasoning: '信用评分 720' },
        agent_fraud:      { agent_id: 'agent_fraud',      answer: 'A',   confidence: 0.65, reasoning: '金额偏大' },
        agent_compliance: { agent_id: 'agent_compliance', answer: 'BBB', confidence: 0.80, reasoning: '无 AML' },
      },
    },
    {
      round_number: 2, consensus_status: 'reached', candidate_answer: 'BBB',
      candidate_confidence: 0.82, stability_counter: 2,
      agent_responses: {
        agent_credit:     { agent_id: 'agent_credit',     answer: 'BBB', confidence: 0.85, reasoning: '信用评分 720' },
        agent_fraud:      { agent_id: 'agent_fraud',      answer: 'BBB', confidence: 0.72, reasoning: '综合判断同意 BBB' },
        agent_compliance: { agent_id: 'agent_compliance', answer: 'BBB', confidence: 0.80, reasoning: '无 AML' },
      },
    },
  ],
  consensus_path: ['agent_credit', 'agent_compliance', 'agent_fraud'],
  agent_graph: {
    group_id: 'group-xyz789',
    nodes: ['agent_credit', 'agent_fraud', 'agent_compliance'],
    edges: [
      { source_agent_id: 'agent_credit',     target_agent_id: 'agent_fraud',      influence_weight: 0.7, trust_score: 0.65, agreement_count: 1, disagreement_count: 1 },
      { source_agent_id: 'agent_credit',     target_agent_id: 'agent_compliance', influence_weight: 0.8, trust_score: 0.90, agreement_count: 2, disagreement_count: 0 },
      { source_agent_id: 'agent_fraud',      target_agent_id: 'agent_compliance', influence_weight: 0.6, trust_score: 0.70, agreement_count: 1, disagreement_count: 1 },
    ],
    updated_at: '2026-03-22T10:30:45Z',
  },
  knowledge_graph: {
    graph_id: 'risk_graph_xyz789', source_type: 'risk_request',
    entities: [
      { entity_id: 'subject_user_12345', entity_type: 'user',     name: 'user_12345',   attributes: { trust_score: 0.78 } },
      { entity_id: 'action_payment_001', entity_type: 'action',   name: 'Payment',      attributes: { channel: 'web' } },
      { entity_id: 'amount_5000',        entity_type: 'amount',   name: '5000 USD',     attributes: { currency: 'USD' } },
      { entity_id: 'loc_sg',             entity_type: 'location', name: 'Singapore',    attributes: {} },
      { entity_id: 'corp_a',             entity_type: 'company',  name: 'Shell Corp A', attributes: {} },
      { entity_id: 'corp_b',             entity_type: 'company',  name: 'Shell Corp B', attributes: {} },
      { entity_id: 'user_990',           entity_type: 'user',     name: 'User_990',     attributes: {} },
      { entity_id: 'action_deposit',     entity_type: 'action',   name: 'Deposit',      attributes: {} },
      { entity_id: 'amount_1m',          entity_type: 'amount',   name: '\$1,000,000',  attributes: {} },
    ],
    relations: [
      { relation_id: 'r1', source_entity_id: 'subject_user_12345', target_entity_id: 'action_payment_001', relation_type: 'initiates',    properties: {} },
      { relation_id: 'r2', source_entity_id: 'action_payment_001', target_entity_id: 'amount_5000',        relation_type: 'value',        properties: {} },
      { relation_id: 'r3', source_entity_id: 'action_payment_001', target_entity_id: 'loc_sg',             relation_type: 'origin',       properties: {} },
      { relation_id: 'r4', source_entity_id: 'action_payment_001', target_entity_id: 'corp_a',             relation_type: 'transfers_to', properties: {} },
      { relation_id: 'r5', source_entity_id: 'corp_a',             target_entity_id: 'corp_b',             relation_type: 'linked_to',    properties: {} },
      { relation_id: 'r6', source_entity_id: 'user_990',           target_entity_id: 'action_deposit',     relation_type: 'initiates',    properties: {} },
      { relation_id: 'r7', source_entity_id: 'action_deposit',     target_entity_id: 'amount_1m',          relation_type: 'value',        properties: {} },
      { relation_id: 'r8', source_entity_id: 'action_deposit',     target_entity_id: 'corp_a',             relation_type: 'transfers_to', properties: {} },
      { relation_id: 'r9', source_entity_id: 'user_990',           target_entity_id: 'subject_user_12345', relation_type: 'beneficiary',  properties: {} },
    ],
    created_at: '2026-03-22T10:30:45Z', metadata: {},
  },
  weighted_votes: { BBB: 1.65, A: 0.65 }, total_weight: 2.30,
  rounds_used: 2, participating_agents: ['agent_credit', 'agent_fraud', 'agent_compliance'],
  execution_time: 3.45, consensus_reached: true,
  timestamp: '2026-03-22T10:30:45Z', metadata: {},
};

export const MOCK_RISK_DECISION: RiskDecisionResponse = {
  decision_id: 'dec-xyz789abc', request_id: 'req-456def', session_id: 'sess-session456',
  decision: 'CHALLENGE', risk_level: 'high', confidence: 0.61, ttl: 300,
  rationale: '[identity] Failed trust score | [amount] High risk | [anomaly] Unusual pattern detected',
  risk_indicators: ['cross_border_high_value', 'potential_structuring_8500_vs_10000'],
  challenge_eligible: true, difficulty_level: 'medium',
  participating_validators: ['amount', 'anomaly', 'compliance'],
  execution_time: 0.52, timestamp: '2026-03-18T10:05:00Z',
  challenge_id: 'chal-xyz789',
  challenge_instructions: 'Please provide: 1. Purpose Proof (invoice/contract) 2. Business Justification',
  required_evidence: ['purpose_proof', 'business_justification'],
};

export const getGroupWeightsSummary = (groupId: string) => ({
  group_id: groupId,
  group_name: 'Financial Risk Team',
  mode: 'consensus' as const,
  agent_count: 3,
  agents: [
    { agent_id: 'agent_credit',     role: 'credit_analyst',     capability_weight: 0.90, historical_accuracy: 0.92, total_evaluations: 156, correct_count: 143, is_active: true, group_id: groupId, mode: 'consensus' as const, specialization: { credit: 0.95 }, added_at: '2026-03-22T10:00:00Z', metadata: {} },
    { agent_id: 'agent_fraud',      role: 'fraud_analyst',      capability_weight: 0.85, historical_accuracy: 0.88, total_evaluations: 120, correct_count: 105, is_active: true, group_id: groupId, mode: 'consensus' as const, specialization: { fraud: 0.90 },  added_at: '2026-03-22T10:00:00Z', metadata: {} },
    { agent_id: 'agent_compliance', role: 'compliance_officer', capability_weight: 0.95, historical_accuracy: 0.95, total_evaluations: 200, correct_count: 190, is_active: true, group_id: groupId, mode: 'consensus' as const, specialization: { compliance: 0.98 }, added_at: '2026-03-22T10:00:00Z', metadata: {} },
  ],
});
