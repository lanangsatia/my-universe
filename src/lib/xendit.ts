import Xendit from 'xendit-node';

const xenditSecretKey = process.env.XENDIT_SECRET_KEY;

let xenditClient: Xendit | null = null;
let invoiceApi: any = null;

function getInvoiceApi() {
  if (!xenditSecretKey) {
    console.warn('XENDIT_SECRET_KEY not configured, using mock payment');
    return null;
  }
  if (!xenditClient) {
    xenditClient = new Xendit({ secretKey: xenditSecretKey });
    invoiceApi = xenditClient.Invoice;
  }
  return invoiceApi;
}

export interface CreatePaymentParams {
  package: string;
  amount: number;
  userId?: string;
  email?: string;
  name?: string;
}

export async function createPaymentInvoice(params: CreatePaymentParams) {
  const orderId = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const api = getInvoiceApi();

  if (!api) {
    // Mock mode for development
    return {
      order_id: orderId,
      invoice_url: `/payment/${orderId}`,
      qr_image: null,
      status: 'PENDING',
    };
  }

  const invoice = await api.createInvoice({
    data: {
      externalId: orderId,
      amount: params.amount,
      description: `Pembelian paket ${params.package} - My Universe Globe`,
      invoiceDuration: '86400',
      currency: 'IDR',
      customer: params.email
        ? { email: params.email }
        : undefined,
      customerNotificationPreference: {
        invoice_paid: ['email'],
      },
      successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/${orderId}?status=success`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/${orderId}?status=failed`,
    },
  });

  return {
    order_id: orderId,
    invoice_url: invoice.invoiceUrl,
    qr_image: null,
    status: 'PENDING',
  };
}
