'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface UploadedPhoto {
  id: string;
  url: string;
  file: File;
}

export default function DashboardPage() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: UploadedPhoto[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2),
      url: URL.createObjectURL(file),
      file,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePublish = async () => {
    if (photos.length === 0) return;
    setPublishing(true);

    // Mock publish - in real app, upload to R2 and save to DB
    await new Promise((r) => setTimeout(r, 1500));

    const generatedSlug = slug || `globe-${Date.now()}`;
    setPublishedUrl(`${window.location.origin}/u/${generatedSlug}`);
    setPublishing(false);
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0015 0%, #1a0020 50%, #0a0015 100%)',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: '#ff6b6b' }}>❤</span>{' '}
          <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Demo</a>
          <a href="/pricing" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>Pricing</a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Buat Globe Kamu</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
          Upload foto-foto kenangan dan bagikan globe interaktif ke orang tersayang
        </p>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Judul Globe</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Our Journey Together"
            style={{
              width: '100%', padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, color: '#fff', fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {/* Slug */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Link Custom (opsional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>/u/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="nama-globe-kamu"
              style={{
                flex: 1, padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12, color: '#fff', fontSize: 15,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Upload */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            Foto ({photos.length}/20)
          </label>

          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed rgba(255,255,255,0.2)',
              borderRadius: 16,
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
              background: 'rgba(255,255,255,0.02)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'; e.currentTarget.style.background = 'rgba(168,85,247,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
              Klik untuk upload foto
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              Format: JPG, PNG · Maks 5MB per foto
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Photo grid */}
        {photos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {photos.map((photo) => (
              <div key={photo.id} style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Image
                  src={photo.url}
                  alt="Preview"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="120px"
                />
                <button
                  onClick={() => removePhoto(photo.id)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 24, height: 24,
                    background: 'rgba(0,0,0,0.6)',
                    border: 'none', borderRadius: '50%',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Publish button */}
        <button
          onClick={handlePublish}
          disabled={photos.length === 0 || publishing}
          style={{
            width: '100%',
            padding: '16px 0',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
            cursor: photos.length === 0 || publishing ? 'not-allowed' : 'pointer',
            background: photos.length === 0
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #a855f7, #ff6b6b)',
            color: '#fff',
            opacity: photos.length === 0 ? 0.5 : 1,
            marginBottom: 24,
          }}
        >
          {publishing ? 'Menerbitkan...' : 'Terbitkan Globe ✨'}
        </button>

        {/* Published URL */}
        {publishedUrl && (
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12,
            padding: 16,
            textAlign: 'center',
          }}>
            <p style={{ color: '#22c55e', fontSize: 14, marginBottom: 8 }}>✅ Globe berhasil diterbitkan!</p>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#a855f7',
                fontSize: 14,
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
            >
              {publishedUrl}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
