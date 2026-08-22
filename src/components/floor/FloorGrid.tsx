"use client";

import React, { useEffect } from "react";
import { 
  CheckCircle2, 
  Skull, 
  Coins, 
  ShieldCheck, 
  Compass, 
  Sparkles, 
  Eye, 
  AlertTriangle, 
  User, 
  Footprints,
  ShieldAlert
} from "lucide-react";
import { FloorTile, FloorPlayer, FloorHint, FloorTileType } from "@/types/floor";

interface FloorGridProps {
  grid: FloorTile[];
  players: FloorPlayer[];
  myPlayer?: FloorPlayer;
  myDossier: FloorHint[];
  onMove: (tileId: string) => void;
  disabled?: boolean;
}

const TILE_STYLES: Record<FloorTileType, { bg: string; border: string; text: string; label: string; icon: any }> = {
  SAFE: { 
    bg: "bg-[#10B981]/15 hover:bg-[#10B981]/25", 
    border: "border-[#10B981]/40", 
    text: "text-[#10B981]", 
    label: "Safe", 
    icon: CheckCircle2 
  },
  TRAP: { 
    bg: "bg-[#F59E0B]/20 hover:bg-[#F59E0B]/30", 
    border: "border-[#F59E0B]/50", 
    text: "text-[#F59E0B]", 
    label: "Trap (-25 HP)", 
    icon: AlertTriangle 
  },
  INSTANT_DEATH: { 
    bg: "bg-[#EF4444]/25 hover:bg-[#EF4444]/35", 
    border: "border-[#EF4444]/60", 
    text: "text-[#EF4444]", 
    label: "Fatal Death", 
    icon: Skull 
  },
  TREASURE: { 
    bg: "bg-[#EAB308]/20 hover:bg-[#EAB308]/30", 
    border: "border-[#EAB308]/60 shadow-[0_0_20px_rgba(234,179,8,0.2)]", 
    text: "text-[#EAB308]", 
    label: "+0.05 MON", 
    icon: Coins 
  },
  TELEPORT: { 
    bg: "bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30", 
    border: "border-[#06B6D4]/50", 
    text: "text-[#06B6D4]", 
    label: "Vortex", 
    icon: Compass 
  },
  SHIELD: { 
    bg: "bg-[#3B82F6]/20 hover:bg-[#3B82F6]/30", 
    border: "border-[#3B82F6]/50", 
    text: "text-[#3B82F6]", 
    label: "Shield", 
    icon: ShieldCheck 
  },
  MYSTERY: { 
    bg: "bg-[#EC4899]/20 hover:bg-[#EC4899]/30", 
    border: "border-[#EC4899]/50", 
    text: "text-[#EC4899]", 
    label: "Mystery", 
    icon: Sparkles 
  },
};

export function FloorGrid({
  grid,
  players,
  myPlayer,
  myDossier,
  onMove,
  disabled = false,
}: FloorGridProps) {
  const myPos = myPlayer?.position || { x: 0, y: 0 };
  const isAlive = Boolean(myPlayer?.isAlive);

  // Check if tile (x, y) is adjacent to my current position
  const isAdjacent = (x: number, y: number) => {
    if (!isAlive || disabled) return false;
    const dx = Math.abs(x - myPos.x);
    const dy = Math.abs(y - myPos.y);
    return dx + dy === 1;
  };

  // Keyboard navigation support (WASD / Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAlive || disabled) return;
      // Do not trigger if typing in an input/textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      let targetX = myPos.x;
      let targetY = myPos.y;

      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") targetY -= 1;
      else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") targetY += 1;
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") targetX -= 1;
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") targetX += 1;
      else return;

      if (targetX >= 0 && targetX < 5 && targetY >= 0 && targetY < 5) {
        const col = String.fromCharCode(65 + targetX);
        const row = targetY + 1;
        onMove(`${col}${row}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAlive, disabled, myPos, onMove]);

  return (
    <div className="flex flex-col items-center">
      {/* Column Headers A-E */}
      <div className="grid grid-cols-5 gap-3 w-full max-w-[560px] mb-2 px-6">
        {["A", "B", "C", "D", "E"].map((col) => (
          <div key={col} className="text-center font-mono font-bold text-xs text-[#8A857B] uppercase tracking-wider">
            {col}
          </div>
        ))}
      </div>

      {/* 5x5 Grid Container */}
      <div className="grid grid-cols-5 gap-3 p-4 bg-[#0A0A0A] border-2 border-[#2C2C29] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative max-w-[560px] w-full aspect-square">
        {grid.map((tile) => {
          const adjacent = isAdjacent(tile.x, tile.y);
          const isMyTile = isAlive && myPos.x === tile.x && myPos.y === tile.y;
          const playersOnTile = players.filter((p) => p.isAlive && p.position.x === tile.x && p.position.y === tile.y);
          const hint = myDossier.find((h) => h.tileId === tile.id);

          const tileStyle = tile.type ? TILE_STYLES[tile.type] : null;
          const IconComponent = tileStyle?.icon;

          return (
            <button
              key={tile.id}
              onClick={() => adjacent && onMove(tile.id)}
              disabled={!adjacent || disabled}
              className={`relative rounded-xl border flex flex-col items-center justify-between p-2 transition-all duration-300 select-none overflow-hidden group
                ${tile.revealed && tileStyle ? `${tileStyle.bg} ${tileStyle.border}` : "bg-[#141413] border-[#242422] hover:border-[#3A3A36]"}
                ${adjacent ? "ring-2 ring-[#C15F3C] ring-offset-2 ring-offset-[#0A0A0A] cursor-pointer scale-[1.02] shadow-[0_0_15px_rgba(193,95,60,0.3)] animate-pulse" : ""}
                ${isMyTile ? "border-[#C15F3C] bg-[#C15F3C]/10 shadow-[0_0_25px_rgba(193,95,60,0.25)]" : ""}
              `}
            >
              {/* Tile Coordinate Label */}
              <div className="w-full flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#8A857B] opacity-75">
                  {tile.id}
                </span>

                {/* Secret Dossier Marker (if unrevealed but in private intel) */}
                {!tile.revealed && hint && (
                  <div 
                    title={`Confidential Intel: Perceived as ${hint.perceivedType} (${hint.confidence}% confidence)${hint.isNoise ? " - System Anomaly!" : ""}`}
                    className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-bold
                      ${hint.isNoise ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30" : "bg-[#836EF9]/20 text-[#836EF9] border border-[#836EF9]/30"}
                    `}
                  >
                    <Eye className="w-2.5 h-2.5" />
                    <span>{hint.perceivedType.slice(0, 1)}</span>
                  </div>
                )}
              </div>

              {/* Center Content: Revealed State or Fog */}
              <div className="flex-1 flex flex-col items-center justify-center my-1">
                {tile.revealed && tileStyle && IconComponent ? (
                  <div className="flex flex-col items-center gap-1 animate-in zoom-in-50 duration-300">
                    <IconComponent className={`w-5 h-5 ${tileStyle.text}`} />
                    <span className={`text-[9px] font-bold tracking-tight uppercase ${tileStyle.text}`}>
                      {tileStyle.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#2C2C29] group-hover:text-[#3A3A36] transition-colors">
                    {adjacent ? (
                      <Footprints className="w-5 h-5 text-[#C15F3C] animate-bounce" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-[#242422]" />
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Occupants / Avatar Pins */}
              <div className="w-full flex items-center justify-center gap-1 min-h-[16px]">
                {playersOnTile.map((p) => {
                  const isMe = myPlayer?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      title={`${p.displayName} (${p.address ? `${p.address.slice(0, 6)}...${p.address.slice(-4)}` : "Node"}) · ${p.hp} HP${p.hasShield ? " [Shield Active]" : ""}`}
                      className={`relative w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-xs font-mono
                        ${isMe ? "ring-2 ring-white scale-110 z-10" : ""}
                      `}
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.displayName.slice(0, 1)}
                      {p.hasShield && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#3B82F6] rounded-full ring-1 ring-black" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Directional Step Marker (on hover adjacent) */}
              {adjacent && (
                <div className="absolute inset-0 bg-[#C15F3C]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-[#F4F3EE] bg-[#0A0A0A]/90 px-1.5 py-0.5 rounded border border-[#C15F3C]">
                    STEP
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Keyboard Helper Indicator */}
      <div className="mt-3 flex items-center gap-2 text-[11px] text-[#8A857B] font-mono">
        <span className="px-1.5 py-0.5 bg-[#1E1E1C] border border-[#2C2C29] rounded text-[10px] text-[#B1ADA1]">WASD</span>
        <span>or</span>
        <span className="px-1.5 py-0.5 bg-[#1E1E1C] border border-[#2C2C29] rounded text-[10px] text-[#B1ADA1]">Arrow Keys</span>
        <span>to step orthogonally</span>
      </div>
    </div>
  );
}
