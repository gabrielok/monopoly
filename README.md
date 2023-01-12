# Monopoly

This is an implementation of the game *Monopoly Here & Now: The World Edition*. The intent is to simulate plays and generate data, which can help further and mathematically analyze the value of different properties. 

For example, how often players land on a property is vital for determining its value. Shouldn't it be equal among all properties, though? Well, yes, except that players often go to Jail, sometimes randomly, regardless of where they are on the board. This means properties right after the Jail get visited more often. Therefore, one of the goals of this simulation is to generate a "Heat map" of properties, which shows how often players visit them.

## To do
- ~~Multiple players~~
- ~~Play again when you roll a double dice~~
- ~~Go to jail if you roll 3 doubles in one turn~~
- ~~Collect rent from other players~~
  - ~~Sites~~
  - ~~Transports~~
  - ~~Utilities~~
- ~~Buy properties from bank~~
- Auctions
- Negotiate properties with other players
- ~~Pay/collect from other players (chance cards)~~
- True multiplayer
- Front-end
- Limit the number of available houses & hotels
- Finish implementations
  - getOptions()
  - manageProperties()
  - transferMoney() => player can go bankrupt to another player
- Show card info (color, rent, price, etc.)
- Limit player actions when arrested
- Remove bankrupt players
