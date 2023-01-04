import { divmod } from "@umatch/utils/math";
import chalk from "chalk";

import { Place, BOARD } from "./board";

import type Game from "./game";
import type Player from "./player";

/**
 * Moves a player to jail without collecting from Go.
 */
export function arrestPlayer(player: Player) {
  console.log(chalk.white.bgRedBright(`👮🏻 ${player.name} has been arrested`));
  movePlayer(player, "Jail", false);
}

export function movePlayer(
  player: Player,
  stepsOrDestination: number | Place,
  collect = true,
) {
  let steps: number;
  if (typeof stepsOrDestination === "number") {
    steps = stepsOrDestination;
  } else {
    const newPosition = BOARD.indexOf(stepsOrDestination);
    // if the destination is before the current position, the player
    // actually goes all the way around the board instead of backwards
    steps =
      newPosition < player.position
        ? newPosition + BOARD.length - player.position
        : newPosition - player.position;
  }

  const [quotient, remainder] = divmod(player.position + steps, BOARD.length);
  // quotient > 0 means the player walked over the starting point (Go)
  if (quotient > 0 && collect) {
    player.balance += Number(process.env.COLLECT_FROM_GO);
  }
  player.position = remainder;
}

export function processPlace(player: Player, game: Game) {
  const place = BOARD[player.position];
  if (place === "Go To Jail") {
    arrestPlayer(player);
  } else if (place === "Chance" || place === "Chest") {
    game.applyCard(player, place);
  }
}
