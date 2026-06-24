'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Scene3D = dynamic(() => import('@/components/three/Scene3D'), { ssr: false });

interface GlobeConfig {
  greetingText?: string;
  questionText?: string;
  globeText?: string;
  globeColor?: string;
  particleColor?: string;
  diskColor?: string;
  innerDiskColor?: string;
  outermostColor?: string;
  backgroundColor?: string;
  isGradient?: boolean;
  size?: number;
  rotationSpeed?: number;
  particleSpeed?: number;
  centralHeartEnabled?: boolean;
  text3dEnabled?: boolean;
  nebulaEnabled?: boolean;
  meteorEnabled?: boolean;
  meteorColor?: string;
  meteorSpeed?: number;
  textColor?: string;
}

export default function UserGlobePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [user, setUser] = useState<{ name: string; slug: string; photos: { imageUrl: string }[]; config?: GlobeConfig } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [animTrigger, setAnimTrigger] = useState(0);
  const [isRotating, setIsRotating] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(`/api/users/${slug}`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
          <p>Loading globe...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Globe Not Found</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>The globe you&apos;re looking for doesn&apos;t exist.</p>
          <a href="/" style={{ display: 'inline-block', marginTop: 20, padding: '12px 32px', background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>Create Your Own</a>
        </div>
      </div>
    );
  }

  const cfg = user.config || {};

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      <Scene3D key={slug} photos={user.photos.map(p => p.imageUrl)} autoRotate={isRotating} config={cfg} startAnimation={animTrigger} />

      {/* Greeting overlay with Yes/No buttons */}
      {showGreeting && (
        <div className="overlay-panel" style={{ cursor: 'default' }}>
          <div className="panel-content">
            <h2 style={{ color: '#fff', fontSize: 'clamp(20px,5vw,36px)', fontWeight: 700, marginBottom: 12 }}>
              {cfg.greetingText || `Hi`} 😘
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(14px,3vw,22px)', marginBottom: 24 }}>
              {cfg.questionText || 'Tap to see the universe'}
            </p>
            <div className="btn-group">
              <button className="btn-yes" onClick={() => { setShowGreeting(false); setAnimTrigger(n => n + 1); if (audioRef.current) { audioRef.current.play().catch(() => {}); setIsMuted(false); } }}>Of course 😍</button>
              <button className="btn-no" onClick={(e) => {
                const b = e.currentTarget;
                b.style.position = 'fixed';
                b.style.transition = 'all 0.15s ease';
                b.style.left = Math.random() * (window.innerWidth - 120) + 'px';
                b.style.top = Math.random() * (window.innerHeight - 50) + 'px';
              }}>No way 🙂‍↔️</button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
        padding: '8px 20px', borderRadius: 30, color: 'rgba(255,255,255,0.6)', fontSize: 12,
        fontFamily: "'Segoe UI', sans-serif",
      }}>
        ✨ {user.name || user.slug}&apos;s Universe · Powered by My Universe
      </div>
      <button
        onClick={() => setIsRotating(v => !v)}
        style={{ position: 'fixed', bottom: 20, right: 24, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 14 }}
      >{isRotating ? '⏸' : '▶'}</button>
      <button
        onClick={() => { const a = audioRef.current; if (!a) return; if (isMuted) { a.play().catch(() => {}); setIsMuted(false); } else { a.pause(); setIsMuted(true); } }}
        style={{ position: 'fixed', bottom: 20, right: 80, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 14 }}
      >{isMuted ? '🔇' : '🔊'}</button>
      <audio ref={audioRef} src="/assets/musics/skyfullofstars.mp3" loop preload="auto" style={{ display: 'none' }} />
    </main>
  );
}
