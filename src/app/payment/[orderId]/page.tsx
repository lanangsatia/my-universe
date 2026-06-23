'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { Suspense } from 'react';

function PaymentContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const orderId = params.orderId as string;
  const status = searchParams.get('status');

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0015 0%, #1a0020 50%, #0a0015 100%)',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '40px',
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
      }}>
        {status === 'success' ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pembayaran Berhasil!</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              Globe kamu sudah aktif. Silakan login untuk mulai mengatur foto-foto kamu.
            </p>
            <a href="/dashboard"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #a855f7, #ff6b6b)',
                color: '#fff',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Buka Dashboard
            </a>
          </>
        ) : status === 'failed' ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pembayaran Gagal</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              Silakan coba lagi atau pilih metode pembayaran lain.
            </p>
            <a href="/pricing"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: 12,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Kembali ke Pricing
            </a>
          </>
        ) : (
          <>
            <div style={{
              width: 60, height: 60,
              border: '4px solid rgba(255,255,255,0.2)',
              borderTop: '4px solid #ff6b6b',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px',
            }} />
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Memproses Pembayaran</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>
              Order ID: {orderId}
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
      }}>
        Loading...
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
