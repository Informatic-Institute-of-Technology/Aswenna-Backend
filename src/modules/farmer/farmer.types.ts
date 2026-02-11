export interface FarmerCreateI {
  readonly fullName: string;
  readonly address: string;
  readonly nicNumber: string;
  readonly email: string;
  readonly phoneNumber: string;
  readonly password: string;
  readonly role: string;
  readonly experience: string;
  readonly crop: string;
  readonly regions: string;
  readonly specificNeeds: string;
}

export interface FarmerUpdateI {
  readonly experience: string;
  readonly crop: string;
  readonly regions: string;
  readonly specificNeeds: string;
}
