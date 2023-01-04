import { shuffle } from "@umatch/utils/array";
import { nthElement } from "@umatch/utils/math";
import { pick } from "@umatch/utils/object";
import chalk from "chalk";
import { prompt } from "enquirer";

import { rollDiceAction } from "./actions";
import { BOARD } from "./board";
import { chanceCards, chestCards } from "./cards";
import Game from "./game";
import Player from "./player";
import { PROPERTIES } from "./properties";

const PLAYER_ACTIONS = {
  "Roll Dice": rollDiceAction,
  "End Turn": () => {},
} as const;
type PlayerAction = keyof typeof PLAYER_ACTIONS;

const playerActionsStartTurn = pick(PLAYER_ACTIONS, ["Roll Dice"]);
const playerActionsEndTurn = pick(PLAYER_ACTIONS, ["End Turn"]);

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
      message: `Choose an action:`,
      choices: Object.keys(playerActionsStartTurn),
    });
    await PLAYER_ACTIONS[answerStart.action](player, game);

    const answerEnd = await prompt<{ action: PlayerAction }>({
      type: "select",
      name: "action",
      message: `Choose an action:`,
      choices: Object.keys(playerActionsEndTurn),
    });
    await PLAYER_ACTIONS[answerEnd.action](player, game);

    round += 1;
  }
  console.log(chalk.bgGreen.white("END"));
}

void run();
