export type StageFlowState = "exploring" | "bossIntro" | "bossFight" | "won" | "lost";

export type StageFlowEvent =
  | "enteredBossTrigger"
  | "bossIntroDone"
  | "bossDefeated"
  | "playerDied"
  | "restart";

export function nextFlow(state: StageFlowState, event: StageFlowEvent): StageFlowState {
  if (state === "exploring" && event === "enteredBossTrigger") return "bossIntro";
  if (state === "bossIntro" && event === "bossIntroDone") return "bossFight";
  if (state === "bossFight" && event === "bossDefeated") return "won";
  if (
    (state === "exploring" || state === "bossIntro" || state === "bossFight") &&
    event === "playerDied"
  ) {
    return "lost";
  }
  if (state === "lost" && event === "restart") return "exploring";
  return state;
}
