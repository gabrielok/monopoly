import { basicPluralizer, formatStr, pad } from "@umatch/utils/string";

import { isSite } from "./interfaces/site";

import type { Property } from "./interfaces/property";
import type { Site } from "./interfaces/site";

type PropertyInitializer = ["transport" | "utility", Property["name"], Property["price"]];
type SiteInitializer = [
  "site",
  Site["name"],
  Site["price"],
  Site["color"],
  Site["rent"],
  Site["houseCost"],
];

const _properties: (PropertyInitializer | SiteInitializer)[] = [
  ["site", "Athens", 1200, "light blue", [80, 400, 1000, 3000, 4500, 6000], 500],
  ["site", "Barcelona", 1000, "light blue", [60, 300, 900, 2700, 4000, 5500], 500],
  ["site", "Beijing", 2600, "yellow", [220, 1100, 3300, 8000, 9750, 11500], 1500],
  ["site", "Belgrade", 3000, "green", [260, 1300, 3900, 9000, 11000, 12750], 2000],
  ["site", "Cape Town", 3200, "green", [280, 1500, 4500, 10000, 12000, 14000], 2000],
  ["site", "Gdynia", 600, "brown", [20, 100, 300, 900, 1600, 2500], 500],
  ["site", "Hong Kong", 2600, "yellow", [220, 1100, 3300, 8000, 9750, 11500], 3000],
  ["site", "Istambul", 1400, "pink", [100, 500, 1500, 4500, 6250, 7500], 1000],
  ["site", "Jerusalem", 2800, "yellow", [240, 1200, 3600, 8500, 10250, 12000], 1500],
  ["site", "Kiev", 1400, "pink", [100, 500, 1500, 4500, 6250, 7500], 1000],
  ["site", "London", 2400, "red", [200, 1000, 3000, 7500, 9250, 11000], 1500],
  ["site", "Montreal", 4000, "blue", [500, 2000, 6000, 14000, 17000, 20000], 2000],
  ["site", "New York", 2200, "red", [180, 900, 2500, 7000, 8750, 10500], 1500],
  ["site", "Paris", 3000, "green", [260, 1300, 3900, 9000, 11000, 12750], 2000],
  ["site", "Riga", 3500, "blue", [350, 1750, 5000, 11000, 13000, 15000], 2000],
  ["site", "Rome", 1800, "orange", [140, 700, 2000, 5500, 7500, 9500], 1000],
  ["site", "Shanghai", 1800, "orange", [140, 700, 2000, 5500, 7500, 9500], 1000],
  ["site", "Sydney", 2200, "red", [180, 900, 2500, 7000, 8750, 10500], 1500],
  ["site", "Taipei", 600, "brown", [40, 200, 600, 1800, 3200, 4500], 500],
  ["site", "Tokyo", 1000, "light blue", [60, 300, 900, 2700, 4000, 5500], 500],
  ["site", "Toronto", 1600, "pink", [120, 600, 1800, 5000, 7000, 9000], 1000],
  ["site", "Vancouver", 2000, "orange", [160, 800, 2200, 6000, 8000, 10000], 1000],
  ["transport", "Monopoly Air", 2000],
  ["transport", "Monopoly Cruise", 2000],
  ["transport", "Monopoly Rail", 2000],
  ["transport", "Monopoly Space", 2000],
  ["utility", "Solar Energy", 1500],
  ["utility", "Wind Energy", 1500],
];

export const PROPERTIES: (Property | Site)[] = _properties.map(
  (data: PropertyInitializer | SiteInitializer) => {
    const [type, name, price] = data;
    const mortgageAmount = price / 2;
    const mortgaged = false;
    const owner = "";
    if (type === "site") {
      const [_type, _name, _price, color, rent, houseCost] = data;
      return {
        color,
        hotelCost: houseCost,
        hotels: 0,
        houseCost,
        houses: 0,
        mortgageAmount,
        mortgaged,
        name,
        owner,
        price,
        rent,
        type,
      } satisfies Site;
    } else {
      return {
        mortgageAmount,
        mortgaged,
        name,
        owner,
        price,
        type,
      } satisfies Property;
    }
  },
);

export function formatMoney(value: number): string {
  return value >= 1000 ? value / 1000 + "M" : value + "K";
}

const whiteLineFn =
  (length: number) =>
  (...params: Parameters<typeof formatStr>) =>
    formatStr(params[0], { color: "black", bgColor: "white", length, ...params[1] });
const redLineFn =
  (length: number) =>
  (...params: Parameters<typeof formatStr>) =>
    formatStr(params[0], {
      color: "white",
      bgColor: "red",
      length: length - 4,
      ...params[1],
    });

export function displayProperty(property: Property) {
  if (isSite(property)) {
    displaySite(property);
    return;
  } else if (property.type === "transport") {
    displayTransport(property);
  } else {
    displayUtility(property);
  }
}

const PRINT_WIDTH = 32;

function displayTransport(property: Property) {
  const innerWidth = PRINT_WIDTH - 2;
  const whiteLine = whiteLineFn(PRINT_WIDTH);
  const baseRent = Number(process.env.RENT_TRANSPORT);
  const rents = [0, 1, 2, 3].map((i) => formatMoney(baseRent * 2 ** i));
  const lines = [
    // TODO: add some icon
    whiteLine(),
    whiteLine(),
    whiteLine(),
    whiteLine(),
    whiteLine(),
    whiteLine(property.name, { bold: true }),
    whiteLine(),
    whiteLine(pad("RENT", rents[0], innerWidth)),
    ...[2, 3, 4].map((number) =>
      [
        whiteLine(pad("If " + basicPluralizer("transport", number), "", innerWidth)),
        whiteLine(pad("are owned", rents[number - 1], innerWidth)),
      ].join("\n"),
    ),
    whiteLine(),
    whiteLine(`MORTGAGE VALUE - ${formatMoney(property.price)}`),
    whiteLine(),
  ];
  console.log(lines.join("\n"));
}

function displayUtility(property: Property) {
  const whiteLine = whiteLineFn(PRINT_WIDTH);
  const baseRent = Number(process.env.RENT_UTILITY);
  const lines = [
    // TODO: add some icon
    whiteLine(),
    whiteLine(),
    whiteLine(),
    whiteLine(),
    whiteLine(),
    whiteLine(property.name, { bold: true }),
    whiteLine(),
    whiteLine('If 1 "Utility" is owned,'),
    whiteLine("rent is 4 times amount"),
    whiteLine("shown on dice.*"),
    whiteLine(),
    whiteLine('If both "Utilities" are owned,'),
    whiteLine("rent is 10 times amount"),
    whiteLine("shown on dice.*"),
    whiteLine(),
    whiteLine(`MORTGAGE VALUE - ${formatMoney(property.price)}`),
    whiteLine(),
    whiteLine(`* Multiplied by ${formatMoney(baseRent)}`),
    whiteLine(),
  ];
  console.log(lines.join("\n"));
}

function displaySite(site: Site) {
  const innerWidth = PRINT_WIDTH - 6;
  const whiteLine = whiteLineFn(PRINT_WIDTH);
  const redLine = redLineFn(PRINT_WIDTH);

  const rents = site.rent.map(formatMoney);
  const [baseRent] = rents;
  const rentsWithHouses = rents.slice(1, -1);
  const rentWithHotel = rents.at(-1)!;
  const lines = [
    whiteLine(),
    whiteLine(redLine()),
    whiteLine(redLine(site.name), { bold: true }),
    whiteLine(redLine()),
    whiteLine(),
    whiteLine(`Rent: ${baseRent}`),
    whiteLine(),
    ...rentsWithHouses.map((rent, i) =>
      whiteLine(pad(`With ${basicPluralizer("House", i + 1)} `, rent, innerWidth)),
    ),
    whiteLine(pad(`With Hotel`, rentWithHotel, innerWidth)),
    whiteLine(),
    whiteLine(`Mortgage Value ${formatMoney(site.price)}`),
    whiteLine(),
    whiteLine(`Houses cost ${formatMoney(site.houseCost)} each`),
    whiteLine(`Hotels, ${formatMoney(site.hotelCost)} each`),
    whiteLine("plus 4 houses"),
    whiteLine(),
  ];
  console.log(lines.join("\n"));
}
