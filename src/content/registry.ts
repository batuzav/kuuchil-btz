import { sentinel } from "./bosses/sentinel.ts";
import { businessMan } from "./characters/business-man.ts";
import { hopper } from "./enemies/hopper.ts";
import { turret } from "./enemies/turret.ts";
import { walker } from "./enemies/walker.ts";
import { stage01 } from "./stages/stage-01/stage.ts";
import type { BossDef, CharacterDef, ContentRegistry, EnemyDef, StageDef } from "./types.ts";

export const FIRST_STAGE_ID = "stage-01";
export const DEFAULT_CHARACTER_ID = "business-man";

export const CONTENT: ContentRegistry = {
  stages: [stage01],
  bosses: [sentinel],
  enemies: [walker, hopper, turret],
  characters: [businessMan],
};

export function getStage(id: string): StageDef | undefined {
  return CONTENT.stages.find((stage) => stage.id === id);
}

export function getBoss(id: string): BossDef | undefined {
  return CONTENT.bosses.find((boss) => boss.id === id);
}

export function getEnemy(id: string): EnemyDef | undefined {
  return CONTENT.enemies.find((enemy) => enemy.id === id);
}

export function getCharacter(id: string): CharacterDef | undefined {
  return CONTENT.characters.find((character) => character.id === id);
}
