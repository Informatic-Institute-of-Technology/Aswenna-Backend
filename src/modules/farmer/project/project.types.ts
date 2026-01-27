export enum ProjectType {
  HARVEST = 'HARVEST',
  COMMISSION = 'COMMISSION',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REQUESTED = 'REQUESTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  ARCHIVED = 'ARCHIVED',
}

export interface HarvestDetailsI {
  readonly expectedYield: number;
  readonly yieldUnit: string;
  readonly investorSharePercentage: number;
  readonly riskLevel: string;
}

export interface CommissionDetailsI {
  readonly commissionType: 'FIXED' | 'PERCENTAGE';
  readonly commissionValue: number;
  readonly serviceDescription: string;
}

export interface ProjectCreateI {
  readonly farmer: string;
  readonly type: ProjectType;
  readonly title: string;
  readonly description: string;
  readonly cropType: string;
  readonly location: string;
  readonly investmentRequired: number;
  readonly expectedROI: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly visibility: boolean;
  readonly harvestDetails: HarvestDetailsI;
  readonly commissionDetails: CommissionDetailsI;
}

export interface ProjectUpdateI {
  readonly title: string;
  readonly description: string;
  readonly cropType: string;
  readonly location: string;
  readonly investmentRequired: number;
  readonly expectedROI: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly visibility: boolean;
  readonly harvestDetails: HarvestDetailsI;
  readonly commissionDetails: CommissionDetailsI;
}

export interface ProjectStatusUpdateI {
  readonly status: ProjectStatus;
}
