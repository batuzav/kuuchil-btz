import { kuuchil } from "./characters/kuuchil.ts";
import type { BossDef, CharacterDef, ContentRegistry, EnemyDef, StageDef } from "./types.ts";

export const FIRST_STAGE_ID = "stage-01";
export const DEFAULT_CHARACTER_ID = "kuuchil";

export const CONTENT: ContentRegistry = {
  stages: [],
  bosses: [],
  enemies: [],
  characters: [kuuchil],
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
