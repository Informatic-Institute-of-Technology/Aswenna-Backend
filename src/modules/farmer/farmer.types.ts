export interface FarmerCreateI {
  readonly user: string;
  readonly dsDivision: string;
  readonly gnDivision: string;
  readonly govijanaSevaId: string;
  readonly GovijanaSevaPassbookImage: string;
  readonly gnCertificateImage: string;
  readonly crop: string;
  readonly experience: string;
  readonly regions: string;
  readonly specificNeeds: string;
}

export interface FarmerUpdateI {
  readonly experience: string;
  readonly crop: string;
  readonly regions: string;
  readonly specificNeeds: string;
}
