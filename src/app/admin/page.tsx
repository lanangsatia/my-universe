'use client';

import { useEffect, useState, useRef } from 'react';

type Tab = 'stats' | 'users' | 'payments' | 'landing';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats');
  const [error, setError] = useState('');

  if (error) return (
    <main style={{ minHeight: '100vh', background: '#0a0015', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{error}</h1>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', background: '#0a0015', color: '#fff', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>⚙️ Admin Panel</h1>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {([['stats','📊 Statistik'],['users','👥 Users & Globes'],['payments','💳 Payments'],['landing','🏠 Landing']] as [Tab,string][]).map(([k,label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '10px 18px', border: 'none', borderBottom: tab === k ? '2px solid #a855f7' : '2px solid transparent',
              background: 'transparent', color: tab === k ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14, fontWeight: tab === k ? 600 : 400,
            }}>{label}</button>
          ))}
        </div>
        {tab === 'stats' && <StatsTab onError={setError} />}
        {tab === 'users' && <UsersTab onError={setError} />}
        {tab === 'payments' && <PaymentsTab onError={setError} />}
        {tab === 'landing' && <LandingTab onError={setError} />}
      </div>
    </main>
  );
}

function Spinner({ text }: { text?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '4px solid rgba(255,255,255,0.15)', borderTop: '4px solid #ff6b6b', borderRadius: '50%', animation: 'spin 1s linear infinite', boxShadow: '0 0 20px rgba(255,107,107,0.4)' }} />
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{text || 'Memuat...'}</span>
    </div>
  );
}

function StatsTab({ onError }: { onError: (e: string) => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch('/api/admin/stats').then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => onError('Akses ditolak')); }, []);
  if (!data) return <Spinner text="Memuat statistik..." />;
  const cards = [
    { label: 'Total User (DB)', value: data.totalUsers, color: '#a855f7' },
    { label: 'User Clerk', value: data.totalClerkUsers, color: '#7c3aed' },
    { label: 'Punya Globe', value: data.withGlobe, color: '#22c55e' },
    { label: 'Total Foto', value: data.totalPhotos, color: '#3b82f6' },
    { label: 'Pembayaran', value: data.totalPayments, color: '#f59e0b' },
    { label: 'Lunas', value: data.paidPayments, color: '#22c55e' },
    { label: 'Pendapatan', value: `Rp ${(data.revenue || 0).toLocaleString('id-ID')}`, color: '#fbbf24' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      {cards.map(c => (
        <div key={c.label} style={{ padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ onError }: { onError: (e: string) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [editConfig, setEditConfig] = useState<any>({});
  const [editSlug, setEditSlug] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const loadUsers = () => fetch('/api/admin/users').then(r => r.ok ? r.json() : Promise.reject()).then(d => { setUsers(d.users); setLoading(false); }).catch(() => { onError('Akses ditolak'); });
  useEffect(() => { loadUsers(); }, []);

  const openEdit = async (id: string) => {
    setEditId(id);
    setLoadingEdit(true);
    const res = await fetch(`/api/admin/users/${id}`);
    if (!res.ok) { setLoadingEdit(false); return; }
    const data = await res.json();
    setEditData(data);
    setEditConfig(data.config || {});
    setEditSlug(data.slug || '');
    setLoadingEdit(false);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSavingEdit(true);
    const res = await fetch(`/api/admin/users/${editId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: editConfig, slug: editSlug || undefined }),
    });
    if (!res.ok) { const err = await res.json(); alert(err.error || 'Gagal'); setSavingEdit(false); return; }
    alert('✅ Globe settings tersimpan!');
    setSavingEdit(false);
    setEditId(null);
    loadUsers();
  };

  const deletePhoto = async (photoId: string) => {
    if (!confirm('Hapus foto ini?')) return;
    await fetch(`/api/globe/photo/${photoId}`, { method: 'DELETE' });
    openEdit(editId!);
  };

  const toggleBan = async (id: string, active: boolean, name: string) => {
    setActionLoading(`ban-${id}`);
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: active ? 'ban' : 'unban' }) });
    setActionLoading(null);
    loadUsers();
  };
  const del = async (id: string, name: string) => {
    if (!confirm(`Hapus "${name}"? Semua data akan hilang!`)) return;
    setActionLoading(`del-${id}`);
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setActionLoading(null);
    loadUsers();
  };
  if (loading) return <Spinner text="Memuat users..." />;
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '12px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Username</th>
            <th style={{ padding: '12px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Slug</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Foto</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Status</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Preview</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Aksi</th>
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.clerkName||u.name}&background=a855f7&color=fff`} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <span style={{ fontWeight: 600 }}>{u.clerkName || u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 10px', color: 'rgba(255,255,255,0.6)' }}>
                  {u.slug?.startsWith('user-') ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{u.slug}</span>
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>Baru</span>
                    </span>
                  ) : (u.slug || '-')}
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>{u.photoCount}</td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: u.isActive ? '#22c55e' : '#ef4444', marginRight: 6 }} />
                  <span style={{ color: u.isActive ? '#22c55e' : '#ef4444', fontSize: 12 }}>{u.isActive ? 'Aktif' : 'Diban'}</span>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                  {u.slug && !u.slug.startsWith('user-') ? (
                    <a href={`/u/${u.slug}`} target="_blank" style={{ padding: '4px 10px', fontSize: 11, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, background: 'transparent', color: '#a855f7', cursor: 'pointer', textDecoration: 'none' }}>Preview</a>
                  ) : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>-</span>}
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {!u.id?.startsWith?.('clerk-') && <button onClick={() => openEdit(u.id)} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, background: 'transparent', color: '#a855f7', cursor: 'pointer' }}>Edit</button>}
                    <button onClick={() => toggleBan(u.id, u.isActive, u.name)} disabled={actionLoading === `ban-${u.id}`} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, background: 'transparent', color: u.isActive ? '#ef4444' : '#22c55e', cursor: actionLoading === `ban-${u.id}` ? 'wait' : 'pointer', opacity: actionLoading === `ban-${u.id}` ? 0.6 : 1 }}>{actionLoading === `ban-${u.id}` ? '⏳' : u.isActive ? 'Ban' : 'Unban'}</button>
                    <button onClick={() => del(u.id, u.name)} disabled={actionLoading === `del-${u.id}`} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid #ef4444', borderRadius: 6, background: 'transparent', color: '#ef4444', cursor: actionLoading === `del-${u.id}` ? 'wait' : 'pointer', opacity: actionLoading === `del-${u.id}` ? 0.6 : 1 }}>{actionLoading === `del-${u.id}` ? '⏳' : 'Hapus'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Globe Modal */}
      {editId && loadingEdit && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
          <Spinner text="Memuat data globe..." />
        </div>
      )}
      {editId && editData && !loadingEdit && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', zIndex: 99999, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '28px 24px', maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>✏️ Edit Globe: {editData.name}</h3>
              <button onClick={() => setEditId(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Slug: {editData.slug || '-'}</p>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Slug (link globe)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>/u/</span>
                <input value={editSlug} onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))} style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }} />
              </div>
            </div>

            {/* Photos */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📸 Foto</h4>
              <input type="file" accept="image/*" multiple style={{ display: 'none' }} id="admin-photo-upload" onChange={async e => {
                const files = Array.from(e.target.files || []);
                for (const f of files) {
                  const fd = new FormData(); fd.append('photo', f); fd.append('userId', editId);
                  await fetch('/api/admin/globe-upload', { method: 'POST', body: fd });
                }
                openEdit(editId);
                e.target.value = '';
              }} />
              <label htmlFor="admin-photo-upload" style={{ display: 'block', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>+ Upload Foto</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {editData.photos?.map((p: any) => (
                  <div key={p.id} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => deletePhoto(p.id)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'rgba(255,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 9 }}>✕</button>
                  </div>
                ))}
                {(!editData.photos || editData.photos.length === 0) && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Tidak ada foto</span>}
              </div>
            </div>

            {/* Theme presets */}
            <div style={{ marginBottom: 14 }}>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>🎨 Tema</h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { name: 'Purple Pink', gc: '#a855f7', pc: '#ec4899' },
                  { name: 'Rose Teal', gc: '#ff6b6b', pc: '#4ecdc4' },
                  { name: 'Ocean Mint', gc: '#00c3ff', pc: '#43cea2' },
                  { name: 'Sunset', gc: '#ffd200', pc: '#ff6b6b' },
                  { name: 'Emerald', gc: '#11998e', pc: '#38bdf8' },
                  { name: 'Midnight', gc: '#03045e', pc: '#00b4d8' },
                  { name: 'Lava', gc: '#9b2226', pc: '#ee9b00' },
                  { name: 'Magic Forest', gc: '#2d6a4f', pc: '#95d5b2' },
                  { name: 'Soft Pastel', gc: '#ffafcc', pc: '#a2d2ff' },
                ].map(t => (
                  <button key={t.name} onClick={() => setEditConfig({...editConfig, globeColor: t.gc, particleColor: t.pc, diskColor: t.gc, outermostColor: t.pc})} style={{
                    padding: '6px 10px', borderRadius: 8, fontSize: 11, border: editConfig.globeColor === t.gc ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer'
                  }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: t.gc, marginRight: 4 }} />
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: t.pc }} />
                    <span style={{ marginLeft: 6 }}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Teks Sapaan</label>
              <input value={editConfig.greetingText || ''} onChange={e => setEditConfig({...editConfig, greetingText: e.target.value})} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Teks Pertanyaan</label>
              <input value={editConfig.questionText || ''} onChange={e => setEditConfig({...editConfig, questionText: e.target.value})} style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>

            {/* Speed */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Kecepatan Putaran ({editConfig.rotationSpeed || 0.002})</label>
              <input type="range" min="0.0001" max="0.01" step="0.0001" value={editConfig.rotationSpeed || 0.002} onChange={e => setEditConfig({...editConfig, rotationSpeed: parseFloat(e.target.value)})} style={{ width: '100%' }} />
            </div>

            {/* Meteor */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#fff' }}>
                <input type="checkbox" checked={editConfig.meteorEnabled === true} onChange={e => setEditConfig({...editConfig, meteorEnabled: e.target.checked})} /> 🌠 Hujan Meteor
              </label>
              {editConfig.meteorEnabled && (
                <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block' }}>Warna</label><input type="color" value={editConfig.meteorColor || '#00f0ff'} onChange={e => setEditConfig({...editConfig, meteorColor: e.target.value})} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent' }} /></div>
                  <div style={{ flex: 1 }}><label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block' }}>Kecepatan ({editConfig.meteorSpeed || 4})</label><input type="range" min="1" max="30" step="1" value={editConfig.meteorSpeed || 4} onChange={e => setEditConfig({...editConfig, meteorSpeed: parseInt(e.target.value)})} style={{ width: '100%' }} /></div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditId(null)} style={{ flex: 1, padding: '10px 0', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Tutup</button>
              <button onClick={saveEdit} disabled={savingEdit} style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function PaymentsTab({ onError }: { onError: (e: string) => void }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const fetchPay = (s: string) => { setLoading(true); fetch(`/api/admin/payments?status=${s}`).then(r => r.ok ? r.json() : Promise.reject()).then(d => { setPayments(d.payments); setLoading(false); }).catch(() => { onError('Akses ditolak'); }); };
  useEffect(() => { fetchPay(filter); }, [filter]);
  if (loading) return <Spinner text="Memuat pembayaran..." />;
  const markPaid = async (oid: string) => { await fetch('/api/payment/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: oid }) }); fetchPay(filter); };
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all','PENDING','PAID'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, background: filter===s ? 'rgba(168,85,247,0.2)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12 }}>{s==='all'?'Semua':s}</button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '12px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>Order</th>
            <th style={{ padding: '12px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.5)' }}>User</th>
            <th style={{ padding: '12px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.5)' }}>Jumlah</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Status</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Tanggal</th>
            <th style={{ padding: '12px 10px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Aksi</th>
          </tr></thead>
          <tbody>
            {payments.map((p: any) => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 10px', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{p.orderId}</td>
                <td style={{ padding: '12px 10px' }}>{p.user?.name || p.user?.slug || '-'}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600 }}>Rp {p.amount.toLocaleString('id-ID')}</td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: p.status==='PAID' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)', color: p.status==='PAID' ? '#22c55e' : '#fbbf24' }}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                  {p.status !== 'PAID' && <button onClick={() => markPaid(p.orderId)} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid #22c55e', borderRadius: 6, background: 'transparent', color: '#22c55e', cursor: 'pointer' }}>Mark PAID</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LandingTab({ onError }: { onError: (e: string) => void }) {
  const [greeting, setGreeting] = useState('');
  const [question, setQuestion] = useState('');
  const [photos, setPhotos] = useState<{ id: string; url: string; file?: File }[]>([]);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncRes, setSyncRes] = useState('');
  const [landingLoading, setLandingLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLandingLoading(true);
    fetch('/api/admin/landing').then(r => r.json()).then(d => {
      if (d.greetingText) setGreeting(d.greetingText);
      if (d.questionText) setQuestion(d.questionText);
      if (d.photoUrls?.length) setPhotos(d.photoUrls.map((u: string) => ({ id: u, url: u })));
    }).catch(() => {}).finally(() => setLandingLoading(false));
  }, []);

  if (landingLoading) return <Spinner text="Memuat data landing..." />;

  const saveLanding = async () => {
    setSaving(true);
    // Upload new photos
    const photoUrls: string[] = [];
    for (const p of photos) {
      if (p.file) {
        const fd = new FormData(); fd.append('photo', p.file);
        const res = await fetch('/api/admin/landing/upload', { method: 'POST', body: fd }).then(r => r.json()).catch(() => null);
        if (res?.url) photoUrls.push(res.url);
      } else if (!p.url.startsWith('blob:')) {
        photoUrls.push(p.url);
      }
    }
    await fetch('/api/admin/landing', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ greetingText: greeting, questionText: question, photoUrls }),
    });
    alert('✅ Landing tersimpan!');
    setSaving(false);
  };

  const syncClerk = async () => {
    setSyncing(true); setSyncRes('');
    const r = await fetch('/api/admin/sync', { method: 'POST' });
    const d = await r.json();
    setSyncRes(`✅ ${d.created} dibuat, ${d.updated} diperbarui dari ${d.total} user`);
    setSyncing(false);
  };

  return (
    <div style={{ maxWidth: 500 }}>
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🏠 Landing Page Default</h3>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Teks Sapaan</label>
          <input value={greeting} onChange={e => setGreeting(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Teks Pertanyaan</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Foto Landing</label>
          <div onClick={() => fileRef.current?.click()} style={{ border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Klik untuk upload foto</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => {
            const files = Array.from(e.target.files || []);
            setPhotos(prev => [...prev, ...files.map(f => ({ id: Math.random().toString(36).substring(2), url: URL.createObjectURL(f), file: f }))]);
            e.target.value = '';
          }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {photos.map(p => (
              <div key={p.id} style={{ position: 'relative', width: 70, height: 70, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, background: 'rgba(255,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
        <button onClick={saveLanding} disabled={saving} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #a855f7, #ff6b6b)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{saving ? 'Menyimpan...' : 'Simpan Landing'}</button>
      </div>
      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>🔄 Sync Clerk → DB</h3>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Sinkronisasi user Clerk ke database lokal</p>
        <button onClick={syncClerk} disabled={syncing} style={{ padding: '10px 24px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>{syncing ? 'Menyinkronkan...' : 'Sync Clerk'}</button>
        {syncRes && <p style={{ marginTop: 10, fontSize: 13, color: '#22c55e' }}>{syncRes}</p>}
      </div>
    </div>
  );
}
