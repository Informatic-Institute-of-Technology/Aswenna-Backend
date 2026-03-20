import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Meta } from 'src/common/schemas/meta.schema';
import { User } from 'src/modules/user/schemas/user.schema';

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

@Schema({ _id: false })
export class CostBreakdownItem {
  @Prop()
  readonly category: string;

  @Prop()
  readonly description: string;

  @Prop()
  readonly estimatedCost: number;
}

@Schema({ _id: false })
export class MilestoneBreakdownItem {
  @Prop()
  readonly milestone: string;

  @Prop()
  readonly description: string;

  @Prop()
  readonly estimatedAmount: number;
}

@Schema({ _id: false })
export class HarvestBasedDetails {
  @Prop()
  readonly expectedHarvest: number;

  @Prop()
  readonly expectedLandArea: number;
}

@Schema({ _id: false })
export class CommissionBasedDetails {
  @Prop()
  readonly commissionPercentage: number;

  @Prop()
  readonly expectedLandArea: number;
}

@Schema({ timestamps: true })
export class FarmerProject extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name })
  readonly farmer: User;

  @Prop({ type: String, enum: ProjectType })
  readonly offerType: ProjectType;

  @Prop({ type: String, enum: ProjectLandAvailability })
  readonly landAvailability: ProjectLandAvailability;

  @Prop()
  readonly projectName: string;

  @Prop()
  readonly description: string;

  @Prop()
  readonly cropType: string;

  @Prop()
  readonly cropIcon: string;

  @Prop()
  readonly backgroundImage: string;

  @Prop()
  readonly location: string;

  @Prop()
  readonly farmingMethods: string;

  @Prop([String])
  readonly preferredRegions: string[];

  @Prop([CostBreakdownItem])
  readonly costBreakdown: CostBreakdownItem[];

  @Prop([MilestoneBreakdownItem])
  readonly milestoneBreakdown: MilestoneBreakdownItem[];

  @Prop()
  readonly totalInvestmentRequired: number;

  @Prop()
  readonly effectiveDateFrom: Date;

  @Prop()
  readonly effectiveDateTo: Date;

  @Prop({
    type: String,
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  readonly status: ProjectStatus;

  @Prop({ default: true })
  readonly visibility: boolean;

  @Prop(HarvestBasedDetails)
  readonly harvestBasedDetails?: HarvestBasedDetails;

  @Prop(CommissionBasedDetails)
  readonly commissionBasedDetails?: CommissionBasedDetails;

  @Prop([Meta])
  readonly meta: Meta[];

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop(Date)
  readonly createdAt: Date;

  @Prop({ default: 'system' })
  readonly updatedBy: string;

  @Prop(Date)
  readonly updatedAt: Date;
}

export const FarmerProjectSchema = SchemaFactory.createForClass(FarmerProject);
