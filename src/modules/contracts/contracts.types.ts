export interface MilestoneI {
  readonly title: string;
  readonly description: string;
  readonly progress?: number;
  readonly status?: 'pending' | 'in-progress' | 'completed';
  readonly startDate: Date | string;
  readonly endDate: Date | string;
  readonly completedDate?: Date | string;
  readonly payment: number;
}

export interface LandRentalI {
  readonly id: string;
  readonly landArea: string;
  readonly month: string;
  readonly dueDate: Date | string;
  readonly paidDate?: Date | string;
  readonly amount: number;
  readonly status: 'pending' | 'paid' | 'overdue';
}

export interface FinancialBreakdownI {
  readonly category: string;
  readonly amount: number;
}

export interface ContractCreateI {
  readonly type:
    | 'investor-harvest-base'
    | 'land-owner-ad'
    | 'investor-sponsorship';
  readonly offer: string;
  readonly landAd?: string;
  readonly investor?: string;
  readonly farmer?: string;
  readonly landowner?: string;
  readonly projectName?: string;
  readonly cropType?: string;
  readonly cropIcon?: string;
  readonly location?: string;
  readonly district?: string;
  readonly province?: string;
  readonly coordinates?: string;
  readonly expectedROI?: number;
  readonly status?: 'active' | 'inactive' | 'completed' | 'terminated';
  readonly investmentType?: 'harvest' | 'commission';
  readonly startDate?: Date | string;
  readonly endDate?: Date | string;
  readonly backgroundImage?: string;
  readonly investorName?: string;
  readonly investorAmount?: number;
  readonly riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly riskStatus?: string;
  readonly milestones?: MilestoneI[];
  readonly landRentals?: LandRentalI[];
  readonly financialBreakdown?: FinancialBreakdownI[];
}
