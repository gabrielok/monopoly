export class Player {
  constructor(
    public name: string,
    public balance: number = 15_000,
    public getOutOfJailFreeCards: number = 0,
    public position: number = 0,
  ) {}
}
