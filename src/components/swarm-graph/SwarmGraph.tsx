"use client";

import React, { useMemo, useEffect, useCallback } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TaskNode } from "./nodes/TaskNode";
import { DispatcherNode } from "./nodes/DispatcherNode";
import { HumanNode } from "./nodes/HumanNode";
import { AggregatorNode } from "./nodes/AggregatorNode";
import { AIVerifyNode } from "./nodes/AIVerifyNode";
import { ConsensusNode } from "./nodes/ConsensusNode";
import { PaymentNode } from "./nodes/PaymentNode";
import { DataFlowEdge } from "./edges/DataFlowEdge";
import type { SwarmTask, SwarmSubmission } from "@/types/swarm";

const nodeTypes = {
  task: TaskNode,
  dispatcher: DispatcherNode,
  human: HumanNode,
  aggregator: AggregatorNode,
  aiVerify: AIVerifyNode,
  consensus: ConsensusNode,
  payment: PaymentNode,
};

const edgeTypes = {
  dataFlow: DataFlowEdge,
};

interface SwarmGraphProps {
  task: SwarmTask | null;
  submissions: SwarmSubmission[];
  onNodeClick?: (node: Node) => void;
}

export function SwarmGraph({ task, submissions, onNodeClick }: SwarmGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Generate nodes and edges whenever task or submissions change
  useEffect(() => {
    if (!task) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    const isTaskActive = task.status !== "COMPLETED" && task.status !== "CANCELLED";
    
    // 1. Task Node
    newNodes.push({
      id: "task",
      type: "task",
      position: { x: 400, y: 50 },
      data: {
        title: task.title,
        reward: (Number(BigInt(task.rewardWeiPerWorker)) / 1e18).toFixed(4),
        category: task.category,
        requirements: task.requirements
      }
    });

    // 2. Dispatcher Node
    newNodes.push({
      id: "dispatcher",
      type: "dispatcher",
      position: { x: 450, y: 250 },
      data: {
        maxWorkers: task.maxWorkers,
        currentWorkers: submissions.length,
        status: task.status
      }
    });

    newEdges.push({
      id: "e-task-dispatcher",
      source: "task",
      target: "dispatcher",
      type: "dataFlow",
      data: { active: isTaskActive },
      animated: isTaskActive,
    });

    // 3. Human Nodes
    const startX = 100;
    const spacingX = 250;
    
    submissions.forEach((sub, i) => {
      const hId = `human-${sub.id}`;
      newNodes.push({
        id: hId,
        type: "human",
        position: { x: startX + (i * spacingX), y: 450 },
        data: {
          address: sub.workerAddress,
          status: sub.status,
          submissionId: sub.id
        }
      });

      // Edge: Dispatcher -> Human
      newEdges.push({
        id: `e-disp-${hId}`,
        source: "dispatcher",
        target: hId,
        type: "dataFlow",
        data: { active: sub.status === "EXECUTING" || sub.status === "SUBMITTED" },
        animated: true,
      });

      // Edge: Human -> Aggregator (Only if submitted or beyond)
      if (sub.status !== "EXECUTING") {
        newEdges.push({
          id: `e-${hId}-agg`,
          source: hId,
          target: "aggregator",
          type: "dataFlow",
          data: { 
            active: sub.status === "SUBMITTED",
            complete: sub.status === "VERIFIED" || sub.status === "PAID_OUT",
            error: sub.status === "REJECTED" || sub.status === "FLAGGED"
          },
          animated: sub.status === "SUBMITTED",
        });
      }
    });

    // 4. Aggregator Node
    const submittedCount = submissions.filter(s => s.status !== "EXECUTING").length;
    newNodes.push({
      id: "aggregator",
      type: "aggregator",
      position: { x: 450, y: 650 },
      data: {
        receivedCount: submittedCount,
        expectedCount: task.maxWorkers
      }
    });

    // 5. AI Verify Node
    const hasReport = !!task.clusterReport;
    const isAiProcessing = task.status === "IN_PROGRESS" && submittedCount > 0 && !hasReport;
    newNodes.push({
      id: "aiVerify",
      type: "aiVerify",
      position: { x: 430, y: 850 },
      data: {
        isProcessing: isAiProcessing,
        confidence: task.clusterReport?.confidence || 0,
        status: hasReport ? "COMPLETED" : "WAITING"
      }
    });

    newEdges.push({
      id: "e-agg-ai",
      source: "aggregator",
      target: "aiVerify",
      type: "dataFlow",
      data: { active: isAiProcessing || (submittedCount > 0 && !hasReport) },
      animated: true
    });

    // 6. Consensus Node
    const verifiedCount = submissions.filter(s => s.status === "VERIFIED" || s.status === "PAID_OUT").length;
    const consensusReached = verifiedCount > 0 && task.status === "COMPLETED";
    newNodes.push({
      id: "consensus",
      type: "consensus",
      position: { x: 440, y: 1050 },
      data: {
        agreementScore: task.clusterReport?.consensusScore || 0,
        isReached: consensusReached,
        status: hasReport ? "VERIFYING" : "WAITING"
      }
    });

    newEdges.push({
      id: "e-ai-cons",
      source: "aiVerify",
      target: "consensus",
      type: "dataFlow",
      data: { active: hasReport && !consensusReached, complete: consensusReached },
      animated: hasReport
    });

    // 7. Payment Node
    const paidOutCount = submissions.filter(s => s.status === "PAID_OUT").length;
    const isPayingOut = task.status === "COMPLETED" && paidOutCount < verifiedCount;
    newNodes.push({
      id: "payment",
      type: "payment",
      position: { x: 420, y: 1250 },
      data: {
        totalPayout: (paidOutCount * (Number(BigInt(task.rewardWeiPerWorker)) / 1e18)).toFixed(4),
        recipientsCount: paidOutCount,
        status: isPayingOut ? "PROCESSING" : (paidOutCount > 0 && paidOutCount === verifiedCount ? "SETTLED" : "WAITING")
      }
    });

    newEdges.push({
      id: "e-cons-pay",
      source: "consensus",
      target: "payment",
      type: "dataFlow",
      data: { active: isPayingOut, complete: paidOutCount > 0 && paidOutCount === verifiedCount },
      animated: isPayingOut
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [task, submissions, setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  return (
    <div className="w-full h-full bg-[#0A0A0A]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        className="dark"
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={24} 
          size={2} 
          color="#2C2C29" 
        />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'task': return '#C15F3C';
              case 'dispatcher': return '#3B82F6';
              case 'human': return '#8A857B';
              case 'aggregator': return '#836EF9';
              case 'aiVerify': return '#10B981';
              case 'consensus': return '#F59E0B';
              case 'payment': return '#F4F3EE';
              default: return '#3A3A36';
            }
          }}
          maskColor="rgba(10, 10, 10, 0.7)"
          className="bg-[#121211] border border-[#2C2C29] rounded-xl overflow-hidden shadow-2xl"
          style={{ bottom: 20, right: 20 }}
        />
        <Controls className="bg-[#121211] border border-[#2C2C29] fill-[#F4F3EE] rounded-lg overflow-hidden" />
      </ReactFlow>
    </div>
  );
}
