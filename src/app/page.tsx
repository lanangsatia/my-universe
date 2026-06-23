'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Scene3D from '@/components/three/Scene3D';

const SAMPLE_PHOTOS = Array.from({ length: 32 }, (_, i) => `/assets/images/photo${i + 1}.jpeg`);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestion, setShowQuestion] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [animTrigger, setAnimTrigger] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const helpPanelRef = useRef<HTMLDivElement>(null);
  const helpIconRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 3000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (showHelp && helpPanelRef.current && helpIconRef.current && !helpPanelRef.current.contains(e.target as Node) && !helpIconRef.current.contains(e.target as Node)) setShowHelp(false); };
    document.addEventListener('click', h); return () => document.removeEventListener('click', h);
  }, [showHelp]);

  const handleYes = useCallback(() => { setShowQuestion(false); setAnimTrigger(n => n + 1); }, []);

  if (isLoading) {
    return (
      <div id="flower-loading-overlay" style={{ display: 'block', position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 999999, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', color: '#fff', fontFamily: 'Arial,sans-serif', zIndex: 1 }}>
          <div style={{ marginBottom: '30px' }}>
            <img src="/assets/images/loading-love.png" alt="Love Planet" style={{ width: '60px', height: '60px', filter: 'drop-shadow(0 0 10px rgba(255,107,107,0.5))', animation: 'pulse 2s ease-in-out infinite' }} />
          </div>
          <div style={{ width: '60px', height: '60px', border: '4px solid rgba(255,255,255,0.2)', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 25px', boxShadow: '0 0 30px rgba(255,107,107,0.6)' }} />
          <div className="gradient-text" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '15px', textShadow: '0 0 15px rgba(255,255,255,0.6)' }}>Love Planet</div>
          <div style={{ fontSize: '18px', fontWeight: 500, marginBottom: '10px', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>A world shaped with love, just for you...</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Just a moment ✨</div>
        </div>
      </div>
    );
  }

  return (
    <main style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#000', position: 'relative' }}>
      <div className="stars-bg" />
      <Scene3D photos={SAMPLE_PHOTOS} autoRotate={isRotating} startAnimation={animTrigger} />

      {showQuestion && (
        <div id="questionPanel" className="overlay-panel">
          <div className="panel-content">
            <h2 id="greetingText" style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>Happy Anniversary Bubuyy 😘</h2>
            <h2 id="questionText" style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '2rem' }}>Do you want to see our moments?</h2>
            <div className="btn-group">
              <button id="btnYes" className="btn-yes" onClick={handleYes}>Of course 😍</button>
              <button id="noBtn" className="btn-no" onClick={(e) => {
                const b = e.currentTarget; const c = b.parentElement!; const r = c.getBoundingClientRect();
                b.style.position = 'absolute'; b.style.left = Math.random() * (r.width - 100) + 'px'; b.style.top = Math.random() * (r.height - 50) + 'px';
              }}>No way 🙂‍↔️</button>
            </div>
          </div>
        </div>
      )}

      <div ref={helpIconRef} className="help-icon" onClick={() => setShowHelp(v => !v)} style={{ display: showQuestion ? 'none' : 'flex' }}>
        <i className="fas fa-question-circle" style={{ color: '#fff', fontSize: '20px' }} />
      </div>

      {showHelp && (
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
      )}

      <button className="rotate-btn" onClick={() => setIsRotating(v => !v)}>{isRotating ? '⏸' : '▶'}</button>
      <button className="mute-btn" onClick={() => {
        const a = audioRef.current;
        if (!a) return;
        if (isMuted) { a.play().catch(() => {}); setIsMuted(false); }
        else { a.pause(); setIsMuted(true); }
      }}>{isMuted ? '🔇' : '🔊'}</button>
      <audio ref={audioRef} src="/assets/musics/skyfullofstars.mp3" loop preload="none" style={{ display: 'none' }} />
    </main>
  );
}
