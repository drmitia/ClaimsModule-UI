export interface CauseOfLossCode {
  code: string;
  name: string;
  perilCategory: string;
}

export interface PolicyDto {
  policyId: string;
  policyNumber: string;
  clientName: string;
  status: string;
  effectiveDate: string;
  expirationDate: string;
}