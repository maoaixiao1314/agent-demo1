import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, RefreshCw, Plus, Trash2, Edit2,
  BookOpen, Cpu, Send, Check, X,
} from 'lucide-react';
import type { Group, GroupMember, GroupConsensusResult, Solution, CollaborationMode } from '../types';
import { MOCK_AGENTS, getGroupWeightsSummary } from '../services/mockApi';
import { groupApi } from '../services/api';
import { KnowledgeGraphView, AgentNetworkView, DiscussionTimeline } from './Graphs';

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleRight?: React.ReactNode;
}> = ({ children, className = '', title, titleRight }) => (
  <div className={`glass flex flex-col overflow-hidden ${className}`}>
    {title && (
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
        {titleRight ?? (
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          </div>
        )}
      </div>
    )}
    <div className="flex-1 overflow-hidden relative">{children}</div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'blue' }) => {
  const colors: Record<string, string> = {
    blue:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    slate:  'bg-slate-500/15 text-slate-400 border-slate-500/25',
    cyan:   'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  };
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${colors[color] ?? colors.blue}`}>{children}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Task Input
// ─────────────────────────────────────────────────────────────────────────────

const TaskInput: React.FC<{ onRun: (task: string) => void; isProcessing: boolean; mode: CollaborationMode }> = ({ onRun, isProcessing, mode }) => {
  const [task, setTask] = useState('');
  const submit = () => { if (task.trim()) { onRun(task); setTask(''); } };
  const fillPreset = () => {
    const preset = mode === 'consensus'
      ? {
          task: '你是小组评委，每轮都要独立判断并允许改变立场。题目：团队周末团建三选一：A爬山 B密室逃脱 C桌游咖啡。每轮固定输出：CHOICE=<A|B|C>; REASONS=<两条>; CHANGE=<yes/no>; WHY_CHANGE=<一句话>。',
          quorum_threshold: 0.65,
          stability_horizon: 3,
          max_rounds: 4,
        }
      : {
          task: '你们是家庭旅行协作小组，要在3天内完成上海出行计划。请按角色分工输出：OWNER=<谁负责>; ACTION=<具体动作>; DEADLINE=<截止时间>; DEPENDENCY=<依赖>; RISK=<风险>; NEXT_STEP=<下一步>。',
          quorum_threshold: 0.5,
          stability_horizon: 1,
          max_rounds: 2,
        };
    setTask(JSON.stringify(preset, null, 2));
  };
  return (
    <div className="p-3 border-t border-white/5 shrink-0 bg-black/20">
      <div className="mb-2">
        <button
          onClick={fillPreset}
          className="px-3 py-1.5 rounded text-[10px] font-black uppercase border border-blue-500/30 text-blue-400 hover:bg-blue-500/15 transition-all"
        >
          一键填充案例 · JSON
        </button>
      </div>
      <div className="flex gap-2">
      <textarea
        value={task}
        onChange={e => setTask(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder="输入任务或问题... (Ctrl+Enter 发送)"
        rows={2}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
      />
      <button
          onClick={submit}
        disabled={isProcessing || !task.trim()}
          className="px-4 rounded-lg bg-blue-600 text-white flex flex-col items-center justify-center gap-1 hover:bg-blue-500 transition-all disabled:opacity-40 shadow-lg shadow-blue-600/20 shrink-0"
      >
          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="text-[8px] font-black uppercase">{isProcessing ? 'RUNNING' : 'RUN'}</span>
      </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Consensus Summary Strip — thin bar shown after run
// ─────────────────────────────────────────────────────────────────────────────

const ConsensusSummaryStrip: React.FC<{ result: GroupConsensusResult | null }> = ({ result }) => {
  if (!result?.final_solution) return null;
  const { answer, confidence } = result.final_solution;
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-blue-600/5 border-b border-blue-500/10 shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Answer</span>
        <span className="text-lg font-black text-white tracking-tighter">{answer}</span>
                  </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Confidence</span>
        <span className="text-sm font-black text-blue-400">{(confidence * 100).toFixed(0)}%</span>
                </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Rounds</span>
        <span className="text-sm font-black text-white">{result.rounds_used}</span>
              </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Time</span>
        <span className="text-sm font-black text-white">{result.execution_time.toFixed(2)}s</span>
                  </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] text-slate-500 uppercase font-bold">Agents</span>
        {result.participating_agents.map(a => (
          <Badge key={a} color="slate">{a.replace('agent_', '')}</Badge>
          ))}
        </div>
      </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Graph Panel
// ─────────────────────────────────────────────────────────────────────────────

type GraphType = 'knowledge' | 'agent';

const GraphPanel: React.FC<{ result: GroupConsensusResult | null }> = ({ result }) => {
  const [graphType, setGraphType] = useState<GraphType>('knowledge');
  return (
    <div className="flex flex-col h-full glass overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2 shrink-0">
        {([
          { id: 'knowledge' as const, label: '知识图谱',   Icon: BookOpen, active: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
          { id: 'agent'     as const, label: 'Agent 网络', Icon: Cpu,      active: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
        ]).map(({ id, label, Icon, active }) => (
          <button
            key={id}
            onClick={() => setGraphType(id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all border ${
              graphType === id ? active : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            <Icon className="w-3 h-3" /> {label}
          </button>
        ))}
        <div className="ml-auto text-[8px] text-slate-700 font-mono">scroll · drag</div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {graphType === 'knowledge'
          ? result?.knowledge_graph
            ? <KnowledgeGraphView graph={result.knowledge_graph} />
            : <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-8"><BookOpen className="w-8 h-8 text-slate-700" /><span className="text-xs text-slate-600">知识图谱将在运行共识后显示</span></div>
          : result?.agent_graph
            ? <AgentNetworkView graph={result.agent_graph} participatingAgents={result.participating_agents} />
            : <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-8"><Cpu className="w-8 h-8 text-slate-700" /><span className="text-xs text-slate-600">Agent 网络将在运行共识后显示</span></div>
        }
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChatPanel — 群聊风格，用户消息右对齐，agent 消息左对齐，整体可滚动
// ─────────────────────────────────────────────────────────────────────────────

type ChatMessage =
  | { type: 'user'; text: string; ts: string }
  | { type: 'agent'; agentId: string; answer: string; confidence: number; reasoning: string; changed: boolean; ts: string }
  | { type: 'system'; text: string; status: 'success' | 'info'; ts: string }
  | { type: 'round'; num: number; status: string };

const buildChatMessages = (task: string | null, result: GroupConsensusResult | null): ChatMessage[] => {
  const msgs: ChatMessage[] = [];
  if (task) msgs.push({ type: 'user', text: task, ts: '' });
  if (!result) return msgs;

  // collaboration 模式：discussion_rounds 为空，用 agent_responses 直接渲染
  if (!result.discussion_rounds?.length && result.agent_responses?.length) {
    msgs.push({ type: 'round', num: 1, status: result.consensus_reached ? 'reached' : result.mode });
    result.agent_responses.forEach(resp => {
      msgs.push({
        type: 'agent', agentId: resp.agent_id, answer: resp.answer,
        confidence: resp.confidence, reasoning: resp.reasoning || resp.answer,
        changed: false, ts: resp.timestamp || '',
      });
    });
  } else {
    // consensus 模式：用 discussion_rounds
    result.discussion_rounds.forEach((round, ri) => {
      const prev = ri > 0 ? result.discussion_rounds[ri - 1] : null;
      msgs.push({ type: 'round', num: round.round_number, status: round.consensus_status });
      (Object.entries(round.agent_responses) as [string, Solution][]).forEach(([agentId, resp]) => {
        msgs.push({
          type: 'agent', agentId, answer: resp.answer,
          confidence: resp.confidence, reasoning: resp.reasoning,
          changed: !!(prev?.agent_responses[agentId] && prev.agent_responses[agentId].answer !== resp.answer),
          ts: '',
        });
      });
    });
  }

  if (result.final_solution) {
    const ans = result.final_solution.answer.length > 80
      ? result.final_solution.answer.slice(0, 80) + '...'
      : result.final_solution.answer;
    msgs.push({ type: 'system', text: `共识达成：${ans}  置信度 ${(result.final_solution.confidence * 100).toFixed(0)}%`, status: 'success', ts: '' });
  }
  return msgs;
};

const AGENT_PALETTE = [
  { accent: '#60a5fa', bg: 'rgba(59,130,246,0.09)',  border: 'rgba(59,130,246,0.22)'  },
  { accent: '#c084fc', bg: 'rgba(168,85,247,0.09)',  border: 'rgba(168,85,247,0.22)'  },
  { accent: '#34d399', bg: 'rgba(16,185,129,0.09)',  border: 'rgba(16,185,129,0.22)'  },
  { accent: '#fbbf24', bg: 'rgba(245,158,11,0.09)',  border: 'rgba(245,158,11,0.22)'  },
  { accent: '#22d3ee', bg: 'rgba(6,182,212,0.09)',   border: 'rgba(6,182,212,0.22)'   },
  { accent: '#fb7185', bg: 'rgba(244,63,94,0.09)',   border: 'rgba(244,63,94,0.22)'   },
];
const agentPaletteCache: Record<string, typeof AGENT_PALETTE[0]> = {};
const agentColor = (id: string) => {
  if (!agentPaletteCache[id]) agentPaletteCache[id] = AGENT_PALETTE[Object.keys(agentPaletteCache).length % AGENT_PALETTE.length];
  return agentPaletteCache[id];
};

const DiscussionPanel: React.FC<{
  result: GroupConsensusResult | null;
  isProcessing: boolean;
  onRun: (task: string) => void;
  lastTask: string | null;
  mode: CollaborationMode;
}> = ({ result, isProcessing, onRun, lastTask, mode }) => {
  const [task, setTask] = useState('');
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  // 当 result 更新（API 返回）时清除 pendingTask
  React.useEffect(() => {
    if (result) setPendingTask(null);
  }, [result]);

  const msgs = buildChatMessages(pendingTask ?? lastTask, result);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length, isProcessing]);

  const submit = () => {
    if (!task.trim() || isProcessing) return;
    setPendingTask(task);
    onRun(task);
    setTask('');
  };

  const fillPreset = () => {
    const preset = mode === 'consensus'
      ? {
          task: '你是小组评委，每轮都要独立判断并允许改变立场。题目：团队周末团建三选一：A爬山 B密室逃脱 C桌游咖啡。每轮固定输出：CHOICE=<A|B|C>; REASONS=<两条>; CHANGE=<yes/no>; WHY_CHANGE=<一句话>。',
          quorum_threshold: 0.65,
          stability_horizon: 3,
          max_rounds: 4,
        }
      : {
          task: '你们是家庭旅行协作小组，要在3天内完成上海出行计划。请按角色分工输出：OWNER=<谁负责>; ACTION=<具体动作>; DEADLINE=<截止时间>; DEPENDENCY=<依赖>; RISK=<风险>; NEXT_STEP=<下一步>。',
          quorum_threshold: 0.5,
          stability_horizon: 1,
          max_rounds: 2,
        };
    setTask(JSON.stringify(preset, null, 2));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/10">
      {/* Scrollable chat area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/15 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-500/40" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">在下方输入任务，<br />多个 Agent 将开始讨论并给出答案</p>
          </div>
        )}

        {msgs.map((msg, i) => {
          // Round 分隔
          if (msg.type === 'round') return (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <span
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: msg.status === 'reached' ? 'rgba(52,211,153,0.08)' : 'rgba(96,165,250,0.08)',
                  border: `1px solid ${msg.status === 'reached' ? 'rgba(52,211,153,0.2)' : 'rgba(96,165,250,0.2)'}`,
                  color: msg.status === 'reached' ? '#34d399' : '#60a5fa',
                }}
              >
                Round {msg.num} · {msg.status}
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>
          );

          // 用户消息 — 右对齐
          if (msg.type === 'user') return (
            <div key={i} className="flex justify-end py-1">
              <div
                className="max-w-[72%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
                style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#e2e8f0' }}
              >
                {msg.text}
              </div>
            </div>
          );

          // 系统消息 — 居中
          if (msg.type === 'system') return (
            <div key={i} className="flex justify-center py-2">
              <div
                className="px-4 py-2 rounded-full text-[11px] font-black"
                style={{
                  background: msg.status === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(96,165,250,0.1)',
                  border: `1px solid ${msg.status === 'success' ? 'rgba(52,211,153,0.25)' : 'rgba(96,165,250,0.25)'}`,
                  color: msg.status === 'success' ? '#34d399' : '#60a5fa',
                }}
              >
                ✓ {msg.text}
              </div>
            </div>
          );

          // Agent 消息 — 左对齐
          if (msg.type === 'agent') {
            const c = agentColor(msg.agentId);
            const initials = msg.agentId.replace(/^agent[_-]?/i, '').slice(0, 2).toUpperCase();
            return (
              <div key={i} className="flex items-start gap-2.5 py-1">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black"
                  style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.accent }}
                >
                  {initials}
                </div>
                <div className="max-w-[75%]">
                  {/* Name + meta */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-black" style={{ color: c.accent }}>{msg.agentId}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#f1f5f9' }}
                    >{msg.answer}</span>
                    <span className="text-[10px] font-mono" style={{ color: 'rgba(148,163,184,0.6)' }}>{(msg.confidence * 100).toFixed(0)}%</span>
                    {msg.changed && (
                      <span
                        className="text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
                      >↻ 改变立场</span>
                    )}
                  </div>
                  {/* Bubble */}
                  <div
                    className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-[13px] leading-relaxed"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: '#cbd5e1' }}
                  >
                    {msg.reasoning}
                  </div>
                </div>
    </div>
            );
          }
          return null;
        })}
        <div ref={bottomRef} />
        {/* Agent 思考中动画 */}
        {isProcessing && (
          <div className="flex items-center gap-2.5 py-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(96,165,250,0.1)', border: '1.5px solid rgba(96,165,250,0.2)' }}>
              <span className="text-[10px] font-black" style={{ color: '#60a5fa' }}>AI</span>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-[11px] text-blue-400/60 ml-1">Agents 讨论中...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-4 py-3 flex flex-col gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
      >
        <div>
          <button
            onClick={fillPreset}
            className="px-3 py-1.5 rounded text-[10px] font-black uppercase border border-blue-500/30 text-blue-400 hover:bg-blue-500/15 transition-all"
          >
            一键填充案例 · JSON
          </button>
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            placeholder="输入任务或问题... (Ctrl+Enter 发送)"
            rows={2}
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 resize-none leading-relaxed"
          />
          <button
            onClick={submit}
            disabled={isProcessing || !task.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
            style={{ background: 'rgba(59,130,246,0.8)', boxShadow: '0 0 16px rgba(59,130,246,0.3)' }}
          >
            {isProcessing
              ? <RefreshCw className="w-4 h-4 text-white animate-spin" />
              : <Send className="w-4 h-4 text-white" />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — full-screen graph + task input
// ─────────────────────────────────────────────────────────────────────────────

const Tab1Graph: React.FC<{
  result: GroupConsensusResult | null;
  isProcessing: boolean;
  onRun: (t: string) => void;
  mode: CollaborationMode;
}> = ({ result, isProcessing, onRun, mode }) => (
  <div className="flex flex-col h-full overflow-hidden">
    <div className="flex-1 min-h-0 p-4" style={{ minHeight: 0 }}>
    <GraphPanel result={result} />
    </div>
    <TaskInput onRun={onRun} isProcessing={isProcessing} mode={mode} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — workbench: full-height discussion
// ─────────────────────────────────────────────────────────────────────────────

const Tab2Workbench: React.FC<{
  result: GroupConsensusResult | null;
  isProcessing: boolean;
  onRun: (task: string) => void;
  lastTask: string | null;
  mode: CollaborationMode;
}> = ({ result, isProcessing, onRun, lastTask, mode }) => (
  <div className="h-full p-4 flex flex-col overflow-hidden">
    <DiscussionPanel result={result} isProcessing={isProcessing} onRun={onRun} lastTask={lastTask} mode={mode} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — dual: graph 60% left, discussion 40% right
// ─────────────────────────────────────────────────────────────────────────────

const Tab3Dual: React.FC<{
  result: GroupConsensusResult | null;
  isProcessing: boolean;
  onRun: (task: string) => void;
  lastTask: string | null;
  mode: CollaborationMode;
}> = ({ result, isProcessing, onRun, lastTask, mode }) => (
  <div className="h-full flex p-4 gap-4 overflow-hidden">
    <div className="flex-[3] min-w-0">
      <GraphPanel result={result} />
    </div>
    <div className="flex-[2] min-w-0 flex flex-col overflow-hidden">
      <DiscussionPanel result={result} isProcessing={isProcessing} onRun={onRun} lastTask={lastTask} mode={mode} />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Agent Management Drawer
// Opened from GroupDetailPage header via "Manage Agents" button
// ─────────────────────────────────────────────────────────────────────────────

export const AgentManagementDrawer: React.FC<{
  open: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onLog: (msg: string, type?: string) => void;
}> = ({ open, groupId, groupName, onClose, onLog }) => {
  const [members, setMembers] = useState<GroupMember[]>(
    () => getGroupWeightsSummary(groupId).agents
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editWeight, setEditWeight] = useState(0.85);
  const [newAgentId, setNewAgentId] = useState('');
  const [newWeight, setNewWeight] = useState(0.85);

  const available = MOCK_AGENTS.filter(a => !members.find(m => m.agent_id === a.agent_id));

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await groupApi.getMembers(groupId);
        if (Array.isArray(data) && data.length) setMembers(data);
      } catch { /* keep mock */ }
    })();
  }, [open, groupId]);

  const handleAdd = async (agentId: string, weight: number) => {
    try {
      const { data } = await groupApi.addMember(groupId, {
        agent_id: agentId, capability_weight: weight, specialization: {},
      });
      setMembers(prev => [...prev, data]);
      onLog(`Agent ${agentId} added`, 'success');
    } catch {
      const agent = MOCK_AGENTS.find(a => a.agent_id === agentId);
      if (agent) {
        setMembers(prev => [...prev, {
          group_id: groupId, agent_id: agentId, capability_weight: weight,
          specialization: agent.specialization, mode: 'consensus',
          added_at: new Date().toISOString(), is_active: true, metadata: {},
        }]);
        onLog(`Agent ${agentId} added (mock)`, 'info');
      }
    }
    setShowAdd(false);
    setNewAgentId('');
  };

  const handleRemove = async (agentId: string) => {
    try { await groupApi.removeMember(groupId, agentId); } catch { /* silent */ }
    setMembers(prev => prev.filter(m => m.agent_id !== agentId));
    onLog(`Agent ${agentId} removed`, 'success');
  };

  const handleUpdateWeight = async (agentId: string, weight: number) => {
    try { await groupApi.updateMember(groupId, agentId, { capability_weight: weight }); } catch { /* silent */ }
    setMembers(prev => prev.map(m => m.agent_id === agentId ? { ...m, capability_weight: weight } : m));
    setEditId(null);
    onLog(`${agentId} weight → ${weight.toFixed(2)}`, 'success');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[400px] bg-[#060d1a] border-l border-white/5 flex flex-col shadow-2xl"
          >
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <div className="text-sm font-black text-white">{groupName}</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">AGENTS_IN_GROUP</div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Add agent section */}
            <div className="px-4 py-3 border-b border-white/5 shrink-0">
              <button
                onClick={() => setShowAdd(v => !v)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase hover:bg-blue-600/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> ADD AGENT
              </button>
              <AnimatePresence>
                {showAdd && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-3">
                      <select
                        value={newAgentId}
                        onChange={e => setNewAgentId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">— Select Agent —</option>
                        {available.map(a => (
                          <option key={a.agent_id} value={a.agent_id}>{a.agent_id} ({a.role})</option>
                        ))}
                      </select>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>Capability Weight</span>
                          <span className="font-black text-blue-400">{newWeight.toFixed(2)}</span>
                        </div>
                        <input type="range" min={0.1} max={1.0} step={0.05}
                          value={newWeight} onChange={e => setNewWeight(+e.target.value)}
                          className="w-full accent-blue-500" />
                      </div>
                      <button
                        onClick={() => { if (newAgentId) handleAdd(newAgentId, newWeight); }}
                        disabled={!newAgentId}
                        className="w-full py-2 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-500 transition-all disabled:opacity-40"
                      >
                        CONFIRM ADD
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Members list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
              {members.length === 0 && (
                <div className="flex items-center justify-center h-32 text-slate-600 text-xs">No agents in this group</div>
              )}
              {members.map(m => (
                <div key={m.agent_id} className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-white font-mono">{m.agent_id}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (editId === m.agent_id) { setEditId(null); }
                          else { setEditId(m.agent_id); setEditWeight(m.capability_weight); }
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(m.agent_id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {editId === m.agent_id ? (
                    <div className="flex items-center gap-2">
                      <input type="range" min={0.1} max={1.0} step={0.05}
                        value={editWeight} onChange={e => setEditWeight(+e.target.value)}
                        className="flex-1 accent-blue-500" />
                      <span className="text-[9px] font-black text-blue-400 w-8 text-right">{editWeight.toFixed(2)}</span>
                      <button
                        onClick={() => handleUpdateWeight(m.agent_id, editWeight)}
                        className="p-1 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{ width: `${m.capability_weight * 100}%` }} />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 w-8 text-right">{m.capability_weight.toFixed(2)}</span>
                    </div>
                  )}
                  {Object.keys(m.specialization).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(m.specialization).map(([k, v]) => (
                        <span key={k} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {k}: {String(v)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// GroupDetailPage — main export
// ─────────────────────────────────────────────────────────────────────────────

type DetailTab = 'graph' | 'workbench' | 'dual';

export interface GroupDetailPageProps {
  groupId: string;
  groups: Group[];
  consensusResult: GroupConsensusResult | null;
  isProcessing: boolean;
  onBack: () => void;
  onRunConsensus: (groupId: string, task: string) => void;
  onLog: (msg: string, type?: string) => void;
}

export const GroupDetailPage: React.FC<GroupDetailPageProps> = ({
  groupId,
  groups,
  consensusResult,
  isProcessing,
  onBack,
  onRunConsensus,
  onLog,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('dual');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastTask, setLastTask] = useState<string | null>(null);
  const group = groups.find(g => g.group_id === groupId);
  const result = consensusResult;

  const handleRun = (task: string) => {
    setLastTask(task);
    onRunConsensus(groupId, task);
  };

  const TABS: { id: DetailTab; label: string }[] = [
    { id: 'graph',     label: '图谱' },
    { id: 'workbench', label: '工作台' },
    { id: 'dual',      label: '双栏' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-xs font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> BACK
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="text-sm font-black text-white">{group?.group_name ?? groupId}</h2>
          <Badge color={group?.mode === 'consensus' ? 'blue' : group?.mode === 'hybrid' ? 'purple' : 'cyan'}>
            {group?.mode ?? 'consensus'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase hover:bg-white/10 hover:text-white transition-all"
          >
            Manage Agents
          </button>
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600/30 text-blue-400 shadow-inner'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'graph'     && <Tab1Graph     result={result} isProcessing={isProcessing} onRun={handleRun} mode={group?.mode ?? 'consensus'} />}
            {activeTab === 'workbench' && <Tab2Workbench result={result} isProcessing={isProcessing} onRun={handleRun} lastTask={lastTask} mode={group?.mode ?? 'consensus'} />}
            {activeTab === 'dual'      && <Tab3Dual      result={result} isProcessing={isProcessing} onRun={handleRun} lastTask={lastTask} mode={group?.mode ?? 'consensus'} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Agent Management Drawer */}
      <AgentManagementDrawer
        open={drawerOpen}
        groupId={groupId}
        groupName={group?.group_name ?? groupId}
        onClose={() => setDrawerOpen(false)}
        onLog={onLog}
      />
    </div>
  );
};
