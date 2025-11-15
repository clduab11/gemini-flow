/**
 * AP2 Mandate Manager
 * Handles payment mandate creation and lifecycle
 */

import crypto from 'crypto';
import {
  PaymentMandate,
  MandateStatus,
  PaymentAmount,
  CartItem,
  VerifiableCredential,
  CredentialProof
} from './types.js';

export class MandateManager {
  private mandates: Map<string, PaymentMandate> = new Map();

  /**
   * Create Intent-based mandate
   */
  createIntentMandate(amount: PaymentAmount, expiresIn: number = 3600000): PaymentMandate {
    const mandate: PaymentMandate = {
      id: this.generateMandateId(),
      type: 'INTENT',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresIn),
      status: MandateStatus.PENDING,
      amount
    };

    this.mandates.set(mandate.id, mandate);
    console.log(`[AP2] Created intent mandate: ${mandate.id}`);

    return mandate;
  }

  /**
   * Create Cart-based mandate
   */
  createCartMandate(items: CartItem[], expiresIn: number = 3600000): PaymentMandate {
    const totalAmount = this.calculateCartTotal(items);

    const mandate: PaymentMandate = {
      id: this.generateMandateId(),
      type: 'CART',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + expiresIn),
      status: MandateStatus.PENDING,
      amount: totalAmount,
      items
    };

    this.mandates.set(mandate.id, mandate);
    console.log(`[AP2] Created cart mandate: ${mandate.id} (${items.length} items)`);

    return mandate;
  }

  /**
   * Create Recurring mandate
   */
  createRecurringMandate(
    amount: PaymentAmount,
    recurrence: PaymentMandate['recurrence']
  ): PaymentMandate {
    const mandate: PaymentMandate = {
      id: this.generateMandateId(),
      type: 'RECURRING',
      createdAt: new Date(),
      status: MandateStatus.PENDING,
      amount,
      recurrence
    };

    this.mandates.set(mandate.id, mandate);
    console.log(`[AP2] Created recurring mandate: ${mandate.id}`);

    return mandate;
  }

  /**
   * Authorize a mandate
   */
  authorizeMandate(mandateId: string, userId: string): PaymentMandate {
    const mandate = this.mandates.get(mandateId);
    if (!mandate) {
      throw new Error(`Mandate not found: ${mandateId}`);
    }

    if (mandate.status !== MandateStatus.PENDING) {
      throw new Error(`Mandate cannot be authorized (status: ${mandate.status})`);
    }

    // Check expiration
    if (mandate.expiresAt && mandate.expiresAt < new Date()) {
      mandate.status = MandateStatus.EXPIRED;
      throw new Error('Mandate has expired');
    }

    // Create verifiable credential
    mandate.verifiableCredential = this.createVerifiableCredential(mandate, userId);
    mandate.status = MandateStatus.AUTHORIZED;

    console.log(`[AP2] Authorized mandate: ${mandateId}`);

    return mandate;
  }

  /**
   * Cancel a mandate
   */
  cancelMandate(mandateId: string): PaymentMandate {
    const mandate = this.mandates.get(mandateId);
    if (!mandate) {
      throw new Error(`Mandate not found: ${mandateId}`);
    }

    if (mandate.status === MandateStatus.EXECUTED) {
      throw new Error('Cannot cancel executed mandate');
    }

    mandate.status = MandateStatus.CANCELLED;
    console.log(`[AP2] Cancelled mandate: ${mandateId}`);

    return mandate;
  }

  /**
   * Mark mandate as executed
   */
  executeMandate(mandateId: string): PaymentMandate {
    const mandate = this.mandates.get(mandateId);
    if (!mandate) {
      throw new Error(`Mandate not found: ${mandateId}`);
    }

    if (mandate.status !== MandateStatus.AUTHORIZED) {
      throw new Error(`Mandate not authorized (status: ${mandate.status})`);
    }

    mandate.status = MandateStatus.EXECUTED;
    console.log(`[AP2] Executed mandate: ${mandateId}`);

    return mandate;
  }

  /**
   * Get mandate
   */
  getMandate(mandateId: string): PaymentMandate | undefined {
    return this.mandates.get(mandateId);
  }

  /**
   * Verify mandate is valid for payment
   */
  verifyMandate(mandateId: string, amount: PaymentAmount): boolean {
    const mandate = this.mandates.get(mandateId);
    if (!mandate) {
      return false;
    }

    // Check status
    if (mandate.status !== MandateStatus.AUTHORIZED) {
      return false;
    }

    // Check expiration
    if (mandate.expiresAt && mandate.expiresAt < new Date()) {
      mandate.status = MandateStatus.EXPIRED;
      return false;
    }

    // Check amount
    if (mandate.amount) {
      if (amount.currency !== mandate.amount.currency) {
        return false;
      }

      const maxAmount = mandate.amount.maxAmount || mandate.amount.value;
      if (amount.value > maxAmount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create verifiable credential for mandate
   */
  private createVerifiableCredential(mandate: PaymentMandate, userId: string): VerifiableCredential {
    const proof: CredentialProof = {
      type: 'Ed25519Signature2020',
      created: new Date(),
      proofPurpose: 'assertionMethod',
      verificationMethod: `did:example:${userId}#key-1`,
      signature: this.signMandate(mandate)
    };

    return {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/v2'
      ],
      type: ['VerifiableCredential', 'PaymentMandateCredential'],
      issuer: userId,
      issuanceDate: new Date(),
      credentialSubject: {
        id: mandate.id,
        mandate: mandate.id,
        amount: mandate.amount,
        permissions: ['payment.execute']
      },
      proof
    };
  }

  /**
   * Sign mandate (simplified - in production use proper cryptography)
   */
  private signMandate(mandate: PaymentMandate): string {
    const data = JSON.stringify({
      id: mandate.id,
      type: mandate.type,
      amount: mandate.amount,
      createdAt: mandate.createdAt
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Calculate cart total
   */
  private calculateCartTotal(items: CartItem[]): PaymentAmount {
    if (items.length === 0) {
      throw new Error('Cart is empty');
    }

    const currency = items[0].totalPrice.currency;
    const total = items.reduce((sum, item) => {
      if (item.totalPrice.currency !== currency) {
        throw new Error('All items must have the same currency');
      }
      return sum + item.totalPrice.value;
    }, 0);

    return {
      value: total,
      currency
    };
  }

  /**
   * Generate unique mandate ID
   */
  private generateMandateId(): string {
    return `mandate-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Cleanup expired mandates
   */
  cleanupExpired(): number {
    const now = new Date();
    let cleaned = 0;

    for (const mandate of this.mandates.values()) {
      if (mandate.expiresAt && mandate.expiresAt < now && mandate.status === MandateStatus.PENDING) {
        mandate.status = MandateStatus.EXPIRED;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[AP2] Expired ${cleaned} mandates`);
    }

    return cleaned;
  }

  /**
   * Get all mandates
   */
  getAllMandates(): PaymentMandate[] {
    return Array.from(this.mandates.values());
  }

  /**
   * Clear all mandates
   */
  clear(): void {
    this.mandates.clear();
    console.log('[AP2] Cleared all mandates');
  }
}
