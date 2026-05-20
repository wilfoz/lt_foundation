export class SurveyPoint {
  constructor(
    public naturalElevation: number,
    public concreteCastingElevation: number,
    public distance: number,
  ) {}

  get protrusion(): number {
    return this.naturalElevation - this.concreteCastingElevation;
  }
}
