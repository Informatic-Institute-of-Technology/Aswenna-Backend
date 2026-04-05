import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { AzureBlobStorageService } from 'src/config/azure/services/azure-blob-storage.service';
import { ContractsService } from 'src/modules/contracts/contracts.service';
import { Offer } from 'src/modules/investor/offer/schemas/offer.schema';
import { FarmerRequestOfferCreateDto } from './dtos/farmer-request-offer.create.dto';
import { RequestQueryDto } from './dtos/request.query.dto';
import { UpdateJourneyStepDto } from './dtos/request.update.dto';
import {
  JourneyStepActionType,
  JourneyStepStatus,
  UserRequest,
} from './schemas/request.schema';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(UserRequest.name)
    private readonly requestModel: Model<UserRequest>,
    @InjectModel(Offer.name)
    private readonly offerModel: Model<Offer>,
    private readonly contractsService: ContractsService,
    private readonly azureBlobService: AzureBlobStorageService,
  ) {}

  async farmerRequestOffer(
    farmerId: string,
    dto: FarmerRequestOfferCreateDto,
  ): Promise<UserRequest> {
    const offer = await this.offerModel
      .findById(dto.investorOffer)
      .select('investor')
      .lean();

    if (!offer) throw new NotFoundException('Investor offer not found');

    const investorId =
      (offer.investor as any)._id?.toString() ?? offer.investor.toString();

    if (investorId === farmerId) {
      throw new BadRequestException('You cannot request your own offer');
    }

    const journeySteps = [
      {
        title: 'Farmer Requested Investment',
        description: 'Farmer submitted investment request',
        status: JourneyStepStatus.COMPLETED,
      },
      {
        title: 'Investor Review',
        description: 'Waiting for investor to review the request',
        status: JourneyStepStatus.PENDING,
      },
      {
        title: 'Investor Accepted Connection',
        description: "Investor accepted farmer's request",
        status: JourneyStepStatus.PENDING,
      },
      {
        title: 'Investor Agreement Upload',
        description: 'Waiting for investor signed agreement',
        status: JourneyStepStatus.PENDING,
        actionType: JourneyStepActionType.UPLOAD_AGREEMENT,
      },
      {
        title: 'Farmer Approval',
        description: 'Pending investor project start approval',
        status: JourneyStepStatus.PENDING,
        actionType: JourneyStepActionType.SIGN_AGREEMENT,
      },
      {
        title: 'Project Started',
        description: 'Cultivation begins',
        status: JourneyStepStatus.PENDING,
      },
    ];

    return this.requestModel.create({
      recipient: new Types.ObjectId(farmerId),
      receiver: new Types.ObjectId(investorId),
      investorOffer: new Types.ObjectId(dto.investorOffer),
      description: dto.description,
      costBreakdown: dto.costBreakdown,
      milestoneBreakdown: dto.milestoneBreakdown.map((m) => ({
        ...m,
        paymentOverDueDate: new Date(m.paymentOverDueDate),
        startDate: new Date(m.startDate),
        endDate: new Date(m.endDate),
      })),
      journeySteps,
      createdBy: farmerId,
      updatedBy: farmerId,
    });
  }

  async findAll(
    userId: string,
    query: RequestQueryDto,
  ): Promise<PaginatedResponseType<UserRequest[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: Record<string, unknown> = {
      $or: [
        { recipient: new Types.ObjectId(userId) },
        { receiver: new Types.ObjectId(userId) },
      ],
    };

    if (query.recipient) filter['recipient'] = new Types.ObjectId(query.recipient);
    if (query.receiver) filter['receiver'] = new Types.ObjectId(query.receiver);
    if (query.status) filter['status'] = query.status;
    if (query.agreementPending) filter['investorAgreement'] = { $exists: false };

    const [data, totalDocs] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.requestModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      data,
      pagination: {
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
        nextPage: page + 1,
        page,
        prevPage: page - 1,
        totalDocs,
        totalPages,
      },
    };
  }

  async updateJourneyStep(
    requestId: string,
    stepId: string,
    userId: string,
    dto: UpdateJourneyStepDto,
  ): Promise<UserRequest> {
    const request = await this.requestModel.findById(requestId);
    if (!request) throw new NotFoundException('Request not found');

    this.assertAccess(request, userId);

    const step = request.journeySteps.find((s) => s._id.toString() === stepId);
    if (!step) throw new NotFoundException('Journey step not found');

    if (dto.title !== undefined) step.title = dto.title;
    if (dto.description !== undefined) step.description = dto.description;
    if (dto.status !== undefined) step.status = dto.status;
    if (dto.icon !== undefined) step.icon = dto.icon;

    const saved = await request.save();

    const allCompleted = saved.journeySteps.every(
      (s) => s.status === JourneyStepStatus.COMPLETED,
    );

    if (allCompleted && saved.investorOffer) {
      await this.contractsService.createFromRequest({
        requestId: saved._id.toString(),
        investorOfferId: this.docId(saved.investorOffer),
        farmerId: this.docId(saved.recipient),
        investorId: this.docId(saved.receiver),
      });
    }

    return saved;
  }

  async uploadInvestorAgreement(
    requestId: string,
    investorId: string,
    file: Express.Multer.File,
  ): Promise<UserRequest> {
    const request = await this.requestModel.findById(requestId);
    if (!request) throw new NotFoundException('Request not found');

    if (this.docId(request.receiver) !== investorId) {
      throw new ForbiddenException(
        'Only the investor can upload the agreement',
      );
    }

    const uploaded = await this.azureBlobService.uploadFile(
      file,
      'investor-agreements',
    );

    request.investorAgreement = {
      filename: file.originalname,
      fileSize: String(file.size),
      mimeType: file.mimetype,
      url: uploaded.url,
    } as any;

    // Mark the agreement upload step completed and activate the next pending step
    const agreementStep = request.journeySteps.find(
      (s) => s.actionType === JourneyStepActionType.UPLOAD_AGREEMENT,
    );
    if (agreementStep) {
      agreementStep.status = JourneyStepStatus.COMPLETED;
      agreementStep.timestamp = new Date();

      const nextStep = request.journeySteps.find(
        (s) => s.status === JourneyStepStatus.PENDING,
      );
      if (nextStep) nextStep.status = JourneyStepStatus.ACTIVE;
    }

    const saved = await request.save();

    const allCompleted = saved.journeySteps.every(
      (s) => s.status === JourneyStepStatus.COMPLETED,
    );

    if (allCompleted && saved.investorOffer) {
      await this.contractsService.createFromRequest({
        requestId: saved._id.toString(),
        investorOfferId: this.docId(saved.investorOffer),
        farmerId: this.docId(saved.recipient),
        investorId: this.docId(saved.receiver),
      });
    }

    return saved;
  }

  async delete(requestId: string, userId: string): Promise<{ deleted: true }> {
    const request = await this.requestModel.findById(requestId);
    if (!request) throw new NotFoundException('Request not found');

    this.assertAccess(request, userId);

    await this.requestModel.deleteOne({ _id: request._id });
    return { deleted: true };
  }

  private assertAccess(request: UserRequest, userId: string): void {
    const isRecipient = this.docId(request.recipient) === userId;
    const isReceiver = this.docId(request.receiver) === userId;
    if (!isRecipient && !isReceiver) {
      throw new ForbiddenException('You do not have access to this request');
    }
  }

  /** Extracts the string ID from a field that may be a populated Document or a raw ObjectId. */
  private docId(ref: { _id?: unknown } | Types.ObjectId | string): string {
    if (typeof ref === 'string') return ref;
    if (ref instanceof Types.ObjectId) return ref.toHexString();
    if (ref._id instanceof Types.ObjectId) return ref._id.toHexString();
    if (typeof ref._id === 'string') return ref._id;
    throw new Error('Unable to resolve document ID');
  }
}
