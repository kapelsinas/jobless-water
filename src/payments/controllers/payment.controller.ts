import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { PaymentResponseDto } from '../dto/response/payment-response.dto';
import { PaymentService } from '../services/payment.service';

@Controller('payments')
@UseGuards(ThrottlerGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('init')
  @Throttle({
    short: { limit: 3, ttl: 1000 },
    medium: { limit: 10, ttl: 10000 },
  })
  async initializePayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.initializePayment(createPaymentDto);
  }
}
