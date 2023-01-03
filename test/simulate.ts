import { randomInteger } from "@umatch/utils/math";
import chalk from "chalk";

import { movePlayer } from "../src/actions";
import { Place, BOARD } from "../src/board";
import { processCard } from "../src/game";
import { Player } from "../src/player";

const MAX_ITER = 100_000;

// SIMULATION
console.log(chalk.green(`Collecting data from ${MAX_ITER} iterations...`));

const visited = Object.fromEntries(BOARD.map((place) => [place, 0])) as {
  [_ in Place]: number;
};

function registerVisit(player: Player) {
  const place = BOARD[player.position];
  visited[place] = visited[place] + 1;
}

const player = new Player("James");
let lastPos;
for (let i = 0; i < MAX_ITER; i += 1) {
  const steps = randomInteger(1, 6) + randomInteger(1, 6);
  movePlayer(player, steps, true);
  lastPos = player.position;
  registerVisit(player);
  processCard(player);
  // the player may move multiple times per turn due to chance cards
  while (lastPos !== player.position) {
    registerVisit(player);
    processCard(player);
    lastPos = player.position;
  }
}

console.log(JSON.stringify(visited, null, 2));
