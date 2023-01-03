import { shuffle } from "@umatch/utils/array";
import chalk from "chalk";
import { prompt } from "enquirer";

import { chanceCards, chestCards } from "./cards";
import Game from "./game";
import Player from "./player";

function getOptions(): { maxPlayers: number; alwaysAuction: boolean } {
  return { maxPlayers: 4, alwaysAuction: false };
}

export async function initGame(): Promise<Game> {
  const options = getOptions();
  const { maxPlayers } = options;
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

  return new Game(players, shuffle(chanceCards), shuffle(chestCards));
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
    game.players[round - 1].bankrupt = true;
    console.log(`Round ${round} - ${game.players[round - 1].name} went bankrupt!`);
    round += 1;
  }
  console.log(chalk.bgGreen.white("END"));
}

void run();
