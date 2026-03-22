import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Auth } from 'src/core/decorators/auth.decorator';
import { Public } from 'src/core/decorators/public.decorator';
import { UserReal } from 'src/core/decorators/user.decorators';
import { PaymentQueryDto } from './dtos/payment-query.dto';
import { PayHereCheckoutDto } from './dtos/payhere-checkout.dto';
import { PayHereNotifyDto } from './dtos/payhere-notify.dto';
import { RefundPaymentDto } from './dtos/refund-payment.dto';
import { PaymentsService } from './payments.service';

@Controller({ path: 'payments', version: '1' })
@Auth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(@Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(query);
  }

  @Get('user/:userId')
  findAllByUser(
    @Param('userId') userId: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.findAll(query, { user: userId });
  }

  @Get('contract/:contractId')
  findAllByContract(
    @Param('contractId') contractId: string,
    @Query() query: PaymentQueryDto,
  ) {
    return this.paymentsService.findAll(query, { contract: contractId });
  }

  @Post('checkout')
  checkout(@Body() dto: PayHereCheckoutDto, @UserReal('user') userId: string) {
    return this.paymentsService.createCheckoutSession(dto, userId);
  }

  @Public()
  @Post('notify')
  notify(@Body() notifyDto: PayHereNotifyDto) {
    return this.paymentsService.handlePayHereNotify(notifyDto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }

  @Post(':id/refund')
  refund(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
    @UserReal('user') userId: string,
  ) {
    return this.paymentsService.refundById(id, dto, userId);
  }

  @Delete(':id')
  deleteById(@Param('id') id: string) {
    return this.paymentsService.deleteById(id);
  }
}
