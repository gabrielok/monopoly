export default class Player {
  constructor(
    public name: string,
    public balance: number = 15_000,
    public bankrupt: boolean = false,
    public getOutOfJailFreeCards: number = 0,
    public position: number = 0,
  ) {}
}
