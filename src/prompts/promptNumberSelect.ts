import { prompt } from "enquirer";

import type { Choice } from "../interfaces/choice";

export default async function promptNumberSelect(
  message: string,
  choices: Choice[],
): Promise<number> {
  const answer = await prompt<{ value: string }>({
    type: "select",
    name: "value",
    message,
    choices,
  });
  return Number(answer.value);
}
