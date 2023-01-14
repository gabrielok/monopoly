import { prompt } from "enquirer";

import { managePropertiesAction, rollDiceAction } from "../actions";

import type Game from "../game";
import type { Choice } from "../interfaces/choice";
import type Player from "../player";

const PLAYER_ACTIONS = {
  "Roll Dice": rollDiceAction,
  "Manage Properties": managePropertiesAction,
  "End Turn": () => {},
} as const;
type PlayerAction = keyof typeof PLAYER_ACTIONS;

const playerActionFilters = {
  startTurn: (action: PlayerAction) => {
    return action !== "End Turn";
  },
  endTurn: (action: PlayerAction) => {
    return action !== "Roll Dice";
  },
  between: (action: PlayerAction) => {
    return action !== "Roll Dice" && action !== "Manage Properties";
  },
} as const;

function playerActionsFormat(
  player: Player,
  game: Game,
): (action: PlayerAction) => Choice {
  return (action: PlayerAction) => ({
    disabled: action === "Manage Properties" && !game.getPlayerProperties(player),
    name: action,
  });
}

export async function promptAndPerformAction(
  player: Player,
  game: Game,
  filterKey: keyof typeof playerActionFilters,
) {
  const answer = await prompt<{ action: PlayerAction }>({
    type: "select",
    name: "action",
    message: "Choose an action:",
    choices: (Object.keys(PLAYER_ACTIONS) as PlayerAction[])
      .filter(playerActionFilters[filterKey])
      .map(playerActionsFormat(player, game)),
  });
  await PLAYER_ACTIONS[answer.action](player, game);
}
