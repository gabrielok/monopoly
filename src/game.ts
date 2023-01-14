import { groupBy } from "@umatch/utils/array";
import chalk from "chalk";

import { isSite, Site } from "./interfaces/site";

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
    console.log(`${player.name} picked: ` + chalk.bgHex("#fa8e48")(card.description));
    card.action(player, this);
  }

  public doesOwnerOwnSet(owner: Player, site: Site): boolean {
    const sites = this.properties.filter(isSite);
    const colorSet = groupBy(sites, "color")[site.color];
    return colorSet.every((p) => p.owner === owner.name);
  }

  public getPlayerProperties(player: Player): Property[] | undefined {
    return groupBy(this.properties, "owner")[player.name];
  }

  public getPropertiesOfType(type: Property["type"]): Property[] {
    return groupBy(this.properties, "type")[type];
  }

  public getProperty(name: Place): Property {
    const property = this.properties.find((p) => p.name === name);
    if (!property) throw new Error(`Unrecognized property name: ${name}`);
    return property;
  }
}
