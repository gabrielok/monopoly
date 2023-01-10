import { groupBy } from "@umatch/utils/array";

import { alterBalance, arrestPlayer, movePlayer, transferMoney } from "./actions";

import type Game from "./game";
import type { Property } from "./interfaces/property";
import type { Site } from "./interfaces/site";
import type Player from "./player";

type ParametersExceptFirstAndSecond<T extends (...args: any) => unknown> = T extends (
  arg0: any,
  arg1: any,
  ...rest: infer R
) => unknown
  ? R
  : never;

export type Card = {
  action: (player: Player, game: Game) => void;
  description: string;
};
type CardInitializer = [string, (player: Player, game: Game) => void];

/**
 * Returns a function, which increases the number of Get Out of Jail Free cards
 * the player has.
 */
function acquireGetOutOfJailFreeCard() {
  return (player: Player) => {
    player.getOutOfJailFreeCards += 1;
  };
}

/**
 * Returns a function, which advances the player to the nearest property
 * of the given type.
 */
function advanceToNearest(type: Property["type"]) {
  return (player: Player, game: Game) => {
    const places = game.getPropertiesOfType(type);
    const steps = places.reduce<number>((prev, transport) => {
      const newPosition = game.board.indexOf(transport.name);
      const dist = newPosition - player.position;
      return Math.abs(dist) < Math.abs(prev) ? dist : prev;
    }, game.board.length);
    movePlayer(player, game, steps, false);
  };
}

/**
 * Returns a function, which, for each player in the game, transfers money
 * from the calling player to the other player.
 */
function transferMoneyToEachPlayer(value: number) {
  return (player1: Player, game: Game) => {
    game.players.forEach((player2) => transferMoney(player1, player2, value));
  };
}

/**
 * Returns a function, which taxes a player based on how many houses
 * and hotels it has on all its sites.
 */
function collectTaxes(houseTax: number, hotelTax: number) {
  return (player: Player, game: Game) => {
    const playerProperties = game.getPlayerProperties(player);
    if (!playerProperties) return;

    const sites = groupBy(playerProperties, "type")["site"];
    sites.forEach((site) => {
      alterBalance((site as Site).houses * houseTax)(player);
      alterBalance((site as Site).hotels * hotelTax)(player);
    });
  };
}

/**
 * A wrapper around movePlayer to reduce verbosity.
 */
function move(...args: ParametersExceptFirstAndSecond<typeof movePlayer>) {
  const [stepsOrDestination, collect] = args;
  return (player: Player, game: Game) =>
    movePlayer(player, game, stepsOrDestination, collect);
}

/**
 * Returns a function, which directly alters the player's position, without
 * looping around the board or any other special behavior.
 */
function moveSimple(steps: number) {
  return (player: Player) => {
    player.position -= steps;
  };
}

const _chanceCards: CardInitializer[] = [
  ["Advance to Go. Collect 2M.", move("Go", true)],
  ["Advance to Istambul. If you pass Go, collect 2M.", move("Istambul")],
  ["Advance to London. If you pass Go, collect 2M.", move("London", true)],
  ["Advance to Montreal.", move("Montreal", false)],
  [
    "Advance to the Monopoly Rail Transport. If you pass Go, collect 2M.",
    move("Monopoly Rail", true),
  ],
  [
    "Advance to the nearest Transport. If unowned, you may buy it from the Bank. " +
      "If owned, pay owner twice the rental to which they are otherwise entitled. " +
      "If you pass Go, collect 2M.",
    advanceToNearest("transport"),
  ],
  [
    "Advance to the nearest Transport. If unowned, you may buy it from the Bank. " +
      "If owned, pay owner twice the rental to which they are otherwise entitled. " +
      "If you pass Go, collect 2M.",
    advanceToNearest("transport"),
  ],
  [
    "Advance to the nearest Utility. If unowned, you may buy it from the Bank. " +
      "If owned, throw dice and pay owner a total 10,000 times the amount thrown. " +
      "If you pass Go, collect 2M.",
    advanceToNearest("utility"),
  ],
  ["Collect 500K.", alterBalance(500)],
  ["Collect 1.5M.", alterBalance(1500)],
  ["For each house pay 250K, for each hotel pay 1M.", collectTaxes(250, 1000)],
  ["Get out of Jail free.", acquireGetOutOfJailFreeCard],
  ["Go back 3 spaces.", moveSimple(-3)],
  ["Go directly to Jail. Do not pass Go, do not collect 2M.", arrestPlayer],
  ["Pay 150K.", alterBalance(-150)],
  ["Pay each player 500K.", transferMoneyToEachPlayer(500)],
];

const _chestCards: CardInitializer[] = [
  ["Advance to Go. Collect 2M.", move("Go", true)],
  ["Collect 100K from each player.", transferMoneyToEachPlayer(-100)],
  ["Collect 100K.", alterBalance(100)],
  ["Collect 100K.", alterBalance(100)],
  ["Collect 200K.", alterBalance(200)],
  ["Collect 250K.", alterBalance(250)],
  ["Collect 500K.", alterBalance(500)],
  ["Collect 1M.", alterBalance(1000)],
  ["Collect 1M.", alterBalance(1000)],
  ["Collect 2M.", alterBalance(2000)],
  ["For each house pay 400K, for each hotel pay 1.15M.", collectTaxes(400, 1150)],
  ["Get out of Jail free.", acquireGetOutOfJailFreeCard],
  ["Go directly to Jail. Do not pass Go, do not collect 2M.", arrestPlayer],
  ["Pay 500K.", alterBalance(-500)],
  ["Pay 1M.", alterBalance(-1000)],
];

function cardFactory([description, action]: CardInitializer): Card {
  return { action, description };
}
export const chanceCards = _chanceCards.map(cardFactory);
export const chestCards = _chestCards.map(cardFactory);
