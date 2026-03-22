import { Agent, AgentGlobalStats, Group, GroupMember, ConsensusResult, RiskEvaluation } from '../types';

export const MOCK_AGENTS: Agent[] = [
  {
    "agent_id": "agent_credit",
    "capability_weight": 0.9,
    "specialization": {
      "credit": 0.95,
      "fraud": 0.7
    },
    "role": "credit_analyst"
  },
  {
    "agent_id": "agent_fraud",
    "capability_weight": 0.85,
    "specialization": {
      "fraud": 0.9,
      "credit": 0.6
    },
    "role": "fraud_analyst"
  },
  {
    "agent_id": "agent_compliance",
    "capability_weight": 0.95,
    "specialization": {
      "compliance": 0.98
    },
    "role": "compliance_officer"
  }
];

export const getAgentGlobalStats = (agentId: string): AgentGlobalStats => ({
  "agent_id": agentId,
  "global_accuracy": 0.92,
  "total_evaluations": 156,
  "correct_count": 143,
  "group_breakdown": [
    {
      "group_id": "group-xyz789",
      "accuracy": 0.95,
      "evaluations": 80,
      "correct_count": 76
    },
    {
      "group_id": "group-abc123",
      "accuracy": 0.88,
      "evaluations": 76,
      "correct_count": 67
    }
  ],
  "last_updated": "2026-03-22T10:30:45.123Z"
});

export const MOCK_GROUPS: Group[] = [
  {
    "group_id": "group-xyz789",
    "group_name": "Financial Risk Team",
    "description": "Credit and fraud assessment group",
    "mode": "consensus",
    "created_by": "user_123",
    "created_at": "2026-03-22T10:00:00Z",
    "updated_at": "2026-03-22T10:00:00Z",
    "metadata": {}
  }
];

export const getGroupWeightsSummary = (groupId: string) => ({
  "group_id": groupId,
  "group_name": "Financial Risk Team",
  "mode": "consensus",
  "agent_count": 3,
  "agents": [
    {
      "agent_id": "agent_credit",
      "role": "credit_analyst",
      "capability_weight": 0.9,
      "historical_accuracy": 0.92,
      "total_evaluations": 156,
      "correct_count": 143,
      "is_active": true,
      "note": "Voting weight = capability_weight (0.9) × confidence (varies) × historical_accuracy (0.92)"
    },
    {
      "agent_id": "agent_fraud",
      "role": "fraud_analyst",
      "capability_weight": 0.85,
      "historical_accuracy": 0.88,
      "total_evaluations": 120,
      "correct_count": 105,
      "is_active": true,
      "note": "Voting weight = capability_weight (0.85) × confidence (varies) × historical_accuracy (0.88)"
    },
    {
      "agent_id": "agent_compliance",
      "role": "compliance_officer",
      "capability_weight": 0.95,
      "historical_accuracy": 0.95,
      "total_evaluations": 200,
      "correct_count": 190,
      "is_active": true,
      "note": "Voting weight = capability_weight (0.95) × confidence (varies) × historical_accuracy (0.95)"
    }
  ]
});

export const MOCK_CONSENSUS_RESULT: ConsensusResult = {
  "consensus_id": "consensus-a1b2c3d4",
  "group_id": "group-xyz789",
  "mode": "consensus",
  "success": true,
  "final_solution": {
    "agent_id": "consensus",
    "answer": "BBB",
    "reasoning": "2 out of 3 agents agreed on BBB rating",
    "confidence": 0.82
  },
  "agent_responses": [
    {
      "agent_id": "agent_credit",
      "answer": "BBB",
      "confidence": 0.85,
      "reasoning": "信用评分 720，历史记录良好，风险中等"
    },
    {
      "agent_id": "agent_fraud",
      "answer": "A",
      "confidence": 0.65,
      "reasoning": "交易模式正常，但金额较大需要关注"
    },
    {
      "agent_id": "agent_compliance",
      "answer": "BBB",
      "confidence": 0.80,
      "reasoning": "无 AML 标记，符合规范要求"
    }
  ],
  "discussion_rounds": [
    {
      "round_number": 1,
      "consensus_status": "forming",
      "candidate_answer": "BBB",
      "candidate_confidence": 0.82,
      "stability_counter": 1,
      "agent_responses": {
        "agent_credit": {
          "answer": "BBB",
          "confidence": 0.85,
          "reasoning": "信用评分 720，历史记录良好，风险中等"
        },
        "agent_fraud": {
          "answer": "A",
          "confidence": 0.65,
          "reasoning": "交易模式正常，但金额较大需要关注"
        },
        "agent_compliance": {
          "answer": "BBB",
          "confidence": 0.80,
          "reasoning": "无 AML 标记，符合规范要求"
        }
      }
    },
    {
      "round_number": 2,
      "consensus_status": "reached",
      "candidate_answer": "BBB",
      "candidate_confidence": 0.82,
      "stability_counter": 2,
      "agent_responses": {
        "agent_credit": {
          "answer": "BBB",
          "confidence": 0.85,
          "reasoning": "信用评分 720，历史记录良好，风险中等"
        },
        "agent_fraud": {
          "answer": "BBB",
          "confidence": 0.72,
          "reasoning": "同意信用和合规的评估，综合判断为 BBB"
        },
        "agent_compliance": {
          "answer": "BBB",
          "confidence": 0.80,
          "reasoning": "无 AML 标记，符合规范要求"
        }
      }
    }
  ],
  "consensus_path": ["agent_credit", "agent_fraud", "agent_compliance"],
  "agent_graph": {
    "nodes": [
      {
        "id": "agent_credit",
        "label": "agent_credit"
      },
      {
        "id": "agent_fraud",
        "label": "agent_fraud"
      },
      {
        "id": "agent_compliance",
        "label": "agent_compliance"
      }
    ],
    "edges": [
      {
        "source": "agent_credit",
        "target": "agent_fraud",
        "influence_weight": 0.7,
        "trust_score": 0.65,
        "agreement_count": 1,
        "disagreement_count": 1
      },
      {
        "source": "agent_credit",
        "target": "agent_compliance",
        "influence_weight": 0.8,
        "trust_score": 0.9,
        "agreement_count": 2,
        "disagreement_count": 0
      },
      {
        "source": "agent_fraud",
        "target": "agent_compliance",
        "influence_weight": 0.6,
        "trust_score": 0.7,
        "agreement_count": 1,
        "disagreement_count": 1
      }
    ],
    "key_agents": [
      ["agent_credit", 1.5],
      ["agent_compliance", 1.4],
      ["agent_fraud", 1.3]
    ]
  },
  "knowledge_graph": {
    "graph_id": "risk_graph_xyz789",
    "source_type": "risk_request",
    "nodes": [
      { "id": "subject_user_12345", "label": "user_12345", "type": "user" },
      { "id": "action_payment_001", "label": "payment", "type": "action" },
      { "id": "amount_5000", "label": "5000 USD", "type": "amount" },
      { "id": "loc_sg", "label": "Singapore", "type": "location" },
      { "id": "loc_ky", "label": "Cayman Islands", "type": "location" },
      { "id": "corp_a", "label": "Shell Corp A", "type": "counterparty" },
      { "id": "corp_b", "label": "Shell Corp B", "type": "counterparty" },
      { "id": "user_990", "label": "User_990", "type": "user" },
      { "id": "action_deposit", "label": "Deposit", "type": "action" },
      { "id": "amount_1m", "label": "$1,000,000", "type": "amount" },
    ],
    "links": [
      { "source": "subject_user_12345", "target": "action_payment_001", "type": "executes" },
      { "source": "action_payment_001", "target": "amount_5000", "type": "value" },
      { "source": "action_payment_001", "target": "loc_sg", "type": "origin" },
      { "source": "action_payment_001", "target": "corp_a", "type": "to" },
      { "source": "corp_a", "target": "corp_b", "type": "linked_to" },
      { "source": "user_990", "target": "action_deposit", "type": "executes" },
      { "source": "action_deposit", "target": "amount_1m", "type": "value" },
      { "source": "action_deposit", "target": "corp_a", "type": "to" },
      { "source": "user_990", "target": "subject_user_12345", "type": "beneficiary" },
    ]
  },
  "weighted_votes": {
    "BBB": 1.65,
    "A": 0.65
  },
  "total_weight": 2.3,
  "rounds_used": 2,
  "participating_agents": ["agent_credit", "agent_fraud", "agent_compliance"],
  "execution_time": 3.45,
  "consensus_reached": true,
  "timestamp": "2026-03-22T10:30:45.123Z"
};

export const MOCK_RISK_EVALUATION: RiskEvaluation = {
  "decision_id": "dec-xyz789abc",
  "request_id": "req-456def",
  "session_id": "sess-session456",
  "decision": "challenge",
  "risk_level": "high",
  "confidence": 0.61,
  "challenge_eligible": true,
  "challenge_id": "chal-xyz789",
  "challenge_instructions": "Your request has been flagged for additional review.\nPlease provide the following evidence:\n1. Purpose Proof - Invoice or contract\n2. Business Justification - Why this transaction is needed",
  "required_evidence": ["purpose_proof", "business_justification"],
  "rationale": "[identity] Failed trust score | [amount] High risk | [anomaly] Unusual pattern detected",
  "risk_indicators": ["cross_border_high_value", "potential_structuring_8500_vs_10000"],
  "participating_validators": ["amount", "anomaly", "compliance"],
  "execution_time": 0.52,
  "timestamp": "2026-03-18T10:05:00Z"
};
