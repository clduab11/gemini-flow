/**
 * AP2 Transaction Manager
 * Handles payment transaction execution and tracking
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  PaymentTransaction,
  TransactionStatus,
  PaymentAmount,
  PaymentAccount,
  TransactionReceipt,
  PaymentRequest,
  PaymentResponse,
  PaymentError,
  RefundRequest,
  RefundResponse
} from './types.js';
import { MandateManager } from './mandate-manager.js';

export class TransactionManager extends EventEmitter {
  private transactions: Map<string, PaymentTransaction> = new Map();
  private mandateManager: MandateManager;

  constructor(mandateManager: MandateManager) {
    super();
    this.mandateManager = mandateManager;
  }

  /**
   * Execute a payment
   */
  async executePayment(request: PaymentRequest, from: PaymentAccount, to: PaymentAccount): Promise<PaymentResponse> {
    try {
      // Verify mandate
      if (!this.mandateManager.verifyMandate(request.mandateId, request.amount)) {
        return {
          transactionId: '',
          status: TransactionStatus.FAILED,
          error: {
            code: 'INVALID_MANDATE',
            message: 'Mandate is not valid for this payment'
          }
        };
      }

      // Create transaction
      const transaction: PaymentTransaction = {
        id: this.generateTransactionId(),
        mandateId: request.mandateId,
        amount: request.amount,
        status: TransactionStatus.PENDING,
        createdAt: new Date(),
        from,
        to,
        description: request.description,
        metadata: request.metadata
      };

      this.transactions.set(transaction.id, transaction);
      this.emit('transaction:created', transaction);

      // Process payment (simulated)
      transaction.status = TransactionStatus.PROCESSING;
      this.emit('transaction:processing', transaction);

      await this.processPayment(transaction);

      // Complete transaction
      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
      transaction.receipt = this.createReceipt(transaction);

      this.emit('transaction:completed', transaction);

      // Mark mandate as executed
      this.mandateManager.executeMandate(request.mandateId);

      console.log(`[AP2] Transaction completed: ${transaction.id}`);

      return {
        transactionId: transaction.id,
        status: transaction.status,
        receipt: transaction.receipt
      };
    } catch (error: any) {
      const errorResponse: PaymentError = {
        code: 'TRANSACTION_FAILED',
        message: error.message,
        details: error
      };

      this.emit('transaction:failed', { request, error: errorResponse });

      return {
        transactionId: '',
        status: TransactionStatus.FAILED,
        error: errorResponse
      };
    }
  }

  /**
   * Process payment (stub - would integrate with actual payment provider)
   */
  private async processPayment(transaction: PaymentTransaction): Promise<void> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, this would:
    // 1. Call payment provider API
    // 2. Handle wallet transactions
    // 3. Record blockchain transactions
    // 4. Update account balances
    // etc.

    console.log(`[AP2] Processed payment: ${transaction.amount.value} ${transaction.amount.currency}`);
  }

  /**
   * Create transaction receipt
   */
  private createReceipt(transaction: PaymentTransaction): TransactionReceipt {
    const receiptData = {
      transactionId: transaction.id,
      timestamp: transaction.completedAt!,
      amount: transaction.amount,
      from: transaction.from.identifier,
      to: transaction.to.identifier
    };

    const signature = crypto
      .createHash('sha256')
      .update(JSON.stringify(receiptData))
      .digest('hex');

    return {
      ...receiptData,
      signature
    };
  }

  /**
   * Get transaction
   */
  getTransaction(transactionId: string): PaymentTransaction | undefined {
    return this.transactions.get(transactionId);
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): PaymentTransaction[] {
    return Array.from(this.transactions.values());
  }

  /**
   * Get transactions by mandate
   */
  getTransactionsByMandate(mandateId: string): PaymentTransaction[] {
    return Array.from(this.transactions.values()).filter(
      tx => tx.mandateId === mandateId
    );
  }

  /**
   * Get transactions by account
   */
  getTransactionsByAccount(accountId: string): PaymentTransaction[] {
    return Array.from(this.transactions.values()).filter(
      tx => tx.from.id === accountId || tx.to.id === accountId
    );
  }

  /**
   * Refund a transaction
   */
  async refundTransaction(request: RefundRequest): Promise<RefundResponse> {
    const transaction = this.transactions.get(request.transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${request.transactionId}`);
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new Error('Can only refund completed transactions');
    }

    const refundAmount = request.amount || transaction.amount;

    // Create refund transaction
    const refund: PaymentTransaction = {
      id: this.generateTransactionId(),
      mandateId: transaction.mandateId,
      amount: refundAmount,
      status: TransactionStatus.COMPLETED,
      createdAt: new Date(),
      completedAt: new Date(),
      from: transaction.to, // Reversed
      to: transaction.from,
      description: `Refund for ${request.transactionId}: ${request.reason}`,
      metadata: {
        originalTransaction: request.transactionId,
        refundReason: request.reason,
        ...request.metadata
      }
    };

    refund.receipt = this.createReceipt(refund);
    this.transactions.set(refund.id, refund);

    // Update original transaction
    transaction.status = TransactionStatus.REFUNDED;

    this.emit('transaction:refunded', { original: transaction, refund });

    console.log(`[AP2] Refunded transaction: ${request.transactionId}`);

    return {
      refundId: refund.id,
      transactionId: request.transactionId,
      amount: refundAmount,
      status: refund.status,
      createdAt: refund.createdAt
    };
  }

  /**
   * Calculate total transaction volume
   */
  getTotalVolume(currency?: string): number {
    let total = 0;

    for (const tx of this.transactions.values()) {
      if (tx.status === TransactionStatus.COMPLETED) {
        if (!currency || tx.amount.currency === currency) {
          total += tx.amount.value;
        }
      }
    }

    return total;
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `tx-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Clear all transactions
   */
  clear(): void {
    this.transactions.clear();
    this.removeAllListeners();
    console.log('[AP2] Cleared all transactions');
  }
}
