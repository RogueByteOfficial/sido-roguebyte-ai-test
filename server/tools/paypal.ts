import { SecurityManager } from '../security.js';

export interface PayPalConfig {
  sandbox: boolean;
  clientId: string;
  clientSecret: string;
}

export interface PayPalOrderResult {
  success: boolean;
  orderId?: string;
  status?: string;
  approveLink?: string;
  amount?: string;
  currency?: string;
  rawResponse?: any;
  error?: string;
}

export class PayPalTool {
  private security: SecurityManager;
  private sandbox: boolean = true;
  private clientId: string = '';
  private clientSecret: string = '';
  private cachedAccessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(security: SecurityManager) {
    this.security = security;
    if (process.env.PAYPAL_SANDBOX_CLIENT_ID && process.env.PAYPAL_SANDBOX_SECRET) {
      this.configure(process.env.PAYPAL_SANDBOX_CLIENT_ID, process.env.PAYPAL_SANDBOX_SECRET, true);
    }
  }

  public configure(clientId: string, clientSecret: string, sandbox: boolean = true): void {
    this.clientId = clientId.trim();
    this.clientSecret = clientSecret.trim();
    this.sandbox = sandbox;
    this.cachedAccessToken = null;
    this.tokenExpiresAt = 0;
    this.security.logAudit(
      'PAYPAL',
      'INFO',
      `PayPal configured. Sandbox mode: ${sandbox ? 'ENABLED' : 'DISABLED'}. Client ID: ${clientId.slice(0, 6)}...`
    );
  }

  public getStatus(): { configured: boolean; sandbox: boolean; clientIdMasked: string } {
    return {
      configured: Boolean(this.clientId && this.clientSecret),
      sandbox: this.sandbox,
      clientIdMasked: this.clientId ? `${this.clientId.slice(0, 6)}...${this.clientId.slice(-4)}` : 'Not Configured'
    };
  }

  private getBaseUrl(): string {
    return this.sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  public async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('PayPal credentials not configured. Please supply Sandbox Client ID and Secret in settings.');
    }

    if (this.cachedAccessToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedAccessToken;
    }

    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to obtain PayPal Sandbox access token: ${this.security.redact(errText)}`);
    }

    const data = await res.json();
    this.cachedAccessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.cachedAccessToken!;
  }

  /**
   * Creates a test order in PayPal Sandbox.
   * Note: Financial actions are strictly guarded by human approval.
   */
  public async createTestOrder(
    amount: string = '10.00',
    currency: string = 'USD',
    description: string = 'Autonomous Agent Test Payment'
  ): Promise<PayPalOrderResult> {
    if (!this.sandbox) {
      throw new Error('PRODUCTION PAYMENT BLOCKED: Agent is strictly restricted to PayPal Sandbox mode.');
    }

    this.security.logAudit('PAYPAL', 'INFO', `Creating PayPal Sandbox Order for ${currency} ${amount}`);

    try {
      const token = await this.getAccessToken();
      const res = await fetch(`${this.getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount
              },
              description
            }
          ],
          application_context: {
            brand_name: 'Local Autonomous AI Agent Sandbox',
            user_action: 'PAY_NOW'
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: this.security.redact(JSON.stringify(data))
        };
      }

      const approveLink = data.links?.find((l: any) => l.rel === 'approve')?.href;

      return {
        success: true,
        orderId: data.id,
        status: data.status,
        approveLink,
        amount,
        currency,
        rawResponse: data
      };
    } catch (err: any) {
      return {
        success: false,
        error: this.security.redact(err.message || String(err))
      };
    }
  }

  public async getOrderStatus(orderId: string): Promise<any> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.getBaseUrl()}/v2/checkout/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await res.json();
  }
}
