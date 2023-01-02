import { groupBy } from "@umatch/utils/array";

import { movePlayer, arrestPlayer } from "./actions";
import { BOARD } from "./board";
import { Property } from "./interfaces/property";
import { Site } from "./interfaces/site";
import { Player } from "./player";
import { PROPERTIES } from "./properties";

/**
 * Returns a function, which advances the player to the nearest property
 * of the given type.
 */
function advanceToNearest(type: Property["type"]) {
  return (player: Player) => {
    const places = groupBy(PROPERTIES, "type")[type];
    const steps = places.reduce<number>((prev, transport) => {
      const newPosition = BOARD.indexOf(transport.name);
      const dist = newPosition - player.position;
      return Math.abs(dist) < Math.abs(prev) ? dist : prev;
    }, BOARD.length);
    movePlayer(player, steps, false);
  };
}

/**
 * Returns a function, which adds the value to the player's balance.
 */
function alterBalance(value: number) {
  return (player: Player) => {
    player.balance += value;
  };
}

/**
 * Returns a function, which taxes a player based on how many houses
 * and hotels it has on all its sites.
 */
function collectTaxes(houseTax: number, hotelTax: number) {
  return (player: Player) => {
    const playerProperties = groupBy(PROPERTIES, "owner")[player.name];
    if (!playerProperties) return;

    const sites = groupBy(playerProperties, "type")["site"];
    sites.forEach((site) => {
      player.balance -= (site as Site).houses * houseTax;
      player.balance -= (site as Site).hotels * hotelTax;
    });
  };
}

export const chanceCards = [
  ["Advance to Go. Collect 2M.", (player: Player) => movePlayer(player, "Go", true)],
  [
    "Advance to Istambul. If you pass Go, collect 2M.",
    (player: Player) => movePlayer(player, "Istambul"),
  ],
  [
    "Advance to London. If you pass Go, collect 2M.",
    (player: Player) => movePlayer(player, "London", true),
  ],
  ["Advance to Montreal.", (player: Player) => movePlayer(player, "Montreal", false)],
  [
    "Advance to the Monopoly Rail Transport. If you pass Go, collect 2M.",
    (player: Player) => movePlayer(player, "Monopoly Rail", true),
  ],
  [
    "Advance to the nearest Transport. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which they are otherwise entitled. If you pass Go, collect 2M.",
    advanceToNearest("transport"),
  ],
  [
    "Advance to the nearest Transport. If unowned, you may buy it from the Bank. If owned, pay owner twice the rental to which they are otherwise entitled. If you pass Go, collect 2M.",
    advanceToNearest("transport"),
  ],
  [
    "Advance to the nearest Utility. If unowned, you may buy it from the Bank. If owned, throw dice and pay owner a total 10,000 times the amount thrown. If you pass Go, collect 2M.",
    advanceToNearest("utility"),
  ],
  ["Collect 1.5M.", alterBalance(1500)],
  ["Collect 500K.", alterBalance(500)],
  ["For each house pay 250K, for each hotel pay 1M.", collectTaxes(250, 1000)],
  [
    "Get out of Jail free.",
    (player: Player) => {
      player.getOutOfJailFreeCards += 1;
    },
  ],
  [
    "Go back 3 spaces.",
    (player: Player) => {
      player.position -= 3;
    },
  ],
  ["Go directly to Jail. Do not pass Go, do not collect 2M.", arrestPlayer],
  ["Pay 150K.", alterBalance(-150)],
  ["Pay each player 500K.", (player: Player) => {}],
] as const;

export const chestCards = [
  ["Advance to Go. Collect 2M.", (player: Player) => movePlayer(player, "Go", true)],
  ["Collect 100K from each player.", (player: Player) => {}],
  ["Collect 100K.", alterBalance(100)],
  ["Collect 100K.", alterBalance(100)],
  ["Collect 1M.", alterBalance(1000)],
  ["Collect 1M.", alterBalance(1000)],
  ["Collect 200K.", alterBalance(200)],
  ["Collect 250K.", alterBalance(250)],
  ["Collect 2M.", alterBalance(2000)],
  ["Collect 500K.", alterBalance(500)],
  ["For each house pay 400K, for each hotel pay 1.15M.", collectTaxes(400, 1150)],
  [
    "Get out of Jail free.",
    (player: Player) => {
      player.getOutOfJailFreeCards += 1;
    },
  ],
  ["Go directly to Jail. Do not pass Go, do not collect 2M.", arrestPlayer],
  ["Pay 1M.", alterBalance(-1000)],
  ["Pay 500K.", alterBalance(-500)],
] as const;
