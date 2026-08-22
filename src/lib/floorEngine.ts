// src/lib/floorEngine.ts
import { 
  FloorGame, 
  FloorTile, 
  FloorTileType, 
  FloorPlayer, 
  FloorHint, 
  FloorAction, 
  FloorMessage, 
  GraveyardEntry, 
  FilteredFloorGame,
  BotPersonality 
} from "@/types/floor";

const NODE_PROFILES: { name: string; address: string; personality: BotPersonality; color: string }[] = [
  { name: "monad_node_7.eth", address: "0x71a4f89d38c24190ea472890b0e5124119d3c92b", personality: "HONEST_SCOUT", color: "#3B82F6" },
  { name: "cipher_validator", address: "0x3e82a9012f45bdc823019823485012351239b1f4", personality: "DECEPTIVE_FOX", color: "#EF4444" },
  { name: "apex_oracle.monad", address: "0x9d11425890b123984501248901234908123448a2", personality: "CHAOTIC_TRICKSTER", color: "#F59E0B" },
  { name: "zk_sentinel", address: "0x5c4289014523980124589012348901234890e817", personality: "CAUTIOUS_SURVIVOR", color: "#10B981" },
  { name: "phantom_runner", address: "0xb823490128459012348901234890123489013f90", personality: "TREASURE_HUNTER", color: "#8B5CF6" },
  { name: "helios_node_04", address: "0x2a94589012348901234890123489012348901c88", personality: "HONEST_SCOUT", color: "#06B6D4" },
  { name: "solaris_vault", address: "0x6f31890123489012348901234890123489019e04", personality: "DECEPTIVE_FOX", color: "#F43F5E" },
];

const LAST_WORDS_TEMPLATES = [
  "\"Packet broadcast was compromised. Coordinate hazardous.\"",
  "\"Oracle feed was spoofed... the floor is lying!\"",
  "\"Greed over protocol safety. Reverting state...\"",
  "\"Consensus anomaly detected. Ghost beacon active.\"",
  "\"Step verified by node cipher_validator was false. Betrayal confirmed.\"",
  "\"Sensor drift caused fatal misstep. Node offline.\"",
  "\"Shield expired right before fatal shockwave.\"",
];

export function coordinateToId(x: number, y: number): string {
  const col = String.fromCharCode(65 + x); // 0 -> A, 1 -> B ...
  const row = y + 1; // 0 -> 1, 1 -> 2 ...
  return `${col}${row}`;
}

export function idToCoordinate(id: string): { x: number; y: number } {
  const col = id.charAt(0).toUpperCase().charCodeAt(0) - 65;
  const row = parseInt(id.slice(1), 10) - 1;
  return { x: col, y: row };
}

export function generateFloorGrid(gridSize = 5): FloorTile[] {
  const tiles: FloorTile[] = [];
  
  // 5x5 = 25 tiles
  // Distribution:
  // 12 SAFE
  // 5 TRAP (25 dmg)
  // 2 INSTANT_DEATH
  // 3 TREASURE
  // 1 TELEPORT
  // 1 SHIELD
  // 1 MYSTERY
  const pool: FloorTileType[] = [
    "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE", "SAFE",
    "TRAP", "TRAP", "TRAP", "TRAP", "TRAP",
    "INSTANT_DEATH", "INSTANT_DEATH",
    "TREASURE", "TREASURE", "TREASURE",
    "TELEPORT",
    "SHIELD",
    "MYSTERY"
  ];

  // Shuffle pool (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let index = 0;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const id = coordinateToId(x, y);
      let type = pool[index++];

      // Ensure starting corners (A1, E1, A5, E5) are safe to prevent immediate spawn deaths
      if ((x === 0 && y === 0) || (x === gridSize - 1 && y === 0) || 
          (x === 0 && y === gridSize - 1) || (x === gridSize - 1 && y === gridSize - 1)) {
        type = "SAFE";
      }

      tiles.push({
        id,
        x,
        y,
        type,
        revealed: (x === 0 && y === 0), // Spawn tile is revealed
        hazardDamage: type === "TRAP" ? 25 : type === "INSTANT_DEATH" ? 100 : 0,
        treasureValue: type === "TREASURE" ? "0.05 MON" : undefined,
        mysteryEffect: type === "MYSTERY" ? "SURPRISE" : undefined,
      });
    }
  }

  return tiles;
}

export function generatePlayerDossiers(grid: FloorTile[], players: FloorPlayer[]): Record<string, FloorHint[]> {
  const dossiers: Record<string, FloorHint[]> = {};

  for (const player of players) {
    const hints: FloorHint[] = [];
    // Give each player 4 to 6 random hints
    const hintCount = 5;
    const shuffledTiles = [...grid].sort(() => Math.random() - 0.5);
    const selected = shuffledTiles.slice(0, hintCount);

    for (const tile of selected) {
      // 15% chance of system glitch / noise (The floor is lying!)
      const isNoise = Math.random() < 0.15;
      let perceivedType = tile.type;

      if (isNoise) {
        // Invert hazard or safe
        if (tile.type === "TRAP" || tile.type === "INSTANT_DEATH") {
          perceivedType = "SAFE";
        } else if (tile.type === "SAFE") {
          perceivedType = "TRAP";
        } else {
          perceivedType = "SAFE";
        }
      }

      hints.push({
        tileId: tile.id,
        x: tile.x,
        y: tile.y,
        perceivedType,
        confidence: isNoise ? 70 : 100,
        isNoise,
        note: isNoise ? "⚠️ Signal fluctuating: High anomaly index" : "Verified sensor scan"
      });
    }

    dossiers[player.id] = hints;
  }

  return dossiers;
}

export function createFloorGame(creatorAddress: string, title?: string, isPrivate = false, roomCode?: string): FloorGame {
  const gameId = `floor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const grid = generateFloorGrid(5);

  const creatorPlayer: FloorPlayer = {
    id: `player_creator_${creatorAddress.substring(0, 6)}`,
    address: creatorAddress.toLowerCase(),
    displayName: `${creatorAddress.substring(0, 6)}...${creatorAddress.slice(-4)}`,
    hp: 100,
    maxHp: 100,
    isAlive: true,
    isGhost: false,
    hasShield: false,
    position: { x: 0, y: 0 },
    score: 0,
    trustScore: 80,
    claimsCount: 0,
    truthfulClaims: 0,
    betrayalsCount: 0,
    treasuresCollected: 0,
    ghostMessageUsed: false,
    avatarColor: "#C15F3C",
    isBot: false,
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  const players: FloorPlayer[] = [creatorPlayer];

  // Populate remaining 7 slots with AI Bot Agents with varied deception/truth personalities
  const spawnCoordinates = [
    { x: 4, y: 0 }, // E1
    { x: 0, y: 4 }, // A5
    { x: 4, y: 4 }, // E5
    { x: 2, y: 0 }, // C1
    { x: 0, y: 2 }, // A3
    { x: 4, y: 2 }, // E3
    { x: 2, y: 4 }, // C5
  ];

  for (let i = 0; i < NODE_PROFILES.length; i++) {
    const bot = NODE_PROFILES[i];
    const spawn = spawnCoordinates[i % spawnCoordinates.length];
    players.push({
      id: `bot_${i}_${bot.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      address: bot.address,
      displayName: bot.name,
      hp: 100,
      maxHp: 100,
      isAlive: true,
      isGhost: false,
      hasShield: false,
      position: spawn,
      score: 0,
      trustScore: bot.personality === "HONEST_SCOUT" ? 90 : bot.personality === "DECEPTIVE_FOX" ? 65 : 75,
      claimsCount: 0,
      truthfulClaims: 0,
      betrayalsCount: 0,
      treasuresCollected: 0,
      ghostMessageUsed: false,
      avatarColor: bot.color,
      isBot: true,
      botPersonality: bot.personality,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  }

  const playerDossiers = generatePlayerDossiers(grid, players);

  const initialMessages: FloorMessage[] = [
    {
      id: `msg_${Date.now()}_sys1`,
      senderId: "SYSTEM",
      senderName: "AI Oracle",
      senderColor: "#836EF9",
      type: "SYSTEM",
      text: "⚡ Welcome to THE FLOOR IS LYING. 8 Nodes entered the 5x5 grid. Some tiles are deadly traps, others hold MON treasure. Nobody has complete information. Trust carefully!",
      timestamp: new Date().toISOString(),
    },
    {
      id: `msg_${Date.now()}_sys2`,
      senderId: "SYSTEM",
      senderName: "AI Oracle",
      senderColor: "#836EF9",
      type: "SYSTEM",
      text: "⚠️ WARNING: Sensor noise detected. 15% of private hints may be simulated deceptions. Use 'Ask Human' or team consensus to cross-verify coordinates.",
      timestamp: new Date().toISOString(),
    }
  ];

  return {
    id: gameId,
    title: title || "Monad Grid Survival Arena",
    status: "IN_PROGRESS",
    round: 1,
    maxRounds: 4,
    turnDurationSeconds: 45,
    turnEndsAt: new Date(Date.now() + 45000).toISOString(),
    maxPlayers: 8,
    gridSize: 5,
    grid,
    players,
    playerDossiers,
    messages: initialMessages,
    graveyard: [],
    humanQueries: [],
    creatorAddress: creatorAddress.toLowerCase(),
    bountyMon: "0.25 MON",
    isPrivate,
    mode: "SIMULATION",
    isDemo: false,
    roomCode: roomCode || (isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function executePlayerAction(game: FloorGame, action: FloorAction): { success: boolean; message: string; game: FloorGame } {
  const player = game.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, message: "Player not found in this match", game };
  }

  const timestamp = new Date().toISOString();
  player.lastActiveAt = timestamp;

  if (action.type === "MOVE") {
    if (!player.isAlive) {
      return { success: false, message: "Eliminated players cannot move (Ghost state active)", game };
    }

    if (!action.targetTileId) {
      return { success: false, message: "Target tile required for MOVE", game };
    }

    const targetCoord = idToCoordinate(action.targetTileId);
    // Validate orthogonal adjacency (dx + dy === 1)
    const dx = Math.abs(targetCoord.x - player.position.x);
    const dy = Math.abs(targetCoord.y - player.position.y);

    if (dx + dy !== 1) {
      return { success: false, message: "Can only move 1 tile orthogonally (Up, Down, Left, Right)", game };
    }

    // Move player
    player.position = targetCoord;
    const tile = game.grid.find(t => t.id === action.targetTileId);
    if (!tile) {
      return { success: false, message: "Invalid tile coordinate", game };
    }

    tile.revealed = true;
    tile.revealedBy = player.displayName;

    let eventText = "";

    // Check previous claims made by other players on this tile to adjust their trust scores
    const previousClaims = game.messages.filter(m => m.type === "CLAIM" && m.tileId === tile.id && m.senderId !== player.id);
    for (const claim of previousClaims) {
      const claimer = game.players.find(p => p.id === claim.senderId);
      if (claimer) {
        claimer.claimsCount += 1;
        const claimedSafe = claim.claimedType === "SAFE";
        const actuallySafe = tile.type === "SAFE" || tile.type === "TREASURE" || tile.type === "SHIELD";

        if ((claimedSafe && actuallySafe) || (!claimedSafe && !actuallySafe)) {
          // Truthful claim!
          claimer.truthfulClaims += 1;
          claimer.trustScore = Math.min(100, claimer.trustScore + 15);
          claimer.score += 30;
          game.messages.push({
            id: `msg_${Date.now()}_ver_${Math.random()}`,
            senderId: "SYSTEM",
            senderName: "Trust Oracle",
            type: "EVENT",
            text: `✅ VERIFIED INTEL: ${claimer.displayName}'s claim on ${tile.id} was ACCURATE. Trust increased to ${claimer.trustScore}%!`,
            timestamp,
          });
        } else {
          // Betrayal / Lie!
          claimer.betrayalsCount += 1;
          claimer.trustScore = Math.max(0, claimer.trustScore - 25);
          game.messages.push({
            id: `msg_${Date.now()}_bet_${Math.random()}`,
            senderId: "SYSTEM",
            senderName: "Trust Oracle",
            type: "BETRAYAL",
            text: `🚨 BETRAYAL DETECTED! ${claimer.displayName} claimed ${tile.id} was ${claim.claimedType}, but it was ${tile.type}! Trust plummeted to ${claimer.trustScore}%.`,
            timestamp,
          });
        }
      }
    }

    // Resolve tile hazard/reward effects
    if (tile.type === "SAFE") {
      player.score += 20;
      eventText = `${player.displayName} stepped on ${tile.id} (SAFE). +20 PTS`;
    } else if (tile.type === "TRAP") {
      tile.trapTriggered = true;
      if (player.hasShield) {
        player.hasShield = false;
        player.score += 15;
        eventText = `🛡️ ${player.displayName}'s SHIELD absorbed the TRAP on ${tile.id}! (0 HP Lost)`;
      } else {
        player.hp = Math.max(0, player.hp - 25);
        eventText = `💀 ${player.displayName} triggered a TRAP on ${tile.id}! (-25 HP, remaining: ${player.hp} HP)`;
      }
    } else if (tile.type === "INSTANT_DEATH") {
      tile.trapTriggered = true;
      if (player.hasShield) {
        player.hasShield = false;
        player.hp = Math.max(10, player.hp - 50);
        eventText = `🛡️ ${player.displayName}'s SHIELD shattered against INSTANT DEATH on ${tile.id}! Left with ${player.hp} HP!`;
      } else {
        player.hp = 0;
        eventText = `☠️ INSTANT DEATH! ${player.displayName} stepped on ${tile.id} and was vaporized!`;
      }
    } else if (tile.type === "TREASURE") {
      player.score += 80;
      player.treasuresCollected += 1;
      eventText = `💰 TREASURE CLAIMED! ${player.displayName} found 0.05 MON on ${tile.id}! (+80 PTS)`;
    } else if (tile.type === "SHIELD") {
      player.hasShield = true;
      player.score += 25;
      eventText = `🛡️ ${player.displayName} acquired an ENERGY SHIELD on ${tile.id}!`;
    } else if (tile.type === "TELEPORT") {
      // Teleport to random non-deadly tile
      const randomTile = game.grid[Math.floor(Math.random() * game.grid.length)];
      player.position = { x: randomTile.x, y: randomTile.y };
      randomTile.revealed = true;
      player.score += 15;
      eventText = `🌀 TELEPORT VORTEX! ${player.displayName} stepped on ${tile.id} and warped across the matrix to ${randomTile.id}!`;
    } else if (tile.type === "MYSTERY") {
      // Heal or reveal
      player.hp = Math.min(player.maxHp, player.hp + 30);
      player.score += 30;
      eventText = `❓ MYSTERY BOX on ${tile.id} activated! ${player.displayName} restored +30 HP and gained +30 PTS!`;
    }

    // Check if player died
    if (player.hp <= 0 && player.isAlive) {
      player.isAlive = false;
      player.isGhost = true;

      const randomLastWords = LAST_WORDS_TEMPLATES[Math.floor(Math.random() * LAST_WORDS_TEMPLATES.length)];
      const graveyardEntry: GraveyardEntry = {
        id: `grave_${Date.now()}_${player.id}`,
        playerId: player.id,
        playerName: player.displayName,
        playerAddress: player.address,
        tileId: tile.id,
        causeOfDeath: tile.type,
        lastWords: randomLastWords,
        eliminatedAt: timestamp,
      };

      game.graveyard.unshift(graveyardEntry);
      game.messages.push({
        id: `msg_${Date.now()}_grave`,
        senderId: "SYSTEM",
        senderName: "Graveyard Reaper",
        type: "EVENT",
        text: `🪦 FALLEN NODE: ${player.displayName} died on ${tile.id} (${tile.type}). Last words: ${randomLastWords}`,
        timestamp,
      });
    }

    game.messages.push({
      id: `msg_${Date.now()}_move_${Math.random()}`,
      senderId: player.id,
      senderName: player.displayName,
      senderColor: player.avatarColor,
      type: "EVENT",
      text: eventText,
      timestamp,
    });

    // Check game victory condition
    const alivePlayers = game.players.filter(p => p.isAlive);
    if (alivePlayers.length <= 1) {
      game.status = "COMPLETED";
      const winner = alivePlayers[0] || game.players.sort((a, b) => b.score - a.score)[0];
      game.winnerId = winner.id;
      game.winnerName = winner.displayName;
      game.winningRewardMon = game.bountyMon;
      winner.score += 150; // Survival winner bonus

      game.messages.push({
        id: `msg_${Date.now()}_win`,
        senderId: "SYSTEM",
        senderName: "Victory Herald",
        type: "EVENT",
        text: `🏆 MATCH TERMINATED! ${winner.displayName} is the SOLE SURVIVOR of THE FLOOR IS LYING! Claimed reward: ${game.bountyMon}!`,
        timestamp,
      });
    }

    game.updatedAt = timestamp;
    return { success: true, message: eventText, game };
  }

  if (action.type === "CLAIM") {
    if (!action.targetTileId || !action.claimedType) {
      return { success: false, message: "Tile ID and Claimed Type required", game };
    }

    const text = `${player.displayName} announced: "${action.targetTileId} is ${action.claimedType}." ${action.messageText ? `("${action.messageText}")` : ""}`;
    game.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_claim`,
      senderId: player.id,
      senderName: player.displayName,
      senderColor: player.avatarColor,
      type: "CLAIM",
      tileId: action.targetTileId,
      claimedType: action.claimedType,
      text,
      timestamp,
    });

    game.updatedAt = timestamp;
    return { success: true, message: "Claim broadcasted", game };
  }

  if (action.type === "WHISPER") {
    if (!action.targetPlayerId || !action.messageText) {
      return { success: false, message: "Target player and message text required", game };
    }

    const target = game.players.find(p => p.id === action.targetPlayerId);
    game.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_whisper`,
      senderId: player.id,
      senderName: player.displayName,
      senderColor: player.avatarColor,
      targetPlayerId: action.targetPlayerId,
      targetPlayerName: target?.displayName || "Player",
      type: "WHISPER",
      text: `[Secret Whisper] ${action.messageText}`,
      timestamp,
    });

    game.updatedAt = timestamp;
    return { success: true, message: "Whisper transmitted", game };
  }

  if (action.type === "ASK_HUMAN") {
    if (!action.targetTileId) {
      return { success: false, message: "Target tile ID required for query", game };
    }

    const target = action.targetPlayerId ? game.players.find(p => p.id === action.targetPlayerId) : undefined;
    const query = {
      id: `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      requesterId: player.id,
      requesterName: player.displayName,
      targetPlayerId: action.targetPlayerId,
      targetPlayerName: target?.displayName,
      tileId: action.targetTileId,
      bountyAmount: action.bountyAmount || "0.01 MON",
      status: "OPEN" as const,
      createdAt: timestamp,
    };

    game.humanQueries.unshift(query);
    game.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_query`,
      senderId: player.id,
      senderName: player.displayName,
      senderColor: player.avatarColor,
      type: "ASK_HUMAN",
      text: `⚡ HUMAN API QUERY: ${player.displayName} offers ${query.bountyAmount} to know: "Is tile ${action.targetTileId} SAFE?"`,
      timestamp,
    });

    game.updatedAt = timestamp;
    return { success: true, message: "Human API query submitted", game };
  }

  if (action.type === "ANSWER_HUMAN") {
    if (!action.targetTileId || !action.messageText) {
      return { success: false, message: "Query target and answer required", game };
    }

    const query = game.humanQueries.find(q => q.tileId === action.targetTileId && q.status === "OPEN");
    if (query) {
      query.status = "ANSWERED";
      query.answer = action.messageText;
      query.answeredBy = player.displayName;
      query.answeredAt = timestamp;
    }

    player.score += 25; // Reward for answering query
    game.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_ans`,
      senderId: player.id,
      senderName: player.displayName,
      senderColor: player.avatarColor,
      type: "ASK_HUMAN",
      text: `💬 ${player.displayName} answered Human API query for ${action.targetTileId}: "${action.messageText}" (Earned query bounty!)`,
      timestamp,
    });

    game.updatedAt = timestamp;
    return { success: true, message: "Query answered", game };
  }

  if (action.type === "GHOST_BROADCAST") {
    if (!player.isGhost) {
      return { success: false, message: "Only eliminated Ghost players can cast Ghost Transmissions", game };
    }
    if (player.ghostMessageUsed) {
      return { success: false, message: "You have already cast your 1 anonymous Ghost Transmission", game };
    }

    player.ghostMessageUsed = true;
    game.messages.push({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_ghost`,
      senderId: "GHOST_REALM",
      senderName: "👻 Anonymous Ghost",
      senderColor: "#94A3B8",
      type: "GHOST",
      text: `👻 GHOST TRANSMISSION FROM BEYOND: "${action.messageText || "Beware the deceiver among you..."}"`,
      timestamp,
    });

    game.updatedAt = timestamp;
    return { success: true, message: "Ghost transmission sent", game };
  }

  return { success: false, message: "Unknown action type", game };
}

export function simulateBotTurns(game: FloorGame): FloorGame {
  if (game.status !== "IN_PROGRESS") return game;

  const aliveBots = game.players.filter(p => p.isBot && p.isAlive);
  if (aliveBots.length === 0) return game;

  // Pick 1-2 alive bots to take an action this tick
  const activeBots = aliveBots.sort(() => Math.random() - 0.5).slice(0, 2);

  for (const bot of activeBots) {
    const dossier = game.playerDossiers[bot.id] || [];
    const validMoves = [
      { x: bot.position.x + 1, y: bot.position.y },
      { x: bot.position.x - 1, y: bot.position.y },
      { x: bot.position.x, y: bot.position.y + 1 },
      { x: bot.position.x, y: bot.position.y - 1 },
    ].filter(pos => pos.x >= 0 && pos.x < 5 && pos.y >= 0 && pos.y < 5);

    if (validMoves.length === 0) continue;

    // AI decision behavior based on personality
    if (bot.botPersonality === "HONEST_SCOUT") {
      // 30% chance to broadcast a truthful hint
      if (Math.random() < 0.3 && dossier.length > 0) {
        const hint = dossier[Math.floor(Math.random() * dossier.length)];
        executePlayerAction(game, {
          type: "CLAIM",
          playerId: bot.id,
          targetTileId: hint.tileId,
          claimedType: hint.perceivedType,
          messageText: "Scouted this tile earlier, sharing with the room.",
        });
      }
      // Move to perceived safe tile if available
      const safeMove = validMoves.find(m => {
        const id = coordinateToId(m.x, m.y);
        const hint = dossier.find(h => h.tileId === id);
        return hint && hint.perceivedType === "SAFE";
      }) || validMoves[Math.floor(Math.random() * validMoves.length)];

      executePlayerAction(game, {
        type: "MOVE",
        playerId: bot.id,
        targetTileId: coordinateToId(safeMove.x, safeMove.y),
      });
    } else if (bot.botPersonality === "DECEPTIVE_FOX") {
      // 40% chance to bluff / lie about a dangerous tile being SAFE
      if (Math.random() < 0.4 && dossier.length > 0) {
        const trapHint = dossier.find(h => h.perceivedType === "TRAP" || h.perceivedType === "INSTANT_DEATH");
        if (trapHint) {
          executePlayerAction(game, {
            type: "CLAIM",
            playerId: bot.id,
            targetTileId: trapHint.tileId,
            claimedType: "SAFE",
            messageText: "I verified this coordinate, completely clear to step!",
          });
        }
      }
      // Move randomly avoiding known traps
      const targetMove = validMoves.find(m => {
        const id = coordinateToId(m.x, m.y);
        const hint = dossier.find(h => h.tileId === id);
        return !hint || hint.perceivedType !== "TRAP";
      }) || validMoves[0];

      executePlayerAction(game, {
        type: "MOVE",
        playerId: bot.id,
        targetTileId: coordinateToId(targetMove.x, targetMove.y),
      });
    } else {
      // Default survivor movement
      const chosenMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      executePlayerAction(game, {
        type: "MOVE",
        playerId: bot.id,
        targetTileId: coordinateToId(chosenMove.x, chosenMove.y),
      });
    }
  }

  return game;
}

export function filterGameForPlayer(game: FloorGame, userAddress?: string): FilteredFloorGame {
  const normAddress = userAddress?.toLowerCase();
  const myPlayer = normAddress ? game.players.find(p => p.address === normAddress) : undefined;
  const myDossier = myPlayer ? game.playerDossiers[myPlayer.id] || [] : [];

  // Filter grid: hide unrevealed tile types unless already revealed
  const filteredGrid = game.grid.map(tile => {
    if (tile.revealed) {
      return tile;
    }
    return {
      id: tile.id,
      x: tile.x,
      y: tile.y,
      revealed: false,
      trapTriggered: tile.trapTriggered,
      hazardDamage: undefined,
      treasureValue: undefined,
      mysteryEffect: undefined,
      // Hide type!
    };
  });

  return {
    id: game.id,
    title: game.title,
    status: game.status,
    round: game.round,
    maxRounds: game.maxRounds,
    turnDurationSeconds: game.turnDurationSeconds,
    turnEndsAt: game.turnEndsAt,
    maxPlayers: game.maxPlayers,
    gridSize: game.gridSize,
    grid: filteredGrid,
    players: game.players,
    myDossier,
    myPlayer,
    messages: game.messages,
    graveyard: game.graveyard,
    humanQueries: game.humanQueries,
    creatorAddress: game.creatorAddress,
    bountyMon: game.bountyMon,
    isPrivate: game.isPrivate,
    roomCode: game.roomCode,
    mode: game.mode || "SIMULATION",
    isDemo: game.isDemo || false,
    winnerId: game.winnerId,
    winnerName: game.winnerName,
    winningRewardMon: game.winningRewardMon,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
}
