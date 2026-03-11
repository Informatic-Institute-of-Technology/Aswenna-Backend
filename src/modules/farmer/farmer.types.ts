export interface FarmerCreateI {
  readonly user: string;
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly govijanaSevaId: string;
  readonly crop: string;
  readonly experience: string;
  readonly regions: string;
  readonly specificNeeds: string;
}

export interface FarmerUpdateI {
  readonly dsDivision?: string;
  readonly gnDivision?: string;
  readonly govijanaSevaId?: string;
  readonly crop?: string;
  readonly experience?: string;
  readonly regions?: string;
  readonly specificNeeds?: string;
}
