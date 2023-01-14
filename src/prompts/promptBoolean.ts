import { parseBool } from "@umatch/utils/string";
import { prompt } from "enquirer";

export default async function promptBoolean(
  message: string,
  inverted?: boolean,
): Promise<boolean> {
  const choices = ["Yes", "No"];
  if (inverted) choices.reverse();

  const answer = await prompt<{ choice: string }>({
    type: "select",
    name: "choice",
    message,
    choices,
  });
  return parseBool(answer.choice);
}
