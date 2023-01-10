import { groupBy } from "@umatch/utils/array";

import type { Place } from "./board";
import type { Card } from "./cards";
import type { Property } from "./interfaces/property";
import type Player from "./player";

export default class Game {
  constructor(
    public players: Player[],
    public board: readonly Place[],
    private properties: Property[],
    private chanceCards: Card[],
    private chestCards: Card[],
  ) {}

  public applyCard(player: Player, place: "Chance" | "Chest") {
    const cardStack = place === "Chance" ? this.chanceCards : this.chestCards;
    const card = cardStack.pop();
    if (!card) throw new Error("Insufficient cards");
    cardStack.unshift(card);
    console.log(`${player.name} picked: ${card.description}`);
    card.action(player, this);
  }

  public getPlayerProperties(player: Player): Property[] | undefined {
    return groupBy(this.properties, "owner")[player.name];
  }

  public getPropertiesOfType(type: Property["type"]): Property[] {
    return groupBy(this.properties, "type")[type];
  }
}
