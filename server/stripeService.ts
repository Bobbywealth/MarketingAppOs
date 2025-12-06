import Stripe from 'stripe';

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
export async function getStripeDashboardMetrics(startDate?: Date, endDate?: Date) {
  const stripeInstance = getStripeInstance();
  if (!stripeInstance) {
    throw new Error('Stripe not configured');
  }

  const now = new Date();
  const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
  const end = endDate || now;

  const startTimestamp = Math.floor(start.getTime() / 1000);
  const endTimestamp = Math.floor(end.getTime() / 1000);

  try {
    // Get all data in parallel
    const [
      activeSubscriptions,
      charges,
      customers,
      invoices,
      payouts,
      balanceTransactions,
    ] = await Promise.all([
      // Active subscriptions
      stripeInstance.subscriptions.list({
        status: 'active',
        limit: 100,
      }),
      // Charges in date range
      stripeInstance.charges.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        limit: 100,
      }),
      // Customers created in date range
      stripeInstance.customers.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        limit: 100,
      }),
      // Invoices
      stripeInstance.invoices.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        limit: 100,
      }),
      // Payouts
      stripeInstance.payouts.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        limit: 100,
      }),
      // Balance transactions for gross volume
      stripeInstance.balanceTransactions.list({
        created: {
          gte: startTimestamp,
          lte: endTimestamp,
        },
        limit: 100,
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.data.reduce((total, sub) => {
      if (sub.items.data.length > 0) {
        const price = sub.items.data[0].price;
        if (price && price.recurring?.interval === 'month') {
          return total + (price.unit_amount || 0);
        } else if (price && price.recurring?.interval === 'year') {
          // Convert annual to monthly
          return total + ((price.unit_amount || 0) / 12);
        }
      }
      return total;
    }, 0) / 100; // Convert from cents to dollars

    // Calculate gross volume
    const grossVolume = balanceTransactions.data
      .filter(tx => tx.type === 'charge')
      .reduce((total, tx) => total + tx.amount, 0) / 100;

    // Get successful charges for revenue
    const successfulCharges = charges.data.filter(c => c.status === 'succeeded');
    const totalRevenue = successfulCharges.reduce((total, c) => total + c.amount, 0) / 100;

    // Get refunded amount
    const refundedAmount = charges.data
      .filter(c => c.refunded)
      .reduce((total, c) => total + (c.amount_refunded || 0), 0) / 100;

    // Calculate customer spending
    const customerSpending = new Map<string, { name: string; email: string; total: number }>();
    
    for (const charge of successfulCharges) {
      if (charge.customer) {
        const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer.id;
        const current = customerSpending.get(customerId) || { name: '', email: '', total: 0 };
        current.total += charge.amount / 100;
        
        // Get customer details if not already set
        if (!current.name && typeof charge.customer === 'object') {
          current.name = charge.customer.name || charge.customer.email || 'Unknown';
          current.email = charge.customer.email || '';
        }
        
        customerSpending.set(customerId, current);
      }
    }

    // Get top customers by spend
    const topCustomers = Array.from(customerSpending.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Get customer details for top customers if needed
    const topCustomersWithDetails = await Promise.all(
      topCustomers.map(async (customer) => {
        if (!customer.name) {
          try {
            const stripeCustomer = await stripeInstance!.customers.retrieve(customer.id);
            if ('deleted' in stripeCustomer && stripeCustomer.deleted) {
              return customer;
            }
            return {
              ...customer,
              name: stripeCustomer.name || stripeCustomer.email || 'Unknown',
              email: stripeCustomer.email || '',
            };
          } catch {
            return customer;
          }
        }
        return customer;
      })
    );

    // Total payouts
    const totalPayouts = payouts.data.reduce((total, p) => total + p.amount, 0) / 100;

    // Payment status breakdown
    const paymentBreakdown = {
      succeeded: charges.data.filter(c => c.status === 'succeeded').length,
      pending: charges.data.filter(c => c.status === 'pending').length,
      failed: charges.data.filter(c => c.status === 'failed').length,
      refunded: charges.data.filter(c => c.refunded).length,
    };

    return {
      activeSubscribers: activeSubscriptions.data.length,
      mrr,
      grossVolume,
      totalRevenue,
      refundedAmount,
      newCustomers: customers.data.length,
      totalPayouts,
      topCustomers: topCustomersWithDetails,
      paymentBreakdown,
      recentCharges: successfulCharges.slice(0, 10).map(c => ({
        id: c.id,
        amount: c.amount / 100,
        currency: c.currency.toUpperCase(),
        customerName: typeof c.customer === 'object' ? (c.customer?.name || c.customer?.email || 'Unknown') : 'Unknown',
        created: new Date(c.created * 1000).toISOString(),
        description: c.description || '',
      })),
      recentPayouts: payouts.data.slice(0, 10).map(p => ({
        id: p.id,
        amount: p.amount / 100,
        currency: p.currency.toUpperCase(),
        status: p.status,
        arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
        created: new Date(p.created * 1000).toISOString(),
      })),
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  } catch (error) {
    console.error('Stripe API error:', error);
    throw error;
  }
}

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

