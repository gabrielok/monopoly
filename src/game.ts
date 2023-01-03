import type { Card } from "./cards";
import type Player from "./player";

export default class Game {
  constructor(
    public players: Player[],
    private chanceCards: Card[],
    private chestCards: Card[],
  ) {}

  public applyCard(player: Player, place: "Chance" | "Chest") {
    const cardStack = place === "Chance" ? this.chanceCards : this.chestCards;
    const card = cardStack.pop();
    if (!card) throw new Error("Insufficient cards");
    cardStack.unshift(card);
    card.action(player, this);
  }
}
