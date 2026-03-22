import React, { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit, ShieldAlert, Settings, Activity, Plus, ArrowLeft,
  CheckCircle2, AlertTriangle, XCircle, Network, Trash2, X, Send, RefreshCw, Zap, Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Page,
  Agent,
  Group,
  GroupConsensusResult,
  RiskDecisionResponse,
  RiskEvaluateInput,
  RiskSessionSummary,
  RiskStatsResponse,
  KnowledgeGraph,
} from './types';
import { MOCK_AGENTS, MOCK_GROUPS, getGroupWeightsSummary } from './services/mockApi';
import { groupApi, riskApi } from './services/api';
import { GroupDetailPage } from './components/GroupDetail';
import { KnowledgeGraphView } from './components/Graphs';

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; titleRight?: React.ReactNode }> = ({ children, className = '', title, titleRight }) => (
  <div className={`glass flex flex-col overflow-hidden ${className}`}>
    {title && (
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
        {titleRight || <div className="flex gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /><div className="w-1.5 h-1.5 rounded-full bg-slate-700" /></div>}
      </div>
    )}
    <div className="flex-1 overflow-hidden relative">{children}</div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    red: 'bg-red-500/15 text-red-400 border-red-500/25',
    yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    slate: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  };
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${colors[color] || colors.blue}`}>{children}</span>;
};

const TerminalLog: React.FC<{ logs: { time: string; msg: string; type: string }[]; onClear: () => void }> = ({ logs, onClear }) => (
  <div className="h-44 border-t border-white/5 bg-black/50 flex flex-col shrink-0">
    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.015] shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">system_log</span>
      </div>
      <button onClick={onClear} className="text-[9px] text-slate-600 hover:text-slate-400 uppercase font-bold">clear</button>
    </div>
    <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-0.5 custom-scrollbar">
      {logs.map((l, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-slate-700 shrink-0">[{l.time}]</span>
          <span className={l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-emerald-400' : 'text-blue-400/80'}>{l.msg}</span>
        </div>
      ))}
      <div className="flex gap-1 text-blue-500 animate-pulse"><span>›</span><span className="inline-block w-1.5 h-3 bg-blue-500/50" /></div>
    </div>
  </div>
);

// ── Header ───────────────────────────────────────────
const Header: React.FC<{ activePage: Page; setActivePage: (p: Page) => void }> = ({ activePage, setActivePage }) => (
  <header className="h-14 border-b border-white/5 bg-navy-900/60 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.5)]">
          <BrainCircuit className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xs font-black text-white tracking-[0.2em] uppercase">Agean-Consensus</h1>
          <div className="text-[8px] font-mono text-blue-400/60 tracking-[0.15em] uppercase">Multi-Agent Decision System</div>
        </div>
      </div>
      <nav className="flex items-center gap-0.5">
        {(['agents', 'groups', 'risk'] as Page[]).map((page) => (
          <button key={page} onClick={() => setActivePage(page)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activePage === page || (activePage === 'agent-detail' && page === 'agents') || (activePage === 'group-detail' && page === 'groups')
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}>{page}</button>
        ))}
      </nav>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Online</span>
      </div>
      <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500"><Settings className="w-4 h-4" /></button>
    </div>
  </header>
);

// ── Main App ──────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState<Page>('groups');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [riskDecision, setRiskDecision] = useState<RiskDecisionResponse | null>(null);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [riskInputMode, setRiskInputMode] = useState<'mini' | 'json'>('mini');
  const [riskJsonInput, setRiskJsonInput] = useState('');
  const [riskSession, setRiskSession] = useState<RiskSessionSummary | null>(null);
  const [riskSessions, setRiskSessions] = useState<RiskSessionSummary[]>([]);
  const [riskStats, setRiskStats] = useState<RiskStatsResponse | null>(null);
  const [isSeedingRiskKB, setIsSeedingRiskKB] = useState(false);
  const [riskInput, setRiskInput] = useState<RiskEvaluateInput>({
    subject_id: 'user_001',
    subject_type: 'user',
    trust_score: 0.85,
    total_transactions: 120,
    flagged_count: 0,
    action_type: 'payment',
    description: 'Pay supplier invoice',
    amount: 500,
    currency: 'USD',
    channel: 'web',
    recent_transaction_count: 1,
    recent_transaction_amount: 200,
  });
  const RISK_SCENARIOS: Record<'low' | 'high' | 'withdrawal', RiskEvaluateInput> = {
    low: {
      subject_id: 'user_001',
      subject_type: 'user',
      trust_score: 0.85,
      total_transactions: 120,
      flagged_count: 0,
      action_type: 'payment',
      description: 'Pay supplier invoice',
      amount: 500,
      currency: 'USD',
      channel: 'web',
      recent_transaction_count: 1,
      recent_transaction_amount: 200,
    },
    high: {
      subject_id: 'user_002',
      subject_type: 'user',
      trust_score: 0.1,
      total_transactions: 2,
      flagged_count: 3,
      action_type: 'payment',
      description: 'Transfer to overseas account',
      amount: 98000,
      currency: 'USD',
      channel: 'web',
      geo_location: 'KP',
      recent_transaction_count: 15,
      recent_transaction_amount: 50000,
    },
    withdrawal: {
      subject_id: 'user_003',
      subject_type: 'user',
      trust_score: 0.5,
      total_transactions: 10,
      flagged_count: 1,
      action_type: 'withdrawal',
      description: 'Large withdrawal request',
      amount: 15000,
      currency: 'USD',
      channel: 'mobile',
      recent_transaction_count: 5,
      recent_transaction_amount: 3000,
    },
  };
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS as Agent[]);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [groupWeights, setGroupWeights] = useState(getGroupWeightsSummary('group-xyz789').agents);
  const [consensusResult, setConsensusResult] = useState<GroupConsensusResult | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMode, setNewGroupMode] = useState<'consensus' | 'collaboration' | 'hybrid'>('consensus');
  const [newGroupMembers, setNewGroupMembers] = useState<{ agent_id: string; capability_weight: number }[]>([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const evidenceTypeRef = useRef<HTMLSelectElement>(null);
  const evidenceContentRef = useRef<HTMLTextAreaElement>(null);

  const addLog = (msg: string, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    setLogs(prev => [...prev.slice(-80), { time, msg, type }]);
  };

  useEffect(() => {
    addLog('System core initializing...', 'info');
    addLog('Agent network: 3 nodes ready', 'success');
    addLog('Consensus channel: group-xyz789', 'info');
    addLog('Security protocol verified', 'success');
    const loadData = async () => {
      try {
        const { data: agentsData } = await groupApi.listAvailableAgents();
        if (Array.isArray(agentsData) && agentsData.length > 0) {
          setAgents(agentsData);
          addLog(`Loaded ${agentsData.length} agents from server`, 'success');
        }
      } catch { /* keep mock */ }
      try {
        const { data: groupsData } = await groupApi.getGroups();
        if (Array.isArray(groupsData) && groupsData.length > 0) {
          setGroups(groupsData);
          addLog(`Loaded ${groupsData.length} groups from server`, 'success');
        }
      } catch { /* keep mock */ }
    };
    loadData();
  }, []);

  const handleRunConsensus = async (task = 'Evaluate credit risk for customer profile') => {
    if (!selectedGroupId) return;
    setIsProcessing(true);
    addLog(`Running consensus on ${selectedGroupId}...`, 'info');

    const defaultPayload = {
      task,
      quorum_threshold: 0.5,
      stability_horizon: 2,
      max_rounds: 3,
    };

    let payload = defaultPayload;
    const trimmed = task.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.task && typeof parsed.task === 'string') {
          payload = {
            task: parsed.task,
            quorum_threshold: typeof parsed.quorum_threshold === 'number' ? parsed.quorum_threshold : defaultPayload.quorum_threshold,
            stability_horizon: typeof parsed.stability_horizon === 'number' ? parsed.stability_horizon : defaultPayload.stability_horizon,
            max_rounds: typeof parsed.max_rounds === 'number' ? parsed.max_rounds : defaultPayload.max_rounds,
          };
          addLog(
            `Using custom consensus params: q=${payload.quorum_threshold}, s=${payload.stability_horizon}, rounds=${payload.max_rounds}`,
            'info'
          );
        }
      } catch {
        addLog('Task looks like JSON but parse failed, fallback to plain task mode', 'info');
      }
    }

    try {
      const { data } = await groupApi.runConsensus(selectedGroupId, payload);
      console.log('[consensus raw response]', JSON.stringify(data, null, 2));
      setConsensusResult(data);
      addLog(`Consensus reached: ${data.final_solution?.answer} (conf ${((data.final_solution?.confidence || 0) * 100).toFixed(0)}%)`, 'success');
    } catch (e: any) {
      addLog(`Consensus failed: ${e?.response?.data?.detail || e?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const { data } = await groupApi.createGroup({
        group_name: newGroupName, description: `${newGroupName} demo group`,
        mode: newGroupMode, created_by: 'demo_user',
        initial_members: newGroupMembers.map(m => ({ agent_id: m.agent_id, capability_weight: m.capability_weight, specialization: {} })),
      });
      setGroups(prev => [...prev, data]);
      addLog(`Group "${newGroupName}" created with ${newGroupMembers.length} members`, 'success');
      setShowCreateGroup(false); setNewGroupName(''); setNewGroupMembers([]);
    } catch (e: any) {
      addLog(`Create group failed: ${e?.response?.data?.detail || e?.message}`, 'error');
    }
  };

  const normalizeRiskDecision = (d: RiskDecisionResponse): RiskDecisionResponse => ({
    ...d,
    decision: typeof d.decision === 'string' ? d.decision.toLowerCase() as RiskDecisionResponse['decision'] : d.decision,
  });

  const applyRiskScenario = (scenario: 'low' | 'high' | 'withdrawal') => {
    const payload = RISK_SCENARIOS[scenario];
    setRiskInput(payload);
    setRiskJsonInput(JSON.stringify(payload, null, 2));
    addLog(`Scenario loaded: ${scenario}`, 'info');
  };

  const parseValidatorOutputs = (decision: RiskDecisionResponse | null) => {
    if (!decision) {
      return [] as Array<{
        validator: string;
        reasoning: string;
        confidence: number;
        risk_level: string;
        weight: number;
        contribution: number;
      }>;
    }

    if (Array.isArray(decision.validator_results) && decision.validator_results.length > 0) {
      return decision.validator_results.map(v => {
        const confidence = Number(v.confidence ?? decision.confidence);
        const weight = Number(v.weight ?? 1);
        return {
          validator: (v.validator_type || v.validator_id || 'unknown').toString(),
          reasoning: v.reasoning || '',
          confidence,
          risk_level: (v.risk_level || decision.risk_level).toString(),
          weight,
          contribution: weight * confidence,
        };
      });
    }

    const chunks = decision.rationale
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);

    return chunks.map((chunk, idx) => {
      const m = chunk.match(/^\[(.*?)\]\s*(.*)$/);
      const validator = m?.[1]?.trim() || decision.participating_validators[idx] || `validator_${idx + 1}`;
      const reasoning = m?.[2]?.trim() || chunk;
      const confidence = decision.confidence;
      const weight = 1;
      return {
        validator,
        reasoning,
        confidence,
        risk_level: decision.risk_level,
        weight,
        contribution: weight * confidence,
      };
    });
  };

  const loadRiskPanels = async (subjectId?: string) => {
    try {
      const [{ data: stats }, { data: sessionsResp }] = await Promise.all([
        riskApi.getStats(),
        riskApi.getSessions({ limit: 8, ...(subjectId ? { subject_id: subjectId } : {}) }),
      ]);
      setRiskStats(stats);
      const mappedSessions: RiskSessionSummary[] = sessionsResp.sessions.map(s => ({
        session_id: s.session_id,
        subject_id: s.subject_id,
        status: s.status,
        created_at: s.created_at,
        expires_at: s.created_at,
        challenge_count: s.challenge_count,
        decision_count: 0,
        current_decision_id: undefined,
        decisions: [],
      }));
      setRiskSessions(mappedSessions);
    } catch {
      // keep current view
    }
  };

  const handleSeedRiskKnowledge = async () => {
    setIsSeedingRiskKB(true);
    try {
      await riskApi.seed(false);
      addLog('Risk knowledge base seeding started', 'success');
    } catch (e: any) {
      addLog(`Seed failed: ${e?.response?.data?.detail || e?.message}`, 'error');
    } finally {
      setIsSeedingRiskKB(false);
    }
  };

  const buildRiskGraph = (input: RiskEvaluateInput, decision: RiskDecisionResponse): KnowledgeGraph => {
    const entities = [
      {
        entity_id: `subject_${input.subject_id}`,
        entity_type: 'user',
        name: input.subject_id,
        attributes: { subject_type: input.subject_type, trust_score: input.trust_score, flagged_count: input.flagged_count },
      },
      {
        entity_id: `action_${input.action_type}`,
        entity_type: 'action',
        name: input.action_type,
        attributes: { description: input.description, channel: input.channel ?? 'unknown' },
      },
      {
        entity_id: `amount_${input.amount ?? 0}_${input.currency ?? 'NA'}`,
        entity_type: 'amount',
        name: `${(input.amount ?? 0).toLocaleString()} ${input.currency ?? ''}`.trim(),
        attributes: { amount: input.amount ?? 0, currency: input.currency ?? null },
      },
      {
        entity_id: `decision_${decision.decision_id}`,
        entity_type: 'event',
        name: `${String(decision.decision).toUpperCase()} · ${decision.risk_level}`,
        attributes: { confidence: decision.confidence, difficulty_level: decision.difficulty_level },
      },
      {
        entity_id: `geo_${input.geo_location ?? 'unknown'}`,
        entity_type: 'location',
        name: input.geo_location ?? 'unknown',
        attributes: {},
      },
    ];

    const relations = [
      {
        relation_id: `rel_${decision.decision_id}_1`,
        source_entity_id: `subject_${input.subject_id}`,
        target_entity_id: `action_${input.action_type}`,
        relation_type: 'initiates',
        properties: {},
      },
      {
        relation_id: `rel_${decision.decision_id}_2`,
        source_entity_id: `action_${input.action_type}`,
        target_entity_id: `amount_${input.amount ?? 0}_${input.currency ?? 'NA'}`,
        relation_type: 'value',
        properties: {},
      },
      {
        relation_id: `rel_${decision.decision_id}_3`,
        source_entity_id: `action_${input.action_type}`,
        target_entity_id: `geo_${input.geo_location ?? 'unknown'}`,
        relation_type: 'origin',
        properties: {},
      },
      {
        relation_id: `rel_${decision.decision_id}_4`,
        source_entity_id: `action_${input.action_type}`,
        target_entity_id: `decision_${decision.decision_id}`,
        relation_type: 'assessed_as',
        properties: { risk_level: decision.risk_level },
      },
    ];

    return {
      graph_id: `risk-graph-${decision.decision_id}`,
      source_type: 'risk_request',
      source_id: decision.request_id,
      entities,
      relations,
      created_at: decision.timestamp,
      metadata: {
        risk_indicators: decision.risk_indicators,
        participating_validators: decision.participating_validators,
      },
    };
  };

  const handleRunRiskEvaluation = async () => {
    setIsProcessing(true);
    try {
      let payload: RiskEvaluateInput;

      if (riskInputMode === 'json') {
        const parsed = JSON.parse(riskJsonInput || '{}');
        if (!parsed || typeof parsed !== 'object') throw new Error('JSON payload must be an object');
        payload = parsed as RiskEvaluateInput;
      } else {
        payload = riskInput;
      }

      const { data } = await riskApi.evaluate(payload);
      const normalized = normalizeRiskDecision(data);
      const parsedOutputs = parseValidatorOutputs(normalized);
      setRiskDecision(normalized);
      setConsensusResult(prev => {
        const builtGraph = buildRiskGraph(payload, normalized);
        if (prev?.group_id) {
          return { ...prev, knowledge_graph: builtGraph };
        }
        return {
          consensus_id: `risk-${normalized.decision_id}`,
          group_id: 'risk-evaluation',
          mode: 'collaboration',
          success: true,
          final_solution: {
            agent_id: 'risk-engine',
            answer: String(normalized.decision).toUpperCase(),
            reasoning: normalized.rationale,
            confidence: normalized.confidence,
          },
          agent_responses: parsedOutputs.map(v => ({
            agent_id: `validator_${v.validator}`,
            answer: v.risk_level,
            reasoning: v.reasoning,
            confidence: v.confidence,
          })),
          discussion_rounds: [],
          consensus_path: parsedOutputs.map(v => v.validator),
          knowledge_graph: builtGraph,
          rounds_used: 1,
          participating_agents: parsedOutputs.map(v => `validator_${v.validator}`),
          execution_time: normalized.execution_time,
          consensus_reached: true,
          timestamp: normalized.timestamp,
          metadata: { source: 'risk' },
        };
      });

      setRiskInput(payload);
      setRiskJsonInput(JSON.stringify(payload, null, 2));
      addLog(`Risk evaluated: ${String(normalized.decision).toUpperCase()} (${normalized.risk_level})`, 'success');

      if (normalized.session_id) {
        try {
          const { data: session } = await riskApi.getSession(normalized.session_id);
          setRiskSession(session);
        } catch {
          setRiskSession(null);
        }
      }
      await loadRiskPanels(riskInput.subject_id);
      await loadRiskPanels(payload.subject_id);
    } catch (e: any) {
      addLog(`Risk evaluate failed: ${e?.response?.data?.detail || e?.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!riskDecision?.challenge_id) return;
    const et = evidenceTypeRef.current?.value || 'purpose_proof';
    const ec = evidenceContentRef.current?.value || '';
    try {
      const { data } = await riskApi.respondChallenge(riskDecision.challenge_id, {
        evidence_type: et, evidence_content: ec, submitted_by: 'demo_user',
      });
      const normalized = normalizeRiskDecision(data);
      setRiskDecision(normalized);
      setShowEvidenceForm(false);
      addLog('Evidence submitted, re-evaluation complete', 'success');
      if (normalized.session_id) {
        try {
          const { data: session } = await riskApi.getSession(normalized.session_id);
          setRiskSession(session);
        } catch {
          setRiskSession(null);
        }
      }
    } catch (e: any) {
      addLog(`Evidence failed: ${e?.response?.data?.detail || e?.message}`, 'error');
    }
  };

  const handleWeightChange = (id: string, val: number) =>
    setGroupWeights(prev => prev.map(a => a.agent_id === id ? { ...a, capability_weight: val } : a));

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await groupApi.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.group_id !== groupId));
      addLog(`Group deleted`, 'success');
    } catch (e: any) {
      addLog(`Delete failed: ${e?.response?.data?.detail || e?.message}`, 'error');
    }
  };

  const AgentDetailModal: React.FC<{ agent: Agent | null; onClose: () => void }> = ({ agent, onClose }) => {
    const [groupStats, setGroupStats] = useState<any | null>(null);
    const [globalStats, setGlobalStats] = useState<any | null>(null);

    useEffect(() => {
      if (!agent || !selectedGroupId) return;

      const load = async () => {
        try {
          const [gRes, glRes] = await Promise.all([
            groupApi.getAgentStats(selectedGroupId, agent.agent_id),
            groupApi.getAgentGlobalStats(agent.agent_id),
          ]);
          setGroupStats(gRes.data);
          setGlobalStats(glRes.data);
        } catch {
          setGroupStats(null);
          setGlobalStats(null);
        }
      };

      load();
    }, [agent]);

    if (!agent) return null;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-2xl glass border border-white/10 overflow-hidden relative z-10"
          >
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">{agent.agent_id}</h3>
                <p className="text-[10px] text-slate-500 mt-1">Role: {agent.role ?? 'N/A'}</p>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <GlassCard title="BASE_PROFILE" className="p-4">
                <div className="space-y-2 text-slate-300">
                  <div>capability_weight: <span className="font-mono text-blue-400">{agent.capability_weight}</span></div>
                  <div>historical_accuracy: <span className="font-mono text-blue-400">{(agent.historical_accuracy ?? 1).toFixed(2)}</span></div>
                  <div>total_evaluations: <span className="font-mono text-blue-400">{agent.total_evaluations ?? 0}</span></div>
                  <div>correct_count: <span className="font-mono text-blue-400">{agent.correct_count ?? 0}</span></div>
                </div>
              </GlassCard>

              <GlassCard title="GROUP_STATS" className="p-4">
                {groupStats ? (
                  <div className="space-y-2 text-slate-300">
                    <div>group_id: <span className="font-mono text-blue-400">{groupStats.group_id}</span></div>
                    <div>historical_accuracy: <span className="font-mono text-blue-400">{(groupStats.historical_accuracy ?? 1).toFixed(2)}</span></div>
                    <div>total_evaluations: <span className="font-mono text-blue-400">{groupStats.total_evaluations ?? 0}</span></div>
                    <div>correct_count: <span className="font-mono text-blue-400">{groupStats.correct_count ?? 0}</span></div>
                  </div>
                ) : (
                  <div className="text-slate-600">No group stats available.</div>
                )}
              </GlassCard>

              <GlassCard title="GLOBAL_STATS" className="p-4 md:col-span-2">
                {globalStats ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300">
                      <div>global_accuracy: <span className="font-mono text-blue-400">{(globalStats.global_accuracy ?? 1).toFixed(2)}</span></div>
                      <div>total_evaluations: <span className="font-mono text-blue-400">{globalStats.total_evaluations ?? 0}</span></div>
                      <div>correct_count: <span className="font-mono text-blue-400">{globalStats.correct_count ?? 0}</span></div>
                      <div>last_updated: <span className="font-mono text-blue-400">{globalStats.last_updated ? new Date(globalStats.last_updated).toLocaleString() : 'N/A'}</span></div>
                    </div>

                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Group Breakdown</div>
                      <div className="space-y-1.5">
                        {(globalStats.group_breakdown ?? []).length === 0 && (
                          <div className="text-slate-600">No group history yet.</div>
                        )}
                        {(globalStats.group_breakdown ?? []).map((g: any) => (
                          <div key={g.group_id} className="p-2 rounded border border-white/10 bg-white/[0.02] flex flex-wrap gap-3 text-[11px]">
                            <span className="font-mono text-blue-400">{g.group_id}</span>
                            <span className="text-slate-300">acc: {(g.accuracy ?? 1).toFixed(2)}</span>
                            <span className="text-slate-300">eval: {g.evaluations ?? 0}</span>
                            <span className="text-slate-300">correct: {g.correct_count ?? 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600">No global stats available.</div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  // ── Pages ─────────────────────────────────────────
  const AgentsPage = () => (
    <div className="p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
      <h2 className="text-xl font-black text-white tracking-tight">AGENT_REGISTRY</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[{l:'Total Agents',v:String(agents.length),c:'blue'},{l:'Avg Weight',v:(agents.reduce((s,a) => s + a.capability_weight, 0) / agents.length).toFixed(2),c:'green'},{l:'Active',v:String(agents.length),c:'cyan'},{l:'Health',v:'98%',c:'purple'}].map((s,i) => (
          <GlassCard key={i} className="p-5 text-center space-y-1">
            <div className={`text-2xl font-black text-${s.c}-400`}>{s.v}</div>
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{s.l}</div>
          </GlassCard>
        ))}
      </div>
      <GlassCard title="AVAILABLE_AGENTS">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.02] text-slate-500 text-[9px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-3">Agent ID</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Weight</th>
              <th className="px-6 py-3">Hist. Acc</th>
              <th className="px-6 py-3">Evals</th>
              <th className="px-6 py-3">Specialization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {agents.map(agent => (
              <tr
                key={agent.agent_id}
                className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedAgentId(agent.agent_id);
                  setActivePage('agents');
                }}
              >
                <td className="px-6 py-3 font-mono text-blue-400 text-xs">{agent.agent_id}</td>
                <td className="px-6 py-3 text-slate-400 text-xs">{agent.role ?? 'N/A'}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${agent.capability_weight * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{agent.capability_weight}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-[11px] font-mono text-emerald-400">{(agent.historical_accuracy ?? 1).toFixed(2)}</td>
                <td className="px-6 py-3 text-[11px] font-mono text-slate-300">{agent.total_evaluations ?? 0}</td>
                <td className="px-6 py-3">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(agent.specialization).length === 0 && <span className="text-[10px] text-slate-600">—</span>}
                    {Object.entries(agent.specialization).map(([k, v]) => (
                      <Badge key={k} color="slate">{k}: {v}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );

  const GroupsPage = () => (
    <div className="p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white tracking-tight">GROUP_MANAGEMENT</h2>
        <button onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-3.5 h-3.5" /> CREATE_GROUP
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map(group => (
          <div key={group.group_id}
            className="glass p-5 space-y-4 hover:border-blue-500/30 transition-all cursor-pointer group relative"
            onClick={() => { setSelectedGroupId(group.group_id); setActivePage("group-detail"); }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete group "${group.group_name}"?`)) {
                  handleDeleteGroup(group.group_id);
                }
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Network className="w-4 h-4 text-blue-400" />
              </div>
              <Badge color={group.mode === "consensus" ? "blue" : group.mode === "hybrid" ? "purple" : "cyan"}>{group.mode}</Badge>
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{group.group_name}</h3>
              <p className="text-[9px] font-mono text-slate-500 mt-0.5">{group.group_id}</p>
            </div>
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] text-slate-500 font-mono">{new Date(group.created_at).toLocaleDateString()}</span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">View →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const GroupDetailPageWrapper = () => (
    <GroupDetailPage
      groupId={selectedGroupId!}
      groups={groups}
      consensusResult={consensusResult}
      isProcessing={isProcessing}
      onBack={() => setActivePage('groups')}
      onRunConsensus={(gid, task) => handleRunConsensus(task)}
      onLog={addLog}
    />
  );

  const RiskPage = () => {
    const decision = riskDecision;
    const decisionLabel = decision ? String(decision.decision).toUpperCase() : 'N/A';
    const isApprove = decision ? String(decision.decision).toLowerCase() === 'approve' : false;
    const isChallenge = decision ? String(decision.decision).toLowerCase() === 'challenge' : false;
    const isRejectLike = decision ? ['reject', 'review'].includes(String(decision.decision).toLowerCase()) : false;
    const validatorOutputs = parseValidatorOutputs(decision);
    const weightedVotes = Object.entries(decision?.weighted_votes ?? {}).map(([level, score]) => [level, Number(score)] as [string, number]);
    const totalContribution = validatorOutputs.reduce((sum, v) => sum + v.contribution, 0);

    return (
    <div className="p-8 space-y-6 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tight">RISK_WORKBENCH</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadRiskPanels(riskInput.subject_id)}
              className="px-3 py-1.5 rounded text-[10px] font-black uppercase border border-blue-500/30 text-blue-400 hover:bg-blue-500/15 transition-all"
            >
              REFRESH PANELS
            </button>
            <button
              onClick={handleSeedRiskKnowledge}
              disabled={isSeedingRiskKB}
              className="px-3 py-1.5 rounded text-[10px] font-black uppercase border border-amber-500/30 text-amber-400 hover:bg-amber-500/15 disabled:opacity-40 transition-all"
            >
              {isSeedingRiskKB ? 'SEEDING...' : 'SEED KB'}
            </button>
            <Badge color="purple">GRAPH + WORKBENCH</Badge>
            <Badge color="red">LIVE API</Badge>
      </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-[640px]">
          <div className="xl:col-span-2 space-y-4">
            <GlassCard title="INPUT_MODE" className="p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setRiskInputMode('mini')}
                  className={`px-3 py-1.5 rounded text-[10px] font-black uppercase border transition-all ${
                    riskInputMode === 'mini'
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                      : 'border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Mini 交易表单
                </button>
                <button
                  onClick={() => {
                    setRiskInputMode('json');
                    if (!riskJsonInput) setRiskJsonInput(JSON.stringify(riskInput, null, 2));
                  }}
                  className={`px-3 py-1.5 rounded text-[10px] font-black uppercase border transition-all ${
                    riskInputMode === 'json'
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                      : 'border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  JSON 输入
                </button>
              </div>
            </GlassCard>

            <GlassCard title="RISK_INPUT" className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => applyRiskScenario('low')}
                  className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                >
                  一键填充 · 低风险
                </button>
                <button
                  onClick={() => applyRiskScenario('high')}
                  className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all"
                >
                  一键填充 · 高风险
                </button>
                <button
                  onClick={() => applyRiskScenario('withdrawal')}
                  className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all"
                >
                  一键填充 · 高频提现
                </button>
              </div>

              {riskInputMode === 'mini' ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">subject_id</label>
                    <input value={riskInput.subject_id} onChange={e => setRiskInput(prev => ({ ...prev, subject_id: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">subject_type</label>
                    <input value={riskInput.subject_type} onChange={e => setRiskInput(prev => ({ ...prev, subject_type: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">trust_score</label>
                    <input type="number" step="0.01" min={0} max={1} value={riskInput.trust_score}
                      onChange={e => setRiskInput(prev => ({ ...prev, trust_score: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">flagged_count</label>
                    <input type="number" value={riskInput.flagged_count}
                      onChange={e => setRiskInput(prev => ({ ...prev, flagged_count: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">action_type</label>
                    <input value={riskInput.action_type} onChange={e => setRiskInput(prev => ({ ...prev, action_type: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">channel</label>
                    <input value={riskInput.channel ?? ''} onChange={e => setRiskInput(prev => ({ ...prev, channel: e.target.value || undefined }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase">description</label>
                    <input value={riskInput.description}
                      onChange={e => setRiskInput(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">amount</label>
                    <input type="number" value={riskInput.amount ?? 0}
                      onChange={e => setRiskInput(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">currency</label>
                    <input value={riskInput.currency ?? ''} onChange={e => setRiskInput(prev => ({ ...prev, currency: e.target.value || undefined }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">recent_tx_count</label>
                    <input type="number" value={riskInput.recent_transaction_count}
                      onChange={e => setRiskInput(prev => ({ ...prev, recent_transaction_count: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">recent_tx_amount</label>
                    <input type="number" value={riskInput.recent_transaction_amount}
                      onChange={e => setRiskInput(prev => ({ ...prev, recent_transaction_amount: Number(e.target.value) }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase">geo_location (optional)</label>
                    <input value={riskInput.geo_location ?? ''}
                      onChange={e => setRiskInput(prev => ({ ...prev, geo_location: e.target.value || undefined }))}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-slate-200" />
                  </div>
                </div>
              ) : (
                <textarea
                  rows={16}
                  value={riskJsonInput}
                  onChange={e => setRiskJsonInput(e.target.value)}
                  placeholder={'{\n  "subject_id": "user_001",\n  "subject_type": "user",\n  ...\n}'}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500/40 resize-none"
                />
              )}

              <button
                onClick={handleRunRiskEvaluation}
                disabled={isProcessing}
                className="mt-4 w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isProcessing ? 'EVALUATING...' : 'RUN RISK EVALUATION'}
              </button>
            </GlassCard>

            <GlassCard title="SESSION" className="p-4">
              {riskSession ? (
                <div className="space-y-2 text-[11px] font-mono text-slate-300">
                  <div>session_id: <span className="text-blue-400">{riskSession.session_id}</span></div>
                  <div>status: <span className="text-emerald-400">{riskSession.status}</span></div>
                  <div>decision_count: <span className="text-slate-200">{riskSession.decision_count}</span></div>
                  <div>challenge_count: <span className="text-slate-200">{riskSession.challenge_count}</span></div>
                </div>
              ) : (
                <div className="text-xs text-slate-600">Run once to load session timeline</div>
              )}
            </GlassCard>

            <GlassCard title="SESSION_TIMELINE" className="p-4">
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {riskSessions.map(s => (
                  <div key={s.session_id} className="p-2 rounded border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-blue-400">{s.subject_id}</span>
                      <span className="text-[10px] font-mono text-slate-500 ml-auto">{s.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">{new Date(s.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {!riskSessions.length && <div className="text-xs text-slate-600">No recent sessions</div>}
              </div>
            </GlassCard>

            <GlassCard title="RISK_STATS" className="p-4">
              {riskStats ? (
                <div className="space-y-2 text-[11px] font-mono text-slate-300">
                  <div>total_sessions: <span className="text-blue-400">{riskStats.sessions.total_sessions}</span></div>
                  <div>challenged: <span className="text-amber-400">{riskStats.sessions.challenged_sessions}</span></div>
                  <div>validators: <span className="text-emerald-400">{riskStats.validators.length}</span></div>
                </div>
              ) : (
                <div className="text-xs text-slate-600">Click REFRESH PANELS to load</div>
              )}
            </GlassCard>
          </div>

          <div className="xl:col-span-3 flex flex-col gap-4 min-h-0">
            <div className="grid grid-cols-1 2xl:grid-cols-5 gap-4 min-h-0">
              <GlassCard className="2xl:col-span-2 p-8 flex flex-col items-center justify-center text-center space-y-5 min-h-[300px]">
          <AnimatePresence mode="wait">
                  {isApprove && (
              <motion.div key="approve" initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}}>
                      <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
              </motion.div>
            )}
                  {isChallenge && (
              <motion.div key="challenge" initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}}>
                      <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                        <AlertTriangle className="w-12 h-12 text-amber-500" />
                </div>
              </motion.div>
            )}
                  {isRejectLike && (
              <motion.div key="reject" initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.5,opacity:0}}>
                      <div className="w-24 h-24 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                        <XCircle className="w-12 h-12 text-red-500" />
                      </div>
                    </motion.div>
                  )}
                  {!decision && (
                    <motion.div key="none" initial={{opacity:0}} animate={{opacity:1}}>
                      <div className="w-24 h-24 rounded-full bg-slate-700/20 border-4 border-slate-600 flex items-center justify-center">
                        <Database className="w-12 h-12 text-slate-500" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
                  <h3 className={`text-4xl font-black uppercase tracking-tighter ${
                    isApprove ? 'text-emerald-500' : isChallenge ? 'text-amber-500' : isRejectLike ? 'text-red-500' : 'text-slate-500'
                  }`}>{decisionLabel}</h3>
                  <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.25em]">Risk Decision</p>
          </div>

                <div className="grid grid-cols-2 gap-6 w-full max-w-[260px]">
                  <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Risk Level</div>
                    <div className="text-lg font-black uppercase text-white">{decision?.risk_level ?? '--'}</div>
            </div>
                  <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Confidence</div>
                    <div className="text-lg font-black text-white">{decision ? `${(decision.confidence * 100).toFixed(0)}%` : '--'}</div>
            </div>
          </div>

                {isChallenge && (
            <button onClick={() => setShowEvidenceForm(true)}
                    className="w-full max-w-[240px] py-2.5 rounded-xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 transition-all">
              SUBMIT EVIDENCE
            </button>
          )}
        </GlassCard>

              <div className="2xl:col-span-3 space-y-4 min-h-[300px]">
                <GlassCard title="RATIONALE" className="p-4">
                  <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{decision?.rationale ?? 'No decision yet.'}</p>
          </GlassCard>
                <GlassCard title="RISK_INDICATORS" className="p-4">
                  <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {(decision?.risk_indicators ?? []).map((ind, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="text-[10px] font-mono text-red-400">{ind}</span>
                </div>
              ))}
                    {!decision?.risk_indicators?.length && <div className="text-xs text-slate-600">No indicators yet.</div>}
            </div>
          </GlassCard>
                <GlassCard title="SCORING_PROCESS" className="p-4">
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                    {validatorOutputs.map((vo, idx) => (
                      <div key={`${vo.validator}-score-${idx}`} className="p-2 rounded border border-white/10 bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="font-black text-blue-400 uppercase">{vo.validator}</span>
                          <span className="font-mono text-slate-500">{vo.risk_level}</span>
                          <span className="ml-auto font-mono text-emerald-400">{vo.weight.toFixed(2)} × {(vo.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-1 text-[10px] font-mono text-amber-400">
                          contribution: {vo.contribution.toFixed(3)}
                        </div>
                      </div>
                    ))}
                    {!validatorOutputs.length && <div className="text-xs text-slate-600">No scoring details yet</div>}
                  </div>
                  {validatorOutputs.length > 0 && (
                    <div className="mt-2 text-[10px] font-mono text-slate-400">
                      total contribution: <span className="text-blue-400">{totalContribution.toFixed(3)}</span>
                    </div>
                  )}
                </GlassCard>
                <GlassCard title="WEIGHTED_VOTES" className="p-4">
                  <div className="space-y-2">
                    {weightedVotes.map(([level, score]) => {
                      const pct = Math.min(100, score * 100);
                      return (
                        <div key={level}>
                          <div className="flex items-center text-[10px] font-mono mb-1">
                            <span className="uppercase text-slate-300">{level}</span>
                            <span className="ml-auto text-blue-400">{score.toFixed(3)}</span>
                          </div>
                          <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {!weightedVotes.length && <div className="text-xs text-slate-600">No weighted votes in response</div>}
                  </div>
                </GlassCard>
                <GlassCard title="VALIDATORS" className="p-4">
            <div className="flex flex-wrap gap-2">
                    {(decision?.participating_validators ?? []).map(v => (
                <Badge key={v} color="slate">{v.toUpperCase()}</Badge>
              ))}
                    {!decision?.participating_validators?.length && <span className="text-xs text-slate-600">--</span>}
            </div>
          </GlassCard>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-5 gap-4 flex-1 min-h-[260px]">
              <GlassCard title="风险知识图谱" className="2xl:col-span-3 min-h-[260px]">
                {consensusResult?.knowledge_graph ? (
                  <KnowledgeGraphView graph={consensusResult.knowledge_graph} />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-600">运行评估后会自动生成图谱</div>
                )}
              </GlassCard>
              <GlassCard title="VALIDATOR_WORKBENCH" className="2xl:col-span-2 p-4">
                <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar">
                  {validatorOutputs.map((vo, idx) => (
                    <div key={`${vo.validator}-${idx}`} className="p-2.5 rounded-lg border border-white/10 bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase text-blue-400">{vo.validator}</span>
                        <span className="text-[10px] font-mono text-slate-400">{vo.risk_level}</span>
                        <span className="text-[10px] font-mono text-amber-400">w:{vo.weight.toFixed(2)}</span>
                        <span className="text-[10px] font-mono text-emerald-400 ml-auto">{(vo.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-[11px] text-slate-300 leading-relaxed">{vo.reasoning || 'No reasoning'}</div>
                    </div>
                  ))}
                  {!validatorOutputs.length && (
                    <div className="text-xs text-slate-600">Run evaluation to see per-validator output</div>
                  )}
                </div>
              </GlassCard>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showEvidenceForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={() => setShowEvidenceForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{scale:0.9,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0,y:20}}
              className="w-full max-w-lg glass border border-white/10 overflow-hidden relative z-10">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-black text-white">EVIDENCE_SUBMISSION</h3>
                <button onClick={() => setShowEvidenceForm(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Evidence Type</label>
                  <select ref={evidenceTypeRef} className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="purpose_proof">purpose_proof</option>
                    <option value="identity_proof">identity_proof</option>
                    <option value="business_justification">business_justification</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Evidence Content</label>
                  <textarea ref={evidenceContentRef} rows={4} placeholder="Enter detailed evidence..."
                    className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <button onClick={handleSubmitEvidence}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> SUBMIT_FOR_REEVALUATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
  };

  // ── Modals ─────────────────────────────────────────
  const createGroupModalJSX = (
    <AnimatePresence>
      {showCreateGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setShowCreateGroup(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{scale:0.9,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0,y:20}}
            className="w-full max-w-lg glass border border-white/10 overflow-hidden relative z-10 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-black text-white">CREATE_NEW_GROUP</h3>
              <button onClick={() => setShowCreateGroup(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              {/* Group Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Group Name</label>
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. fraud_detection_team"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              {/* Mode */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['consensus','collaboration','hybrid'] as const).map(m => (
                    <button key={m} onClick={() => setNewGroupMode(m)}
                      className={`py-2 rounded-lg border text-[9px] font-black uppercase transition-all ${
                        newGroupMode === m ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'border-white/10 text-slate-500 hover:border-white/20'
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
              {/* Initial Members */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Initial Members</label>
                  <span className="text-[9px] text-slate-600">{newGroupMembers.length} selected</span>
                </div>
                <div className="space-y-2">
                  {agents.map(agent => {
                    const existing = newGroupMembers.find(m => m.agent_id === agent.agent_id);
                    return (
                      <div key={agent.agent_id} className={`p-3 rounded-lg border transition-all ${
                        existing ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5 bg-white/[0.02]'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-[10px] font-black text-white font-mono">{agent.agent_id}</div>
                            <div className="text-[9px] text-slate-500">{agent.role}</div>
                          </div>
                          <button
                            onClick={() => {
                              if (existing) {
                                setNewGroupMembers(prev => prev.filter(m => m.agent_id !== agent.agent_id));
                              } else {
                                setNewGroupMembers(prev => [...prev, { agent_id: agent.agent_id, capability_weight: agent.capability_weight }]);
                              }
                            }}
                            className={`px-3 py-1 rounded text-[9px] font-black uppercase transition-all ${
                              existing
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-red-600/20 hover:text-red-400 hover:border-red-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-blue-600/20 hover:text-blue-400'
                            }`}
                          >
                            {existing ? 'REMOVE' : '+ ADD'}
                          </button>
                        </div>
                        {existing && (
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-500 shrink-0">Weight</span>
                            <input type="range" min={0.1} max={1.0} step={0.05}
                              value={existing.capability_weight}
                              onChange={e => setNewGroupMembers(prev =>
                                prev.map(m => m.agent_id === agent.agent_id ? { ...m, capability_weight: +e.target.value } : m)
                              )}
                              className="flex-1 accent-blue-500" />
                            <span className="text-[9px] font-black text-blue-400 w-8 text-right">{existing.capability_weight.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={handleCreateGroup}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> CREATE_GROUP
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  const addAgentModalJSX = (
    <AnimatePresence>
      {showAddAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={() => setShowAddAgent(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{scale:0.9,opacity:0,y:20}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.9,opacity:0,y:20}}
            className="w-full max-w-sm glass border border-white/10 overflow-hidden relative z-10">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white">ADD_AGENT_TO_GROUP</h3>
              <button onClick={() => setShowAddAgent(false)} className="p-1.5 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Agent ID</label>
                <input value={newAgentId} onChange={e => setNewAgentId(e.target.value)}
                  placeholder="e.g. agent-alpha"
                  className="w-full bg-navy-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <button onClick={() => { addLog(`Agent ${newAgentId} added`, "success"); setShowAddAgent(false); setNewAgentId(""); }}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> ADD_AGENT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // ── Root render ────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy-950 text-slate-200 flex flex-col font-sans overflow-hidden" style={{ height: "100dvh" }}>
      <Header activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex flex-col min-h-0">
        <motion.div key={activePage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
          className="flex-1 min-h-0 overflow-hidden">
          {activePage === "agents" && <AgentsPage />}
          {activePage === "groups" && <GroupsPage />}
          {activePage === "group-detail" && selectedGroupId && <GroupDetailPageWrapper />}
          {activePage === "risk" && <RiskPage />}
        </motion.div>
        <TerminalLog logs={logs} onClear={() => setLogs([])} />
      </div>
      <AgentDetailModal
        agent={agents.find(a => a.agent_id === selectedAgentId) ?? null}
        onClose={() => setSelectedAgentId(null)}
      />
      {createGroupModalJSX}
      {addAgentModalJSX}
    </div>
  );
}
