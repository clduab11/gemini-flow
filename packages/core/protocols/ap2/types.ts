/**
 * AP2 (Agent Payments Protocol) Types
 * Extends A2A for payment capabilities
 * Based on Google's AP2 specification
 */

/**
 * Payment Mandate - Authorization from user
 */
export interface PaymentMandate {
  id: string;
  type: 'INTENT' | 'CART' | 'RECURRING';
  createdAt: Date;
  expiresAt?: Date;
  status: MandateStatus;
  amount?: PaymentAmount;
  items?: CartItem[];
  recurrence?: RecurrenceConfig;
  verifiableCredential?: VerifiableCredential;
  metadata?: Record<string, any>;
}

/**
 * Mandate Status
 */
export enum MandateStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

/**
 * Payment Amount
 */
export interface PaymentAmount {
  value: number;
  currency: string; // ISO 4217
  maxAmount?: number;
}

/**
 * Cart Item
 */
export interface CartItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: PaymentAmount;
  totalPrice: PaymentAmount;
  metadata?: Record<string, any>;
}

/**
 * Recurrence Configuration
 */
export interface RecurrenceConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number;
  startDate: Date;
  endDate?: Date;
  maxOccurrences?: number;
}

/**
 * Verifiable Credential (for proof of authorization)
 */
export interface VerifiableCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: Date;
  credentialSubject: {
    id: string;
    mandate: string;
    amount?: PaymentAmount;
    permissions: string[];
  };
  proof: CredentialProof;
}

/**
 * Credential Proof
 */
export interface CredentialProof {
  type: string;
  created: Date;
  proofPurpose: string;
  verificationMethod: string;
  signature: string;
}

/**
 * Payment Transaction
 */
export interface PaymentTransaction {
  id: string;
  mandateId: string;
  amount: PaymentAmount;
  status: TransactionStatus;
  createdAt: Date;
  completedAt?: Date;
  from: PaymentAccount;
  to: PaymentAccount;
  description?: string;
  receipt?: TransactionReceipt;
  metadata?: Record<string, any>;
}

/**
 * Transaction Status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

/**
 * Payment Account
 */
export interface PaymentAccount {
  id: string;
  type: 'USER' | 'AGENT' | 'SERVICE';
  identifier: string;
  metadata?: Record<string, any>;
}

/**
 * Transaction Receipt
 */
export interface TransactionReceipt {
  transactionId: string;
  timestamp: Date;
  amount: PaymentAmount;
  from: string;
  to: string;
  signature: string;
  blockchainTxHash?: string; // For blockchain-based payments
}

/**
 * Payment Request
 */
export interface PaymentRequest {
  mandateId: string;
  amount: PaymentAmount;
  description?: string;
  items?: CartItem[];
  metadata?: Record<string, any>;
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  transactionId: string;
  status: TransactionStatus;
  receipt?: TransactionReceipt;
  error?: PaymentError;
}

/**
 * Payment Error
 */
export interface PaymentError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Payment Audit Log Entry
 */
export interface PaymentAuditLog {
  id: string;
  timestamp: Date;
  action: AuditAction;
  mandateId?: string;
  transactionId?: string;
  actor: string;
  details: any;
  signature: string;
}

/**
 * Audit Actions
 */
export enum AuditAction {
  MANDATE_CREATED = 'mandate_created',
  MANDATE_AUTHORIZED = 'mandate_authorized',
  MANDATE_CANCELLED = 'mandate_cancelled',
  TRANSACTION_INITIATED = 'transaction_initiated',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
  TRANSACTION_REFUNDED = 'transaction_refunded'
}

/**
 * Balance Query
 */
export interface BalanceQuery {
  accountId: string;
  currency?: string;
}

/**
 * Balance Response
 */
export interface BalanceResponse {
  accountId: string;
  balances: Array<{
    currency: string;
    available: number;
    pending: number;
    total: number;
  }>;
  lastUpdated: Date;
}

/**
 * Refund Request
 */
export interface RefundRequest {
  transactionId: string;
  amount?: PaymentAmount; // Partial refund if specified
  reason: string;
  metadata?: Record<string, any>;
}

/**
 * Refund Response
 */
export interface RefundResponse {
  refundId: string;
  transactionId: string;
  amount: PaymentAmount;
  status: TransactionStatus;
  createdAt: Date;
}
