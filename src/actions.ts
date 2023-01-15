import { divmod, randomInteger } from "@umatch/utils/math";
import chalk from "chalk";
import { prompt } from "enquirer";
import { setTimeout } from "node:timers/promises";

import { isSite } from "./interfaces/site";
import { promptBuyProperty } from "./prompts/promptBuyProperty";

import type { Place } from "./board";
import type Game from "./game";
import type { Property } from "./interfaces/property";
import type Player from "./player";

/**
 * Returns a function, which adds the value to the player's balance.
 *
 * If the value is negative and the player's balance goes below 0, the player
 * goes bankrupt.
 */
export function alterBalance(value: number) {
  return (player: Player) => {
    player.balance += value;
    if (player.balance <= 0) {
      console.log(`Oh no! ${player.name} went bankrupt`);
      player.bankrupt = true;
    }
  };
}

/**
 * Moves a player to jail without collecting from Go.
 */
export function arrestPlayer(player: Player, game: Game) {
  console.log(chalk.white.bgRedBright(`${player.name} has been arrested 🚓`));
  movePlayer(player, game, "Jail", false);
}

/**
 * Returns how much rent a player must pay the owner upon landing on a property.
 */
function calcRent(
  owner: Player,
  game: Game,
  property: Property,
  diceRoll: number,
): number {
  if (isSite(property)) {
    if (property.hotels === 1) {
      return property.rent.at(-1)!;
    } else if (property.houses > 0) {
      return property.rent[property.houses];
    } else {
      const baseRent = property.rent[0];
      return baseRent * (game.doesOwnerOwnSet(owner, property) ? 2 : 1);
    }
  } else {
    const countProperties = game
      .getPropertiesOfType(property.type)
      .filter((p) => p.owner === owner.name).length;
    if (property.type === "transport") {
      return Number(process.env.RENT_TRANSPORT) * 2 ** countProperties;
    } else {
      const multiplier = countProperties === 1 ? 4 : 10;
      return Number(process.env.RENT_UTILITY) * multiplier * diceRoll;
    }
  }
}

export async function managePropertiesAction(player: Player, game: Game) {
  const playerProperties = game.getPlayerProperties(player);
  if (!playerProperties) {
    // the player may only access this action if they have properties
    throw new Error("Player has no properties");
  }

  const answer = await prompt<{ name: string }>({
    type: "select",
    name: "name",
    message: `Choose a property:`,
    choices: playerProperties.map((p) => p.name),
  });
  const property = playerProperties.find((p) => p.name === answer.name);
  console.log(property);
}

/**
 * Moves the player a number of steps or to a specific place.
 *
 * If the player passes Go, rewards them with a fixed amount, except when
 * collect is false. If the place is before the current position, loops around
 * the board to possibly collect from Go.
 */
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
    alterBalance(Number(process.env.COLLECT_FROM_GO))(player);
  }
  player.position = remainder;
}

/**
 * Prints a message over existing text.
 *
 * Moves the cursor to a given position, or to the start of the line if not
 * specified.
 */
function printSameLine(message?: any, cursorTo = 0) {
  process.stdout.cursorTo(cursorTo);
  process.stdout.write(String(message));
}

/**
 * Processes the place where the player arrived.
 *
 * If the place is a property, the player must
 * pay rent to the owner or may buy it if it is unowned.
 */
export async function processPlace(player: Player, game: Game, diceRoll: number) {
  const place = game.board[player.position];
  console.log(`${player.name} arrived on ${place}`);
  if (place === "Go To Jail") {
    arrestPlayer(player, game);
  } else if (place === "Chance" || place === "Chest") {
    game.applyCard(player, place);
  } else if (place === "Income Tax") {
    alterBalance(Number(process.env.INCOME_TAX))(player);
  } else if (place === "Super Tax") {
    alterBalance(Number(process.env.SUPER_TAX))(player);
  } else if (place === "Go" || place === "Jail" || place === "Parking") {
    // nothing happens
  } else {
    if (process.env.NODE_ENV === "dev") return;

    // place is a property
    const property = game.getProperty(place);
    const owner = game.players.find((p) => p.name === property.owner);
    if (owner) {
      const rent = calcRent(owner, game, property, diceRoll);
      console.log(`${player.name} owes ${owner.name} $${rent} for visiting ${place}`);
      transferMoney(player, owner, rent);
    } else {
      await promptBuyProperty(player, game, property);
    }
  }
}

/**
 * Animates a single dice roll.
 */
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

/**
 * Rolls the dice, moves the player and processes the place where they arrive.
 */
async function rollDiceAndMove(player: Player, game: Game): Promise<boolean> {
  const firstRoll = await rollSingleDice("First roll: ");
  const secondRoll = await rollSingleDice("Second roll: ");

  const totalRoll = firstRoll + secondRoll;
  console.log(`${player.name} rolled ${firstRoll} + ${secondRoll} = ${totalRoll}`);
  movePlayer(player, game, totalRoll);

  // Some cards move the player. If they moved, then we should process the new place.
  const lastPos = player.position;
  await processPlace(player, game, totalRoll);
  if (player.position !== lastPos) {
    await processPlace(player, game, totalRoll);
  }
  return firstRoll === secondRoll;
}

/**
 * Implements the double roll mechanic.
 *
 * If the player rolls a double, they can roll again, up to 3 times, when they
 * are arrested.
 */
export async function rollDiceAction(player: Player, game: Game): Promise<void> {
  let consecutiveDoubles = 0;
  while (true) {
    if (consecutiveDoubles === 3) {
      console.log(chalk.red(`Oh oh! ${player.name} moved too many times.`));
      arrestPlayer(player, game);
      break;
    }

    const rolledDouble = await rollDiceAndMove(player, game);
    if (!rolledDouble) break;
    consecutiveDoubles += 1;
  }
}

/**
 * Transfers value from the first player to the second player.
 */
export function transferMoney(player1: Player, player2: Player, value: number): void {
  player1.balance -= value;
  player2.balance += value;
}
