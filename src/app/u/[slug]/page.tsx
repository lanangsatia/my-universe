'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('@/components/three/Scene3D'), { ssr: false });

interface UserData {
  name: string;
  slug: string;
  photos: { imageUrl: string }[];
}

export default function UserGlobePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: "'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60,
            border: '4px solid rgba(255,255,255,0.2)',
            borderTop: '4px solid #ff6b6b',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px',
          }} />
          <p>Loading globe...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{
        minHeight: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: "'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Globe Not Found</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>
            The globe you&apos;re looking for doesn&apos;t exist.
          </p>
          <a href="/" style={{
            display: 'inline-block', marginTop: 20,
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #a855f7, #ff6b6b)',
            color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600,
          }}>
            Create Your Own
          </a>
        </div>
      </div>
    );
  }

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      <Scene3D photos={user.photos.map(p => p.imageUrl)} autoRotate={true} />

      {/* Watermark branding */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        padding: '8px 20px',
        borderRadius: 30,
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        ✨ {user.name || user.slug}&apos;s Universe · Powered by My Universe
      </div>
    </main>
  );
}
