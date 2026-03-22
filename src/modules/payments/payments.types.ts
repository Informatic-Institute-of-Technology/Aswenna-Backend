import { Types } from 'mongoose';

export interface CreatePaymentI {
  contract: Types.ObjectId;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface PaymentI extends CreatePaymentI {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
