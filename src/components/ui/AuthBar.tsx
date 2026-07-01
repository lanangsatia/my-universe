"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthBar() {
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();
  const [slug, setSlug] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = user?.publicMetadata?.isAdmin === true;

  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    const interval = setInterval(() => {
      setDemoMode(!!(window as any).__demoMode);
    }, 200);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    let mounted = true;
    fetch('/api/user/subscription')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (data?.slug) setSlug(data.slug);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [isSignedIn]);

  // Sembunyikan navbar di halaman publik globe /u/[slug] dan demo mode
  if (pathname.startsWith('/u/') || demoMode) return null;

  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: scrolled ? 'rgba(10,0,21,0.95)' : 'transparent', transition: 'background 0.3s ease' }}>
      <a href="/" style={{ fontSize: 20, fontWeight: 800, textDecoration: 'none' }}>
        <span style={{ color: '#ff6b6b' }}>❤</span>{' '}
        <span style={{ background: 'linear-gradient(135deg, #ff6b6b, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Universe</span>
      </a>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button style={{ padding: '8px 16px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Masuk</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Daftar</button>
            </SignUpButton>
          </>
        ) : (
          <>
            <UserButton />
            {pathname !== '/admin' && (isAdmin ? (
              <a href="/admin" style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>⚙️ Admin</a>
            ) : pathname === '/dashboard' && slug ? (
              <a href={`/u/${slug}`} style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Globe Saya</a>
            ) : slug ? (
              <a href="/dashboard" style={{ padding: '6px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Dashboard</a>
            ) : (
              <a href="/dashboard" style={{ padding: '6px 18px', borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>Buat Globe ✨</a>
            ))}
          </>
        )}
      </div>
    </nav>
  );
}
