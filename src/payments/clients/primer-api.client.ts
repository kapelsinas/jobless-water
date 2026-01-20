import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

import { AppException } from '../../common/exceptions/app.exception';
import { AppConfig } from '../../config/app.config';

import {
  PrimerClientSessionOptions,
  PrimerClientSessionRequest,
  PrimerClientSessionResponse,
  PrimerErrorResponse,
} from '../types/primer/primer.types';

@Injectable()
export class PrimerApiClient {
  private readonly logger = new Logger(PrimerApiClient.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const primerConfig =
      this.configService.get<AppConfig['primer']>('app.primer');
    this.apiUrl = primerConfig!.apiUrl;
    this.apiKey = primerConfig!.apiKey;
  }

  async createClientSession(
    data: PrimerClientSessionRequest,
    options: PrimerClientSessionOptions,
  ): Promise<PrimerClientSessionResponse> {
    const response = await firstValueFrom(
      this.httpService
        .post<PrimerClientSessionResponse>('/client-session', data, {
          baseURL: this.apiUrl,
          headers: {
            'X-Api-Key': this.apiKey,
            'X-Api-Version': '2.2',
            'Content-Type': 'application/json',
            'Idempotency-Key': options.idempotencyKey,
          },
        })
        .pipe(
          catchError((error: AxiosError<PrimerErrorResponse>) => {
            this.logger.error(
              `Primer API Error: ${error.response?.data?.error?.description || error.message}`,
            );
            throw new AppException({
              message:
                error.response?.data?.error?.description ??
                'EXTERNAL_SERVICE_ERROR',
              status:
                error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
              details: error.response?.data,
              code: 'PRIMER_API_ERROR',
            });
          }),
        ),
    );

    return response.data;
  }
}
