import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from 'src/app.module';
import { AllExceptionsFilter } from 'src/common/filters/all.filter';
import { PrimerApiClient } from 'src/payments/clients/primer-api.client';
import { Payment } from 'src/payments/entities/payment.entity';
import { PaymentStatus } from 'src/payments/types/payment-status.enum';
import request from 'supertest';
import { DataSource } from 'typeorm';

describe('PaymentController (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const mockPrimerClient = {
    createClientSession: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrimerApiClient)
      .useValue(mockPrimerClient)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(Payment).clear();
    jest.clearAllMocks();
  });

  const validPayload = {
    orderId: 'ORD-123',
    amount: 10050,
    currency: 'USD',
  };

  it('/payments/init (POST) - Success', async () => {
    mockPrimerClient.createClientSession.mockResolvedValue({
      clientToken: 'mock-token-123',
    });

    const response = await request(app.getHttpServer())
      .post('/payments/init')
      .send(validPayload)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      orderId: validPayload.orderId,
      status: PaymentStatus.COMPLETED,
      providerToken: 'mock-token-123',
      amount: validPayload.amount,
      currency: validPayload.currency,
    });

    const payment = await dataSource
      .getRepository(Payment)
      .findOneBy({ orderId: validPayload.orderId });
    expect(payment?.status).toBe(PaymentStatus.COMPLETED);
    expect(payment?.providerToken).toBe('mock-token-123');
  });

  it('/payments/init (POST) - Idempotency (COMPLETED)', async () => {
    const repo = dataSource.getRepository(Payment);
    await repo.save({
      orderId: 'ORD-EXISTING',
      amount: 10050,
      currency: 'USD',
      status: PaymentStatus.COMPLETED,
      providerToken: 'cached-token',
    });

    const response = await request(app.getHttpServer())
      .post('/payments/init')
      .send({ ...validPayload, orderId: 'ORD-EXISTING' })
      .expect(HttpStatus.CREATED);

    const body = response.body as { providerToken: string };
    expect(body.providerToken).toBe('cached-token');
    expect(mockPrimerClient.createClientSession).not.toHaveBeenCalled();
  });

  it('/payments/init (POST) - Conflict (PENDING)', async () => {
    const repo = dataSource.getRepository(Payment);
    await repo.save({
      orderId: 'ORD-PENDING',
      amount: 5000,
      currency: 'USD',
      status: PaymentStatus.PENDING,
    });

    const response = await request(app.getHttpServer())
      .post('/payments/init')
      .send({ ...validPayload, orderId: 'ORD-PENDING' })
      .expect(HttpStatus.CONFLICT);

    const body = response.body as { message: string };
    expect(body.message).toContain('already being processed');
  });

  it('/payments/init (POST) - Failure handles FAILED status', async () => {
    mockPrimerClient.createClientSession.mockRejectedValue(
      new Error('Primer API down'),
    );

    await request(app.getHttpServer())
      .post('/payments/init')
      .send(validPayload)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    const payment = await dataSource
      .getRepository(Payment)
      .findOneBy({ orderId: validPayload.orderId });
    expect(payment?.status).toBe(PaymentStatus.FAILED);
  });

  it('/payments/init (POST) - Validation Error', async () => {
    await request(app.getHttpServer())
      .post('/payments/init')
      .send({ amount: -1 })
      .expect(HttpStatus.BAD_REQUEST);
  });
});
