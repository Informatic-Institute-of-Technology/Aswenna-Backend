import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Offer } from 'src/modules/investor/offer/schemas/offer.schema';
import { User } from 'src/modules/user/schemas/user.schema';
import { UserRequest } from 'src/modules/request/schemas/request.schema';

export enum ContractStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

@Schema({ timestamps: true })
export class Contract extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: UserRequest.name,
    required: true,
    unique: true,
  })
  readonly request!: UserRequest;

  @Prop({ type: Types.ObjectId, ref: Offer.name, required: true })
  readonly investorOffer!: Offer;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  readonly farmer!: User;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  readonly investor!: User;

  @Prop({
    type: String,
    enum: ContractStatus,
    default: ContractStatus.PENDING,
  })
  readonly status!: ContractStatus;

  @Prop(Date)
  readonly createdAt!: Date;

  @Prop(Date)
  readonly updatedAt!: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

ContractSchema.index({ farmer: 1, status: 1 });
ContractSchema.index({ investor: 1, status: 1 });
ContractSchema.index({ createdAt: -1 });
