export enum ProjectType {
  HARVEST = 'harvest',
  COMMISSION = 'commission',
}

export enum ProjectLandAvailability {
  WITH_LAND = 'with_land',
  WITHOUT_LAND = 'without_land',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  REQUESTED = 'REQUESTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  ARCHIVED = 'ARCHIVED',
}

export interface CostBreakdownItemI {
  readonly category: string;
  readonly description: string;
  readonly estimatedCost: number;
}

export interface MilestoneBreakdownItemI {
  readonly milestone: string;
  readonly description: string;
  readonly estimatedAmount: number;
}

export interface HarvestBasedDetailsI {
  // readonly expectedHarvest: number;
  readonly expectedLandArea: number;
}

export interface CommissionBasedDetailsI {
  readonly commissionPercentage: number;
  readonly expectedLandArea: number;
}

export interface ProjectCreateI {
  readonly farmer: string;
  readonly offerType: ProjectType;
  readonly landAvailability: ProjectLandAvailability;
  readonly projectName: string;
  readonly description: string;
  readonly cropType: string;
  readonly cropIcon: string;
  readonly backgroundImage: string;
  readonly location: string;
  readonly farmingMethods: string;
  readonly preferredRegions: string[];
  readonly costBreakdown: CostBreakdownItemI[];
  readonly milestoneBreakdown: MilestoneBreakdownItemI[];
  readonly totalInvestmentRequired: number;
  readonly effectiveDateFrom: Date;
  readonly effectiveDateTo: Date;
  readonly visibility?: boolean;
  readonly harvestBasedDetails?: HarvestBasedDetailsI;
  readonly commissionBasedDetails?: CommissionBasedDetailsI;
}

export interface ProjectUpdateI {
  readonly user?: string;
  readonly offerType?: ProjectType;
  readonly landAvailability?: ProjectLandAvailability;
  readonly projectName?: string;
  readonly description?: string;
  readonly cropType?: string;
  readonly cropIcon?: string;
  readonly backgroundImage?: string;
  readonly location?: string;
  readonly farmingMethods?: string;
  readonly preferredRegions?: string[];
  readonly costBreakdown?: CostBreakdownItemI[];
  readonly milestoneBreakdown?: MilestoneBreakdownItemI[];
  readonly totalInvestmentRequired?: number;
  readonly effectiveDateFrom?: Date;
  readonly effectiveDateTo?: Date;
  readonly visibility?: boolean;
  readonly harvestBasedDetails?: HarvestBasedDetailsI;
  readonly commissionBasedDetails?: CommissionBasedDetailsI;
}

export interface ProjectStatusUpdateI {
  readonly status: ProjectStatus;
}
