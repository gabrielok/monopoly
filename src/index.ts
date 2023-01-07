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
  betweenTurns: (action: PlayerAction) => {
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

function getOptions(): {
  alwaysAuction: boolean;
  collectFromGo: number;
  maxPlayers: number;
} {
  return { alwaysAuction: false, collectFromGo: 2000, maxPlayers: 4 };
}

export async function initGame(): Promise<Game> {
  const options = getOptions();
  const { alwaysAuction, collectFromGo, maxPlayers } = options;
  process.env.ALWAYS_AUCTION = String(alwaysAuction);
  process.env.COLLECT_FROM_GO = String(collectFromGo);

  const players: Player[] = [];
  for (let i = 0; i < maxPlayers; i += 1) {
    const answer = await prompt<{ name: string }>({
      type: "input",
      name: "name",
      message: `What is your name? (${i + 1}/${maxPlayers})`,
      validate(value: string): boolean | string {
        if (!value) return "You need to type something";
        if (value.length < 3) return "Please type a longer name";
        if (players.map((p) => p.name.toLowerCase()).includes(value.toLowerCase()))
          return "Name already taken";
        return true;
      },
    });
    players.push(new Player(answer.name));
  }

  return new Game(players, BOARD, PROPERTIES, shuffle(chanceCards), shuffle(chestCards));
}

async function run() {
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

  const game = await initGame();
  function bankrupt() {
    return game.players.reduce<number>(
      (count, player) => count + (player.bankrupt ? 1 : 0),
      0,
    );
  }

  let round = 1;
  while (bankrupt() < game.players.length - 1) {
    const player = nthElement(game.players, round - 1);
    console.log(chalk.black.bgWhite(`Round ${round} - ${player.name}'s turn`));

    const answerStart = await prompt<{ action: PlayerAction }>({
      type: "select",
      name: "action",
      message: "Choose an action:",
      choices: (Object.keys(PLAYER_ACTIONS) as PlayerAction[])
        .filter(playerActionFilters["startTurn"])
        .map(playerActionsFormat(player, game)),
    });
    await PLAYER_ACTIONS[answerStart.action](player, game);

    const answerEnd = await prompt<{ action: PlayerAction }>({
      type: "select",
      name: "action",
      message: "Choose an action:",
      choices: (Object.keys(PLAYER_ACTIONS) as PlayerAction[])
        .filter(playerActionFilters["endTurn"])
        .map(playerActionsFormat(player, game)),
    });
    await PLAYER_ACTIONS[answerEnd.action](player, game);

    // the current player and the one who's about to play don't need to take
    // actions between turns
    const playersWhoCanPlayBetween = game.players.slice(2);
    const wantToPlay = await prompt<{ choice: string }>({
      type: "select",
      name: "choice",
      message: `Does anyone want to take actions between turns? (next up: ${
        nthElement(game.players, round).name
      })`,
      choices: ["No", "Yes"],
    });
    if (parseBool(wantToPlay.choice)) {
      for (const playerBetween of playersWhoCanPlayBetween) {
        const wantsToPlay = await prompt<{ choice: string }>({
          type: "select",
          name: "choice",
          message: `Does ${playerBetween.name} want to take actions between turns?`,
          choices: ["No", "Yes"],
        });
        if (!parseBool(wantsToPlay.choice)) continue;

        const actionBetween = await prompt<{ action: PlayerAction }>({
          type: "select",
          name: "action",
          message: "Choose an action:",
          choices: (Object.keys(PLAYER_ACTIONS) as PlayerAction[])
            .filter(playerActionFilters["betweenTurns"])
            .map(playerActionsFormat(playerBetween, game)),
        });
        await PLAYER_ACTIONS[actionBetween.action](playerBetween, game);
      }
    }

    round += 1;
  }
  console.log(chalk.bgGreen.white("END"));
}

(async () => {
  try {
    await run();
  } catch (error) {
    console.debug(error);
    console.log(chalk.whiteBright.bgRed("Goodbye!"));
    process.exit();
  }
})();
