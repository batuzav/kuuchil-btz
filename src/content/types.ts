export type Hitbox = {
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

export type CharacterDef = {
  readonly id: string;
  readonly name: string;
  readonly textureKey: string;
  readonly projectileTextureKey: string;
  readonly hitbox: Hitbox;
  readonly muzzle: { readonly x: number; readonly y: number }; // desde los pies: x hacia delante, y hacia arriba (px)
  readonly maxHp: number;
  readonly shotDamage: number;
  readonly abilities: readonly string[];
};

export type EnemyBehavior = "walker" | "hopper" | "turret";

export type EnemyDef = {
  readonly id: string;
  readonly name: string;
  readonly behavior: EnemyBehavior;
  readonly textureKey: string;
  readonly hitbox: Hitbox;
  readonly maxHp: number;
  readonly contactDamage: number;
  readonly speed: number; // px/s horizontal (walker, hopper)
  readonly jumpVelocity: number; // px/s hacia arriba (hopper); 0 si no salta
  readonly actionIntervalMs: number; // hopper: cada cuánto salta; turret: cada cuánto dispara; 0 = nunca
  readonly rangePx: number; // turret: distancia máxima para disparar; 0 = no aplica
  readonly projectileSpeed: number; // px/s; 0 = no dispara
  readonly projectileDamage: number;
};

export type BossPattern = "dash" | "shot-spread" | "slam";

export type BossAttackDef = {
  readonly id: string;
  readonly pattern: BossPattern;
  readonly telegraphMs: number; // aviso visible; >= TUNING.minTelegraphMs
  readonly activeMs: number;
  readonly recoveryMs: number; // ventana de castigo del jugador
  readonly damage: number;
  readonly hitbox: Hitbox; // dash/slam: cuerpo durante el ataque; shot-spread: cada bala
  readonly speed: number; // px/s
  readonly count: number; // shot-spread: balas; otros: 1
};

export type BossPhaseDef = {
  readonly id: string;
  readonly enterAtHpFraction: number; // 1 para la primera; estrictamente decreciente
  readonly idleMs: number;
  readonly attackCycle: readonly string[]; // ids de attacks, en orden cíclico
};

export type BossDef = {
  readonly id: string;
  readonly name: string;
  readonly textureKey: string;
  readonly hitbox: Hitbox;
  readonly maxHp: number;
  readonly contactDamage: number;
  readonly introMs: number;
  readonly phases: readonly BossPhaseDef[];
  readonly attacks: readonly BossAttackDef[];
};

export type StageDef = {
  readonly id: string;
  readonly name: string;
  readonly mapKey: string;
  readonly mapPath: string;
  readonly tilesetName: string;
  readonly tilesetTextureKey: string;
  readonly groundLayer: string;
  readonly spawnLayer: string;
  readonly bossId: string;
  readonly minibossIds: readonly string[];
  readonly music: null;
};

export type ContentRegistry = {
  readonly stages: readonly StageDef[];
  readonly bosses: readonly BossDef[];
  readonly enemies: readonly EnemyDef[];
  readonly characters: readonly CharacterDef[];
};
