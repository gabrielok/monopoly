import { shuffle } from "@umatch/utils/array";
import { nthElement } from "@umatch/utils/math";
import { snakeCase } from "@umatch/utils/string";
import chalk from "chalk";

import { BOARD } from "./board";
import { chanceCards, chestCards } from "./cards";
import Game from "./game";
import Player from "./player";
import promptAndPerformAction from "./prompts/promptAndPerformAction";
import promptBoolean from "./prompts/promptBoolean";
import promptPlayerName from "./prompts/promptPlayerName";
import { PROPERTIES } from "./properties";

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

      await promptAndPerformAction(playerBetween, game, "between");
    }
  }
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
  for (const [name, value] of Object.entries(options)) {
    process.env[snakeCase(name).toUpperCase()] = String(value);
  }

  const players: Player[] = [];
  for (let i = 0; i < options.maxPlayers; i += 1) {
    const name = await promptPlayerName(players, options.maxPlayers);
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

    await promptAndPerformAction(player, game, "startTurn");
    await promptAndPerformAction(player, game, "endTurn");
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
