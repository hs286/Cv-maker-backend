export interface CustomerPayment {
  chargeId: string;
  amount: number;
  amountCaptured: number;
  created: number;
  currency: string;
  receiptUrl: string;
  status: string;
}
