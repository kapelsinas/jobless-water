export type PrimerClientSessionOptions = {
  idempotencyKey: string;
};

export type PrimerClientSessionRequest = {
  orderId: string;
  amount: number;
  currencyCode: string;
  customer?: {
    mobileNumber?: string;
    emailAddress?: string;
    firstName?: string;
    lastName?: string;
    shippingAddress?: {
      firstName?: string;
      lastName?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      countryCode?: string;
      postalCode?: string;
    };
  };
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
