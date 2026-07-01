'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import Scene3D from '@/components/three/Scene3D';
import { preloadTextures } from '@/lib/texture-cache';

const SAMPLE_PHOTOS = Array.from({ length: 5 }, (_, i) => `/assets/images/${i + 1}.jpeg`);
const DEFAULT_GREETING = 'Hi, welcome to my universe!';
const DEFAULT_QUESTION = 'Do you want to see our moments?';

const categories = [
  { icon: '💕', label: 'Anniversary', desc: 'Kado romantis yang bisa diputar lagi kapan saja' },
  { icon: '🎂', label: 'Birthday', desc: 'Ucapan ulang tahun dengan foto dan musik favorit' },
  { icon: '💒', label: 'Wedding', desc: 'Album digital kecil untuk momen pernikahan' },
  { icon: '🎓', label: 'Graduation', desc: 'Hadiah kelulusan yang terasa personal' },
  { icon: '✈️', label: 'Travel', desc: 'Jejak perjalanan dalam satu globe interaktif' },
  { icon: '👨‍👩‍👧‍👦', label: 'Family', desc: 'Kenangan keluarga yang mudah dibagikan' },
];

const steps = [
  { icon: '📸', title: 'Upload Foto', desc: 'Pilih foto terbaik, lalu susun jadi cerita kecil.' },
  { icon: '🎨', title: 'Personalisasi Globe', desc: 'Atur tema warna, teks pembuka, efek, dan musik.' },
  { icon: '🔗', title: 'Kirim Link Spesial', desc: 'Bagikan link atau QR code ke orang yang ingin kamu kejutkan.' },
];

const testimonials = [
  { name: 'Sarah & Budi', text: 'Globe ini jadi kado kejutan buat anniversary kami. Dia nangis haru!', rating: 5 },
  { name: 'Rina', text: 'Buat globe kenangan liburan keluarga. Simpel, cantik, dan bermakna.', rating: 5 },
  { name: 'Dian', text: 'Hadiah kelulusan yang unik banget. Teman-teman pada suka!', rating: 5 },
];

const trustItems = [
  { value: '10 menit', label: 'rata-rata selesai dibuat' },
  { value: '1 link', label: 'siap dibuka di HP' },
  { value: '3D + musik', label: 'langsung terasa personal' },
];

const features = [
  { icon: '🌍', title: 'Globe 3D Interaktif', desc: 'Foto tidak cuma tampil seperti galeri biasa. Pengunjung bisa memutar, zoom, dan melihat kenanganmu mengorbit di ruang 3D.' },
  { icon: '💌', title: 'Pesan Pembuka Personal', desc: 'Tambahkan greeting dan pertanyaan pembuka supaya momen pertama saat link dibuka terasa seperti kejutan.' },
  { icon: '🎵', title: 'Background Music', desc: 'Pilih musik latar untuk membangun suasana sebelum foto-foto mulai bergerak.' },
  { icon: '🔗', title: 'Link Unik & QR Code', desc: 'Setiap globe punya halaman sendiri yang mudah dikirim lewat chat, kartu ucapan, atau dicetak sebagai QR.' },
  { icon: '✨', title: 'Efek Visual Siap Pakai', desc: 'Tema warna, partikel, glow, dan meteor dibuat agar hasilnya tetap cantik tanpa perlu desain dari nol.' },
  { icon: '📱', title: 'Nyaman di Mobile', desc: 'Landing globe dibuat untuk dibuka di HP, karena kebanyakan kejutan digital pertama kali dilihat dari chat.' },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestion, setShowQuestion] = useState(false);
  const [isRotating, setIsRotating] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [animTrigger, setAnimTrigger] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionDismissedRef = useRef(false);

  // Dynamic data: user globe if logged in, else defaults
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [greetingText, setGreetingText] = useState(DEFAULT_GREETING);
  const [questionText, setQuestionText] = useState(DEFAULT_QUESTION);
  const [globeConfig, setGlobeConfig] = useState<any>(null);
  const [transitionLoading, setTransitionLoading] = useState(false);

  const fetchGuardRef = useRef<boolean | undefined>(undefined);

  // Parallax effect on marketing page sections
  const parallaxRef = useRef<Map<HTMLElement, number>>(new Map());
  useEffect(() => {
    if (isSignedIn !== false || isLoading || showDemo) return;

    const els = document.querySelectorAll<HTMLElement>('[data-parallax]');
    if (els.length === 0) return;
    els.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-parallax') || '0');
      parallaxRef.current.set(el, speed);
    });

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const wh = window.innerHeight;
          parallaxRef.current.forEach((speed, el) => {
            const rect = el.getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const offset = (center - wh / 2) * speed * 0.15;
            el.style.setProperty('--parallax-y', `${offset}px`);
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
    return () => { window.removeEventListener('scroll', onScroll); parallaxRef.current.clear(); };
  }, [isSignedIn, isLoading, showDemo]);

  // Soft reveal for marketing sections and cards
  useEffect(() => {
    if (isSignedIn !== false || isLoading || showDemo) return;

    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (els.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [isSignedIn, isLoading, showDemo]);

  // Loading overlay until data is fetched
  useEffect(() => {
    if (isSignedIn === undefined) return;
    if (fetchGuardRef.current === isSignedIn) return;
    fetchGuardRef.current = isSignedIn;

    let mounted = true;
    let photoUrlsToLoad: string[] = [];

    if (isSignedIn) setTransitionLoading(true);

    const finish = async () => {
      if (!mounted) return;
      if (photoUrlsToLoad.length > 0) await preloadTextures(photoUrlsToLoad);
      if (mounted) {
        setTransitionLoading(false);
        if (isSignedIn && !questionDismissedRef.current) setShowQuestion(true);
        setTimeout(() => setIsLoading(false), 300);
      }
    };
    const fallback = setTimeout(() => { if (!mounted) return; setIsLoading(false); setTransitionLoading(false); if (isSignedIn && !questionDismissedRef.current) setShowQuestion(true); }, 8000);

    if (isSignedIn) {
      (async () => {
        try {
          const sub = await fetch('/api/user/subscription').then(r => r.ok ? r.json() : null);
          if (!mounted || !sub?.slug) { finish(); return; }
          const data = await fetch(`/api/users/${sub.slug}`).then(r => r.json());
          if (!mounted) return;
          if (data.photos?.length) { photoUrlsToLoad = data.photos.map((p: any) => p.imageUrl); setPhotos(photoUrlsToLoad); }
          if (data.config) setGlobeConfig(data.config);
          if (data.config?.greetingText) setGreetingText(data.config.greetingText);
          if (data.config?.questionText) setQuestionText(data.config.questionText);
        } catch {}
        finish();
      })();
    } else {
      finish();
    }

    return () => { mounted = false; clearTimeout(fallback); };
  }, [isSignedIn]);

  const handleYes = useCallback(() => {
    setShowQuestion(false); questionDismissedRef.current = true;
    setAnimTrigger(n => n + 1);
    if (audioRef.current) { audioRef.current.play().catch(() => {}); setIsMuted(false); }
  }, []);

  if (isLoading || transitionLoading) {
    return (
      <div key="loading-view" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 999999 }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 25px' }} />
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10, background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Universe</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{transitionLoading ? 'Memuat globe kamu ✨' : 'Just a moment ✨'}</div>
        </div>
      </div>
    );
  }

  // Logged in -> show 3D globe directly (skip marketing page)
  if (isSignedIn && !showDemo) {
    return (
      <main key="signed-in-view" style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
        <div className="stars-bg" />
        <Scene3D photos={photos || SAMPLE_PHOTOS} autoRotate={isRotating} startAnimation={animTrigger} config={globeConfig || undefined} />
        <button className="rotate-btn" onClick={() => setIsRotating(v => !v)}>{isRotating ? '⏸' : '▶'}</button>
        <button className="mute-btn" onClick={() => { const a = audioRef.current; if (!a) return; if (isMuted) { a.play().catch(() => {}); setIsMuted(false); } else { a.pause(); setIsMuted(true); } }}>{isMuted ? '🔇' : '🔊'}</button>
        <audio ref={audioRef} src="/assets/musics/skyfullofstars.mp3" loop preload="auto" style={{ display: 'none' }} />
        {showQuestion && (
          <div className="overlay-panel">
            <div className="panel-content">
              <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>{greetingText}</h2>
              <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '2rem' }}>{questionText}</h2>
              <div className="btn-group">
                <button className="btn-yes" onClick={() => {
                  setShowQuestion(false); questionDismissedRef.current = true;
                  setAnimTrigger(n => n + 1);
                  if (audioRef.current) { audioRef.current.play().catch(() => {}); setIsMuted(false); }
                }}>Of course 😍</button>
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
      </main>
    );
  }

  // Full 3D immersive mode (after clicking demo)
  if (showDemo) {
    return (
      <main key="demo-view" style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
        <div className="stars-bg" />
        <Scene3D photos={photos || SAMPLE_PHOTOS} autoRotate={isRotating} startAnimation={animTrigger} config={globeConfig || undefined} />
        <button className="rotate-btn" onClick={() => setIsRotating(v => !v)}>{isRotating ? '⏸' : '▶'}</button>
        <button className="mute-btn" onClick={() => { const a = demoAudioRef.current; if (!a) return; if (isMuted) { a.play().catch(() => {}); setIsMuted(false); } else { a.pause(); setIsMuted(true); } }}>{isMuted ? '🔇' : '🔊'}</button>
        <audio ref={demoAudioRef} src="/assets/musics/skyfullofstars.mp3" loop preload="auto" style={{ display: 'none' }} />
        <button onClick={() => { setShowDemo(false); setShowQuestion(false); questionDismissedRef.current = true; (window as any).__demoMode = false; }} style={{ position: 'fixed', top: 20, left: 20, zIndex: 999999, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(10px)' }}>← Kembali</button>
        {showQuestion && (
          <div className="overlay-panel" style={{ zIndex: 99999 }}>
            <div className="panel-content">
              <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>{greetingText}</h2>
              <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '2rem' }}>{questionText}</h2>
              <div className="btn-group">
                <button className="btn-yes" onClick={() => {
                  setShowQuestion(false); questionDismissedRef.current = true;
                  setAnimTrigger(n => n + 1);
                  if (demoAudioRef.current) { demoAudioRef.current.play().catch(() => {}); setIsMuted(false); }
                }}>Of course 😍</button>
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
      </main>
    );
  }

  return (
    <main style={{
      background: 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.16), transparent 34rem), radial-gradient(circle at 12% 48%, rgba(255,107,107,0.08), transparent 28rem), radial-gradient(circle at 88% 72%, rgba(236,72,153,0.08), transparent 30rem), #0a0015',
      color: '#fff',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Fixed 3D Globe Background */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.3, zIndex: 0, pointerEvents: 'none', background: '#0a0015' }}>
        <Scene3D photos={SAMPLE_PHOTOS} autoRotate config={{ globeColor: '#a855f7', particleColor: '#ec4899', rotationSpeed: 0.0015 }} />
      </div>

      {/* Navbar: AuthBar handles this globally */}

      {/* ===== HERO ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '120px 20px 80px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(10,0,21,0.28) 0%, rgba(10,0,21,0.48) 58%, rgba(10,0,21,0.08) 100%)',
          zIndex: 1,
        }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 720, padding: '0 20px' }}>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 16, letterSpacing: '2px', textTransform: 'uppercase' }}>Interactive 3D Memory Globe</div>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16, letterSpacing: 0 }}>
            Buat Semesta Kecil{' '}
            <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Berisi Kenangan Terindahmu</span>
          </h1>
          <p data-parallax="-0.3" style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: 32, maxWidth: 560, margin: '0 auto 32px' }}>
            Upload foto, tulis pesan pembuka, pilih musik, lalu jadikan semuanya globe 3D interaktif yang bisa dibagikan ke orang tersayang.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isSignedIn ? (
              <a href="/dashboard" style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 25px rgba(168,85,247,0.4)' }}>
                Dashboard
              </a>
            ) : (
              <SignUpButton mode="modal">
                <button style={{ padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 25px rgba(168,85,247,0.4)' }}>
                  Buat Semestamu Sekarang
                </button>
              </SignUpButton>
            )}
            <button onClick={() => { try { setShowDemo(true); setShowQuestion(true); setAnimTrigger(0); (window as any).__demoMode = true; } catch(e) { console.error('Demo error:', e); } }} style={{ padding: '14px 32px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>
              Lihat Demo
            </button>
          </div>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
            {trustItems.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, padding: '100px 0', background: 'transparent' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Untuk Setiap Momen</div>
          <h2 data-parallax="-0.2" style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800 }}>Buat Globe untuk Momen Spesialmu</h2>
          <p data-parallax="-0.15" style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Apapun momennya, abadikan dalam bentuk globe 3D interaktif</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {categories.map((c, i) => (
            <div key={i} data-reveal="item" style={{ ['--reveal-delay' as any]: `${i * 70}ms`, padding: '24px 16px', borderRadius: 16, background: 'rgba(10,0,21,0.4)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{c.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{c.desc}</div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, padding: '100px 0', background: 'transparent' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Fitur Unggulan</div>
          <h2 data-parallax="-0.2" style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800 }}>Kenapa My Universe?</h2>
          <p data-parallax="-0.15" style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Semua yang kamu butuhkan untuk membuat hadiah digital yang tak terlupakan</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <div key={i} data-reveal="item" style={{ ['--reveal-delay' as any]: `${i * 70}ms`, padding: '24px', borderRadius: 16, background: 'rgba(10,0,21,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, padding: '100px 0', background: 'transparent' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Cara Membuat</div>
          <h2 data-parallax="-0.2" style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800 }}>3 Langkah Mudah</h2>
          <p data-parallax="-0.15" style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Hanya 3 langkah sederhana untuk membuat globe kenanganmu</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={i} data-reveal="item" style={{ ['--reveal-delay' as any]: `${i * 90}ms`, display: 'flex', gap: 16, alignItems: 'center', padding: '20px 28px', borderRadius: 16, background: 'rgba(10,0,21,0.4)', border: '1px solid rgba(255,255,255,0.06)', maxWidth: 500, width: '100%' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(255,107,107,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: 'rgba(168,85,247,0.2)', color: '#a855f7', fontWeight: 600 }}>Langkah {i + 1}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, padding: '80px 0', background: 'transparent' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '0 20px' }}>
        <div data-reveal="item" style={{
          padding: '40px 28px 36px', borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(255,107,107,0.1))',
          border: '1.5px solid rgba(168,85,247,0.25)',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          boxShadow: '0 0 60px rgba(168,85,247,0.15)',
        }}>
          {/* decorative glow */}
          <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 12 }}>✨ Spesial — 1 Paket</div>
            <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 4, lineHeight: 1.1 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.5)', verticalAlign: 'super' }}>Rp</span>{' '}
              <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>29.999</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>bayar sekali · berlaku selamanya</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, maxWidth: 240, margin: '0 auto 28px' }}>
              {[
                { icon: '📸', label: '10 foto kenangan' },
                { icon: '🌍', label: 'Globe 3D interaktif' },
                { icon: '🎵', label: 'Background music' },
                { icon: '💌', label: 'Teks pembuka custom' },
                { icon: '🔗', label: 'Link unik & QR code' },
                { icon: '📱', label: 'Mobile friendly' },
                { icon: '☁️', label: 'Hosting gratis' },
              ].map((f, j) => (
                <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span> {f.label}
                </div>
              ))}
            </div>
            <SignUpButton mode="modal">
              <button style={{
                padding: '14px 48px', borderRadius: 14,
                background: 'linear-gradient(135deg, #a855f7, #ff6b6b)',
                color: '#fff', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: 15,
                boxShadow: '0 4px 30px rgba(168,85,247,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 40px rgba(168,85,247,0.6)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 30px rgba(168,85,247,0.4)'; }}
              >Buat Semestaku ✨</button>
            </SignUpButton>
            <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Aktif selamanya · tidak ada bulanan</div>
          </div>
        </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, padding: '100px 0', background: 'transparent' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>Testimonial</div>
          <h2 data-parallax="-0.2" style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800 }}>Apa Kata Mereka?</h2>
          <p data-parallax="-0.15" style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 12 }}>Lihat apa kata pengguna yang sudah membuat globe kenangan</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {testimonials.map((t, i) => (
            <div key={i} data-reveal="item" style={{ ['--reveal-delay' as any]: `${i * 70}ms`, padding: '24px', borderRadius: 16, background: 'rgba(10,0,21,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>{'⭐'.repeat(t.rating)}</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 12, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ fontSize: 13, fontWeight: 700 }}>— {t.name}</div>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section data-reveal="section" style={{ position: 'relative', zIndex: 1, padding: '100px 0', textAlign: 'center', background: 'transparent' }}>
        <div style={{ padding: '0 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 32px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(255,107,107,0.06))', border: '1px solid rgba(168,85,247,0.15)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>❤️</div>
          <h2 data-parallax="-0.15" style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Siap Membuat Kenangan?</h2>
          <p data-parallax="-0.1" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 24, lineHeight: 1.6 }}>Buat globe 3D interaktif berisi foto kenangan terindahmu. Bagikan ke orang spesial dalam hitungan menit.</p>
          {isSignedIn ? (
            <a href="/dashboard" style={{ display: 'inline-block', padding: '14px 36px', borderRadius: 14, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 25px rgba(168,85,247,0.4)' }}>
              ✨ Dashboard
            </a>
          ) : (
            <SignUpButton mode="modal">
              <button style={{ padding: '14px 36px', borderRadius: 14, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 25px rgba(168,85,247,0.4)' }}>
                ✨ Buat Semestamu Sekarang
              </button>
            </SignUpButton>
          )}
        </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '60px 20px 24px', background: 'transparent', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              <span style={{ color: '#ff6b6b' }}>❤</span>{' '}
              <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Universe</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280 }}>Buat semesta kecil berisi kenangan terindahmu. Hadiah digital yang tak terlupakan.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.5px' }}>KONTAK</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
              <div>📧 hello@myuniverse.app</div>
              <div>📱 +62 896-0480-0267</div>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 800, margin: '40px auto 0', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 My Universe · Dibuat dengan ❤️ untuk semua kenangan indah
        </div>
      </footer>

      <audio ref={audioRef} src="/assets/musics/skyfullofstars.mp3" loop preload="auto" style={{ display: 'none' }} />
    </main>
  );
}
