"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function AuthBar() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();
  const [slug, setSlug] = useState<string | null>(null);

  // Sembunyikan navbar di halaman publik globe /u/[slug]
  if (pathname.startsWith('/u/')) return null;

  useEffect(() => {
    if (!isSignedIn) return;
    let mounted = true;
    const fetchSlug = () => {
      fetch('/api/user/subscription')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!mounted) return;
          if (data?.slug) setSlug(data.slug);
        })
        .catch(() => {});
    };
    fetchSlug();
    // Poll every 5s untuk update setelah globe terbit
    const interval = setInterval(fetchSlug, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, [isSignedIn]);

  return (
    <div className="auth-bar">
      {!isSignedIn && (
        <>
          <SignInButton mode="modal">
            <button className="auth-btn auth-btn-signin">Masuk</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="auth-btn auth-btn-signup">Daftar</button>
          </SignUpButton>
        </>
      )}

      {isSignedIn && (
        <>
          <UserButton />
          {pathname === '/dashboard' && slug ? (
            <a href={`/u/${slug}`} className="auth-btn auth-btn-signup" style={{ fontSize: 12, padding: '6px 14px' }}>Globe Saya</a>
          ) : slug ? (
            <a href="/dashboard" className="auth-btn auth-btn-signup" style={{ fontSize: 12, padding: '6px 14px' }}>Dashboard</a>
          ) : (
            <a href="/dashboard" className="auth-btn auth-btn-create" style={{ fontSize: 12, padding: '6px 18px' }}>Buat Globe ✨</a>
          )}
        </>
      )}
    </div>
  );
}
