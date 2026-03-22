import axios from 'axios';
import type {
  RiskEvaluateInput,
  RiskSessionListResponse,
  RiskSessionSummary,
  RiskStatsResponse,
} from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://173.249.5.203:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

// ── System ────────────────────────────────────────────
export const systemApi = {
  health: () => api.get('/health'),
  root:   () => api.get('/'),
};

// ── Groups ────────────────────────────────────────────
export const groupApi = {
  createGroup: (data: {
    group_name: string;
    description?: string;
    mode: 'consensus' | 'collaboration' | 'hybrid';
    created_by: string;
    metadata?: Record<string, any>;
    initial_members?: Array<{
      agent_id: string;
      role?: string;
      capability_weight?: number;
      specialization?: Record<string, number>;
    }>;
  }) => api.post('/api/v1/groups/', data),

  getGroups: (created_by?: string) =>
    api.get('/api/v1/groups/', { params: created_by ? { created_by } : {} }),

  getGroup: (group_id: string) => api.get(`/api/v1/groups/${group_id}`),

  deleteGroup: (group_id: string) => api.delete(`/api/v1/groups/${group_id}`),

  addMember: (group_id: string, data: {
    agent_id: string;
    role?: string;
    capability_weight?: number;
    specialization?: Record<string, number>;
  }) => api.post(`/api/v1/groups/${group_id}/members`, data),

  removeMember: (group_id: string, agent_id: string) =>
    api.delete(`/api/v1/groups/${group_id}/members/${agent_id}`),

  updateMember: (group_id: string, agent_id: string, data: { capability_weight?: number; specialization?: Record<string, number> }) =>
    api.put(`/api/v1/groups/${group_id}/members/${agent_id}`, data),

  getMembers: (group_id: string, active_only = false) =>
    api.get(`/api/v1/groups/${group_id}/members`, { params: { active_only } }),

  sendMessage: (group_id: string, data: {
    sender_id: string;
    sender_type: 'user' | 'agent';
    content: string;
    metadata?: Record<string, any>;
  }) => api.post(`/api/v1/groups/${group_id}/messages`, data),

  getMessages: (group_id: string, limit?: number) =>
    api.get(`/api/v1/groups/${group_id}/messages`, { params: limit ? { limit } : {} }),

  runConsensus: (group_id: string, data: {
    task: string;
    message_id?: string;
    quorum_threshold?: number;
    stability_horizon?: number;
    max_rounds?: number;
  }) => api.post(`/api/v1/groups/${group_id}/consensus`, data),

  listAvailableAgents: () => api.get('/api/v1/groups/agents'),

  getAgentStats: (group_id: string, agent_id: string) =>
    api.get(`/api/v1/groups/${group_id}/agent-stats/${agent_id}`),

  getAgentGlobalStats: (agent_id: string) =>
    api.get(`/api/v1/groups/agents/${agent_id}/global-stats`),

  updateMemberWeight: (group_id: string, agent_id: string, data: { capability_weight: number }) =>
    api.put(`/api/v1/groups/${group_id}/members/${agent_id}`, data),
};

// ── Risk ──────────────────────────────────────────────
export const riskApi = {
  evaluate: (data: RiskEvaluateInput) => api.post('/api/v1/risk/evaluate', data),

  respondChallenge: (challenge_id: string, data: {
    evidence_type: string;
    evidence_content: string;
    submitted_by?: string;
    evidence_metadata?: Record<string, any>;
  }) => api.post(`/api/v1/risk/challenge/${challenge_id}/respond`, data),

  getSession: (session_id: string) => api.get<RiskSessionSummary>(`/api/v1/risk/sessions/${session_id}`),

  getSessions: (params?: { subject_id?: string; status?: string; limit?: number }) =>
    api.get<RiskSessionListResponse>('/api/v1/risk/sessions', { params }),

  getStats: () => api.get<RiskStatsResponse>('/api/v1/risk/stats'),

  seed: (force = false) => api.post('/api/v1/risk/seed', null, { params: { force } }),
};

export default api;
