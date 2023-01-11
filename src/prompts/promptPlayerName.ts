import { prompt } from "enquirer";

import type Player from "../player";

export async function promptPlayerName(
  players: Player[],
  numberOfPlayers: number,
): Promise<string> {
  const answer = await prompt<{ name: string }>({
    type: "input",
    name: "name",
    message: `What is your name? (${players.length + 1}/${numberOfPlayers})`,
    validate(value: string): boolean | string {
      if (!value) {
        return "You need to type something";
      }
      if (value.length < 3) {
        return "Please type a longer name";
      }
      if (players.map((p) => p.name.toLowerCase()).includes(value.toLowerCase())) {
        return "Name already taken";
      }
      return true;
    },
  });
  return answer.name;
}
