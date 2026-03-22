import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Contract } from './schemas/contract.schema';
import { ContractCreateI, MilestoneI } from './contracts.types';
import { OfferService } from '../investor/offer/offer.service';
import { OfferType } from '../investor/offer/schemas/offer.schema';
import { LandOwnerAd } from '../land-owner/ads/schemas/land-owner-ad.schema';
import { PaymentsService } from '../payments/payments.service';
import { PaymentStatus } from '../payments/schemas/payment.schema';
import { CreatePaymentI } from '../payments/payments.types';

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
      throw new BadRequestException('Invalid offer ID in payload');
    }

    const offer = await this.offerService.findById(offerId);

    if (!offer) {
      throw new BadRequestException(`Offer with ID ${offerId} not found`);
    }

    this.validateOfferForContractType(contractData.type, offer.offerType);

    const landAd = await this.resolveLandAd(contractData);

    const investorId = this.resolveInvestorId(contractData, offer);
    const farmerId = this.resolveObjectId(contractData.farmer);
    const landownerId =
      this.resolveObjectId(contractData.landowner) ||
      this.getLandAdLandownerId(landAd);

    if (contractData.type !== 'land-owner-ad' && !farmerId) {
      throw new BadRequestException(
        'farmer is required for this contract type',
      );
    }

    if (contractData.type === 'land-owner-ad' && !landownerId) {
      throw new BadRequestException(
        'landowner is required for land-owner-ad contracts',
      );
    }

    const normalizedMilestones = this.resolveMilestones(
      contractData,
      offer,
      landAd,
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

    const contractPayload = this.buildContractPayload({
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

    const existingContract = await this.contractModel
      .findOne(
        this.buildUpsertFilter(
          contractData,
          offerId,
          investorId,
          farmerId,
          landownerId,
          landAd?._id,
        ),
      )
      .exec();

    if (existingContract) {
      const confirmationPatch = this.buildConfirmationPatch(
        existingContract,
        userId,
      );

      const updatedContract = await this.contractModel
        .findByIdAndUpdate(
          existingContract._id,
          {
            $set: {
              ...this.withoutUndefined(contractPayload),
              ...confirmationPatch,
              updatedBy: userId || existingContract.updatedBy || 'system',
            },
          },
          { new: true },
        )
        .exec();

      if (!updatedContract) {
        throw new BadRequestException('Failed to update existing contract');
      }

      return this.attachPaymentsIfMissing(
        updatedContract,
        normalizedMilestones,
      );
    }

    const newConfirmationPatch = this.buildConfirmationPatch(
      {
        investor: investorId,
        farmer: farmerId,
        landowner: landownerId,
        investorConfirmed: false,
        farmerConfirmed: false,
        landownerConfirmed: false,
      },
      userId,
    );

    const createdContract = await this.contractModel.create({
      ...this.withoutUndefined(contractPayload),
      ...newConfirmationPatch,
      createdBy: userId || 'system',
      updatedBy: userId || 'system',
    });

    return this.attachPaymentsIfMissing(createdContract, normalizedMilestones);
  }

  private ensureSupportedType(type: ContractCreateI['type']): void {
    if (
      ![
        'investor-harvest-base',
        'land-owner-ad',
        'investor-sponsorship',
      ].includes(type)
    ) {
      throw new BadRequestException('Unsupported contract type');
    }
  }

  private validateOfferForContractType(
    contractType: ContractCreateI['type'],
    offerType: OfferType,
  ): void {
    if (
      contractType === 'investor-harvest-base' &&
      offerType !== OfferType.DIRECT_HARVEST
    ) {
      throw new BadRequestException(
        'investor-harvest-base contracts require a direct-harvest offer',
      );
    }

    if (
      contractType === 'investor-sponsorship' &&
      offerType !== OfferType.SPONSORSHIP
    ) {
      throw new BadRequestException(
        'investor-sponsorship contracts require a sponsorship offer',
      );
    }
  }

  private resolveInvestorId(
    contractData: ContractCreateI,
    offer: { investor?: unknown },
  ): Types.ObjectId {
    const payloadInvestor = contractData.investor;

    if (payloadInvestor && Types.ObjectId.isValid(payloadInvestor)) {
      return new Types.ObjectId(payloadInvestor);
    }

    const offerInvestor = this.extractNestedObjectId(offer.investor);

    if (!offerInvestor) {
      throw new BadRequestException(
        'Unable to resolve investor from payload or offer',
      );
    }

    return offerInvestor;
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
    if (contractData.type === 'investor-sponsorship') {
      return this.buildSponsorshipMilestones(
        offer,
        contractData.projectName || 'Sponsorship',
      );
    }

    if (contractData.milestones?.length) {
      return this.normalizeMilestones(contractData.milestones);
    }

    if (contractData.type === 'land-owner-ad') {
      return this.buildLandOwnerMilestones(
        offer,
        landAd,
        contractData.projectName,
      );
    }

    throw new BadRequestException(
      'milestones are required for investor-harvest-base contracts',
    );
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
    if (contractData.type === 'investor-sponsorship') {
      return this.buildSponsorshipFinancialBreakdown(offer);
    }

    if (contractData.financialBreakdown?.length) {
      return contractData.financialBreakdown;
    }

    if (contractData.type === 'land-owner-ad') {
      return [
        {
          category: 'Land Rental',
          amount:
            landAd?.rentalAmount ||
            offer.harvestBaseDetails?.totalBudget ||
            offer.commissionDetails?.minimumInvestment ||
            0,
        },
      ];
    }

    throw new BadRequestException(
      'financialBreakdown is required for investor-harvest-base contracts',
    );
  }

  private resolveStartDate(
    contractData: ContractCreateI,
    landAd: LandOwnerAd | null,
    milestones: MilestoneI[],
  ): Date {
    if (contractData.startDate) {
      return new Date(contractData.startDate);
    }

    if (landAd?.availableFrom) {
      return new Date(landAd.availableFrom);
    }

    if (milestones?.[0]?.startDate) {
      return new Date(milestones[0].startDate);
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

    if (landAd?.availableTo) {
      return new Date(landAd.availableTo);
    }

    if (milestones?.length && milestones[milestones.length - 1].endDate) {
      return new Date(milestones[milestones.length - 1].endDate);
    }

    return new Date();
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
    return {
      type: contractData.type,
      offer: new Types.ObjectId(offerId),
      landAd: landAd?._id,
      investor: investorId,
      farmer: farmerId,
      landowner: landownerId,
      projectName:
        contractData.projectName ||
        offer.harvestBaseDetails?.projectTitle ||
        offer.commissionDetails?.sponsorshipTitle ||
        'Contract Project',
      cropType:
        contractData.cropType ||
        offer.commissionDetails?.cropTypes?.[0] ||
        offer.harvestBaseDetails?.cropType ||
        undefined,
      cropIcon: contractData.cropIcon || offer.cropIcon,
      backgroundImage: contractData.backgroundImage || offer.backgroundImage,
      location:
        contractData.location ||
        this.getLandAdLocation(landAd) ||
        offer.commissionDetails?.preferredRegions?.[0] ||
        offer.harvestBaseDetails?.deliveryLocation ||
        undefined,
      district: contractData.district,
      province: contractData.province,
      coordinates: contractData.coordinates,
      expectedROI: contractData.expectedROI ?? offer.expectedROI,
      status: contractData.status || 'active',
      investmentType:
        contractData.investmentType ||
        (contractData.type === 'investor-sponsorship'
          ? 'commission'
          : 'harvest'),
      startDate,
      endDate,
      investorAmount:
        contractData.investorAmount ??
        offer.commissionDetails?.minimumInvestment ??
        offer.harvestBaseDetails?.totalBudget ??
        0,
      investorName:
        contractData.investorName ||
        offer.harvestBaseDetails?.companyName ||
        offer.commissionDetails?.sponsorshipTitle ||
        undefined,
      riskLevel: contractData.riskLevel || 'LOW',
      riskStatus: contractData.riskStatus,
      milestones: normalizedMilestones,
      financialBreakdown,
      landRentals:
        contractData.type === 'land-owner-ad'
          ? this.generateLandRentalsFromLandAd(landAd)
          : contractData.landRentals || [],
    };
  }

  private buildUpsertFilter(
    contractData: ContractCreateI,
    offerId: string,
    investorId: Types.ObjectId,
    farmerId?: Types.ObjectId,
    landownerId?: Types.ObjectId,
    landAdId?: Types.ObjectId,
  ): FilterQuery<Contract> {
    const filter: Record<string, unknown> = {
      type: contractData.type,
      offer: new Types.ObjectId(offerId),
      investor: investorId,
    };

    if (contractData.type === 'land-owner-ad') {
      if (landownerId) {
        filter.landowner = landownerId;
      }

      if (landAdId) {
        filter.landAd = landAdId;
      }

      if (farmerId) {
        filter.farmer = farmerId;
      }

      return filter as FilterQuery<Contract>;
    }

    if (farmerId) {
      filter.farmer = farmerId;
    }

    return filter as FilterQuery<Contract>;
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
    const currentInvestorConfirmed = contractLike.investorConfirmed ?? false;
    const currentFarmerConfirmed = contractLike.farmerConfirmed ?? false;
    const currentLandownerConfirmed = contractLike.landownerConfirmed ?? false;

    if (!userId) {
      return {
        investorConfirmed: currentInvestorConfirmed,
        farmerConfirmed: currentFarmerConfirmed,
        landownerConfirmed: currentLandownerConfirmed,
        isFullyConfirmed: this.computeFullyConfirmed(
          contractLike,
          currentInvestorConfirmed,
          currentFarmerConfirmed,
          currentLandownerConfirmed,
        ),
      };
    }

    const isInvestor = contractLike.investor?.toString() === userId;
    const isFarmer = contractLike.farmer?.toString() === userId;
    const isLandowner = contractLike.landowner?.toString() === userId;

    const investorConfirmed = currentInvestorConfirmed || isInvestor;
    const farmerConfirmed = currentFarmerConfirmed || isFarmer;
    const landownerConfirmed = currentLandownerConfirmed || isLandowner;

    return {
      investorConfirmed,
      farmerConfirmed,
      landownerConfirmed,
      isFullyConfirmed: this.computeFullyConfirmed(
        contractLike,
        investorConfirmed,
        farmerConfirmed,
        landownerConfirmed,
      ),
    };
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
    if (!contractLike.investor || !investorConfirmed) {
      return false;
    }

    if (contractLike.farmer && !farmerConfirmed) {
      return false;
    }

    if (contractLike.landowner && !landownerConfirmed) {
      return false;
    }

    return true;
  }

  private async attachPaymentsIfMissing(
    contract: Contract,
    milestones: MilestoneI[],
  ): Promise<Contract> {
    if (contract.payments?.length || !milestones.length) {
      return contract;
    }

    const generatedPayments = this.generatePendingPayments(
      milestones,
      contract._id,
    );

    if (!generatedPayments.length) {
      return contract;
    }

    const createdPayments =
      await this.paymentsService.createMany(generatedPayments);
    const payments = createdPayments.map((payment) => payment._id);

    const updatedContract = await this.contractModel
      .findByIdAndUpdate(contract._id, { $set: { payments } }, { new: true })
      .exec();

    if (!updatedContract) {
      throw new BadRequestException(
        'Failed to update contract with payment references',
      );
    }

    return updatedContract;
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
    projectName?: string,
  ): MilestoneI[] {
    const startDate = landAd?.availableFrom
      ? new Date(landAd.availableFrom)
      : new Date();
    const endDate = landAd?.availableTo
      ? new Date(landAd.availableTo)
      : offer.expiredDate
        ? new Date(offer.expiredDate)
        : new Date();

    return [
      {
        title:
          projectName ||
          offer.harvestBaseDetails?.projectTitle ||
          'Land Owner Investment Milestone',
        description: offer.description || 'Land owner contract milestone',
        startDate,
        endDate,
        payment:
          landAd?.rentalAmount ||
          offer.harvestBaseDetails?.totalBudget ||
          offer.commissionDetails?.minimumInvestment ||
          0,
        progress: 0,
        status: 'pending',
      },
    ];
  }

  private resolveObjectId(value?: string): Types.ObjectId | undefined {
    if (!value || !Types.ObjectId.isValid(value)) {
      return undefined;
    }

    return new Types.ObjectId(value);
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

    if (typeof value === 'object' && '_id' in value) {
      const nestedValue = (value as { _id: unknown })._id;

      if (nestedValue instanceof Types.ObjectId) {
        return nestedValue;
      }

      if (
        typeof nestedValue === 'string' &&
        Types.ObjectId.isValid(nestedValue)
      ) {
        return new Types.ObjectId(nestedValue);
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
    return (milestones || []).map((milestone) => ({
      ...milestone,
      progress: milestone.progress ?? 0,
      status: milestone.status || 'pending',
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
    const startDate = new Date();
    const endDate = offer.expiredDate
      ? new Date(offer.expiredDate)
      : new Date();

    return [
      {
        title:
          offer.commissionDetails?.sponsorshipTitle ||
          `${projectName} Sponsorship Milestone`,
        description: offer.description || 'Sponsorship contract milestone',
        startDate,
        endDate,
        payment: offer.commissionDetails?.minimumInvestment || 0,
        progress: 0,
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
    const minimumInvestment = offer.commissionDetails?.minimumInvestment || 0;
    const supportTypes = offer.commissionDetails?.supportType || [];

    if (!supportTypes.length) {
      return [
        {
          category:
            offer.commissionDetails?.sponsorshipTitle || 'Sponsorship Budget',
          amount: minimumInvestment,
        },
      ];
    }

    const baseAmount = Math.floor(minimumInvestment / supportTypes.length);
    const remainder = minimumInvestment % supportTypes.length;

    return supportTypes.map((category, index) => ({
      category,
      amount: baseAmount + (index === 0 ? remainder : 0),
    }));
  }

  private async resolveLandAd(
    contractData: ContractCreateI,
  ): Promise<LandOwnerAd | null> {
    if (contractData.type !== 'land-owner-ad') {
      return null;
    }

    if (!contractData.landAd || !Types.ObjectId.isValid(contractData.landAd)) {
      throw new BadRequestException(
        'Valid landAd is required for land-owner-ad contracts',
      );
    }

    const landAd = await this.landOwnerAdModel
      .findById(contractData.landAd)
      .exec();

    if (!landAd) {
      throw new BadRequestException(
        `Land ad with ID ${contractData.landAd} not found`,
      );
    }

    return landAd;
  }

  private getLandAdLocation(landAd: LandOwnerAd | null): string | undefined {
    if (!landAd?.location) {
      return undefined;
    }

    return `${landAd.location.latitude},${landAd.location.longitude}`;
  }

  private getLandAdLandownerId(
    landAd: LandOwnerAd | null,
  ): Types.ObjectId | undefined {
    const landowner = landAd?.landowner as unknown;

    if (!landowner) {
      return undefined;
    }

    if (landowner instanceof Types.ObjectId) {
      return landowner;
    }

    if (typeof landowner === 'string' && Types.ObjectId.isValid(landowner)) {
      return new Types.ObjectId(landowner);
    }

    if (typeof landowner === 'object' && '_id' in landowner) {
      const nestedId = (landowner as { _id: unknown })._id;

      if (nestedId instanceof Types.ObjectId) {
        return nestedId;
      }

      if (typeof nestedId === 'string' && Types.ObjectId.isValid(nestedId)) {
        return new Types.ObjectId(nestedId);
      }
    }

    return undefined;
  }

  private generateLandRentalsFromLandAd(landAd: LandOwnerAd | null) {
    if (!landAd) {
      return [];
    }

    return [
      {
        id: String(landAd._id),
        landArea: String(landAd.landArea),
        month: this.getMonthLabel(landAd.availableFrom),
        dueDate: new Date(landAd.availableTo),
        amount: landAd.rentalAmount,
        status: 'pending' as const,
      },
    ];
  }

  private getMonthLabel(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }

  private generatePendingPayments(
    milestones: MilestoneI[],
    contractId: Types.ObjectId,
  ): CreatePaymentI[] {
    return milestones.map((milestone) => ({
      contract: contractId,
      amount: milestone.payment,
      dueDate: new Date(milestone.endDate),
      status: PaymentStatus.PENDING,
      description: `${milestone.title} Payment`,
    }));
  }
}
