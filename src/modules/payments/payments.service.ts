import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePaymentI, PaymentI } from './payments.types';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Payment')
    private readonly paymentModel: Model<PaymentI>,
  ) {}

  async createMany(payments: CreatePaymentI[]): Promise<PaymentI[]> {
    return this.paymentModel.insertMany(payments);
  }

  async findByContractId(contractId: Types.ObjectId): Promise<PaymentI[]> {
    return this.paymentModel.find({ contract: contractId }).exec();
  }
}
