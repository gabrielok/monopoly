import { shuffle } from "@umatch/utils/array";
import { nthElement } from "@umatch/utils/math";
import { parseBool } from "@umatch/utils/string";
import chalk from "chalk";
import { prompt } from "enquirer";

import { managePropertiesAction, rollDiceAction } from "./actions";
import { BOARD } from "./board";
import { chanceCards, chestCards } from "./cards";
import Game from "./game";
import Player from "./player";
import { PROPERTIES } from "./properties";

// for some reason, enquirer doesn't export this interface
type Choice = {
  disabled?: boolean | string;
  hint?: string;
  message?: string;
  name: string;
  value?: string;
};

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

function greet() {
  console.log(
    chalk.whiteBright
      .bgRed(`                                                                         
  ███╗   ███╗ █████╗ ███╗  ██╗ █████╗ ██████╗  █████╗ ██╗     ██╗   ██╗  
  ████╗ ████║██╔══██╗████╗ ██║██╔══██╗██╔══██╗██╔══██╗██║     ╚██╗ ██╔╝  
  ██╔████╔██║██║  ██║██╔██╗██║██║  ██║██████╔╝██║  ██║██║      ╚████╔╝   
  ██║╚██╔╝██║██║  ██║██║╚████║██║  ██║██╔═══╝ ██║  ██║██║       ╚██╔╝    
  ██║ ╚═╝ ██║╚█████╔╝██║ ╚███║╚█████╔╝██║     ╚█████╔╝███████╗   ██║     
  ╚═╝     ╚═╝ ╚════╝ ╚═╝  ╚══╝ ╚════╝ ╚═╝      ╚════╝ ╚══════╝   ╚═╝     
                                                                         `),
    "\n",
  );
}

function playerActionsFormat(
  player: Player,
  game: Game,
): (action: PlayerAction) => Choice {
  return (action: PlayerAction) => ({
    disabled: action === "Manage Properties" && !game.getPlayerProperties(player),
    name: action,
  });
}

async function performActionsBetweenTurns(player: Player, game: Game, round: number) {
  const nextPlayer = nthElement(game.players, round + 1);
  const wantToPlay = await promptBoolean(
    `Does anyone want to take actions between turns? (next up: ${nextPlayer.name})`,
    true,
  );
  if (wantToPlay) {
    // the current player and the one who's about to play don't need to take
    // actions between turns
    for (let i = 2; i < game.players.length; i += 1) {
      const playerBetween = nthElement(game.players, round + i);
      const wantsToPlay = await promptBoolean(
        `Does ${playerBetween.name} want to take actions between turns?`,
        true,
      );
      if (!wantsToPlay) continue;

      await promptAndPerformAction(playerBetween, game, "between", playerActionsFormat);
    }
  }
}
async function promptAndPerformAction(
  player: Player,
  game: Game,
  filterKey: keyof typeof playerActionFilters,
  mapper: (player: Player, game: Game) => (action: PlayerAction) => Choice,
) {
  const answer = await prompt<{ action: PlayerAction }>({
    type: "select",
    name: "action",
    message: "Choose an action:",
    choices: (Object.keys(PLAYER_ACTIONS) as PlayerAction[])
      .filter(playerActionFilters[filterKey])
      .map(mapper(player, game)),
  });
  await PLAYER_ACTIONS[answer.action](player, game);
}

async function promptBoolean(message: string, inverted: boolean): Promise<boolean> {
  const choices = ["Yes", "No"];
  if (inverted) choices.reverse();

  const answer = await prompt<{ choice: string }>({
    type: "select",
    name: "choice",
    message,
    choices,
  });
  return parseBool(answer.choice);
}

async function promptPlayerName(
  players: Player[],
  numberOfPlayers: number,
): Promise<string> {
  const answer = await prompt<{ name: string }>({
    type: "input",
    name: "name",
    message: `What is your name? (${players.length + 1}/${numberOfPlayers})`,
    validate(value: string): boolean | string {
      if (!value) return "You need to type something";
      if (value.length < 3) return "Please type a longer name";
      if (players.map((p) => p.name.toLowerCase()).includes(value.toLowerCase()))
        return "Name already taken";
      return true;
    },
  });
  return answer.name;
}

function getOptions(): {
  alwaysAuction: boolean;
  collectFromGo: number;
  incomeTax: number;
  maxPlayers: number;
  superTax: number;
} {
  return {
    alwaysAuction: false,
    collectFromGo: 2000,
    incomeTax: 2000,
    maxPlayers: 4,
    superTax: 1000,
  };
}

export async function initGame(): Promise<Game> {
  const options = getOptions();
  const { alwaysAuction, collectFromGo, incomeTax, maxPlayers, superTax } = options;
  process.env.ALWAYS_AUCTION = String(alwaysAuction);
  process.env.COLLECT_FROM_GO = String(collectFromGo);
  process.env.INCOME_TAX = String(incomeTax);
  process.env.SUPER_TAX = String(superTax);

  const players: Player[] = [];
  for (let i = 0; i < maxPlayers; i += 1) {
    const name = await promptPlayerName(players, maxPlayers);
    players.push(new Player(name));
  }

  return new Game(players, BOARD, PROPERTIES, shuffle(chanceCards), shuffle(chestCards));
}

async function run() {
  greet();

  const game = await initGame();
  function bankrupt() {
    return game.players.filter((p) => p.bankrupt).length;
  }

  let round = 0;
  while (bankrupt() < game.players.length - 1) {
    const player = nthElement(game.players, round);
    console.log(chalk.black.bgWhite(`Round ${round + 1} - ${player.name}'s turn`));

    await promptAndPerformAction(player, game, "startTurn", playerActionsFormat);
    await promptAndPerformAction(player, game, "endTurn", playerActionsFormat);
    await performActionsBetweenTurns(player, game, round);

    round += 1;
  }
  console.log(chalk.bgGreen.white("END"));
}

(async () => {
  try {
    await run();
  } catch (error) {
    console.debug(error);
  }
  console.log(chalk.whiteBright.bgRed("Goodbye!"));
  process.exit();
})();
