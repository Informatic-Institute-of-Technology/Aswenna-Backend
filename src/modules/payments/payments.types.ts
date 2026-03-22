import { Types } from 'mongoose';
import { PaymentStatus } from './schemas/payment.schema';

export interface CreatePaymentI {
  readonly user?: Types.ObjectId;
  readonly contract: Types.ObjectId;
  readonly amount: number;
  readonly dueDate: Date;
  readonly status: PaymentStatus;
  readonly description: string;
}

export interface PayHereCheckoutResponseI {
  readonly paymentId: string;
  readonly checkoutUrl: string;
  readonly payload: Record<string, string>;
}

export interface PaymentFilterI {
  readonly user?: string;
  readonly contract?: string;
  readonly status?: PaymentStatus;
}
