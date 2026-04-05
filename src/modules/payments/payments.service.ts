import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginatedResponseType } from 'src/common/interfaces/response.types';
import { PaymentQueryDto } from './dtos/payment-query.dto';
import { PayHereNotifyDto } from './dtos/payhere-notify.dto';
import { RefundPaymentDto } from './dtos/refund-payment.dto';
import {
  CreatePaymentI,
  PayHereCheckoutResponseI,
  PaymentFilterI,
} from './payments.types';
import { ContractPayment, PaymentStatus } from './schemas/payment.schema';
import { createHash } from 'node:crypto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(ContractPayment.name)
    private readonly paymentModel: Model<ContractPayment>,
    private readonly configService: ConfigService,
  ) {}

  async createMany(payments: CreatePaymentI[]): Promise<ContractPayment[]> {
    if (!payments.length) {
      return [];
    }

    return this.paymentModel.insertMany(payments);
  }

  async findAll(
    query: PaymentQueryDto,
    filterOverride?: PaymentFilterI,
  ): Promise<PaginatedResponseType<ContractPayment[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const filter: FilterQuery<Record<string, unknown>> = {};
    const user = filterOverride?.user || query.user;
    const contract = filterOverride?.contract || query.contract;
    const status = filterOverride?.status || query.status;

    if (user) {
      filter.user = this.asObjectId(user, 'user');
    }

    if (contract) {
      filter.contract = this.asObjectId(contract, 'contract');
    }

    if (status) {
      filter.status = status;
    }

    if (query.search) {
      filter.$or = [
        { description: { $regex: query.search, $options: 'i' } },
        { orderId: { $regex: query.search, $options: 'i' } },
        { gatewayPaymentId: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, totalDocs] = await Promise.all([
      this.paymentModel
        .find(filter)
        .sort(this.parseSort(query.sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .populate([
          { path: 'contract' },
          { path: 'user', select: 'fullName email phone' },
        ])
        .exec(),
      this.paymentModel.countDocuments(filter),
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

  async findById(id: string): Promise<ContractPayment> {
    const payment = await this.paymentModel
      .findById(this.asObjectId(id, 'payment'))
      .populate([
        { path: 'contract' },
        { path: 'user', select: 'fullName email phone' },
      ])
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByContractId(
    contractId: Types.ObjectId,
  ): Promise<ContractPayment[]> {
    return this.paymentModel.find({ contract: contractId }).exec();
  }

  async deleteById(id: string): Promise<{ deleted: true }> {
    const deleted = await this.paymentModel
      .findByIdAndDelete(this.asObjectId(id, 'payment'))
      .exec();

    if (!deleted) {
      throw new NotFoundException('Payment not found');
    }

    return { deleted: true };
  }

  async createCheckoutSession(
    paymentId: string,
    userId?: string,
  ): Promise<PayHereCheckoutResponseI> {
    const merchantId =
      this.configService.get<string>('payhere.merchantId') || '';
    const merchantSecret =
      this.configService.get<string>('payhere.merchantSecret') || '';

    if (!merchantId || !merchantSecret) {
      throw new BadRequestException(
        'PayHere merchant configuration is missing',
      );
    }

    const currency =
      this.configService.get<string>('payhere.currency') || 'LKR';
    const notifyUrl = this.configService.get<string>('payhere.notifyUrl') || '';
    const returnUrl = this.configService.get<string>('payhere.returnUrl') || '';
    const cancelUrl = this.configService.get<string>('payhere.cancelUrl') || '';

    const payment = await this.paymentModel
      .findById(this.asObjectId(paymentId, 'payment'))
      .populate([
        { path: 'contract', select: 'projectName' },
        {
          path: 'user',
          select:
            'fullName email phoneNumber personalInfo.address personalInfo.city',
        },
      ])
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const userLike = payment.user as
      | {
          fullName?: string;
          email?: string;
          phoneNumber?: string;
          personalInfo?: { address?: string; city?: string };
        }
      | undefined;

    if (!userLike?.email) {
      throw new BadRequestException(
        'Payment user must include an email to create checkout session',
      );
    }

    const contractLike = payment.contract as
      | { projectName?: string }
      | undefined;
    const [firstName, ...rest] = (userLike.fullName || '').trim().split(' ');
    const lastName = rest.join(' ').trim();

    const orderId =
      payment.orderId || this.generateOrderId(payment._id.toString());
    const amount = Number(payment.amount).toFixed(2);
    const hash = this.generateCheckoutHash(
      merchantId,
      orderId,
      amount,
      currency,
      merchantSecret,
    );

    const payload: Record<string, string> = {
      merchant_id: merchantId,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      order_id: orderId,
      items:
        contractLike?.projectName || payment.description || 'Contract Payment',
      currency,
      amount,
      first_name: firstName || 'User',
      last_name: lastName || 'Aswenna',
      email: userLike.email,
      phone: userLike.phoneNumber || '',
      address: userLike.personalInfo?.address || '',
      city: userLike.personalInfo?.city || '',
      country: 'Sri Lanka',
      custom_1: payment._id.toString(),
      custom_2: payment.contract?.toString() || '',
      hash,
    };

    await this.paymentModel
      .findByIdAndUpdate(payment._id, {
        $set: {
          orderId,
          checkoutPayload: payload,
          updatedBy: userId || payment.updatedBy || 'system',
        },
      })
      .exec();

    return {
      paymentId: payment._id.toString(),
      checkoutUrl: this.getCheckoutUrl(),
      payload,
    };
  }

  async handlePayHereNotify(
    notify: PayHereNotifyDto,
  ): Promise<{ received: true; paymentId: string; status: PaymentStatus }> {
    const merchantSecret =
      this.configService.get<string>('payhere.merchantSecret') || '';

    if (!merchantSecret) {
      throw new BadRequestException('PayHere merchant secret is missing');
    }

    const payment = await this.findPaymentByNotifyPayload(notify);

    if (!payment) {
      throw new NotFoundException('Payment not found for PayHere notification');
    }

    const expectedMd5Sig = this.generateNotifyHash(notify, merchantSecret);

    if (expectedMd5Sig !== notify.md5sig.toUpperCase()) {
      throw new BadRequestException('Invalid PayHere notification signature');
    }

    const mappedStatus = this.mapPayHereStatus(notify.status_code);
    const paidDate =
      mappedStatus === PaymentStatus.PAID ? new Date() : undefined;

    const updated = await this.paymentModel
      .findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status: mappedStatus,
            paidDate,
            gatewayPaymentId: notify.payment_id,
            gatewayMethod: notify.method,
            gatewayStatusCode: notify.status_code,
            gatewayStatusMessage: notify.status_message,
            gatewayResponse: notify,
            updatedBy: 'payhere-notify',
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        'Payment not found after notification update',
      );
    }

    return {
      received: true,
      paymentId: updated._id.toString(),
      status: updated.status,
    };
  }

  async refundById(
    id: string,
    dto: RefundPaymentDto,
    userId?: string,
  ): Promise<ContractPayment> {
    const payment = await this.paymentModel
      .findById(this.asObjectId(id, 'payment'))
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only paid payments can be refunded');
    }

    const refundAmount = dto.amount ?? payment.amount;

    if (refundAmount > payment.amount) {
      throw new BadRequestException(
        'Refund amount cannot exceed original payment amount',
      );
    }

    const updated = await this.paymentModel
      .findByIdAndUpdate(
        payment._id,
        {
          $set: {
            status: PaymentStatus.REFUNDED,
            refundedAmount: refundAmount,
            refundedAt: new Date(),
            refundReason: dto.reason,
            refundedBy: userId || 'system',
            updatedBy: userId || 'system',
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Payment not found after refund update');
    }

    return updated;
  }

  private parseSort(sort?: string): Record<string, 1 | -1> {
    if (!sort) {
      return { createdAt: -1 };
    }

    const sortOptions: Record<string, 1 | -1> = {};

    sort.split(',').forEach((field) => {
      const cleanField = field.trim();
      if (!cleanField) return;

      const isDesc = cleanField.startsWith('-');
      const key = cleanField.replace(/^[+-]/, '').trim();
      if (!key) return;

      sortOptions[key] = isDesc ? -1 : 1;
    });

    if (!Object.keys(sortOptions).length) {
      sortOptions.createdAt = -1;
    }

    return sortOptions;
  }

  private asObjectId(value: string, name: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ${name} id`);
    }

    return new Types.ObjectId(value);
  }

  private generateOrderId(paymentId: string): string {
    return `ASW-${Date.now()}-${paymentId.slice(-6)}`;
  }

  private generateCheckoutHash(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    merchantSecret: string,
  ): string {
    const merchantSecretHash = this.md5(merchantSecret).toUpperCase();
    return this.md5(
      `${merchantId}${orderId}${amount}${currency}${merchantSecretHash}`,
    ).toUpperCase();
  }

  private generateNotifyHash(
    notify: PayHereNotifyDto,
    merchantSecret: string,
  ): string {
    const merchantSecretHash = this.md5(merchantSecret).toUpperCase();

    return this.md5(
      `${notify.merchant_id}${notify.order_id}${notify.payhere_amount}${notify.payhere_currency}${notify.status_code}${merchantSecretHash}`,
    ).toUpperCase();
  }

  private md5(value: string): string {
    return createHash('md5').update(value).digest('hex');
  }

  private mapPayHereStatus(statusCode: string): PaymentStatus {
    if (statusCode === '2') return PaymentStatus.PAID;
    if (statusCode === '0') return PaymentStatus.PENDING;
    if (statusCode === '-1') return PaymentStatus.CANCELLED;
    if (statusCode === '-2' || statusCode === '-3') return PaymentStatus.FAILED;
    return PaymentStatus.PENDING;
  }

  private async findPaymentByNotifyPayload(
    notify: PayHereNotifyDto,
  ): Promise<ContractPayment | null> {
    const byOrderId = await this.paymentModel
      .findOne({ orderId: notify.order_id })
      .exec();

    if (byOrderId) {
      return byOrderId;
    }

    if (notify.custom_1 && Types.ObjectId.isValid(notify.custom_1)) {
      return this.paymentModel
        .findById(new Types.ObjectId(notify.custom_1))
        .exec();
    }

    return null;
  }

  private getCheckoutUrl(): string {
    const explicitUrl = this.configService.get<string>('payhere.checkoutUrl');
    if (explicitUrl) {
      return explicitUrl;
    }

    const isSandbox =
      this.configService.get<boolean>('payhere.sandbox') ?? true;
    return isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';
  }
}
