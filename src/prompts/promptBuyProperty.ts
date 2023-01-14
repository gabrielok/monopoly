import { remove } from "@umatch/utils/array";
import { nthElement } from "@umatch/utils/math";
import { parseBool } from "@umatch/utils/string";
import { prompt } from "enquirer";

import { alterBalance } from "../actions";
import promptBoolean from "./promptBoolean";
import promptNumberSelect from "./promptNumberSelect";

import type Game from "../game";
import type { Property } from "../interfaces/property";
import type Player from "../player";

async function handlePropertySale(player: Player, property: Property): Promise<boolean> {
  const hasMoney = () => player.balance >= property.price;
  if (!hasMoney()) {
    console.log("Oops! You don't have enough balance.");
    while (!hasMoney()) {
      const answer = await prompt<{ action: string }>({
        type: "select",
        name: "action",
        message: "Choose an action:",
        choices: [
          // TODO: add choices
        ],
      });
      console.log(answer);
    }
  }

  const confirm = await promptBoolean(
    `Proceed to buy ${property.name} for ${property.price}?`,
  );
  if (confirm) {
    alterBalance(-property.price)(player);
    property.owner = player.name;
  }
  return confirm;
}

async function handleAuction(game: Game, property: Property) {
  console.log(`Starting auction for ${property.name} 💸`);

  let currentBid = 0;
  const bidders = [...game.players];
  let bidJumpOptions: [number, number, number, number];
  if (property.price >= 2500) {
    bidJumpOptions = [100, 250, 500, 1000];
  } else if (property.price >= 1500) {
    bidJumpOptions = [50, 100, 250, 500];
  } else {
    bidJumpOptions = [20, 50, 100, 250];
  }

  let i = 0;
  while (bidders.length > 1) {
    const player = nthElement(bidders, i);
    const bid = await promptNumberSelect(`${player.name}, what is your bid?`, [
      {
        name: "0",
        hint: "(quit auction)",
      },
      ...bidJumpOptions.map((increase) => ({
        name: String(currentBid + increase),
        hint: `(+${increase})`,
      })),
    ]);
    if (bid === 0) {
      remove(bidders, player);
    } else {
      currentBid = bid;
    }
    i += 1;
  }

  const [winner] = bidders;
  console.log(`${winner.name} won the auction for ${property.name} at ${currentBid}! 🎉`);
  alterBalance(-property.price)(winner);
  property.owner = winner.name;
}

export async function promptBuyProperty(player: Player, game: Game, property: Property) {
  const alwaysAuction = parseBool(process.env.ALWAYS_AUCTION);
  if (!alwaysAuction) {
    const wantsToBuy = await promptBoolean(
      `${player.name}, do you want to buy ${property.name} for ${property.price}?`,
    );
    if (wantsToBuy) {
      const sold = await handlePropertySale(player, property);
      if (sold) return;
    }
  }
  await handleAuction(game, property);
}
