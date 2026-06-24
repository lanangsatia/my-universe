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

  useEffect(() => {
    Promise.all([
      fetch('/api/user/subscription').then(r => r.json()),
      fetch('/api/globe/settings').then(r => r.json()),
    ]).then(([sub, cfg]) => {
      if (sub.slug) {
        setSlug(sub.slug);
        fetch(`/api/users/${sub.slug}`).then(r => r.json()).then(u => {
          if (u.photos) { setTitle(u.name || ''); setPublishedUrl(`${window.location.origin}/u/${sub.slug}`); setExistingImages(u.photos.map((p: any) => ({ id: p.id, url: p.imageUrl }))); }
        }).catch(() => {});
      }
      if (cfg && cfg.globeColor) setConfig(prev => ({ ...prev, ...cfg }));
    }).catch(() => {}).finally(() => setLoading(false));
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

  const saveConfig = async () => {
    setSavingConfig(true);
    try { await fetch('/api/globe/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }) }); } catch {}
    setSavingConfig(false);
  };

  const handlePublish = async () => {
    if (newPhotos.length === 0) { alert('Pilih minimal 1 foto.'); return; }
    setPublishing(true);
    try {
      const formData = new FormData();
      formData.set('title', title || 'My Universe');
      formData.set('slug', slug || `globe-${Date.now()}`);
      newPhotos.forEach(p => formData.append('photos', p.file));
      const res = await fetch('/api/globe/publish', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Gagal'); setPublishing(false); return; }
      setPublishedUrl(`${window.location.origin}${data.url}`);
      // Tambah foto baru ke existingImages agar langsung muncul tanpa reload
      if (data.photos?.length) {
        const newExisting = data.photos.map((p: any) => ({ id: p.id, url: p.imageUrl }));
        setExistingImages(prev => [...prev, ...newExisting]);
      }
      setNewPhotos([]);
    } catch { alert('Terjadi kesalahan.'); }
    setPublishing(false);
  };

  if (loading) return <main style={{ minHeight: '100vh', background: '#0a0015', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></main>;

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0015 0%, #1a0020 50%, #0a0015 100%)', color: '#fff', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}><span style={{ color: '#ff6b6b' }}>❤</span> <span  style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}><a href='/' style={{ color: 'inherit', textDecoration: 'none' }}>My Universe</a></span></div>
       
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Globe Saya</h1>

        {publishedUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 12, marginBottom: 24, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
            {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>✅ Globe sudah diterbitkan</p>
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7', fontSize: 14, textDecoration: 'underline', wordBreak: 'break-all' }}>{publishedUrl}</a>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <button onClick={() => { navigator.clipboard.writeText(publishedUrl); }} style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>📋 Salin Link</button>
                {qrCodeDataUrl && <button onClick={() => { const a = document.createElement('a'); a.href = qrCodeDataUrl; a.download = 'qrcode.png'; a.click(); }} style={{ padding: '4px 10px', fontSize: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', cursor: 'pointer' }}>⬇️ Download QR</button>}
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
          <button onClick={handlePublish} disabled={newPhotos.length === 0 || publishing} style={{ marginTop: 12, width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: newPhotos.length === 0 || publishing ? 'not-allowed' : 'pointer', background: newPhotos.length === 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', opacity: newPhotos.length === 0 ? 0.5 : 1 }}>{publishing ? 'Menyimpan...' : publishedUrl ? 'Simpan Perubahan ✨' : 'Terbitkan Globe ✨'}</button>
        </section>

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

        <button onClick={saveConfig} disabled={savingConfig} style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: savingConfig ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', marginBottom: 24 }}>{savingConfig ? 'Menyimpan...' : 'Simpan Pengaturan ✨'}</button>
      </div>
    </main>
  );
}
