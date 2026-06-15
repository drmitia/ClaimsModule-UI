export interface ClaimSummaryDto {
  id: string;
  claimNumber: string;
  policyNumber?: string;
  clientName?: string;
  status: ClaimStatus;
  severity?: ClaimSeverity;
  reportedDate: string;
  assignedHandlerId?: string;
  causeOfLossCode?: string;  
  totalReserve: number;      
  lossDate?: string;
}

export interface ClaimDetailDto {
  id: string;
  claimNumber: string;
  policyNumber?: string;
  clientName?: string;
  status: ClaimStatus;
  severity?: ClaimSeverity;
  reportedDate: string;
  assignedHandlerId?: string;
  notes?: string;
  closedAt?: string;
  closureReason?: string;
  lossEvent?: LossEventDto;
  parties: ClaimPartyDto[];
  riskObjects: ClaimRiskObjectDto[];
  reserveComponents: ReserveComponentDto[];
  documents: ClaimDocumentDto[];
}

export interface LossEventDto {
  id: string;
  lossDate: string;
  lossDescription: string;
  lossLocation?: string;
  causeOfLossCode: string;
  estimatedLossAmount?: number;
  policeReportNumber?: string;
}

export interface ClaimPartyDto {
  id: string;
  partyRole: PartyRole;
  partyType: PartyType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  displayName: string;
}

export interface ClaimRiskObjectDto {
  id: string;
  assetType: AssetType;
  assetDescription: string;
  damageDescription?: string;
  isPrimary: boolean;
  assetReference?: string;
}

export interface ReserveComponentDto {
  id: string;
  component: ReserveComponent;
  currentAmount: number;
  notes?: string;
  history: ReserveHistoryDto[];
}

export interface ReserveHistoryDto {
  id: string;
  transactionType: TransactionType;
  amount: number;
  previousBalance: number;
  newBalance: number;
  approvalStatus: ApprovalStatus;
  changeReason: string;
  rejectionReason?: string;
  createdAt: string;
  submittedByUserId?: string;
  approvedByUserId?: string;
}

export interface ClaimDocumentDto {
  id: string;
  documentType: DocumentType;
  documentName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  downloadUrl?: string;
  blobPath?: string; 
}

export interface AuditLogDto {
  auditLogId: string;
  eventType: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  createdByUserId?: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ValidationResultDto {
  isValid: boolean;
  issues: ValidationIssueDto[];
}

export interface ValidationIssueDto {
  code: string;
  message: string;
  severity: string;
}

export interface TransitionResultDto {
  succeeded: boolean;
  blockingIssues: string[];
  warnings: string[];
}

export type ClaimStatus =
  | 'Draft'
  | 'Open'
  | 'UnderInvestigation'
  | 'PendingPayment'
  | 'Closed'
  | 'Reopened'
  | 'Withdrawn';

export type ClaimSeverity =
  | 'Minor'
  | 'Standard'
  | 'Critical'
  | 'Catastrophic';

export type PartyRole =
  | 'Claimant'
  | 'Insured'
  | 'ThirdParty'
  | 'Witness'
  | 'Attorney';

export type PartyType = 'Person' | 'Company';

export type AssetType =
  | 'Vehicle'
  | 'Property'
  | 'Person'
  | 'Equipment'
  | 'Other';

export type ReserveComponent =
  | 'Indemnity'
  | 'Expense'
  | 'ALAE'
  | 'SubrogationRecoverable';

export type ApprovalStatus =
  | 'AutoApproved'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export type TransactionType = 'Add' | 'Adjust' | 'Reverse';

export type DocumentType =
  | 'PoliceReport'
  | 'MedicalReport'
  | 'Invoice'
  | 'Photo'
  | 'Other';

export type PostingStatus = 'Pending' | 'Posted' | 'Failed' | 'Cancelled';