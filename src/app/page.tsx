'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Scene3D from '@/components/three/Scene3D';
import { preloadTextures } from '@/lib/texture-cache';

const SAMPLE_PHOTOS = Array.from({ length: 5 }, (_, i) => `/assets/images/${i + 1}.jpeg`);
const DEFAULT_GREETING = 'Hi, welcome to my universe!';
const DEFAULT_QUESTION = 'Do you want to see our moments?';

export default function Home() {
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestion, setShowQuestion] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [animTrigger, setAnimTrigger] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const helpPanelRef = useRef<HTMLDivElement>(null);
  const helpIconRef = useRef<HTMLDivElement>(null);

  // Dynamic data: user globe if logged in, else defaults
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [greetingText, setGreetingText] = useState(DEFAULT_GREETING);
  const [questionText, setQuestionText] = useState(DEFAULT_QUESTION);
  const [dataReady, setDataReady] = useState(false);

  // Keep loading overlay until ALL data is fetched AND photos are preloaded
  useEffect(() => {
    let mounted = true;
    let resolved = 0;
    let photoUrlsToLoad: string[] = [];

    const checkDone = async () => {
      if (!mounted) return;
      resolved++;
      if (resolved >= 2) {
        // Preload all photos before hiding loading overlay
        if (photoUrlsToLoad.length > 0) {
          await preloadTextures(photoUrlsToLoad);
        }
        if (mounted) {
          setDataReady(true);
          setTimeout(() => setIsLoading(false), 300);
        }
      }
    };
    const fallback = setTimeout(() => { if (!mounted) return; setDataReady(true); setIsLoading(false); }, 8000);

    // Fetch landing defaults (public)
    fetch('/api/admin/landing')
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        if (data.photoUrls?.length) { photoUrlsToLoad = data.photoUrls; setPhotos(data.photoUrls); }
        if (data.greetingText) setGreetingText(data.greetingText);
        if (data.questionText) setQuestionText(data.questionText);
      })
      .catch(() => {})
      .finally(() => { checkDone(); });

    // If logged in & has globe, override with personal data
    const fetchUserGlobe = async () => {
      try {
        const sub = await fetch('/api/user/subscription').then(r => r.ok ? r.json() : null);
        if (!mounted || !sub?.slug) { checkDone(); return; }
        const data = await fetch(`/api/users/${sub.slug}`).then(r => r.json());
        if (!mounted) return;
        if (data.photos?.length) { photoUrlsToLoad = data.photos.map((p: any) => p.imageUrl); setPhotos(photoUrlsToLoad); }
        if (data.config?.greetingText) setGreetingText(data.config.greetingText);
        if (data.config?.questionText) setQuestionText(data.config.questionText);
      } catch {}
      checkDone();
    };
    if (isSignedIn) fetchUserGlobe(); else checkDone();

    return () => { mounted = false; clearTimeout(fallback); };
  }, [isSignedIn]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (showHelp && helpPanelRef.current && helpIconRef.current && !helpPanelRef.current.contains(e.target as Node) && !helpIconRef.current.contains(e.target as Node)) setShowHelp(false); };
    document.addEventListener('click', h); return () => document.removeEventListener('click', h);
  }, [showHelp]);

  const handleYes = useCallback(() => {
    setShowQuestion(false);
    setAnimTrigger(n => n + 1);
    // Auto-play music on user gesture
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsMuted(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div id="flower-loading-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 999999, pointerEvents: 'none' }}>
        <div style={{ textAlign: 'center', color: '#fff', fontFamily: 'Arial,sans-serif' }}>
          <div style={{ marginBottom: '30px', textAlign: 'center' }}>
            <img src="/assets/images/loading-love.png" alt="Love Planet" style={{ display: 'block', margin: '0 auto', width: '60px', height: '60px', filter: 'drop-shadow(0 0 10px rgba(255,107,107,0.5))', animation: 'pulse 2s ease-in-out infinite' }} />
          </div>
          <div style={{ width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 25px', boxShadow: '0 0 30px rgba(255,107,107,0.6)' }} />
          <div className="gradient-text" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '15px', textShadow: '0 0 15px rgba(255,255,255,0.6)' }}>Love Planet</div>
          <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '10px', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>A world shaped with love, just for you...</div>
          {photos && photos.length > 0
            ? <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Menyiapkan {photos.length} foto kenangan ✨</div>
            : <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Just a moment ✨</div>}
        </div>
      </div>
    );
  }

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      <div className="stars-bg" />
      <Scene3D photos={photos || SAMPLE_PHOTOS} autoRotate={isRotating} startAnimation={animTrigger} />

      {showQuestion && (
        <div id="questionPanel" className="overlay-panel">
          <div className="panel-content">
            <h2 id="greetingText" style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>{greetingText}</h2>
            <h2 id="questionText" style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '2rem' }}>{questionText}</h2>
            <div className="btn-group">
              <button id="btnYes" className="btn-yes" onClick={handleYes}>Of course 😍</button>
              <button id="noBtn" className="btn-no" onClick={(e) => {
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

      {/* <div ref={helpIconRef} className="help-icon" onClick={() => setShowHelp(v => !v)} style={{ display: showQuestion ? 'none' : 'flex' }}>
        <i className="fas fa-question-circle" style={{ color: '#fff', fontSize: '20px' }} />
      </div> */}


      {/* {showHelp && (
        <div ref={helpPanelRef} className="help-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Petunjuk Singkat</h3>
            <button onClick={() => setShowHelp(false)} className="close-help"><i className="fas fa-times" /></button>
          </div>
          <div className="help-section">
            <div className="section-divider"><h4>Kontrol Dasar</h4></div>
            <ul>
              <li><span className="label-mobile">[Mobile]</span> Ketuk 2x di mana saja ✨</li>
              <li><span className="label-pc">[PC]</span> Klik dua kali di mana saja ✨</li>
            </ul>
          </div>
          <div className="help-section">
            <div className="section-divider"><h4>Kontrol Kamera</h4></div>
            <ul>
              <li>Geser untuk menjelajahi 💫</li>
              <li>Scroll / Cubit untuk zoom ✨</li>
            </ul>
          </div>
        </div>
      )} */}

      <button className="rotate-btn" onClick={() => setIsRotating(v => !v)}>{isRotating ? '⏸' : '▶'}</button>
      <button className="mute-btn" onClick={() => {
        const a = audioRef.current;
        if (!a) return;
        if (isMuted) { a.play().catch(() => {}); setIsMuted(false); }
        else { a.pause(); setIsMuted(true); }
      }}>{isMuted ? '🔇' : '🔊'}</button>
      <audio ref={audioRef} src="/assets/musics/skyfullofstars.mp3" loop preload="auto" style={{ display: 'none' }} />
    </main>
  );
}
