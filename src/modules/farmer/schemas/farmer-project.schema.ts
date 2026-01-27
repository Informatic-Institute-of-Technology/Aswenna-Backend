import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Farmer } from './farmer.schema';
import { Meta } from 'src/common/schemas/meta.schema';

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

export enum ProjectCommissionType {
  FIXED = 'FIXED',
  PERCENTAGE = 'PERCENTAGE',
}

@Schema({ _id: false })
export class HarvestDetails {
  @Prop()
  readonly expectedYield: number;

  @Prop()
  readonly yieldUnit: string;

  @Prop()
  readonly investorSharePercentage: number;

  @Prop()
  readonly riskLevel: string;
}

@Schema({ _id: false })
export class CommissionDetails {
  @Prop({ enum: ProjectCommissionType })
  readonly commissionType: ProjectCommissionType;

  @Prop()
  readonly commissionValue: number;

  @Prop()
  readonly serviceDescription: string;
}

@Schema({ timestamps: true })
export class FarmerProject extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Farmer.name })
  readonly farmer: Farmer;

  @Prop({ enum: ProjectType })
  readonly type: ProjectType;

  @Prop()
  readonly title: string;

  @Prop()
  readonly description: string;

  @Prop()
  readonly cropType: string;

  @Prop()
  readonly location: string;

  @Prop()
  readonly investmentRequired: number;

  @Prop()
  readonly expectedROI: number;

  @Prop()
  readonly startDate: Date;

  @Prop()
  readonly endDate: Date;

  @Prop({
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  readonly status: ProjectStatus;

  @Prop({ default: true })
  readonly visibility: boolean;

  @Prop(HarvestDetails)
  readonly harvestDetails?: HarvestDetails;

  @Prop(CommissionDetails)
  readonly commissionDetails?: CommissionDetails;

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
