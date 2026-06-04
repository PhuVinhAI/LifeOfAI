// ─── Game Time ───────────────────────────────────────────────
export interface GameTimeData {
  minute: number;
  hour: number;
  day: number;
  month: number;
  year: number;
}

// ─── ECS Types ───────────────────────────────────────────────
export interface Component {
  type: string;
}

export interface Entity {
  id: string;
  components: Map<string, Component>;
}

// ─── Needs ───────────────────────────────────────────────────
export interface Needs extends Component {
  type: 'needs';
  hunger: number;    // 0-100 (100 = no)
  thirst: number;    // 0-100
  energy: number;    // 0-100
  bladder: number;   // 0-100 (100 = không cần đi)
  hygiene: number;   // 0-100
  fun: number;       // 0-100
}

export const DEFAULT_NEEDS: Needs = {
  type: 'needs',
  hunger: 80,
  thirst: 80,
  energy: 80,
  bladder: 80,
  hygiene: 80,
  fun: 80,
};

export interface NeedDecayRates {
  hunger: number;
  thirst: number;
  energy: number;
  bladder: number;
  hygiene: number;
  fun: number;
}

export const DEFAULT_DECAY_RATES: NeedDecayRates = {
  hunger: 0.5,
  thirst: 0.7,
  energy: 0.6,
  bladder: 0.8,
  hygiene: 0.3,
  fun: 0.4,
};

// ─── Position ────────────────────────────────────────────────
export interface Position extends Component {
  type: 'position';
  x: number;
  y: number;
  roomId: string;
}

// ─── Identity ────────────────────────────────────────────────
export interface Identity extends Component {
  type: 'identity';
  name: string;
  age: number;
  bio: string;
}

// ─── Object State ────────────────────────────────────────────
export type FSMState = string;

export interface ObjectState extends Component {
  type: 'object_state';
  objectName: string;
  traits: Record<string, FSMState>;   // traitName → current FSM state
}

// ─── Goal ────────────────────────────────────────────────────
export interface GoalComponent extends Component {
  type: 'goal';
  currentGoal: string | null;
  urgency: number;
  history: Array<{ goal: string; startedAt: number; completed: boolean }>;
}

// ─── Room ────────────────────────────────────────────────────
export interface RoomConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  objects: RoomObjectConfig[];
}

export interface RoomObjectConfig {
  name: string;
  x: number;
  y: number;
  traits: string[];           // trait names to apply
  traitConfig?: Record<string, Record<string, unknown>>;  // per-trait config
}

// ─── Agent Config ────────────────────────────────────────────
export interface AgentConfig {
  name: string;
  age: number;
  bio: string;
  startX: number;
  startY: number;
  needs: Needs;
}

// ─── Trait ───────────────────────────────────────────────────
export interface TraitDefinition {
  name: string;
  capabilities: string[];            // "use", "open", "clean", "repair"...
  initialState: FSMState;
  transitions: Record<FSMState, Partial<Record<string, FSMState>>>;  // state → (event → nextState)
  onEnter?: Partial<Record<FSMState, (entity: Entity, world: World) => void>>;
  onExit?: Partial<Record<FSMState, (entity: Entity, world: World) => void>>;
  tick?: (entity: Entity, world: World, delta: number) => void;
  onInteract: (entity: Entity, action: string, user: Entity, params: Record<string, unknown> | undefined, world: World) => InteractionResult;
}

export interface InteractionResult {
  success: boolean;
  message: string;
  duration?: number;   // minutes this action takes
  effects?: Array<{
    entityId: string;
    component: string;
    changes: Record<string, number>;
  }>;
}

// ─── Plugin ──────────────────────────────────────────────────
export interface Plugin {
  name: string;
  version: string;
  dependencies: string[];
  traitDefs: TraitDefinition[];
  components: Array<{ name: string; schema: Record<string, unknown> }>;
  systemFns: Array<(world: World, delta: number, events: IEventBus) => void>;
}

// ─── World (subset of sim-ecs IWorld) ────────────────────────
export interface World {
  entities: Map<string, Entity>;
  spawnEntity(id: string, components: Component[]): Entity;
  removeEntity(id: string): void;
  getEntity(id: string): Entity | undefined;
  query(componentTypes: string[]): Entity[];
  tick(delta: number): void;
}

// ─── Event Bus ───────────────────────────────────────────────
export interface GameEvents {
  'engine:play': () => void;
  'engine:pause': () => void;
  'engine:tick': (tick: number) => void;
  'engine:time_advanced': (time: GameTimeData, minutesElapsed: number) => void;
  'ai:stream': (agentId: string, text: string) => void;
  'ai:tool_call': (agentId: string, tool: string, args: Record<string, unknown>) => void;
  'ai:tool_result': (agentId: string, tool: string, result: InteractionResult) => void;
  'needs:critical': (agentId: string, need: string, value: number) => void;
  'interaction:executed': (sourceId: string, targetId: string, action: string, result: InteractionResult) => void;
}

export interface IEventBus {
  on<K extends keyof GameEvents>(event: K, listener: GameEvents[K]): this;
  off<K extends keyof GameEvents>(event: K, listener: GameEvents[K]): this;
  emit<K extends keyof GameEvents>(event: K, ...args: Parameters<GameEvents[K]>): boolean;
}

// ─── Serializer ──────────────────────────────────────────────
export interface SaveData {
  version: string;
  timestamp: number;
  entities: Array<{
    id: string;
    components: Record<string, unknown>;
  }>;
  tick: number;
  gameTime: GameTimeData;
}

// ─── Tool Definition ─────────────────────────────────────────
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>, world: World, agentId: string) => Promise<unknown>;
}
