import Stripe from 'stripe';
import memoize from 'memoizee';

let stripe: Stripe | null = null;

export function initializeStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️  Stripe not configured. Set STRIPE_SECRET_KEY in .env');
    return null;
  }

  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-10-28.acacia',
  });

  console.log('✅ Stripe initialized');
  return stripe;
}

export function getStripeInstance() {
  if (!stripe) {
    initializeStripe();
  }
  return stripe;
}

// Get dashboard metrics
async function _getStripeDashboardMetrics(startDate?: Date, endDate?: Date) {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    throw new Error('Stripe not configured');
  }
...
      },
    };
  } catch (error) {
    console.error('Stripe API error:', error);
    throw error;
  }
}

// Memoized version to improve performance
export const getStripeDashboardMetrics = memoize(_getStripeDashboardMetrics, {
  promise: true,
  maxAge: 5 * 60 * 1000, // 5 minutes cache
  normalizer: (args) => {
    const start = args[0] instanceof Date ? args[0].toISOString().split('T')[0] : 'default';
    const end = args[1] instanceof Date ? args[1].toISOString().split('T')[0] : 'default';
    return `${start}-${end}`;
  }
});

// Create a new invoice
export async function createStripeInvoice(customerId: string, items: Array<{ description: string; amount: number }>) {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    throw new Error('Stripe not configured');
  }

  try {
    // Create invoice
    const invoice = await stripeInstance.invoices.create({
      customer: customerId,
      auto_advance: false, // Don't automatically finalize
      collection_method: 'send_invoice',
      days_until_due: 30,
    });

    // Add invoice items
    for (const item of items) {
      await stripeInstance.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: item.description,
        amount: Math.round(item.amount * 100), // Convert to cents
        currency: 'usd',
      });
    }

    // Finalize the invoice
    const finalizedInvoice = await stripeInstance.invoices.finalizeInvoice(invoice.id);

    return {
      id: finalizedInvoice.id,
      amount: finalizedInvoice.amount_due / 100,
      currency: finalizedInvoice.currency.toUpperCase(),
      status: finalizedInvoice.status,
      hostedInvoiceUrl: finalizedInvoice.hosted_invoice_url,
      invoicePdf: finalizedInvoice.invoice_pdf,
      created: new Date(finalizedInvoice.created * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error creating Stripe invoice:', error);
    throw error;
  }
}

// Get all customers for dropdown
export async function getStripeCustomers() {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    throw new Error('Stripe not configured');
  }

  try {
    const customers = await stripeInstance.customers.list({
      limit: 100,
    });

    return customers.data.map(c => ({
      id: c.id,
      name: c.name || c.email || 'Unknown',
      email: c.email || '',
    }));
  } catch (error) {
    console.error('Error fetching Stripe customers:', error);
    throw error;
  }
}

// Get balance
export async function getStripeBalance() {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    throw new Error('Stripe not configured');
  }

  try {
    const balance = await stripeInstance.balance.retrieve();
    
    return {
      available: balance.available.map(b => ({
        amount: b.amount / 100,
        currency: b.currency.toUpperCase(),
      })),
      pending: balance.pending.map(b => ({
        amount: b.amount / 100,
        currency: b.currency.toUpperCase(),
      })),
    };
  } catch (error) {
    console.error('Error fetching Stripe balance:', error);
    throw error;
  }
}

// Create Checkout Session for signup package purchase
export async function createCheckoutSession(params: {
  packageId: string;
  packageName: string;
  packagePrice: number;
  clientEmail: string;
  clientName: string;
  leadId?: string;
  discountCode?: string;
  stripeCouponId?: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    throw new Error('Stripe not configured');
  }

  try {
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: params.packageName,
              description: `Marketing package subscription`,
            },
            unit_amount: params.packagePrice, // Amount in cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: params.clientEmail,
      client_reference_id: params.leadId || undefined,
      metadata: {
        packageId: params.packageId,
        packageName: params.packageName,
        clientName: params.clientName,
        leadId: params.leadId || '',
        discountCode: params.discountCode || '',
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      billing_address_collection: 'required',
      // Always allow promotion codes at checkout
      allow_promotion_codes: true,
    };

    // Add discount if provided
    if (params.stripeCouponId) {
      sessionConfig.discounts = [{
        coupon: params.stripeCouponId,
      }];
    }

    const session = await stripeInstance.checkout.sessions.create(sessionConfig);

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
}

