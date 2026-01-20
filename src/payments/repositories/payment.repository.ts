import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { InjectRepository } from '@nestjs/typeorm';
import { getTransactionManager } from 'src/common/namespaces/transaction/transaction';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../types/payment-status.enum';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  private get repository() {
    const entityManager = getTransactionManager();

    return entityManager
      ? entityManager.getRepository(Payment)
      : this.paymentRepository;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return this.repository.findOne({
      where: { orderId },
    });
  }

  async findByOrderIdWithLock(orderId: string): Promise<Payment | null> {
    return this.repository
      .createQueryBuilder('payment')
      .setLock('pessimistic_write')
      .where('payment.orderId = :orderId', { orderId })
      .getOne();
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.repository.create(data);
    return this.repository.save(payment);
  }

  async updateStatusByOrderId(
    orderId: string,
    status: PaymentStatus,
    providerToken?: string | null,
  ): Promise<void> {
    await this.repository.update(
      { orderId },
      {
        status,
        ...(providerToken !== undefined && { providerToken }),
      },
    );
  }
}
