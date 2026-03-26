import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Contract } from './schemas/contract.schema';
import { ContractCreateI, MilestoneI, LandRentalI } from './contracts.types';
import { OfferService } from '../investor/offer/offer.service';
import { LandOwnerAd } from '../land-owner/land-ads/schemas/land-owner-ad.schema';
import { PaymentsService } from '../payments/payments.service';
import { CreatePaymentI } from '../payments/payments.types';
import { OfferType } from '../investor/offer/schemas/offer.schema';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<Contract>,
    @InjectModel(LandOwnerAd.name)
    private readonly landOwnerAdModel: Model<LandOwnerAd>,
    private readonly offerService: OfferService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(
    contractData: ContractCreateI,
    userId?: string,
  ): Promise<Contract> {
    this.ensureSupportedType(contractData.type);

    const offerId = contractData.offer;

    if (!Types.ObjectId.isValid(offerId)) {
      throw new Error('Invalid offer ID');
    }

    const offer = await this.offerService.findById(offerId);

    if (!offer) {
      throw new Error('Offer not found');
    }

    this.validateOfferForContractType(
      contractData.type,
      offer.offerType as unknown as OfferType,
    );

    const landAd = await this.resolveLandAd(contractData);

    const investorId = this.resolveInvestorId(contractData, offer);
    const farmerId = this.resolveObjectId(contractData.farmer);
    const landownerId =
      this.resolveObjectId(contractData.landowner) ||
      this.getLandAdLandownerId(landAd);

    if (contractData.type !== 'land-owner-ad' && !farmerId) {
      throw new Error('Farmer is required for this contract type');
    }

    if (contractData.type === 'land-owner-ad' && !landownerId) {
      throw new Error('Land owner is required for land-owner-ad contracts');
    }

    const normalizedMilestones = this.normalizeMilestones(
      contractData.milestones,
    );
    const financialBreakdown = this.resolveFinancialBreakdown(
      contractData,
      offer,
      landAd,
    );
    const startDate = this.resolveStartDate(
      contractData,
      landAd,
      normalizedMilestones,
    );
    const endDate = this.resolveEndDate(
      contractData,
      landAd,
      normalizedMilestones,
    );

    const payload = this.buildContractPayload({
      contractData,
      offer,
      landAd,
      offerId,
      investorId,
      farmerId,
      landownerId,
      normalizedMilestones,
      financialBreakdown,
      startDate,
      endDate,
    });

    const filter = this.buildUpsertFilter(
      contractData,
      offerId,
      investorId,
      farmerId,
      landownerId,
      landAd?._id,
    );

    const createdContract = await this.contractModel.findOneAndUpdate(
      filter,
      payload,
      { upsert: true, new: true },
    );

    if (!createdContract) {
      throw new Error('Failed to create contract');
    }

    const confirmationPatch = this.buildConfirmationPatch(
      createdContract,
      userId,
    );

    if (Object.keys(confirmationPatch).length > 0) {
      await this.contractModel.updateOne(
        { _id: createdContract._id },
        confirmationPatch,
      );
    }

    const contract = await this.contractModel.findById(createdContract._id);

    if (!contract) {
      throw new Error('Failed to retrieve created contract');
    }

    return this.attachPaymentsIfMissing(contract, normalizedMilestones);
  }

  private ensureSupportedType(type: ContractCreateI['type']): void {
    const supportedTypes = [
      'investor-harvest-base',
      'land-owner-ad',
      'investor-sponsorship',
    ];

    if (!supportedTypes.includes(type)) {
      throw new Error(`Unsupported contract type: ${type}`);
    }
  }

  private validateOfferForContractType(
    contractType: ContractCreateI['type'],
    offerType: OfferType,
  ): void {
    const validations: Record<string, string | string[]> = {
      'investor-harvest-base': 'direct-harvest',
      'investor-sponsorship': 'sponsorship',
      'land-owner-ad': 'land-rental',
    };

    const expectedOfferType = validations[contractType];

    if (!expectedOfferType) {
      throw new Error(
        `No validation mapping for contract type: ${contractType}`,
      );
    }

    const expectedTypes = Array.isArray(expectedOfferType)
      ? expectedOfferType
      : [expectedOfferType];

    if (!expectedTypes.includes(offerType)) {
      throw new Error(
        `Invalid offer type for contract type ${contractType}. Expected ${expectedTypes.join(' or ')}, got ${offerType}`,
      );
    }
  }

  private resolveInvestorId(
    contractData: ContractCreateI,
    offer: { investor?: unknown },
  ): Types.ObjectId {
    const investorId =
      this.resolveObjectId(contractData.investor) ||
      this.extractNestedObjectId(offer.investor);

    if (!investorId) {
      throw new Error('Could not resolve investor ID');
    }

    return investorId;
  }

  private resolveMilestones(
    contractData: ContractCreateI,
    offer: {
      commissionDetails?: {
        sponsorshipTitle?: string;
        minimumInvestment?: number;
      };
      description?: string;
      expiredDate?: Date;
      harvestBaseDetails?: {
        projectTitle?: string;
        totalBudget?: number;
      };
    },
    landAd: LandOwnerAd | null,
  ): MilestoneI[] {
    if (contractData.milestones && contractData.milestones.length > 0) {
      return contractData.milestones;
    }

    switch (contractData.type) {
      case 'investor-sponsorship':
        return this.buildSponsorshipMilestones(
          offer,
          contractData.projectName || '',
        );
      case 'land-owner-ad':
        return this.buildLandOwnerMilestones(offer, landAd);
      case 'investor-harvest-base':
      default:
        return [];
    }
  }

  private resolveFinancialBreakdown(
    contractData: ContractCreateI,
    offer: {
      commissionDetails?: {
        supportType?: string[];
        minimumInvestment?: number;
        sponsorshipTitle?: string;
      };
      harvestBaseDetails?: {
        totalBudget?: number;
      };
    },
    landAd: LandOwnerAd | null,
  ): Array<{ category: string; amount: number }> {
    if (
      contractData.financialBreakdown &&
      contractData.financialBreakdown.length > 0
    ) {
      return contractData.financialBreakdown;
    }

    if (contractData.type === 'investor-sponsorship') {
      return this.buildSponsorshipFinancialBreakdown(offer);
    }

    if (contractData.type === 'land-owner-ad' && landAd) {
      const rentPerMonth = landAd.rentalAmount || 0;
      return [{ category: 'Land Rent', amount: rentPerMonth }];
    }

    if (contractData.investorAmount) {
      return [{ category: 'Investment', amount: contractData.investorAmount }];
    }

    return [];
  }

  private resolveStartDate(
    contractData: ContractCreateI,
    landAd: LandOwnerAd | null,
    milestones: MilestoneI[],
  ): Date {
    if (contractData.startDate) {
      return new Date(contractData.startDate);
    }

    if (milestones.length > 0) {
      return new Date(milestones[0].startDate);
    }

    if (landAd?.availableFrom) {
      return new Date(landAd.availableFrom);
    }

    return new Date();
  }

  private resolveEndDate(
    contractData: ContractCreateI,
    landAd: LandOwnerAd | null,
    milestones: MilestoneI[],
  ): Date {
    if (contractData.endDate) {
      return new Date(contractData.endDate);
    }

    if (milestones.length > 0) {
      return new Date(milestones[milestones.length - 1].endDate);
    }

    if (landAd?.availableTo) {
      return new Date(landAd.availableTo);
    }

    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    return oneYearFromNow;
  }

  private buildContractPayload({
    contractData,
    offer,
    landAd,
    offerId,
    investorId,
    farmerId,
    landownerId,
    normalizedMilestones,
    financialBreakdown,
    startDate,
    endDate,
  }: {
    contractData: ContractCreateI;
    offer: {
      _id: Types.ObjectId;
      offerType: OfferType;
      cropIcon?: string;
      backgroundImage?: string;
      expectedROI?: number;
      description?: string;
      harvestBaseDetails?: {
        projectTitle?: string;
        cropType?: string;
        companyName?: string;
        deliveryLocation?: string;
        totalBudget?: number;
      };
      commissionDetails?: {
        cropTypes?: string[];
        minimumInvestment?: number;
        sponsorshipTitle?: string;
        preferredRegions?: string[];
      };
    };
    landAd: LandOwnerAd | null;
    offerId: string;
    investorId: Types.ObjectId;
    farmerId?: Types.ObjectId;
    landownerId?: Types.ObjectId;
    normalizedMilestones: MilestoneI[];
    financialBreakdown: Array<{ category: string; amount: number }>;
    startDate: Date;
    endDate: Date;
  }): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      type: contractData.type,
      offer: offerId,
      investor: investorId,
      startDate,
      endDate,
      milestones: normalizedMilestones,
      financialBreakdown,
      status: contractData.status || 'active',
    };

    if (farmerId) {
      payload.farmer = farmerId;
    }

    if (landownerId) {
      payload.landowner = landownerId;
    }

    if (landAd) {
      payload.landAd = landAd._id;
    }

    payload.projectName =
      contractData.projectName ||
      offer.harvestBaseDetails?.projectTitle ||
      offer.commissionDetails?.sponsorshipTitle ||
      '';

    payload.cropType =
      contractData.cropType || offer.harvestBaseDetails?.cropType || '';

    payload.cropIcon = contractData.cropIcon || offer.cropIcon || '';

    payload.location =
      contractData.location || this.getLandAdLocation(landAd) || '';

    payload.expectedROI = contractData.expectedROI || offer.expectedROI || 0;

    payload.backgroundImage =
      contractData.backgroundImage || offer.backgroundImage || '';

    payload.investmentType =
      contractData.investmentType ||
      (contractData.type === 'investor-sponsorship' ? 'commission' : 'harvest');

    payload.investorName = contractData.investorName || '';

    payload.investorAmount =
      contractData.investorAmount ||
      offer.commissionDetails?.minimumInvestment ||
      0;

    payload.riskLevel = contractData.riskLevel || 'MEDIUM';

    payload.riskStatus = contractData.riskStatus || '';

    payload.landRentals =
      contractData.landRentals && contractData.landRentals.length > 0
        ? contractData.landRentals
        : this.generateLandRentalsFromLandAd(landAd);

    return this.withoutUndefined(payload);
  }

  private buildUpsertFilter(
    contractData: ContractCreateI,
    offerId: string,
    investorId: Types.ObjectId,
    farmerId?: Types.ObjectId,
    landownerId?: Types.ObjectId,
    landAdId?: Types.ObjectId,
  ): FilterQuery<Contract> {
    const filter: FilterQuery<Contract> = {
      type: contractData.type,
      offer: offerId,
      investor: investorId,
    };

    if (contractData.type === 'land-owner-ad' && landAdId) {
      filter.landAd = landAdId;
    } else if (contractData.type === 'land-owner-ad' && landownerId) {
      filter.landowner = landownerId;
    } else if (farmerId) {
      filter.farmer = farmerId;
    }

    return filter;
  }

  private buildConfirmationPatch(
    contractLike: {
      investor?: Types.ObjectId;
      farmer?: Types.ObjectId;
      landowner?: Types.ObjectId;
      investorConfirmed?: boolean;
      farmerConfirmed?: boolean;
      landownerConfirmed?: boolean;
    },
    userId?: string,
  ): Record<string, boolean> {
    const patch: Record<string, boolean> = {};

    if (!userId) {
      return patch;
    }

    const investorIdStr = contractLike.investor?.toString();
    const farmerIdStr = contractLike.farmer?.toString();
    const landownerIdStr = contractLike.landowner?.toString();

    if (userId === investorIdStr && !contractLike.investorConfirmed) {
      patch.investorConfirmed = true;
    }

    if (userId === farmerIdStr && !contractLike.farmerConfirmed) {
      patch.farmerConfirmed = true;
    }

    if (userId === landownerIdStr && !contractLike.landownerConfirmed) {
      patch.landownerConfirmed = true;
    }

    if (Object.keys(patch).length > 0) {
      const investorConfirmed =
        patch.investorConfirmed ?? contractLike.investorConfirmed ?? false;
      const farmerConfirmed =
        patch.farmerConfirmed ?? contractLike.farmerConfirmed ?? false;
      const landownerConfirmed =
        patch.landownerConfirmed ?? contractLike.landownerConfirmed ?? false;

      patch.fullyConfirmed = this.computeFullyConfirmed(
        contractLike,
        investorConfirmed,
        farmerConfirmed,
        landownerConfirmed,
      );
    }

    return patch;
  }

  private computeFullyConfirmed(
    contractLike: {
      investor?: Types.ObjectId;
      farmer?: Types.ObjectId;
      landowner?: Types.ObjectId;
    },
    investorConfirmed: boolean,
    farmerConfirmed: boolean,
    landownerConfirmed: boolean,
  ): boolean {
    const requiresInvestor = !!contractLike.investor;
    const requiresFarmer = !!contractLike.farmer;
    const requiresLandowner = !!contractLike.landowner;

    let confirmationCount = 0;
    let requiredCount = 0;

    if (requiresInvestor) {
      requiredCount++;
      if (investorConfirmed) {
        confirmationCount++;
      }
    }

    if (requiresFarmer) {
      requiredCount++;
      if (farmerConfirmed) {
        confirmationCount++;
      }
    }

    if (requiresLandowner) {
      requiredCount++;
      if (landownerConfirmed) {
        confirmationCount++;
      }
    }

    return requiredCount > 0 && confirmationCount === requiredCount;
  }

  private async attachPaymentsIfMissing(
    contract: Contract,
    milestones: MilestoneI[],
  ): Promise<Contract> {
    // Check if contract already has payments associated
    try {
      const existingPayments = await this.paymentsService.findByContractId(
        contract._id as unknown as Types.ObjectId,
      );

      if (existingPayments && existingPayments.length > 0) {
        return contract;
      }
    } catch {
      // Payments service might not be available, continue without payments
    }

    const pendingPayments = this.generatePendingPayments(
      milestones,
      contract._id as unknown as Types.ObjectId,
    );

    if (pendingPayments.length > 0) {
      try {
        await this.paymentsService.createMany(pendingPayments);
      } catch {
        // Payments creation failed, continue without payments
      }
    }

    return contract;
  }

  private buildLandOwnerMilestones(
    offer: {
      description?: string;
      harvestBaseDetails?: {
        projectTitle?: string;
        totalBudget?: number;
      };
      commissionDetails?: {
        minimumInvestment?: number;
      };
      expiredDate?: Date;
    },
    landAd: LandOwnerAd | null,
  ): MilestoneI[] {
    const milestones: MilestoneI[] = [];

    if (!landAd) {
      return milestones;
    }

    const months = this.calculateRentalMonths(
      landAd.availableFrom,
      landAd.availableTo,
    );
    const startDate = new Date(landAd.availableFrom);

    for (let i = 0; i < months; i++) {
      const milestoneStart = new Date(startDate);
      milestoneStart.setMonth(milestoneStart.getMonth() + i);

      const milestoneEnd = new Date(milestoneStart);
      milestoneEnd.setMonth(milestoneEnd.getMonth() + 1);

      milestones.push({
        title: `${this.getMonthLabel(milestoneStart)} Payment`,
        description: `Land rental payment for ${this.getMonthLabel(milestoneStart)}`,
        startDate: milestoneStart,
        endDate: milestoneEnd,
        payment: landAd.rentalAmount || 0,
        status: 'pending',
      });
    }

    return milestones;
  }

  private resolveObjectId(value?: string): Types.ObjectId | undefined {
    if (!value) {
      return undefined;
    }

    if (Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    return undefined;
  }

  private extractNestedObjectId(value: unknown): Types.ObjectId | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Types.ObjectId) {
      return value;
    }

    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;

      if (obj._id instanceof Types.ObjectId) {
        return obj._id;
      }

      if (typeof obj._id === 'string' && Types.ObjectId.isValid(obj._id)) {
        return new Types.ObjectId(obj._id);
      }

      if ('id' in obj && obj.id instanceof Types.ObjectId) {
        return obj.id;
      }

      if (
        'id' in obj &&
        typeof obj.id === 'string' &&
        Types.ObjectId.isValid(obj.id)
      ) {
        return new Types.ObjectId(obj.id);
      }
    }

    return undefined;
  }

  private withoutUndefined(
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
  }

  private normalizeMilestones(milestones?: MilestoneI[]): MilestoneI[] {
    if (!milestones || milestones.length === 0) {
      return [];
    }

    return milestones.map((milestone) => ({
      ...milestone,
      startDate: new Date(milestone.startDate),
      endDate: new Date(milestone.endDate),
      completedDate: milestone.completedDate
        ? new Date(milestone.completedDate)
        : undefined,
    }));
  }

  private buildSponsorshipMilestones(
    offer: {
      commissionDetails?: {
        sponsorshipTitle?: string;
        minimumInvestment?: number;
      };
      description?: string;
      expiredDate?: Date;
    },
    projectName: string,
  ): MilestoneI[] {
    const expiredDate = offer.expiredDate
      ? new Date(offer.expiredDate)
      : new Date();
    const startDate = new Date();
    const endDate = new Date(expiredDate);

    return [
      {
        title: `${projectName || offer.commissionDetails?.sponsorshipTitle || 'Sponsorship'} - Commitment Period`,
        description: offer.description || 'Sponsorship commitment period',
        startDate,
        endDate,
        payment: offer.commissionDetails?.minimumInvestment || 0,
        status: 'pending',
      },
    ];
  }

  private buildSponsorshipFinancialBreakdown(offer: {
    commissionDetails?: {
      supportType?: string[];
      minimumInvestment?: number;
      sponsorshipTitle?: string;
    };
  }): Array<{ category: string; amount: number }> {
    const breakdown: Array<{ category: string; amount: number }> = [];

    if (
      offer.commissionDetails?.supportType &&
      offer.commissionDetails.supportType.length > 0
    ) {
      const supportTypeCount = offer.commissionDetails.supportType.length;
      const minimumInvestment = offer.commissionDetails.minimumInvestment || 0;

      offer.commissionDetails.supportType.forEach((type) => {
        breakdown.push({
          category: type,
          amount: Math.round(minimumInvestment / supportTypeCount),
        });
      });
    } else {
      breakdown.push({
        category: offer.commissionDetails?.sponsorshipTitle || 'Sponsorship',
        amount: offer.commissionDetails?.minimumInvestment || 0,
      });
    }

    return breakdown;
  }

  private async resolveLandAd(
    contractData: ContractCreateI,
  ): Promise<LandOwnerAd | null> {
    if (!contractData.landAd) {
      return null;
    }

    if (!Types.ObjectId.isValid(contractData.landAd)) {
      return null;
    }

    const landAd = await this.landOwnerAdModel.findById(contractData.landAd);

    return landAd || null;
  }

  private getLandAdLocation(landAd: LandOwnerAd | null): string | undefined {
    if (!landAd) {
      return undefined;
    }

    // TODO: Get location from landAd.location object with coordinates
    return landAd.title || undefined;
  }

  private getLandAdLandownerId(
    landAd: LandOwnerAd | null,
  ): Types.ObjectId | undefined {
    if (!landAd || !landAd.landowner) {
      return undefined;
    }

    if (landAd.landowner instanceof Types.ObjectId) {
      return landAd.landowner;
    }

    if (
      typeof landAd.landowner === 'string' &&
      Types.ObjectId.isValid(landAd.landowner)
    ) {
      return new Types.ObjectId(landAd.landowner);
    }

    if (typeof landAd.landowner === 'object' && landAd.landowner !== null) {
      const obj = landAd.landowner as unknown as Record<string, unknown>;

      if (obj._id instanceof Types.ObjectId) {
        return obj._id;
      }

      if (typeof obj._id === 'string' && Types.ObjectId.isValid(obj._id)) {
        return new Types.ObjectId(obj._id);
      }
    }

    return undefined;
  }

  private generateLandRentalsFromLandAd(landAd: LandOwnerAd | null) {
    if (!landAd) {
      return [];
    }

    const rentals: LandRentalI[] = [];
    const months = this.calculateRentalMonths(
      landAd.availableFrom,
      landAd.availableTo,
    );
    const startDate = new Date(landAd.availableFrom);

    for (let i = 0; i < months; i++) {
      const rentalMonth = new Date(startDate);
      rentalMonth.setMonth(rentalMonth.getMonth() + i);

      rentals.push({
        id: `${landAd._id.toString()}-${i}`,
        landArea: `${landAd.landArea || 0} units`,
        month: this.getMonthLabel(rentalMonth),
        dueDate: rentalMonth,
        amount: landAd.rentalAmount || 0,
        status: 'pending',
      });
    }

    return rentals;
  }

  private getMonthLabel(date: Date): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  private calculateRentalMonths(from: Date, to: Date): number {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const difference = toDate.getTime() - fromDate.getTime();
    const months = Math.ceil(difference / (1000 * 60 * 60 * 24 * 30));
    return Math.max(1, months);
  }

  private generatePendingPayments(
    milestones: MilestoneI[],
    contractId: Types.ObjectId,
  ): CreatePaymentI[] {
    return milestones.map((milestone) => ({
      contract: contractId,
      amount: milestone.payment,
      dueDate: new Date(milestone.endDate),
      description: milestone.title,
      status: 'pending',
    }));
  }
}
