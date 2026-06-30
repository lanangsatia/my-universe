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
  const [paymentLoading, setPaymentLoading] = useState(false);

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
  const [paymentAmount] = useState(Number(process.env.NEXT_PUBLIC_GLOBE_PRICE) || 29999);
  const [paymentMethod, setPaymentMethod] = useState<'select' | 'midtrans' | 'manual'>('select');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const enableManual = process.env.NEXT_PUBLIC_ENABLE_MANUAL_PAYMENT === 'true';
  const qrisStaticImage = '/assets/images/qris-static.jpeg';
  const merchantName = 'EL Digital';
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '6289604800267';

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

  const handleManualProofSubmit = async () => {
    if (!proofFile) { alert('Pilih bukti pembayaran terlebih dahulu.'); return; }
    setUploadingProof(true);
    try {
      const fd = new FormData();
      fd.set('order_id', paymentRef);
      fd.set('proof', proofFile);
      const res = await fetch('/api/payment/manual-proof', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Gagal mengirim bukti'); setUploadingProof(false); return; }
      setManualSuccess(true);
      alert('✅ ' + data.message);
    } catch { alert('Terjadi kesalahan saat mengirim bukti'); }
    setUploadingProof(false);
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
      setPaymentLoading(true);
      const res = await fetch('/api/payment/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: paymentAmount }),
      });
      const data = await res.json();
      setPaymentLoading(false);
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
      setPaymentMethod(enableManual ? 'select' : 'midtrans');
      setProofFile(null);
      setManualSuccess(false);
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
                    setPaymentLoading(true);
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
                    setPaymentLoading(false);
                    setPaymentMethod(enableManual ? 'select' : 'midtrans');
                    setProofFile(null);
                    setManualSuccess(false);
                    setShowPayment(true);
                  }} disabled={paymentLoading} style={{ padding: '4px 14px', fontSize: 12, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', border: 'none', borderRadius: 6, color: '#fff', cursor: paymentLoading ? 'wait' : 'pointer', fontWeight: 600, opacity: paymentLoading ? 0.6 : 1 }}>{paymentLoading ? '⏳ Memuat...' : '💳 Bayar Sekarang'}</button>
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

        {/* PAYMENT MODAL */}
        {showPayment && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 99999, backdropFilter: 'blur(12px)' }}>
            <div style={{ position: 'relative', background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)', borderRadius: 24, padding: '32px 28px', maxWidth: 420, width: '90%', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
              
              {/* Loading overlay */}
              {(paymentLoading || uploadingProof) && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,15,35,0.9)', borderRadius: 24, zIndex: 10, flexDirection: 'column', gap: 16 }}>
                  <div style={{ width: 44, height: 44, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #a855f7', borderRadius: '50%', animation: 'spin 1s linear infinite', boxShadow: '0 0 20px rgba(168,85,247,0.3)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: '0.3px' }}>{uploadingProof ? 'Mengirim bukti pembayaran...' : 'Memproses pembayaran...'}</span>
                </div>
              )}

              {/* ============ SCREEN: METHOD SELECTION ============ */}
              {paymentMethod === 'select' && (
                <>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(255,107,107,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>💳</div>
                  <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>Pilih Metode Pembayaran</h3>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 20, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>Rp {paymentAmount.toLocaleString('id-ID')}</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {/* Opsi Instan — langsung buka Snap */}
                    <button onClick={() => {
                      if (payingRef.current || paymentLoading) return;
                      if (!paymentToken) { setPaymentMethod('midtrans'); return; }
                      payingRef.current = true;
                      setPaymentLoading(true);
                      (window as any).snap.pay(paymentToken, {
                        onSuccess: async () => {
                          await fetch('/api/payment/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: paymentRef }) });
                          payingRef.current = false; setPaymentLoading(false); doPublish();
                        },
                        onPending: () => { payingRef.current = false; setPaymentLoading(false); },
                        onError: () => { payingRef.current = false; setPaymentLoading(false); alert('Pembayaran gagal, coba lagi.'); },
                        onClose: () => { payingRef.current = false; setPaymentLoading(false); },
                      });
                    }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(255,107,107,0.08))', border: '1.5px solid rgba(168,85,247,0.25)', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}>
                      <span style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚡</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Pembayaran Instan</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400, marginTop: 2 }}>Otomatis — QRIS, GoPay, OVO, Bank Transfer</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 600, whiteSpace: 'nowrap' }}>⚡ Cepat</span>
                    </button>
                    {/* Opsi Manual */}
                    <button onClick={() => setPaymentMethod('manual')} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}>
                      <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤝</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Pembayaran Manual</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 400, marginTop: 2 }}>Transfer ke QRIS statis, upload bukti</div>
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 600, whiteSpace: 'nowrap' }}>🛡️ Aman</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowPayment(false)} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}>Tutup</button>
                    <a href={`https://wa.me/${waNumber}?text=Halo%20saya%20butuh%20bantuan%20pembayaran`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}>🆘 Bantuan</a>
                  </div>
                </>
              )}

              {/* ============ SCREEN: MIDTRANS (INSTAN) ============ */}
              {paymentMethod === 'midtrans' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    {enableManual && (
                      <button onClick={() => setPaymentMethod('select')} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
                    )}
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, flex: 1, letterSpacing: '-0.3px' }}>Pembayaran Instan</h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 16 }}>Bayar via QRIS, GoPay, OVO, atau Bank Transfer</p>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 20, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rp {paymentAmount.toLocaleString('id-ID')}</div>
                  {paymentToken ? (
                    <button onClick={() => {
                      if (payingRef.current || paymentLoading) return;
                      payingRef.current = true;
                      setPaymentLoading(true);
                      (window as any).snap.pay(paymentToken, {
                        onSuccess: async () => {
                          await fetch('/api/payment/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: paymentRef }) });
                          payingRef.current = false; setPaymentLoading(false); doPublish();
                        },
                        onPending: () => { payingRef.current = false; setPaymentLoading(false); },
                        onError: () => { payingRef.current = false; setPaymentLoading(false); alert('Pembayaran gagal, coba lagi.'); },
                        onClose: () => { payingRef.current = false; setPaymentLoading(false); },
                      });
                    }} disabled={paymentLoading} style={{ width: '100%', marginBottom: 14, padding: '15px 0', background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 15, border: 'none', cursor: paymentLoading ? 'wait' : 'pointer', opacity: paymentLoading ? 0.6 : 1, boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}>{paymentLoading ? '⏳ Memproses...' : '💳 Bayar Sekarang'}</button>
                  ) : paymentRedirectUrl ? (
                    <a href={paymentRedirectUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 14, padding: '15px 0', background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}>💳 Bayar Sekarang</a>
                  ) : null}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { if (!paymentLoading) setShowPayment(false); }} disabled={paymentLoading} style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: paymentLoading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, opacity: paymentLoading ? 0.4 : 1 }}>Tutup</button>
                    {process.env.NEXT_PUBLIC_SHOW_SIMULATE_PAYMENT !== 'false' && (
                      <button onClick={async () => { setPaymentLoading(true); await fetch('/api/payment/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: paymentRef }) }); setPaymentLoading(false); doPublish(); }} disabled={paymentLoading} style={{ flex: 1, padding: '12px 0', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: paymentLoading ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, opacity: paymentLoading ? 0.5 : 1 }}>{paymentLoading ? '⏳' : 'Simulasi Bayar ✅'}</button>
                    )}
                  </div>
                </>
              )}

              {/* ============ SCREEN: MANUAL QRIS ============ */}
              {paymentMethod === 'manual' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <button onClick={() => { setPaymentMethod('select'); setProofFile(null); setManualSuccess(false); }} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, flex: 1, letterSpacing: '-0.3px' }}>Pembayaran Manual</h3>
                  </div>

                  {/* Warning Banner */}
                  <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.2)', marginBottom: 20, textAlign: 'left', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                    <div>
                      <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 2 }}>Perhatian</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>Pembayaran manual perlu diverifikasi admin. Proses verifikasi maksimal 1×24 jam.</div>
                    </div>
                  </div>

                  {/* QRIS Card */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '20px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                      <div style={{ padding: 8, background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                        <img src={qrisStaticImage} alt="QRIS Static" style={{ width: 160, height: 160, borderRadius: 8, objectFit: 'contain', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rp {paymentAmount.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>
                      <div>🏪 <span style={{ color: 'rgba(255,255,255,0.7)' }}>{merchantName}</span></div>
                      <div>💳 <span style={{ color: 'rgba(255,255,255,0.7)' }}>QRIS (Semua Bank & E-Wallet)</span></div>
                    </div>
                  </div>

                  {/* Steps */}
                  <div style={{ textAlign: 'left', marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cara Bayar:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { icon: '📱', text: 'Scan QRIS via bank/e-wallet kamu' },
                        { icon: '💸', text: `Bayar Rp ${paymentAmount.toLocaleString('id-ID')}` },
                        { icon: '📤', text: 'Upload bukti bayar di bawah' },
                      ].map((step, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>{step.icon}</span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{step.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload & Submit */}
                  {!manualSuccess ? (
                    <>
                      {/* Upload area */}
                      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 14, padding: '18px', cursor: 'pointer', background: proofFile ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)', marginBottom: 14, transition: 'all 0.2s' }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setProofFile(f); e.target.value = ''; }} />
                        {proofFile ? (
                          <>
                            <span style={{ fontSize: 28 }}>📎</span>
                            <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>{proofFile.name}</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Klik untuk ganti file</span>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 32, opacity: 0.6 }}>📤</span>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Upload bukti pembayaran</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Screenshot atau foto bukti transfer</span>
                          </>
                        )}
                      </label>

                      {/* Buttons */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setShowPayment(false); setProofFile(null); }} disabled={uploadingProof} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: uploadingProof ? 'wait' : 'pointer', fontSize: 14, fontWeight: 600, opacity: uploadingProof ? 0.4 : 1 }}>Tutup</button>
                        <button onClick={handleManualProofSubmit} disabled={!proofFile || uploadingProof} style={{ flex: 1.5, padding: '13px 0', border: 'none', borderRadius: 12, background: !proofFile ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', cursor: !proofFile ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, opacity: !proofFile ? 0.4 : 1, boxShadow: proofFile ? '0 4px 15px rgba(34,197,94,0.3)' : 'none' }}>{uploadingProof ? '⏳ Mengirim...' : '📤 Kirim Bukti Pembayaran'}</button>
                      </div>
                    </>
                  ) : (
                    /* Success state */
                    <>
                      <div style={{ padding: '18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.25)', marginBottom: 14 }}>
                        <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
                        <div style={{ fontSize: 15, color: '#4ade80', fontWeight: 700, marginBottom: 4 }}>Bukti Terkirim!</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Kami akan verifikasi dan globe akan terbit otomatis setelah pembayaran dikonfirmasi.</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowPayment(false)} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>Tutup</button>
                        <a href={`https://wa.me/${waNumber}?text=Halo%20saya%20sudah%20kirim%20bukti%20pembayaran%20dengan%20ID%20${paymentRef}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1.5, padding: '13px 0', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>🆘 Konfirmasi via WA</a>
                      </div>
                    </>
                  )}
                </>
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
