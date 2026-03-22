import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphEdge, ConsensusRound } from '../types';

interface GraphProps {
  nodes: GraphNode[];
  links: GraphEdge[];
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  type: 'knowledge' | 'agent';
}

export const MiroGraph: React.FC<GraphProps> = ({ nodes, links, width = 800, height = 600, onNodeClick, type }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    // Define arrow markers
    svg.append("defs").selectAll("marker")
      .data(["arrow"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#475569")
      .attr("d", "M0,-5L10,0L0,5");

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d: any) => {
        if (type === 'agent') {
          return d.trust_score > 0.8 ? "#10b981" : d.trust_score < 0.7 ? "#ef4444" : "#3b82f6";
        }
        return "#334155";
      })
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => (d.influence_weight || 1) * 2)
      .attr("marker-end", "url(#arrow)");

    const node = svg.append("g")
      .selectAll("path")
      .data(nodes)
      .enter().append("path")
      .attr("d", (d: any) => {
        if (type === 'agent') {
          const size = (d.score || 0.5) * 1000 + 200;
          return d3.symbol().type(d3.symbolCircle).size(size)();
        }
        switch (d.type) {
          case 'user': return d3.symbol().type(d3.symbolCircle).size(400)();
          case 'action': return d3.symbol().type(d3.symbolSquare).size(400)();
          case 'amount': return d3.symbol().type(d3.symbolDiamond).size(400)();
          case 'location': return d3.symbol().type(d3.symbolStar).size(400)();
          case 'counterparty': return d3.symbol().type(d3.symbolTriangle).size(400)();
          default: return d3.symbol().type(d3.symbolCircle).size(400)();
        }
      })
      .attr("fill", (d: any) => {
        if (type === 'knowledge') {
          switch (d.type) {
            case 'user': return '#3b82f6';
            case 'action': return '#10b981';
            case 'amount': return '#eab308';
            case 'location': return '#ef4444';
            case 'counterparty': return '#a855f7';
            default: return '#94a3b8';
          }
        }
        return "#1e293b";
      })
      .attr("stroke", (d: any) => {
        if (type === 'agent' && d.score > 0.8) return "#10b981";
        return "#f8fafc";
      })
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => onNodeClick?.(d as any))
      .call(d3.drag<SVGPathElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    const edgeLabel = type === 'knowledge' ? svg.append("g")
      .selectAll("text")
      .data(links)
      .enter().append("text")
      .attr("dy", -5)
      .attr("text-anchor", "middle")
      .attr("fill", "#475569")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .text((d: any) => d.type) : null;

    const label = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter().append("text")
      .attr("dy", (d: any) => type === 'agent' ? 45 : 35)
      .attr("text-anchor", "middle")
      .attr("fill", "#f8fafc")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .text((d: any) => d.label);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      if (edgeLabel) {
        edgeLabel
          .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
          .attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      }

      label
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, type, onNodeClick]);

  return (
    <div className="relative w-full h-full bg-[#0B0F1A] overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" />
    </div>
  );
};

export const DiscussionTimeline: React.FC<{ rounds: ConsensusRound[] }> = ({ rounds }) => {
  return (
    <div className="space-y-6 p-4">
      {rounds.map((round, idx) => {
        const prevRound = idx > 0 ? rounds[idx - 1] : null;
        
        return (
          <div key={round.round_number} className="relative pl-8 border-l border-white/10">
            <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,242,255,0.5)]" />
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ROUND_{round.round_number}</span>
              <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${
                round.consensus_status === 'reached' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-blue/20 text-neon-blue'
              }`}>
                {round.consensus_status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(round.agent_responses).map(([agentId, response]: [string, any]) => {
                const prevResponse = prevRound?.agent_responses[agentId];
                const hasChanged = prevResponse && prevResponse.answer !== response.answer;
                
                return (
                  <div 
                    key={agentId} 
                    className={`p-3 rounded-lg bg-white/5 border transition-all ${
                      hasChanged 
                        ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-white">{agentId}</span>
                      <span className="text-[10px] font-mono text-neon-blue">{(response.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-[11px] font-black text-neon-purple mb-1">{response.answer}</div>
                    <p className="text-[9px] text-slate-500 leading-tight">{response.reasoning}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
