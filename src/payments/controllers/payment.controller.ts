import { Body, Controller, Post } from '@nestjs/common';

import { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { PaymentResponseDto } from '../dto/response/payment-response.dto';
import { PaymentService } from '../services/payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('init')
  async initializePayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.initializePayment(createPaymentDto);
  }
}
