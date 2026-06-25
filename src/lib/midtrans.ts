import Midtrans from 'midtrans-client';

// Snap API (backend)
let snap: Midtrans.Snap | null = null;

function getSnap() {
  if (!snap) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    if (!serverKey) return null;
    snap = new Midtrans.Snap({
      isProduction,
      serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    });
  }
  return snap;
}

export async function createSnapTransaction(amount: number, orderId: string) {
  const s = getSnap();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  if (!s) {
    // Mock mode
    return {
      token: `mock-token-${orderId}`,
      redirect_url: `${baseUrl}/payment/${orderId}?mock=1`,
    };
  }

  const transaction = await s.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
    credit_card: { secure: true },
    customer_details: {
      notes: 'Pembuatan Globe - My Universe',
    },
    callbacks: {
      finish: `${baseUrl}/payment/${orderId}?status=success`,
      error: `${baseUrl}/payment/${orderId}?status=error`,
      pending: `${baseUrl}/payment/${orderId}?status=pending`,
    },
  });

  return {
    token: transaction.token,
    redirect_url: transaction.redirect_url,
  };
}

export async function checkTransactionStatus(orderId: string) {
  const s = getSnap();
  if (!s) return { status: 'PENDING' };

  try {
    const status = await s.transaction.status(orderId);
    return { status: status.transaction_status || 'PENDING' };
  } catch {
    return { status: 'PENDING' };
  }
}
