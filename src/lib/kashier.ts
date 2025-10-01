/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/kashier.ts
import crypto from 'crypto';

export interface KashierConfig {
  merchantId: string;
  apiKey: string;
  mode: 'test' | 'live';
}

export interface PaymentData {
  amount: string;
  currency: string;
  orderId: string;
  merchantOrderId: string;
  hash: string;
  mode: string;
  merchantRedirect: string;
  serverWebhook?: string;
  merchantId: string;
  display: string;
  billing?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

class KashierService {
  private config: KashierConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      merchantId: process.env.KASHIER_MERCHANT_ID || '',
      apiKey: process.env.KASHIER_API_KEY || '',
      mode: (process.env.KASHIER_MODE as 'test' | 'live') || 'test'
    };
    
    this.baseUrl = this.config.mode === 'test' 
      ? 'https://test-payment.kashier.io'
      : 'https://payment.kashier.io';
  }

  /**
   * توليد HMAC Hash للتحقق من صحة الطلب
   */
  generateHash(data: string): string {
    return crypto
      .createHmac('sha256', this.config.apiKey)
      .update(data)
      .digest('hex');
  }

  /**
   * إنشاء بيانات الدفع
   */
  createPaymentData(
    amount: number,
    orderId: string,
    userEmail: string,
    userName: string,
    userPhone?: string
  ): PaymentData {
    const merchantOrderId = `ORDER-${orderId}-${Date.now()}`;
    
    // البيانات المطلوبة للـ Hash
    const hashString = `${this.config.merchantId}.${merchantOrderId}.${amount}.EGP`;
    const hash = this.generateHash(hashString);

    const redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard/subscription/payment-callback`;
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/subscription/webhook`;

    return {
      amount: amount.toString(),
      currency: 'EGP',
      orderId: orderId,
      merchantOrderId: merchantOrderId,
      hash: hash,
      mode: this.config.mode,
      merchantRedirect: redirectUrl,
      serverWebhook: webhookUrl,
      merchantId: this.config.merchantId,
      display: 'ar', // اللغة العربية
      billing: {
        name: userName,
        email: userEmail,
        phone: userPhone || ''
      }
    };
  }

  /**
   * التحقق من صحة الـ Webhook
   */
  verifyWebhook(data: any): boolean {
    const { merchantId, merchantOrderId, amount, currency, hash } = data;
    
    const expectedHash = this.generateHash(
      `${merchantId}.${merchantOrderId}.${amount}.${currency}`
    );
    
    return hash === expectedHash;
  }

  /**
   * الحصول على رابط صفحة الدفع
   */
  getPaymentUrl(): string {
    return `${this.baseUrl}`;
  }

  /**
   * التحقق من حالة الدفع
   */
  async verifyPayment(transactionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/transaction/${transactionId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return await response.json();
    } catch (error) {
      console.error('خطأ في التحقق من الدفع:', error);
      throw error;
    }
  }
}

export const kashierService = new KashierService();