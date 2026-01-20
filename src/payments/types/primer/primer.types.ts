export type PrimerClientSessionOptions = {
  idempotencyKey: string;
};

export type PrimerClientSessionRequest = {
  orderId: string;
  amount: number;
  currencyCode: string;
};

export type PrimerClientSessionResponse = {
  clientToken: string;
  expirationDate: string;
  orderId: string;
  customerId: string;
};

export type PrimerErrorResponse = {
  error: {
    id: string;
    description: string;
    diagnostics?: any;
  };
};
