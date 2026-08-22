import React from "react";
import { BaseEdge, getBezierPath, EdgeProps } from "@xyflow/react";

export function DataFlowEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.active;
  const isComplete = data?.complete;
  const hasError = data?.error;

  let strokeColor = "#3A3A36"; // default idle
  if (isActive) strokeColor = "#3B82F6";
  if (isComplete) strokeColor = "#10B981";
  if (hasError) strokeColor = "#EF4444";

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, stroke: strokeColor, strokeWidth: isActive ? 2 : 1 }} 
      />
      {isActive && (
        <circle r="4" fill="#F4F3EE" className="drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">
          <animateMotion 
            dur="2s" 
            repeatCount="indefinite" 
            path={edgePath} 
          />
        </circle>
      )}
      {isActive && (
        <circle r="2" fill="#3B82F6" className="drop-shadow-[0_0_8px_rgba(59,130,246,1)]">
          <animateMotion 
            dur="2s" 
            repeatCount="indefinite" 
            path={edgePath} 
            begin="-0.2s"
          />
        </circle>
      )}
    </>
  );
}
