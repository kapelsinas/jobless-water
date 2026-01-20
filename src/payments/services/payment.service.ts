import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { withTransaction } from 'src/common/namespaces/transaction/transaction';
import { PrimerApiClient } from '../clients/primer-api.client';
import { CreatePaymentDto } from '../dto/request/create-payment.dto';
import { PaymentResponseDto } from '../dto/response/payment-response.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentProvider } from '../types/payment-provider.enum';
import { PaymentStatus } from '../types/payment-status.enum';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentRepository: PaymentRepository,
    private readonly primerApiClient: PrimerApiClient,
  ) {}

  async initializePayment(dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    // 1. Ensure record exists in PENDING/COMPLETED state safely
    const payment = await withTransaction(this.dataSource, async () => {
      const existing = await this.paymentRepository.findByOrderIdWithLock(
        dto.orderId,
      );

      if (existing) {
        if (existing.status === PaymentStatus.COMPLETED) {
          return existing;
        }

        if (existing.status === PaymentStatus.PENDING) {
          throw new ConflictException('Payment is already being processed');
        }

        // If FAILED, restart as PENDING
        existing.status = PaymentStatus.PENDING;
        existing.amount = dto.amount;
        existing.currency = dto.currency;
        return this.paymentRepository.save(existing);
      }

      // Create new PENDING record
      return this.paymentRepository.create({
        orderId: dto.orderId,
        amount: dto.amount,
        currency: dto.currency,
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.PRIMER,
      });
    });

    // If it was already COMPLETED, return immediately
    if (payment.status === PaymentStatus.COMPLETED) {
      return this.mapToResponseDto(payment);
    }

    try {
      // 2. Call Primer API for session
      const primerSession = await this.primerApiClient.createClientSession(
        {
          orderId: dto.orderId,
          amount: dto.amount,
          currencyCode: dto.currency,
        },
        { idempotencyKey: dto.orderId },
      );

      // 3. Update to COMPLETED
      await this.paymentRepository.updateStatusByOrderId(
        dto.orderId,
        PaymentStatus.COMPLETED,
        primerSession.clientToken,
      );

      // 4. Fetch final state for response
      const updated = await this.paymentRepository.findByOrderId(dto.orderId);
      if (!updated) {
        throw new Error('Payment not found');
      }
      return this.mapToResponseDto(updated);
    } catch (error) {
      this.logger.error(
        `Failed to initialize payment for order ${dto.orderId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      if (!(error instanceof ConflictException)) {
        await this.paymentRepository.updateStatusByOrderId(
          dto.orderId,
          PaymentStatus.FAILED,
        );
      }
      throw error;
    }
  }

  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      orderId: payment.orderId,
      status: payment.status,
      providerToken: payment.providerToken,
      amount: payment.amount,
      currency: payment.currency,
    };
  }
}
