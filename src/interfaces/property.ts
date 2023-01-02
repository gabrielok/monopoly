import { Place } from "../board";

export type Property = {
  mortgageAmount: number;
  mortgaged: boolean;
  name: Place;
  owner: string;
  price: number;
  type: "site" | "transport" | "utility";
};
