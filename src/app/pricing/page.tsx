'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29999,
    priceLabel: 'Rp29.999',
    features: [
      'Maksimal 10 foto',
      '1 Globe',
      'Share Link',
      'Mobile Friendly',
      'Hosting 1 Tahun',
    ],
    recommended: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 49999,
    priceLabel: 'Rp49.999',
    features: [
      'Maksimal 20 foto',
      '1 Globe',
      'Share Link',
      'Mobile Friendly',
      'Background Music',
      'Tanpa Watermark',
      'Hosting 1 Tahun',
    ],
    recommended: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleChoose = async (plan: typeof PLANS[0]) => {
    setLoading(plan.id);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: plan.id, amount: plan.price }),
      });
      const data = await res.json();
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else if (data.qr_image) {
        // Show QR modal
        router.push(`/payment/${data.order_id}`);
      } else {
        alert('Gagal membuat pembayaran. Silakan coba lagi.');
      }
    } catch {
      alert('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0015 0%, #1a0020 50%, #0a0015 100%)',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Stars background */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.2), transparent), radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.2), transparent)',
        backgroundSize: '200px 200px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Nav */}
      <nav style={{
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', maxWidth: 1200, margin: '0 auto',
      }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          <span style={{ color: '#ff6b6b' }}>❤</span>{' '}
          <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Universe</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>Demo</a>
          <a href="/pricing" style={{ color: '#ff6b6b', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Pricing</a>
        </div>
      </nav>

      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '40px 20px 20px' }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, marginBottom: 12 }}>
          Pilih Paket <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Globe</span> Kamu
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
          Buat globe interaktif berisi foto kenangan dan bagikan ke orang tersayang
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        padding: '20px 20px 60px',
        flexWrap: 'wrap',
        position: 'relative', zIndex: 1,
        maxWidth: 900, margin: '0 auto',
      }}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              flex: '1 1 300px',
              maxWidth: 380,
              background: plan.recommended
                ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(255,107,107,0.15))'
                : 'rgba(255,255,255,0.05)',
              border: plan.recommended
                ? '1px solid rgba(168,85,247,0.4)'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '32px 28px',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(168,85,247,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            {plan.recommended && (
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #a855f7, #ff6b6b)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '4px 16px', borderRadius: 20,
                letterSpacing: 1, textTransform: 'uppercase',
              }}>
                Recommended
              </div>
            )}

            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h2>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 36, fontWeight: 800 }}>{plan.priceLabel}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginLeft: 4 }}>/sekali</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 28 }}>
              {plan.features.map((f, i) => (
                <li key={i} style={{
                  padding: '6px 0',
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleChoose(plan)}
              disabled={loading === plan.id}
              style={{
                width: '100%',
                padding: '14px 0',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading === plan.id ? 'wait' : 'pointer',
                background: plan.recommended
                  ? 'linear-gradient(135deg, #a855f7, #ff6b6b)'
                  : 'rgba(255,255,255,0.1)',
                color: '#fff',
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => { if (loading !== plan.id) e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading === plan.id ? 'Memproses...' : 'Pilih Paket'}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: 12, position: 'relative', zIndex: 1 }}>
        © 2026 My Universe. All rights reserved.
      </div>
    </main>
  );
}
