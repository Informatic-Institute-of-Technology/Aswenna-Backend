import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Schema({ timestamps: true })
export class ContractPayment extends Document {
  declare readonly _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  readonly user?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  readonly contract: Types.ObjectId;

  @Prop({ required: true })
  readonly amount: number;

  @Prop({ required: true })
  readonly dueDate: Date;

  @Prop()
  readonly paidDate?: Date;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  readonly status: PaymentStatus;

  @Prop()
  readonly orderId?: string;

  @Prop()
  readonly gatewayPaymentId?: string;

  @Prop()
  readonly gatewayMethod?: string;

  @Prop()
  readonly gatewayStatusCode?: string;

  @Prop()
  readonly gatewayStatusMessage?: string;

  @Prop({ type: Object })
  readonly checkoutPayload?: Record<string, unknown>;

  @Prop({ type: Object })
  readonly gatewayResponse?: Record<string, unknown>;

  @Prop()
  readonly refundedAmount?: number;

  @Prop()
  readonly refundedAt?: Date;

  @Prop()
  readonly refundReason?: string;

  @Prop()
  readonly refundedBy?: string;

  @Prop()
  readonly description: string;

  @Prop({ default: 'system' })
  readonly createdBy: string;

  @Prop({ default: 'system' })
  readonly updatedBy: string;
}

export const PaymentSchema = SchemaFactory.createForClass(ContractPayment);
