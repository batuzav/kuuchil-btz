import { TUNING } from "../core/tuning.ts";
import type { ContentRegistry, Hitbox } from "./types.ts";

export type SpawnPoint = { x: number; y: number };
export type EnemySpawn = SpawnPoint & { enemyId: string };
export type TriggerRect = { x: number; y: number; width: number; height: number };
export type StageSpawns = {
  playerStarts: SpawnPoint[];
  bossSpawns: SpawnPoint[];
  bossTriggers: TriggerRect[];
  enemies: EnemySpawn[];
};

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null;
const layers = (map: unknown): Obj[] =>
  isObj(map) && Array.isArray(map.layers) ? (map.layers.filter(isObj) as Obj[]) : [];

export function extractSpawns(map: unknown, spawnLayer: string): StageSpawns | null {
  const layer = layers(map).find((l) => l.type === "objectgroup" && l.name === spawnLayer);
  if (!layer) return null;
  const out: StageSpawns = { playerStarts: [], bossSpawns: [], bossTriggers: [], enemies: [] };
  const objects = Array.isArray(layer.objects) ? layer.objects.filter(isObj) : [];
  for (const obj of objects) {
    const kind =
      typeof obj.type === "string" ? obj.type : typeof obj.class === "string" ? obj.class : "";
    const x = Number(obj.x);
    const y = Number(obj.y);
    if (kind === "player_start") out.playerStarts.push({ x, y });
    else if (kind === "boss_spawn") out.bossSpawns.push({ x, y });
    else if (kind === "boss_trigger")
      out.bossTriggers.push({ x, y, width: Number(obj.width), height: Number(obj.height) });
    else if (kind === "enemy") {
      const props = Array.isArray(obj.properties) ? obj.properties.filter(isObj) : [];
      const p = props.find((q) => q.name === "enemyId");
      out.enemies.push({ x, y, enemyId: p && typeof p.value === "string" ? p.value : "" });
    }
  }
  return out;
}

const badHitbox = (h: Hitbox): boolean =>
  h.width <= 0 || h.height <= 0 || h.offsetX < 0 || h.offsetY < 0;

export function validateContent(
  content: ContentRegistry,
  readMap: (mapPath: string) => unknown,
): string[] {
  const errors: string[] = [];
  const dupes = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`${kind}: id duplicado ${id}`);
      seen.add(id);
    }
  };
  dupes(
    "stage",
    content.stages.map((s) => s.id),
  );
  dupes(
    "boss",
    content.bosses.map((b) => b.id),
  );
  dupes(
    "enemy",
    content.enemies.map((e) => e.id),
  );
  dupes(
    "character",
    content.characters.map((c) => c.id),
  );

  const bossIds = new Set(content.bosses.map((b) => b.id));
  const enemyIds = new Set(content.enemies.map((e) => e.id));

  for (const stage of content.stages) {
    let map: unknown;
    try {
      map = readMap(stage.mapPath);
    } catch (e) {
      errors.push(`${stage.id}: no se pudo leer el map ${stage.mapPath}: ${String(e)}`);
      continue;
    }
    const m = isObj(map) ? map : {};
    if (m.tilewidth !== 16 || m.tileheight !== 16) errors.push(`${stage.id}: tile debe ser 16x16`);
    const ground = layers(map).find((l) => l.type === "tilelayer" && l.name === stage.groundLayer);
    if (!ground) errors.push(`${stage.id}: falta la capa ground '${stage.groundLayer}'`);
    else if (
      !Array.isArray(ground.data) ||
      ground.data.length !== Number(ground.width) * Number(ground.height)
    )
      errors.push(`${stage.id}: ground con data de tamaño incorrecto`);
    const tilesets = Array.isArray(m.tilesets) ? m.tilesets.filter(isObj) : [];
    if (!tilesets.some((t) => t.name === stage.tilesetName))
      errors.push(`${stage.id}: tilesetName ${stage.tilesetName} no está en el mapa`);
    const spawns = extractSpawns(map, stage.spawnLayer);
    if (!spawns) errors.push(`${stage.id}: falta la capa spawns '${stage.spawnLayer}'`);
    else {
      if (spawns.playerStarts.length !== 1) errors.push(`${stage.id}: debe haber 1 player_start`);
      if (spawns.bossSpawns.length !== 1) errors.push(`${stage.id}: debe haber 1 boss_spawn`);
      if (
        spawns.bossTriggers.length < 1 ||
        spawns.bossTriggers.some((t) => t.width <= 0 || t.height <= 0)
      )
        errors.push(`${stage.id}: boss_trigger inválido`);
      for (const en of spawns.enemies)
        if (!enemyIds.has(en.enemyId))
          errors.push(`${stage.id}: enemyId no registrado '${en.enemyId}'`);
    }
    for (const id of [stage.bossId, ...stage.minibossIds])
      if (!bossIds.has(id)) errors.push(`${stage.id}: jefe no registrado ${id}`);
  }

  for (const boss of content.bosses) {
    const attackIds = new Set(boss.attacks.map((a) => a.id));
    if (boss.phases.length === 0) errors.push(`${boss.id}: sin phase`);
    boss.phases.forEach((p, i) => {
      const prev = boss.phases[i - 1];
      if (i === 0 && p.enterAtHpFraction !== 1)
        errors.push(`${boss.id}: first phase debe entrar en 1`);
      if (p.enterAtHpFraction <= 0 || (prev && p.enterAtHpFraction >= prev.enterAtHpFraction))
        errors.push(`${boss.id}: phase ${p.id} no estrictamente decreciente`);
      if (p.attackCycle.length === 0 || p.attackCycle.some((id) => !attackIds.has(id)))
        errors.push(`${boss.id}: attackCycle inválido en ${p.id}`);
    });
    for (const a of boss.attacks) {
      if (a.telegraphMs < TUNING.minTelegraphMs) errors.push(`${a.id}: telegraph demasiado corto`);
      if (a.activeMs <= 0 || a.recoveryMs < 0 || a.damage <= 0)
        errors.push(`${a.id}: valores inválidos`);
      if (badHitbox(a.hitbox)) errors.push(`${a.id}: hitbox inválido`);
    }
  }
  for (const c of content.characters)
    if (c.abilities.length === 0) errors.push(`${c.id}: abilities vacío`);
  return errors;
}
