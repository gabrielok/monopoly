import { pickRandom } from "@umatch/utils/math";

import { arrestPlayer } from "./actions";
import { BOARD } from "./board";
import { chestCards, chanceCards } from "./cards";
import { Player } from "./player";

export function processCard(player: Player) {
  const place = BOARD[player.position];
  if (place === "Go To Jail") {
    arrestPlayer(player);
  } else if (place === "Chance") {
    const [_card, effect] = pickRandom(chanceCards);
    effect(player);
  } else if (place === "Chest") {
    const [_card, effect] = pickRandom(chestCards);
    effect(player);
  }
}
