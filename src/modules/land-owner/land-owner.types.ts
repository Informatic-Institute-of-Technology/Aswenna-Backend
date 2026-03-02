export interface LandOwnerCreateI {
  readonly user: string;
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly location: {
    readonly latitude: number;
    readonly longitude: number;
  };
  readonly landAddress: {
    readonly street: string;
    readonly city: string;
    readonly province: string;
    readonly district: string;
    readonly postalCode: string;
    readonly size: string;
    readonly soilType: string;
    readonly rentalExpectation: string;
    readonly dsDivision: string;
    readonly gnDivision: string;
  };
}
