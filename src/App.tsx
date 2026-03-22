import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  BrainCircuit, 
  Clock, 
  Database, 
  Layout, 
  Network, 
  Settings, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  Maximize2, 
  Terminal as TerminalIcon,
  Plus,
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Save,
  Trash2,
  History,
  Info,
  Send,
  ArrowRight as ArrowRightIcon,
  X as XIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, Agent, Group, ConsensusResult, RiskEvaluation, GroupMember } from './types';
import { 
  MOCK_AGENTS, 
  MOCK_GROUPS, 
  MOCK_CONSENSUS_RESULT, 
  MOCK_RISK_EVALUATION,
  getAgentGlobalStats,
  getGroupWeightsSummary
} from './services/mockApi';
import { MiroGraph, DiscussionTimeline } from './components/Graphs';

// --- Reusable UI Components ---

const GlassCard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = "", title }) => (
  <div className={`bg-navy-900/40 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden flex flex-col ${className}`}>
    {title && (
      <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
        </div>
      </div>
    )}
    <div className="flex-1 overflow-hidden relative">
      {children}
    </div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = "blue" }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    slate: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[color]}`}>
      {children}
    </span>
  );
};

  // --- Sub-components ---

const Header: React.FC<{ activePage: Page; setActivePage: (p: Page) => void }> = ({ activePage, setActivePage }) => {
  return (
    <header className="h-16 border-b border-white/5 bg-navy-950/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-widest uppercase">Agean-Consensus</h1>
            <div className="text-[8px] font-mono text-blue-400/70 tracking-[0.2em] uppercase">Autonomous Multi-Agent System</div>
          </div>
        </div>
        
        <nav className="flex items-center gap-1">
          {(['agents', 'groups', 'consensus', 'risk'] as Page[]).map((page) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activePage === page 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {page}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">System Online</span>
        </div>
        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

const Sidebar: React.FC<{ 
  onRun: () => void; 
  isProcessing: boolean;
  onSelectGroup: (id: string) => void;
  setActivePage: (p: Page) => void;
}> = ({ onRun, isProcessing, onSelectGroup, setActivePage }) => {
  return (
    <aside className="w-80 border-l border-white/5 bg-navy-950/30 backdrop-blur-sm flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-6 gap-6">
      <GlassCard title="SYSTEM_STATS">
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Nodes</div>
            <div className="text-xl font-black text-white">128</div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Edges</div>
            <div className="text-xl font-black text-white">412</div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Latency</div>
            <div className="text-xl font-black text-blue-400">24ms</div>
          </div>
          <div className="space-y-1">
            <div className="text-[8px] font-bold text-slate-500 uppercase">Uptime</div>
            <div className="text-xl font-black text-green-400">99.9%</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard title="SIMULATION_CONTROL" className="p-6 bg-blue-600/5 border-blue-500/20">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center gap-4">
            <Zap className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-xs font-black text-white uppercase">Ready to Run</div>
              <div className="text-[10px] text-slate-500">Consensus Group: group-xyz789</div>
            </div>
          </div>
          <button 
            onClick={onRun}
            disabled={isProcessing}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {isProcessing ? 'PROCESSING...' : 'RUN SIMULATION'}
          </button>
        </div>
      </GlassCard>

      <GlassCard title="ACTIVE_GROUPS">
        <div className="divide-y divide-white/5">
          {MOCK_GROUPS.map(group => (
            <div 
              key={group.group_id} 
              className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => {
                onSelectGroup(group.group_id);
                setActivePage('group-detail');
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors">{group.group_name}</span>
                <Badge color="blue">{group.mode}</Badge>
              </div>
              <div className="text-[9px] font-mono text-slate-500">{group.group_id}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </aside>
  );
};

const Terminal: React.FC<{ logs: { time: string; msg: string; type: string }[]; onClear: () => void }> = ({ logs, onClear }) => {
  return (
    <div className="h-48 border-t border-white/5 bg-black/40 backdrop-blur-md flex flex-col shrink-0">
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Logs</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[8px] font-bold text-slate-500 uppercase">Live</span>
          </div>
          <button onClick={onClear} className="text-[8px] font-bold text-slate-500 hover:text-white uppercase">Clear</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-4 group">
            <span className="text-slate-600 shrink-0">[{log.time}]</span>
            <span className={
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              'text-blue-400/80'
            }>
              {log.msg}
            </span>
          </div>
        ))}
        <div className="flex gap-2 text-blue-400 animate-pulse">
          <span>{'>'}</span>
          <span className="w-2 h-4 bg-blue-400/50" />
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [activePage, setActivePage] = useState<Page>('consensus');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ time: string; msg: string; type: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [riskDecision, setRiskDecision] = useState<RiskEvaluation>(MOCK_RISK_EVALUATION);
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [groupWeights, setGroupWeights] = useState<GroupMember[]>(getGroupWeightsSummary('group-xyz789').agents as any);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMode, setNewGroupMode] = useState<'consensus' | 'risk'>('consensus');

  useEffect(() => {
    const initialLogs = [
      { time: '19:11:54.283', msg: '初始化系统核心...', type: 'info' },
      { time: '19:11:54.486', msg: '加载 Agent 网络: 3 个节点就绪', type: 'success' },
      { time: '19:11:54.698', msg: '建立共识通道: group-xyz789', type: 'info' },
      { time: '19:11:54.902', msg: '安全协议验证通过', type: 'success' },
    ];
    setLogs(initialLogs);
  }, []);

  const addLog = (msg: string, type: string = 'info') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false }) + '.' + Math.floor(Math.random() * 1000);
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const handleRunConsensus = () => {
    setIsProcessing(true);
    addLog('开始执行共识任务...', 'info');
    setTimeout(() => {
      setIsProcessing(false);
      addLog('共识达成: BBB (信心度 82%)', 'success');
      setActivePage('consensus');
    }, 1500);
  };

  const handleWeightChange = (id: string, val: number) => {
    setGroupWeights(prev => prev.map(a => a.agent_id === id ? { ...a, capability_weight: val } : a));
  };

  const handleCreateGroup = () => {
    if (!newGroupName) return;
    addLog(`Creating group: ${newGroupName}...`, 'info');
    setTimeout(() => {
      addLog(`Group ${newGroupName} created successfully.`, 'success');
      setShowCreateGroup(false);
      setNewGroupName('');
      setActivePage('groups');
    }, 1000);
  };

  // --- Page Components ---

  const SystemStatusBar = () => (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
      <div className="flex gap-4 pointer-events-auto">
        <div className="px-4 py-2 rounded-lg bg-navy-950/80 backdrop-blur-md border border-white/5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live_Stream: active</span>
        </div>
        <div className="px-4 py-2 rounded-lg bg-navy-950/80 backdrop-blur-md border border-white/5 flex items-center gap-3">
          <Database className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">DB_Sync: 100%</span>
        </div>
      </div>
      <div className="px-4 py-2 rounded-lg bg-navy-950/80 backdrop-blur-md border border-white/5 flex items-center gap-4 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-slate-500 uppercase">CPU</span>
          <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: '34%' }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-bold text-slate-500 uppercase">MEM</span>
          <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: '62%' }} />
          </div>
        </div>
      </div>
    </div>
  );

  const GroupListPage = () => (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">GROUP_MANAGEMENT_CORE</h2>
        <button 
          onClick={() => setShowCreateGroup(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> CREATE_GROUP
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_GROUPS.map(group => (
          <GlassCard key={group.group_id} className="p-6 space-y-4 hover:border-blue-500/30 transition-all group cursor-pointer" onClick={() => {
            setSelectedGroupId(group.group_id);
            setActivePage('groups');
          }}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Layout className="w-5 h-5 text-blue-400" />
              </div>
              <Badge color={group.mode === 'consensus' ? 'blue' : 'purple'}>{group.mode}</Badge>
            </div>
            <div>
              <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{group.group_name}</h3>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">{group.group_id}</p>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-slate-800 border-2 border-navy-950 flex items-center justify-center text-[8px] font-bold text-slate-400">
                    A{i}
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border-2 border-navy-950 flex items-center justify-center text-[8px] font-bold text-blue-400">
                  +2
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">5 Agents</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );

  const AgentStatsPage = () => (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">AGENT_GLOBAL_STATS</h2>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Network className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase">Active: 12</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black text-green-400 uppercase">Health: 98%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Agents', value: '24', icon: Network, color: 'blue' },
          { label: 'Avg Accuracy', value: '94.2%', icon: Activity, color: 'green' },
          { label: 'Total Tasks', value: '1,284', icon: Database, color: 'purple' },
          { label: 'System Load', value: '12%', icon: Zap, color: 'yellow' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-6 flex flex-col items-center text-center space-y-2">
            <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <GlassCard title="AVAILABLE_AGENTS">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Agent ID</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Weight</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {MOCK_AGENTS.map(agent => (
                <tr key={agent.agent_id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono text-blue-400">{agent.agent_id}</td>
                  <td className="px-6 py-4 text-slate-400">{agent.role}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${agent.capability_weight * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-mono">{agent.capability_weight}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedAgentId(agent.agent_id);
                        setActivePage('agent-detail');
                      }}
                      className="text-[10px] font-black text-blue-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1 ml-auto"
                    >
                      Details <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );

  const AgentDetailPage = () => {
    const stats = getAgentGlobalStats(selectedAgentId || 'agent_credit');
    return (
      <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
        <button onClick={() => setActivePage('agents')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold">
          <ArrowLeft className="w-4 h-4" /> BACK_TO_LIST
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 p-8 bg-gradient-to-br from-blue-500/10 to-transparent">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h3 className="text-3xl font-black text-white mb-1">{stats.agent_id}</h3>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">CREDIT_ANALYST_CORE</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-blue-400">{(stats.global_accuracy * 100).toFixed(0)}%</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Accuracy</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Evaluations</div>
                <div className="text-2xl font-black text-white">{stats.total_evaluations}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Correct Count</div>
                <div className="text-2xl font-black text-green-400">{stats.correct_count}</div>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="SYSTEM_INFO" className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Last Updated</div>
              <div className="text-sm font-mono">{new Date(stats.last_updated).toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Status</div>
              <Badge color="green">OPERATIONAL</Badge>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Agent maintains high precision in credit risk assessment across multiple financial sectors.
              </p>
            </div>
          </GlassCard>
        </div>

        <GlassCard title="GROUP_BREAKDOWN">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Group ID</th>
                <th className="px-6 py-4">Accuracy</th>
                <th className="px-6 py-4">Evaluations</th>
                <th className="px-6 py-4">Correct</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.group_breakdown.map(g => (
                <tr key={g.group_id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-300">{g.group_id}</td>
                  <td className="px-6 py-4 font-mono text-blue-400">{(g.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 text-slate-400">{g.evaluations}</td>
                  <td className="px-6 py-4 text-green-500/70">{g.correct_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    );
  };

  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');

  const handleAddAgent = () => {
    if (!newAgentId) return;
    addLog(`Adding agent ${newAgentId} to group...`, 'info');
    setTimeout(() => {
      addLog(`Agent ${newAgentId} added successfully.`, 'success');
      setShowAddAgent(false);
      setNewAgentId('');
    }, 800);
  };

  const GroupDetailPage = () => {
    const summary = getGroupWeightsSummary('group-xyz789');
    return (
      <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
        <div className="flex items-center justify-between">
          <button onClick={() => setActivePage('groups')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold">
            <ArrowLeft className="w-4 h-4" /> BACK_TO_LIST
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddAgent(true)}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Agent
            </button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
              <Settings className="w-4 h-4" /> Configure
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">{summary.group_name}</h2>
            <div className="flex items-center gap-3 mt-2">
              <Badge color="purple">{summary.mode.toUpperCase()}</Badge>
              <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">{summary.group_id}</span>
            </div>
          </div>
        </div>

        <GlassCard title="WEIGHT_MANAGEMENT">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4">Capability Weight</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groupWeights.map(agent => (
                <tr key={agent.agent_id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{agent.agent_id}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">{agent.role}</div>
                  </td>
                  <td className="px-6 py-4 w-64">
                    <div className="space-y-2">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={agent.capability_weight}
                        onChange={(e) => handleWeightChange(agent.agent_id, parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-blue-400">
                        <span className="font-black">{agent.capability_weight.toFixed(2)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-all" title="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        {/* Consensus History */}
        <GlassCard title="CONSENSUS_HISTORY">
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    #{100 - i}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Consensus_Session_{88291 - i}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">2026-03-22 10:0{i}:00</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] font-black text-green-400 uppercase">REACHED</div>
                    <div className="text-[10px] font-mono text-slate-500">Conf: 0.9{5-i}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Add Agent Modal */}
        {showAddAgent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-navy-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-black text-white tracking-tight">ADD_AGENT_TO_GROUP</h3>
                <button onClick={() => setShowAddAgent(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Agent</label>
                  <select 
                    value={newAgentId}
                    onChange={(e) => setNewAgentId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="bg-navy-900">Select an agent...</option>
                    <option value="agent_risk_analyst" className="bg-navy-900">Risk Analyst Agent</option>
                    <option value="agent_legal" className="bg-navy-900">Legal Agent</option>
                    <option value="agent_market" className="bg-navy-900">Market Agent</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddAgent}
                  disabled={!newAgentId}
                  className="w-full py-3 rounded-lg bg-blue-600 text-white font-black text-xs hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                >
                  CONFIRM_ADDITION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  const ConsensusResultPage = () => (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-white tracking-tighter">CONSENSUS_QUADRANT</h2>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="text-blue-400">ID:</span> {MOCK_CONSENSUS_RESULT.consensus_id}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Re-Simulate
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 min-h-0">
        {/* Top Left: Knowledge Graph */}
        <GlassCard title="KNOWLEDGE_GRAPH (D3_FORCE)" className="relative">
          <MiroGraph 
            nodes={MOCK_CONSENSUS_RESULT.knowledge_graph.nodes}
            links={MOCK_CONSENSUS_RESULT.knowledge_graph.links as any}
            type="knowledge"
          />
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold text-blue-400">USER</div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[8px] font-bold text-green-400">ACTION</div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-[8px] font-bold text-yellow-400">AMOUNT</div>
          </div>
        </GlassCard>

        {/* Top Right: Agent Network */}
        <GlassCard title="AGENT_NETWORK (INFLUENCE_MAP)">
          <MiroGraph 
            nodes={MOCK_CONSENSUS_RESULT.agent_graph.nodes}
            links={MOCK_CONSENSUS_RESULT.agent_graph.edges as any}
            type="agent"
          />
        </GlassCard>

        {/* Bottom Left: Timeline */}
        <GlassCard title="DISCUSSION_TIMELINE" className="overflow-y-auto custom-scrollbar">
          <DiscussionTimeline rounds={MOCK_CONSENSUS_RESULT.discussion_rounds} />
        </GlassCard>

        {/* Bottom Right: Stats */}
        <GlassCard title="CONSENSUS_METRICS" className="p-8 flex flex-col justify-center items-center text-center space-y-8">
          <div className="space-y-2">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Final Solution</div>
            <div className="text-9xl font-black text-white tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              {MOCK_CONSENSUS_RESULT.final_solution.answer}
            </div>
          </div>

          <div className="w-full max-w-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Confidence</span>
              <span className="text-xl font-black text-blue-400">{(MOCK_CONSENSUS_RESULT.final_solution.confidence * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${MOCK_CONSENSUS_RESULT.final_solution.confidence * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 w-full pt-8 border-t border-white/5">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Rounds</div>
              <div className="text-2xl font-black text-white">{MOCK_CONSENSUS_RESULT.rounds_used}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Time</div>
              <div className="text-2xl font-black text-white">{MOCK_CONSENSUS_RESULT.execution_time}s</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Agents</div>
              <div className="text-2xl font-black text-white">{MOCK_CONSENSUS_RESULT.participating_agents.length}</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );

  const RiskPage = () => (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">RISK_EVALUATION_CORE</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
            {(['approve', 'challenge', 'reject'] as const).map(d => (
              <button
                key={d}
                onClick={() => setRiskDecision({ ...riskDecision, decision: d })}
                className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest transition-all ${
                  riskDecision.decision === d 
                    ? d === 'approve' ? 'bg-green-500 text-white' : d === 'challenge' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <Badge color="red">HIGH_PRIORITY</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decision Card */}
        <GlassCard className="p-12 flex flex-col items-center justify-center text-center space-y-8 min-h-[500px]">
          <div className="relative">
            <AnimatePresence mode="wait">
              {riskDecision.decision === 'approve' && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} key="approve">
                  <div className="w-32 h-32 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 className="w-16 h-16 text-green-500" />
                  </div>
                </motion.div>
              )}
              {riskDecision.decision === 'challenge' && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} key="challenge">
                  <div className="w-32 h-32 rounded-full bg-yellow-500/20 border-4 border-yellow-500 flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                    <AlertTriangle className="w-16 h-16 text-yellow-500" />
                  </div>
                </motion.div>
              )}
              {riskDecision.decision === 'reject' && (
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} key="reject">
                  <div className="w-32 h-32 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                    <XCircle className="w-16 h-16 text-red-500" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <h3 className={`text-6xl font-black uppercase tracking-tighter ${
              riskDecision.decision === 'approve' ? 'text-green-500' : 
              riskDecision.decision === 'challenge' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {riskDecision.decision}D
            </h3>
            <p className="text-slate-500 font-mono text-sm uppercase tracking-[0.3em]">Decision Outcome</p>
          </div>

          <div className="grid grid-cols-2 gap-12 w-full max-w-sm">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Risk Level</div>
              <div className={`text-xl font-black uppercase ${
                riskDecision.risk_level === 'low' ? 'text-green-400' : 
                riskDecision.risk_level === 'high' ? 'text-orange-400' : 'text-red-500'
              }`}>{riskDecision.risk_level}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Confidence</div>
              <div className="text-xl font-black text-white">{(riskDecision.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>

          {riskDecision.decision === 'challenge' && (
            <button 
              onClick={() => setShowEvidenceForm(true)}
              className="w-full max-w-xs py-4 rounded-xl bg-yellow-500 text-black font-black text-sm hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20"
            >
              SUBMIT EVIDENCE
            </button>
          )}
        </GlassCard>

        {/* Details Panel */}
        <div className="space-y-6">
          <GlassCard title="RATIONALE_ANALYSIS" className="p-6">
            <p className="text-sm text-slate-300 leading-relaxed font-mono">
              {riskDecision.rationale}
            </p>
          </GlassCard>

          <GlassCard title="RISK_INDICATORS" className="p-6">
            <div className="space-y-3">
              {riskDecision.risk_indicators.map((indicator, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-mono text-red-400">{indicator}</span>
                </div>
              ))}
              {riskDecision.risk_indicators.length === 0 && (
                <div className="text-xs text-slate-500 italic">No critical risk indicators detected.</div>
              )}
            </div>
          </GlassCard>

          <GlassCard title="PARTICIPATING_VALIDATORS" className="p-6">
            <div className="flex flex-wrap gap-2">
              {riskDecision.participating_validators.map(v => (
                <Badge key={v} color="slate">{v.toUpperCase()}</Badge>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Evidence Form Modal */}
      <AnimatePresence>
        {showEvidenceForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowEvidenceForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-navy-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h3 className="text-lg font-black text-white tracking-tight">EVIDENCE_SUBMISSION</h3>
                <button onClick={() => setShowEvidenceForm(false)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Type</label>
                  <select className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all">
                    <option>purpose_proof</option>
                    <option>identity_proof</option>
                    <option>business_justification</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Content</label>
                  <textarea 
                    rows={4}
                    placeholder="Enter detailed evidence for re-evaluation..."
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>
                <button 
                  onClick={() => {
                    setRiskDecision({
                      ...riskDecision,
                      decision: 'approve',
                      risk_level: 'low',
                      confidence: 0.88,
                      rationale: "[identity] Normal trust profile | [amount] Within limits | [anomaly] No anomalies | [evidence] Purpose verified with invoice"
                    });
                    setShowEvidenceForm(false);
                    addLog('证据已提交，重新评估中...', 'info');
                    setTimeout(() => addLog('重新评估完成: APPROVED', 'success'), 1000);
                  }}
                  className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> SUBMIT_FOR_REEVALUATION
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-[#05070a] text-slate-200 flex flex-col overflow-hidden selection:bg-blue-500/30">
      <Header activePage={activePage} setActivePage={setActivePage} />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left Area: Main Content */}
        <div className="flex-1 relative flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {activePage === 'agents' && <AgentStatsPage />}
                {activePage === 'agent-detail' && <AgentDetailPage />}
                {activePage === 'groups' && <GroupListPage />}
                {activePage === 'group-detail' && <GroupDetailPage />}
                {activePage === 'consensus' && (
                  <div className="h-full relative">
                    <SystemStatusBar />
                    <ConsensusResultPage />
                  </div>
                )}
                {activePage === 'risk' && <RiskPage />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Terminal */}
          <Terminal logs={logs} onClear={() => setLogs([])} />
        </div>

        {/* Right Area: Sidebar */}
        <Sidebar 
          onRun={handleRunConsensus} 
          isProcessing={isProcessing} 
          onSelectGroup={setSelectedGroupId}
          setActivePage={setActivePage}
        />
      </main>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateGroup(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-navy-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h3 className="text-lg font-black text-white tracking-tight">CREATE_NEW_GROUP</h3>
                <button onClick={() => setShowCreateGroup(false)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Group Name</label>
                  <input 
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operation Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['consensus', 'risk'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setNewGroupMode(mode)}
                        className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                          newGroupMode === mode 
                            ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleCreateGroup}
                  className="w-full py-4 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> INITIALIZE_GROUP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
