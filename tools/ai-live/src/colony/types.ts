export type AgentController = "bot" | "human";

export interface AgentIdentity {
  id: string;
  name?: string;
  personaId?: string;
  controller?: AgentController;
  memoryRef?: string;
  metadata?: Record<string, unknown>;
}

export interface GameSnapshot {
  gameId?: string;
  roomId?: string;
  currentRound?: number;
  agentCash?: number;
  remainingMs?: number;
  isGameOver?: boolean;
  raw?: unknown;
}

export interface GameEvent<TData = unknown> {
  id?: string;
  type: string;
  source?: string;
  roomId?: string;
  actorId?: string;
  targetAgentId?: string;
  at?: number;
  data?: TData;
  snapshot?: GameSnapshot;
  raw?: unknown;
}

export interface GameAction<TPayload = unknown> {
  type: string;
  payload?: TPayload;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ActionDispatchResult {
  ok: boolean;
  action: GameAction;
  data?: unknown;
  error?: string;
}

export interface GameAdapter {
  id: string;
  gameName: string;
  readEvents(): Promise<GameEvent[] | undefined>;
  readSnapshot?(): Promise<GameSnapshot | undefined>;
  listLegalActions(event: GameEvent, snapshot?: GameSnapshot): GameAction[];
  dispatchAction(action: GameAction): Promise<ActionDispatchResult>;
}

export interface AgentColonyEventHandler {
  observeEvent?(input: ColonyEventInput): Promise<void> | void;
  decideAction(input: ColonyEventInput): Promise<GameAction | undefined> | GameAction | undefined;
  afterDispatch?(input: ColonyDispatchInput): Promise<void> | void;
}

export interface ColonyEventInput {
  agent: AgentIdentity;
  adapter: GameAdapter;
  event: GameEvent;
  snapshot?: GameSnapshot;
  legalActions: GameAction[];
}

export interface ColonyDispatchInput extends ColonyEventInput {
  action: GameAction;
  result: ActionDispatchResult;
}
