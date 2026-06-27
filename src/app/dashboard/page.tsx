'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import QRCode from 'qrcode';

const MAX_PHOTOS = 10;

const THEMES = {
  'purple-pink': { name: 'Purple Pink', globeColor: '#a855f7', particleColor: '#ec4899', diskColor: '#a855f7', innerDiskColor: '#f5d0fe', outermostColor: '#ec4899', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'rose-teal': { name: 'Rose Teal', globeColor: '#ff6b6b', particleColor: '#4ecdc4', diskColor: '#ff6b6b', innerDiskColor: '#ffccf2', outermostColor: '#ff6b6b', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'ocean-mint': { name: 'Ocean Mint', globeColor: '#00c3ff', particleColor: '#43cea2', diskColor: '#00c3ff', innerDiskColor: '#ccfbf1', outermostColor: '#00c3ff', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'golden-sunset': { name: 'Sunset', globeColor: '#ffd200', particleColor: '#ff6b6b', diskColor: '#ffd200', innerDiskColor: '#fef9c3', outermostColor: '#ff6b6b', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'emerald-sea': { name: 'Emerald', globeColor: '#11998e', particleColor: '#38bdf8', diskColor: '#11998e', innerDiskColor: '#ccfbf1', outermostColor: '#38bdf8', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'midnight-blue': { name: 'Midnight', globeColor: '#03045e', particleColor: '#00b4d8', diskColor: '#023e8a', innerDiskColor: '#caf0f8', outermostColor: '#0077b6', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'lava-fire': { name: 'Lava', globeColor: '#9b2226', particleColor: '#ee9b00', diskColor: '#ae2012', innerDiskColor: '#e9d8a6', outermostColor: '#ca6702', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'magic-forest': { name: 'Magic Forest', globeColor: '#2d6a4f', particleColor: '#95d5b2', diskColor: '#1b4332', innerDiskColor: '#d8f3dc', outermostColor: '#52b788', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
  'soft-pastel': { name: 'Soft Pastel', globeColor: '#ffafcc', particleColor: '#a2d2ff', diskColor: '#ffc8dd', innerDiskColor: '#cdb4db', outermostColor: '#bde0fe', isGradient: true, size: 9, rotationSpeed: 0.002, particleSpeed: 2.0 },
};

type ThemeKey = keyof typeof THEMES;

interface GlobeConfig {
  greetingText: string; questionText: string;
  globeColor: string; particleColor: string; diskColor: string;
  innerDiskColor: string; outermostColor: string; isGradient: boolean;
  size: number; rotationSpeed: number; particleSpeed: number;
  meteorEnabled: boolean; meteorColor: string; meteorSpeed: number; textColor: string;
}

const DEFAULT_CONFIG: GlobeConfig = {
  greetingText: 'Hi', questionText: 'Wanna see something cute?',
  globeColor: '#a855f7', particleColor: '#ec4899', diskColor: '#a855f7',
  innerDiskColor: '#f5d0fe', outermostColor: '#ec4899', isGradient: true,
  size: 9, rotationSpeed: 0.002, particleSpeed: 2.0,
  meteorEnabled: false, meteorColor: '#00f0ff', meteorSpeed: 4, textColor: '#ffffff',
};

interface PhotoItem { id: string; url: string; file: File; }

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [newPhotos, setNewPhotos] = useState<PhotoItem[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [existingImages, setExistingImages] = useState<{ id: string; url: string }[]>([]);
  const [config, setConfig] = useState<GlobeConfig>(DEFAULT_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment state
  const [showPayment, setShowPayment] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentQr, setPaymentQr] = useState('');
  const [paymentToken, setPaymentToken] = useState('');
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState('');
  const payingRef = useRef(false);

  // Load Midtrans Snap script
  useEffect(() => {
    if (document.getElementById('midtrans-snap')) return;
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.id = 'midtrans-snap';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.body.appendChild(script);
  }, []);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [pendingPayment, setPendingPayment] = useState(false);
  const [paymentAmount] = useState(29999); // Harga tetap

  useEffect(() => {
    (async () => {
      try {
        const [sub, cfg] = await Promise.all([
          fetch('/api/user/subscription').then(r => r.json()),
          fetch('/api/globe/settings').then(r => r.json()),
        ]);
        if (sub.slug) {
          setSlug(sub.slug);
          if (sub.pendingPayment) setPendingPayment(true);
          const u = await fetch(`/api/users/${sub.slug}`).then(r => r.json()).catch(() => null);
          if (u?.photos) {
            setTitle(u.name || '');
            setPublishedUrl(`${window.location.origin}/u/${sub.slug}`);
            setExistingImages(u.photos.map((p: any) => ({ id: p.id, url: p.imageUrl })));
          }
        }
        if (cfg && cfg.globeColor) setConfig(prev => ({ ...prev, ...cfg }));
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Generate QR code when published URL changes
  useEffect(() => {
    if (!publishedUrl) { setQrCodeDataUrl(null); return; }
    QRCode.toDataURL(publishedUrl, { width: 160, margin: 1, color: { dark: '#ffffff', light: '#00000000' } })
      .then(setQrCodeDataUrl)
      .catch(() => {});
  }, [publishedUrl]);

  const handleDeleteImage = useCallback(async (photoId: string) => {
    if (!confirm('Hapus foto ini?')) return;
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/globe/photo/${photoId}`, { method: 'DELETE' });
      if (!res.ok) { alert('Gagal menghapus foto'); setDeletingId(null); return; }
      setExistingImages(prev => prev.filter(p => p.id !== photoId));
    } catch { alert('Terjadi kesalahan'); }
    setDeletingId(null);
  }, []);

  const totalCount = existingImages.length + newPhotos.length;
  const remaining = MAX_PHOTOS - totalCount;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > remaining) { alert(`Maksimal ${MAX_PHOTOS} foto. Kamu hanya bisa tambah ${remaining} foto lagi.`); return; }
    setNewPhotos(prev => [...prev, ...files.map(f => ({ id: Math.random().toString(36).substring(2), url: URL.createObjectURL(f), file: f }))]);
    // Reset input agar bisa pilih file yang sama lagi
    e.target.value = '';
  };

  const removeNewPhoto = (id: string) => setNewPhotos(prev => prev.filter(p => p.id !== id));

  const applyTheme = (key: ThemeKey) => { const t = THEMES[key]; setConfig(prev => ({ ...prev, ...t })); };

  const handleSave = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/globe/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) { alert('Gagal menyimpan pengaturan'); setSavingConfig(false); return; }
      // If already published, also update photos/publish
      if (publishedUrl && newPhotos.length > 0) {
        await doPublish();
      }
    } catch { alert('Terjadi kesalahan saat menyimpan'); }
    setSavingConfig(false);
  };

  const doPublish = async () => {
    setPublishing(true);
    try {
      // Save config first
      const cfgRes = await fetch('/api/globe/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!cfgRes.ok) { alert('Gagal menyimpan pengaturan'); setPublishing(false); return; }
      // Publish: update user with slug (photos already uploaded via upload-photos)
      const formData = new FormData();
      formData.set('title', title || 'My Universe');
      formData.set('slug', slug || `globe-${Date.now()}`);
      // Include any new photos not yet uploaded
      newPhotos.forEach(p => formData.append('photos', p.file));
      const res = await fetch('/api/globe/publish', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Gagal'); setPublishing(false); return; }
      setPublishedUrl(`${window.location.origin}${data.url}`);
      if (data.photos?.length) {
        const newExisting = data.photos.map((p: any) => ({ id: p.id, url: p.imageUrl }));
        setExistingImages(prev => [...prev, ...newExisting]);
      }
      setNewPhotos([]);
      setShowPayment(false);
      setPaymentStatus('');
      setPendingPayment(false);
    } catch { alert('Terjadi kesalahan.'); }
    setPublishing(false);
  };

  const handlePublish = async () => {
    if (newPhotos.length === 0) { alert('Pilih minimal 1 foto.'); return; }
    if (!slug) { alert('Isi slug globe terlebih dahulu.'); return; }

    // Save config settings first (before anything)
    try {
      const cfgRes = await fetch('/api/globe/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (!cfgRes.ok) { alert('Gagal menyimpan pengaturan'); return; }
    } catch { alert('Gagal menyimpan pengaturan'); return; }

    // If already published, just republish (no payment)
    if (publishedUrl) { doPublish(); return; }

    // Upload photos first (so they're saved even if payment is cancelled)
    setPublishing(true);
    try {
      const photoFormData = new FormData();
      photoFormData.set('title', title || 'My Universe');
      newPhotos.forEach(p => photoFormData.append('photos', p.file));
      const uploadRes = await fetch('/api/globe/upload-photos', { method: 'POST', body: photoFormData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { alert(uploadData.error || 'Gagal upload foto'); setPublishing(false); return; }
      // Merge uploaded photos into existing images
      const uploadedPhotos = uploadData.photos.map((p: any) => ({ id: p.id, url: p.imageUrl }));
      setExistingImages(prev => [...prev, ...uploadedPhotos]);
      setNewPhotos([]);

      // Update slug & name now (so data is ready, globe locked until payment)
      try {
        const slugForm = new FormData();
        slugForm.set('title', title || 'My Universe');
        slugForm.set('slug', slug);
        const pubRes = await fetch('/api/globe/publish', { method: 'POST', body: slugForm });
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          setPublishedUrl(`${window.location.origin}${pubData.url}`);
        }
      } catch {}

      // Create payment
      const res = await fetch('/api/payment/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: paymentAmount }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Gagal membuat pembayaran'); setPublishing(false); return; }
      setPaymentRef(data.reference_id);
      setPaymentToken(data.token || '');
      setPaymentRedirectUrl(data.redirect_url || '');
      if (data.redirect_url) {
        QRCode.toDataURL(data.redirect_url, { width: 200, margin: 1 })
          .then(setPaymentQr)
          .catch(() => {});
      }
      if (data.existing) {
        alert('Kamu masih memiliki pembayaran yang belum dibayar. Silakan selesaikan pembayaran sebelumnya.');
      }
      setPaymentStatus('PENDING');
      setPendingPayment(true);
      setShowPayment(true);
      setPublishing(false);
    } catch { alert('Terjadi kesalahan.'); setPublishing(false); }
  };

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#0a0015', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', boxShadow: '0 0 30px rgba(255,107,107,0.6)' }} />
      <div style={{ fontSize: 18, fontWeight: 600, background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Loading Dashboard...</div>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0015 0%, #1a0020 50%, #0a0015 100%)', color: '#fff', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}><span style={{ color: '#ff6b6b' }}>❤</span> <span  style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><a href='/' style={{ color: 'inherit', textDecoration: 'none' }}>My Universe</a></span></div>
       
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Globe Saya</h1>

        {publishedUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12, marginBottom: 24, background: pendingPayment ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)', border: pendingPayment ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(34,197,94,0.3)' }}>
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: pendingPayment ? '#fbbf24' : '#22c55e' }}>{pendingPayment ? '✅ Globe sudah dibuat' : '✅ Globe sudah terbit'}</p>
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7', fontSize: 14, textDecoration: 'underline', wordBreak: 'break-all' }}>{publishedUrl}</a>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => { navigator.clipboard.writeText(publishedUrl); }} style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>📋 Salin Link</button>
                {qrCodeDataUrl && <button onClick={() => { const a = document.createElement('a'); a.href = qrCodeDataUrl; a.download = 'qrcode.png'; a.click(); }} style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>⬇️ Download QR</button>}
                {pendingPayment && (
                  <button onClick={async () => {
                    // If payment data is lost (page refresh), fetch existing payment
                    if (!paymentRef && pendingPayment) {
                      const r = await fetch('/api/payment/qris', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount: paymentAmount }),
                      });
                      const d = await r.json();
                      if (r.ok) {
                        setPaymentRef(d.reference_id);
                        setPaymentToken(d.token || '');
                        setPaymentRedirectUrl(d.redirect_url || '');
                        if (d.redirect_url) {
                          QRCode.toDataURL(d.redirect_url, { width: 200, margin: 1 }).then(setPaymentQr).catch(() => {});
                        }
                      }
                    }
                    setShowPayment(true);
                  }} style={{ padding: '4px 14px', fontSize: 12, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 600 }}>💳 Bayar Sekarang</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FOTO */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📸 Foto ({totalCount}/{MAX_PHOTOS})</h2>
          <div onClick={() => remaining > 0 && fileInputRef.current?.click()} style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 16, padding: '30px 20px', textAlign: 'center', cursor: remaining > 0 ? 'pointer' : 'not-allowed', opacity: remaining > 0 ? 1 : 0.5, background: 'rgba(255,255,255,0.02)', marginBottom: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📸</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{remaining > 0 ? 'Klik untuk upload foto' : 'Maksimal 10 foto'}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {existingImages.map((img) => (
              <div key={img.id} style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => handleDeleteImage(img.id)} disabled={deletingId === img.id} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, background: deletingId === img.id ? 'rgba(255,0,0,0.4)' : 'rgba(255,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{deletingId === img.id ? '⏳' : '✕'}</button>
              </div>
            ))}
            {newPhotos.map(p => (
              <div key={p.id} style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removeNewPhoto(p.id)} style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 10 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul Globe" style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>/u/</span><input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="slug" style={{ width: 120, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} disabled={!!publishedUrl} /></div>
          </div>
          {publishedUrl ? (
            <button onClick={handleSave} disabled={savingConfig} style={{ marginTop: 12, width: '100%', padding: '14px 0', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: savingConfig ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.05)', color: '#fff', opacity: savingConfig ? 0.5 : 1 }}>{savingConfig ? 'Menyimpan...' : '💾 Simpan'}</button>
          ) : (
            <button onClick={handlePublish} disabled={newPhotos.length === 0 || publishing} style={{ marginTop: 12, width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: newPhotos.length === 0 || publishing ? 'not-allowed' : 'pointer', background: newPhotos.length === 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', opacity: newPhotos.length === 0 ? 0.5 : 1 }}>{publishing ? 'Memproses...' : '✨ Terbitkan'}</button>
          )}
        </section>

        {/* QRIS PAYMENT MODAL */}
        {showPayment && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
            <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '32px 28px', maxWidth: 380, width: '90%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Bayar untuk Terbitkan</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>Klik tombol di bawah untuk membayar via QRIS/GoPay/OVO/Bank Transfer</p>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rp {paymentAmount.toLocaleString('id-ID')}</div>
              {paymentToken ? (
                <button onClick={() => {
                  if (payingRef.current) return;
                  payingRef.current = true;
                  (window as any).snap.pay(paymentToken, {
                    onSuccess: async () => {
                      await fetch('/api/payment/simulate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: paymentRef }),
                      });
                      payingRef.current = false;
                      doPublish();
                    },
                    onPending: () => { payingRef.current = false; },
                    onError: () => { payingRef.current = false; alert('Pembayaran gagal, coba lagi.'); },
                    onClose: () => { payingRef.current = false; },
                  });
                }} style={{ display: 'inline-block', marginBottom: 12, padding: '14px 32px', background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer' }}>💳 Bayar Sekarang</button>
              ) : (
                paymentRedirectUrl && (
                  <a href={paymentRedirectUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginBottom: 12, padding: '14px 32px', background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>💳 Bayar Sekarang</a>
                )
              )}
            
              {paymentStatus === 'PAID' ? (
                <div style={{ padding: '12px 0', color: '#22c55e', fontSize: 15, fontWeight: 600 }}>✅ Menerbitkan globe...</div>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => { setShowPayment(false); }} style={{ flex: 1, padding: '14px 0', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Tutup</button>
                  {process.env.NEXT_PUBLIC_SHOW_SIMULATE_PAYMENT !== 'false' && (
                    <button onClick={async () => {
                      await fetch('/api/payment/simulate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: paymentRef }),
                      });
                      doPublish();
                    }} style={{ flex: 1, padding: '14px 0', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 12, background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>Simulasi Bayar ✅</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* THEME */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>🎨 Tema Warna</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 16 }}>
            {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, t]) => (
              <button key={key} onClick={() => applyTheme(key)} style={{ padding: 10, borderRadius: 10, border: config.globeColor === t.globeColor ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 4 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.globeColor, display: 'inline-block' }} />
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.particleColor, display: 'inline-block' }} />
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.diskColor, display: 'inline-block' }} />
                </div>
                <span style={{ fontSize: 11 }}>{t.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* TEKS */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>✏️ Teks Tampilan</h2>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Sapaan Awal</label><input type="text" value={config.greetingText} onChange={e => setConfig(p => ({ ...p, greetingText: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Pertanyaan</label><input type="text" value={config.questionText} onChange={e => setConfig(p => ({ ...p, questionText: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} /></div>

        </section>

        {/* SPEED */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>⚡ Kecepatan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Putaran Globe ({config.rotationSpeed})</label><input type="range" min="0.0001" max="0.01" step="0.0001" value={config.rotationSpeed} onChange={e => setConfig(p => ({ ...p, rotationSpeed: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
            <div><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, display: 'block' }}>Partikel ({config.particleSpeed})</label><input type="range" min="0.1" max="10" step="0.1" value={config.particleSpeed} onChange={e => setConfig(p => ({ ...p, particleSpeed: parseFloat(e.target.value) }))} style={{ width: '100%' }} /></div>
          </div>
        </section>

        {/* EFEK */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>✨ Efek Tambahan</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[{ key: 'meteorEnabled', label: '🌠 Hujan Meteor' }].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', padding: '8px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input type="checkbox" checked={(config as any)[key]} onChange={e => setConfig(p => ({ ...p, [key]: e.target.checked }))} />{label}
              </label>
            ))}
          </div>
          {config.meteorEnabled && (
            <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Warna Meteor</label><input type="color" value={config.meteorColor} onChange={e => setConfig(p => ({ ...p, meteorColor: e.target.value }))} style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }} /></div>
              <div style={{ flex: 2 }}><label style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 2 }}>Kecepatan Meteor ({config.meteorSpeed})</label><input type="range" min="1" max="30" step="1" value={config.meteorSpeed} onChange={e => setConfig(p => ({ ...p, meteorSpeed: parseInt(e.target.value) }))} style={{ width: '100%' }} /></div>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
