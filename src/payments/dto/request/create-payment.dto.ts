import { IsNotEmpty, IsNumber, IsString, Length, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  @Length(3, 3)
  currency: string;
}
