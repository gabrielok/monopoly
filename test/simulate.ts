import { shuffle } from "@umatch/utils/array";
import { randomInteger, round } from "@umatch/utils/math";
import { apply, stringify } from "@umatch/utils/object";
import chalk from "chalk";

import { movePlayer, processPlace } from "../src/actions";
import { Place, BOARD } from "../src/board";
import { chanceCards, chestCards } from "../src/cards";
import Game from "../src/game";
import Player from "../src/player";
import { PROPERTIES } from "../src/properties";

const MAX_ITER = 100_000;
process.env.NODE_ENV = "dev";

// disable logging in other files to make it faster
const log = console.log;
console.log = () => {};

async function simulate() {
  const visited = {} as { [_ in Place]: number };
  function registerVisit(player: Player, game: Game) {
    const place = game.board[player.position];
    visited[place] = (visited[place] ?? 0) + 1;
  }

  const player = new Player("James");
  const game = new Game(
    [player],
    BOARD,
    PROPERTIES,
    shuffle(chanceCards),
    shuffle(chestCards),
  );
  let lastPos;
  log(chalk.green(`Collecting data from ${MAX_ITER} iterations...`));
  for (let i = 0; i < MAX_ITER; i += 1) {
    const steps = randomInteger(1, 6) + randomInteger(1, 6);
    movePlayer(player, game, steps, true);
    lastPos = player.position;
    registerVisit(player, game);
    await processPlace(player, game, steps);
    // the player may move multiple times per turn due to chance cards
    while (lastPos !== player.position) {
      registerVisit(player, game);
      await processPlace(player, game, steps);
      lastPos = player.position;
    }
  }

  const formatted = apply(visited, (count) => round((count / MAX_ITER) * 100, 2));
  log(stringify(formatted, { pad: true }));
}

(async () => {
  try {
    await simulate();
  } catch (error) {
    console.debug(error);
  }
  log(chalk.whiteBright.bgRed("End simulation"));
  process.exit();
})();
