import { PaymentStatus } from '../../types/payment-status.enum';

export class PaymentResponseDto {
  orderId: string;
  status: PaymentStatus;
  providerToken: string | null;
  amount: number; // Returns cents
  currency: string;
}
