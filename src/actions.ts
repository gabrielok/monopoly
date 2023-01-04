import { divmod, randomInteger } from "@umatch/utils/math";
import chalk from "chalk";
import { setTimeout } from "node:timers/promises";

import type { Place } from "./board";
import type Game from "./game";
import type Player from "./player";

/**
 * Moves a player to jail without collecting from Go.
 */
export function arrestPlayer(player: Player, game: Game) {
  console.log(chalk.white.bgRedBright(`👮🏻 ${player.name} has been arrested`));
  movePlayer(player, game, "Jail", false);
}

export function movePlayer(
  player: Player,
  game: Game,
  stepsOrDestination: number | Place,
  collect = true,
) {
  let steps: number;
  if (typeof stepsOrDestination === "number") {
    steps = stepsOrDestination;
  } else {
    const newPosition = game.board.indexOf(stepsOrDestination);
    // if the destination is before the current position, the player
    // actually goes all the way around the board instead of backwards
    steps =
      newPosition < player.position
        ? newPosition + game.board.length - player.position
        : newPosition - player.position;
  }

  const [quotient, remainder] = divmod(player.position + steps, game.board.length);
  // quotient > 0 means the player walked over the starting point (Go)
  if (quotient > 0 && collect) {
    player.balance += Number(process.env.COLLECT_FROM_GO);
  }
  player.position = remainder;
}

function printSameLine(message?: any, cursorTo = 0) {
  process.stdout.cursorTo(cursorTo);
  process.stdout.write(String(message));
}

export function processPlace(player: Player, game: Game) {
  const place = game.board[player.position];
  if (place === "Go To Jail") {
    arrestPlayer(player, game);
  } else if (place === "Chance" || place === "Chest") {
    game.applyCard(player, place);
  }
}

async function rollSingleDice(message = ""): Promise<number> {
  let roll = randomInteger(1, 6);
  process.stdout.write(message);
  process.stdout.write(String(roll));

  const baseSpeed = randomInteger(2, 3);
  const speeds = [5, 5, 5, 5, 3, 3, 2, 2, 1].map((v) => v * baseSpeed);
  let lastRoll = roll;
  for (const speed of speeds) {
    const delay = 1000 / speed;
    await setTimeout(delay);
    while (roll === lastRoll) {
      roll = randomInteger(1, 6);
    }
    lastRoll = roll;
    printSameLine(roll, message.length);
  }
  await setTimeout(1200);
  console.log("");
  return roll;
}

async function rollDiceAndMove(player: Player, game: Game): Promise<boolean> {
  const firstRoll = await rollSingleDice("First roll: ");
  const secondRoll = await rollSingleDice("Second roll: ");

  const totalRoll = firstRoll + secondRoll;
  console.log(`${player.name} rolled ${firstRoll} + ${secondRoll} = ${totalRoll}`);
  movePlayer(player, game, totalRoll);

  // Some cards move the player. If they moved, then we should process the new place.
  const lastPos = player.position;
  processPlace(player, game);
  if (player.position !== lastPos) {
    processPlace(player, game);
  }
  return firstRoll === secondRoll;
}

export async function rollDiceAction(player: Player, game: Game): Promise<void> {
  let consecutiveDoubles = 0;
  while (true) {
    if (consecutiveDoubles === 3) {
      console.log(chalk.red(`Oh oh! ${player.name} moved too many times.`));
      arrestPlayer(player, game);
    }

    const rolledDouble = await rollDiceAndMove(player, game);
    if (!rolledDouble) break;
    consecutiveDoubles += 1;
  }
}
