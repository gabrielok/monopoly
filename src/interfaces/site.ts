import type { Property } from "./property";

export type Site = Property & {
  color: "blue" | "brown" | "green" | "light blue" | "orange" | "pink" | "red" | "yellow";
  hotelCost: number;
  hotels: number;
  houseCost: number;
  houses: number;
  rent: [number, number, number, number, number, number];
  type: "site";
};

export function isSite(property: Property): property is Site {
  return property.type === "site";
}
