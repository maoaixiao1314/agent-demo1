import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { KGEntity, KnowledgeGraph, GroupGraph, ConsensusRound, Solution } from '../types';

const ENTITY_COLORS: Record<string, string> = {
  user: '#3b82f6', action: '#10b981', amount: '#f59e0b',
  location: '#ef4444', company: '#a855f7', event: '#06b6d4', counterparty: '#f97316',
};

interface KGGraphProps { graph: KnowledgeGraph; onNodeClick?: (e: KGEntity) => void; }
export const KnowledgeGraphView: React.FC<KGGraphProps> = ({ graph, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 800;
    const H = containerRef.current.clientHeight || 500;
    if (W === 0 || H === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const zoomG = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4])
      .on('zoom', (e) => zoomG.attr('transform', e.transform)));
    const defs = svg.append('defs');
    const types = [...new Set(graph.relations.map(r => r.relation_type))];
    types.forEach(t => {
      defs.append('marker').attr('id', `arrow-${t}`)
        .attr('viewBox', '0 -5 10 10').attr('refX', 28).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#475569');
    });
    const nodes: any[] = graph.entities.map(e => ({ ...e, x: W / 2, y: H / 2 }));
    const links: any[] = graph.relations.map(r => ({ ...r, source: r.source_entity_id, target: r.target_entity_id }));
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.entity_id).distance(130))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide(50));
    const link = zoomG.append('g').selectAll('line').data(links).enter().append('line')
      .attr('stroke', '#334155').attr('stroke-opacity', 0.7).attr('stroke-width', 1.5)
      .attr('marker-end', (d: any) => `url(#arrow-${d.relation_type})`);
    const linkLabel = zoomG.append('g').selectAll('text').data(links).enter().append('text')
      .attr('fill', '#475569').attr('font-size', '8px').attr('font-family', 'monospace')
      .attr('text-anchor', 'middle').text((d: any) => d.relation_type);
    const nodeG = zoomG.append('g').selectAll('g').data(nodes).enter().append('g')
      .style('cursor', 'pointer')
      .on('click', (_: any, d: any) => onNodeClick?.(d))
      .call(d3.drag<SVGGElement, any>()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    nodeG.append('circle')
      .attr('r', 16)
      .attr('fill', (d: any) => ENTITY_COLORS[d.entity_type] || '#94a3b8')
      .attr('fill-opacity', 0.92)
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2.2);
    nodeG.append('text').attr('dy', 32).attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0').attr('font-size', '9px').attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text((d: any) => d.name.length > 14 ? d.name.slice(0, 13) + '...' : d.name);
    sim.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      linkLabel.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
               .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 4);
      nodeG.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }, [graph, onNodeClick]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  const entityTypes = [...new Set(graph.entities.map(e => e.entity_type))];
  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#060d1a]" style={{ minHeight: '300px' }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
        {entityTypes.map(t => (
          <div key={t} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[8px] font-bold uppercase tracking-wider"
            style={{ color: ENTITY_COLORS[t as string] || '#94a3b8' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: ENTITY_COLORS[t as string] || '#94a3b8' }} />
            {t}
          </div>
        ))}
      </div>
      <div className="absolute top-3 right-3 text-[8px] text-slate-600 font-mono pointer-events-none">scroll to zoom · drag to pan</div>
    </div>
  );
};

interface AgentNetworkProps { graph: GroupGraph; participatingAgents?: string[]; }
export const AgentNetworkView: React.FC<AgentNetworkProps> = ({ graph, participatingAgents }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 800;
    const H = containerRef.current.clientHeight || 500;
    if (W === 0 || H === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const zoomG = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4])
      .on('zoom', (e) => zoomG.attr('transform', e.transform)));
    const defs = svg.append('defs');
    defs.append('marker').attr('id', 'arr-agent')
      .attr('viewBox', '0 -5 10 10').attr('refX', 32).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#475569');
    const nodes: any[] = graph.nodes.map(id => ({ id, x: W / 2, y: H / 2 }));
    const links: any[] = graph.edges.map(e => ({ ...e, source: e.source_agent_id, target: e.target_agent_id }));
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(W / 2, H / 2));
    const link = zoomG.append('g').selectAll('line').data(links).enter().append('line')
      .attr('stroke', (d: any) => d.trust_score > 0.8 ? '#10b981' : d.trust_score < 0.65 ? '#ef4444' : '#3b82f6')
      .attr('stroke-opacity', 0.6).attr('stroke-width', (d: any) => 1 + d.influence_weight * 3)
      .attr('marker-end', 'url(#arr-agent)');
    const linkLabel = zoomG.append('g').selectAll('text').data(links).enter().append('text')
      .attr('fill', '#475569').attr('font-size', '8px').attr('font-family', 'monospace')
      .attr('text-anchor', 'middle').text((d: any) => `trust:${d.trust_score.toFixed(2)}`);
    const nodeG = zoomG.append('g').selectAll('g').data(nodes).enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    nodeG.append('circle')
      .attr('r', (d: any) => {
        const out = graph.edges.filter(e => e.source_agent_id === d.id);
        return 20 + out.reduce((s, e) => s + e.influence_weight, 0) * 15;
      })
      .attr('fill', '#1e3a5f')
      .attr('stroke', (d: any) => participatingAgents?.includes(d.id) ? '#3b82f6' : '#334155')
      .attr('stroke-width', 2);
    nodeG.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', '#e2e8f0').attr('font-size', '9px').attr('font-weight', 'bold')
      .attr('font-family', 'monospace').text((d: any) => d.id.replace('agent_', ''));
    nodeG.append('text').attr('dy', 38).attr('text-anchor', 'middle')
      .attr('fill', '#64748b').attr('font-size', '8px').attr('font-family', 'monospace')
      .text((d: any) => {
        const out = graph.edges.filter(e => e.source_agent_id === d.id);
        return `inf:${out.reduce((s, e) => s + e.influence_weight, 0).toFixed(2)}`;
      });
    sim.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      linkLabel.attr('x', (d: any) => (d.source.x + d.target.x) / 2)
               .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);
      nodeG.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    return () => { sim.stop(); };
  }, [graph, participatingAgents]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#060d1a]" style={{ minHeight: '300px' }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(#60a5fa 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }} />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 pointer-events-none">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-emerald-500/30 text-[8px] font-bold text-emerald-400">● high trust (&gt;0.8)</div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-blue-500/30 text-[8px] font-bold text-blue-400">● medium</div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-red-500/30 text-[8px] font-bold text-red-400">● low trust (&lt;0.65)</div>
      </div>
      <div className="absolute top-3 right-3 text-[8px] text-slate-600 font-mono pointer-events-none">node size = influence · scroll to zoom</div>
    </div>
  );
};

// Agent color palette — each agent gets a fixed color slot
const COLOR_POOL = [
  { accent: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)'  }, // blue
  { accent: '#a855f7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)' }, // purple
  { accent: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' }, // emerald
  { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' }, // amber
  { accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)',  border: 'rgba(6,182,212,0.2)'  }, // cyan
  { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)',  border: 'rgba(244,63,94,0.2)'  }, // rose
];
const agentColorCache: Record<string, typeof COLOR_POOL[0]> = {};
const getColor = (id: string) => {
  if (!agentColorCache[id]) {
    agentColorCache[id] = COLOR_POOL[Object.keys(agentColorCache).length % COLOR_POOL.length];
  }
  return agentColorCache[id];
};

export const DiscussionTimeline: React.FC<{ rounds: ConsensusRound[] }> = ({ rounds }) => {
  type Msg = { roundNum: number; status: string; agentId: string; resp: Solution; changed: boolean; isFirst: boolean; };
  const msgs: Msg[] = [];
  rounds.forEach((round, ri) => {
    const prev = ri > 0 ? rounds[ri - 1] : null;
    (Object.entries(round.agent_responses) as [string, Solution][]).forEach(([aid, resp], i) => {
      msgs.push({ roundNum: round.round_number, status: round.consensus_status, agentId: aid, resp, changed: !!(prev?.agent_responses[aid] && prev.agent_responses[aid].answer !== resp.answer), isFirst: i === 0 });
    });
  });

  return (
    <div className="flex flex-col gap-0 px-3 py-2">
      {msgs.map((msg, idx) => {
        const c = getColor(msg.agentId);
        const name = msg.agentId.replace(/^agent[_\-]?/i, '');
        const initials = name.slice(0, 2).toUpperCase();
        return (
          <React.Fragment key={idx}>
            {/* Round header */}
            {msg.isFirst && (
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase"
                  style={{
                    background: msg.status === 'reached' ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.08)',
                    border: `1px solid ${msg.status === 'reached' ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`,
                    color: msg.status === 'reached' ? '#34d399' : '#60a5fa',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: msg.status === 'reached' ? '#34d399' : '#60a5fa' }}
                  />
                  Round {msg.roundNum} — {msg.status}
                </div>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            )}

            {/* Chat bubble */}
            <div className="flex items-start gap-3 py-1.5">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px] tracking-wider"
                style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.accent }}
              >
                {initials}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-black" style={{ color: c.accent }}>
                    {msg.agentId}
                  </span>
                  <div
                    className="px-2 py-0.5 rounded text-[10px] font-black font-mono"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#f1f5f9' }}
                  >
                    {msg.resp.answer}
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(148,163,184,0.7)' }}>
                    {(msg.resp.confidence * 100).toFixed(0)}%
                  </span>
                  {msg.changed && (
                    <span
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}
                    >
                      ↻ 改变立场
                    </span>
                  )}
                </div>

                {/* Reasoning bubble */}
                <div
                  className="px-3.5 py-2.5 rounded-xl rounded-tl-sm text-[12px] leading-relaxed"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: '#cbd5e1',
                    fontFamily: '\'PingFang SC\', \'Microsoft YaHei\', sans-serif',
                  }}
                >
                  {msg.resp.reasoning}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
