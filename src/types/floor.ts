// src/types/floor.ts

export type FloorTileType = 
  | "SAFE" 
  | "TRAP" 
  | "INSTANT_DEATH" 
  | "TREASURE" 
  | "TELEPORT" 
  | "SHIELD" 
  | "MYSTERY";

export interface FloorTile {
  id: string; // e.g. "A1", "C3", "E5"
  x: number;  // 0 to 4
  y: number;  // 0 to 4
  type: FloorTileType;
  revealed: boolean;
  revealedBy?: string; // player address or name
  hazardDamage?: number;
  treasureValue?: string; // e.g. "0.05 MON"
  mysteryEffect?: string;
  trapTriggered?: boolean;
}

export type BotPersonality = 
  | "HONEST_SCOUT" 
  | "DECEPTIVE_FOX" 
  | "CHAOTIC_TRICKSTER" 
  | "CAUTIOUS_SURVIVOR" 
  | "TREASURE_HUNTER";

export interface FloorPlayer {
  id: string;
  address: string;
  displayName: string;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  isGhost: boolean;
  hasShield: boolean;
  position: { x: number; y: number }; // coordinate 0-4
  score: number;
  trustScore: number; // 0 to 100
  claimsCount: number;
  truthfulClaims: number;
  betrayalsCount: number;
  treasuresCollected: number;
  ghostMessageUsed: boolean;
  avatarColor: string;
  isBot: boolean;
  botPersonality?: BotPersonality;
  joinedAt: string;
  lastActiveAt: string;
}

export interface FloorHint {
  tileId: string;
  x: number;
  y: number;
  perceivedType: FloorTileType;
  confidence: number; // e.g. 100% or 60% if noisy
  isNoise?: boolean; // System lied to player!
  note?: string;
}

export type FloorActionType = 
  | "MOVE" 
  | "CLAIM" 
  | "WHISPER" 
  | "ASK_HUMAN" 
  | "ANSWER_HUMAN" 
  | "GHOST_BROADCAST";

export interface FloorAction {
  type: FloorActionType;
  playerId: string;
  targetTileId?: string;
  targetPlayerId?: string;
  claimedType?: FloorTileType;
  messageText?: string;
  bountyAmount?: string;
}

export type MessageType = 
  | "PUBLIC" 
  | "WHISPER" 
  | "CLAIM" 
  | "BETRAYAL" 
  | "GHOST" 
  | "SYSTEM" 
  | "ASK_HUMAN"
  | "EVENT";

export interface FloorMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor?: string;
  type: MessageType;
  text: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  tileId?: string;
  claimedType?: FloorTileType;
  timestamp: string;
}

export interface GraveyardEntry {
  id: string;
  playerId: string;
  playerName: string;
  playerAddress: string;
  tileId: string;
  causeOfDeath: string;
  lastWords: string;
  eliminatedAt: string;
}

export interface AskHumanQuery {
  id: string;
  requesterId: string;
  requesterName: string;
  targetPlayerId?: string; // empty if public swarm query
  targetPlayerName?: string;
  tileId: string;
  bountyAmount: string;
  status: "OPEN" | "ANSWERED" | "EXPIRED";
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  createdAt: string;
}

export type GameStatus = "LOBBY" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface FloorGame {
  id: string;
  title: string;
  status: GameStatus;
  round: number;
  maxRounds: number;
  turnDurationSeconds: number;
  turnEndsAt: string;
  maxPlayers: number;
  gridSize: number; // usually 5 (5x5)
  grid: FloorTile[];
  players: FloorPlayer[];
  playerDossiers: Record<string, FloorHint[]>; // playerId -> list of private hints
  messages: FloorMessage[];
  graveyard: GraveyardEntry[];
  humanQueries: AskHumanQuery[];
  creatorAddress: string;
  bountyMon: string;
  isPrivate: boolean;
  roomCode?: string;
  mode?: "LIVE" | "SIMULATION";
  isDemo?: boolean;
  winnerId?: string;
  winnerName?: string;
  winningRewardMon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilteredFloorGame {
  id: string;
  title: string;
  status: GameStatus;
  round: number;
  maxRounds: number;
  turnDurationSeconds: number;
  turnEndsAt: string;
  maxPlayers: number;
  gridSize: number;
  grid: (Omit<FloorTile, "type"> & { type?: FloorTileType })[]; // hidden if not revealed!
  players: FloorPlayer[];
  myDossier: FloorHint[];
  myPlayer?: FloorPlayer;
  messages: FloorMessage[];
  graveyard: GraveyardEntry[];
  humanQueries: AskHumanQuery[];
  creatorAddress: string;
  bountyMon: string;
  isPrivate: boolean;
  roomCode?: string;
  mode?: "LIVE" | "SIMULATION";
  isDemo?: boolean;
  winnerId?: string;
  winnerName?: string;
  winningRewardMon?: string;
  createdAt: string;
  updatedAt: string;
}
