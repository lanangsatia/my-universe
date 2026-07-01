# 🌌 My Universe

> *"A little universe made just for you, filled with everything I feel."*

**My Universe** adalah aplikasi web interaktif 3D untuk membuat dan membagikan **globe kustom** yang dipenuhi foto kenangan, efek partikel galaksi, hujan meteor, dan musik latar. Setiap pengguna mendapat link unik (`/u/[slug]`) untuk dibagikan ke orang spesial.

Dibangun dengan **Next.js 16 (App Router)**, **React 19**, **Three.js**, **Clerk Auth**, **Midtrans Payment**, **Cloudflare R2**, dan **PostgreSQL + Prisma**.

---

## ✨ Fitur Utama

| Fitur | Detail |
|---|---|
| **🌍 Globe 3D Interaktif** | 200.000+ partikel galaksi, sphere gradient GPU shader, bloom glow, OrbitControls |
| **📸 Memory Photo Ring** | Foto user mengorbit di sekitar globe (up to 500 sprite limit) |
| **🌠 Meteor Shower** | Canvas 2D overlay — 200 meteor trails, warna & kecepatan adjustable |
| **🎨 9 Tema Warna** | Purple Pink, Rose Teal, Ocean Mint, Sunset, Emerald, Midnight, Lava, Magic Forest, Soft Pastel |
| **🎬 Animasi Kamera GSAP** | 3-stage cinematic: zoom in → pull back → orbit |
| **💳 Midtrans Snap** | QRIS, GoPay, OVO, Bank Transfer — sandbox & production |
| **🔐 Clerk Auth** | Email/password, Google OAuth, middleware route protection |
| **👑 Admin Panel** | Statistik, CRUD user, edit globe, kelola payment, landing editor, Clerk sync |
| **📱 QR Code** | Generate QR dari link globe untuk dibagikan |
| **❤️ 3D Heart Model** | GLB model hati di tengah globe |
| **🎵 Background Music** | MP3 player dengan mute/unmute kontrol |
| **🏃 "No Way" Button** | Tombol kabur yang lari saat diklik (random position) |

---

## 🛠️ Tech Stack

| Teknologi | Versi | Fungsi |
|---|---|---|
| **Next.js** | 16.2.9 | Framework React (App Router + Turbopack) |
| **React** | 19.2.4 | UI Library |
| **TypeScript** | ^5 | Type safety |
| **Three.js** | ^0.174.0 | Render 3D (WebGL, EffectComposer, UnrealBloomPass, OrbitControls) |
| **GSAP** | ^3.12.2 | Animasi kamera 3-stage |
| **TailwindCSS** | ^4 | Styling utility-first |
| **Prisma** | 5.22.0 | ORM PostgreSQL |
| **PostgreSQL** | — | Database (Supabase / Neon / Railway) |
| **Clerk** | ^7.5.8 | Autentikasi & user management |
| **Midtrans** | ^1.4.3 | Payment gateway (Snap API) |
| **Cloudflare R2** | — | S3-compatible object storage untuk foto |
| **AWS SDK** | ^3.1075.0 | S3 client (upload, delete, pre-signed URL) |
| **QR Code** | ^1.5.4 | Generate QR code client-side |
| **Font Awesome** | 6.0.0 | Icons via CDN |

---

## 📂 Struktur Project

```
my-universe/
├── prisma/
│   └── schema.prisma                        # 3 models: User, Payment, Photo
├── public/
│   └── assets/
│       ├── fonts/DancingScript.json          # Font 3D (Three.js TextGeometry)
│       ├── images/
│       │   ├── 1.jpeg ~ 5.jpeg              # Sample photos landing
│       │   ├── cloud.png                     # Cloud texture
│       │   ├── heart_in_love.glb            # 3D heart model
│       │   └── loading-love.png             # Loading screen icon
│       └── musics/
│           ├── skyfullofstars.mp3           # Main background music
│           └── sombodypleasure.mp3          # Alternative music
├── src/
│   ├── proxy.ts                              # Clerk middleware (auth protection)
│   ├── app/
│   │   ├── globals.css                       # Tailwind v4 + custom CSS + keyframe animations
│   │   ├── layout.tsx                        # Root: ClerkProvider + AuthBar + metadata
│   │   ├── page.tsx                          # Landing page (3D globe, greeting, loading overlay)
│   │   ├── dashboard/page.tsx               # User dashboard (upload, theme, publish)
│   │   ├── admin/page.tsx                   # Admin panel (4 tabs: stats, users, payments, landing)
│   │   ├── u/[slug]/page.tsx               # Public globe page (3D scene + greeting)
│   │   ├── payment/[orderId]/page.tsx      # Payment result page
│   │   ├── pricing/page.tsx                # Pricing plans (Basic Rp29.999 / Premium Rp49.999)
│   │   ├── sign-in/[[...sign-in]]/page.tsx # Clerk sign-in
│   │   ├── sign-up/[[...sign-up]]/page.tsx # Clerk sign-up
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── stats/route.ts           # GET — aggregate statistics
│   │       │   ├── users/route.ts           # GET — list users (non-admin)
│   │       │   ├── users/[id]/route.ts      # GET/PUT/PATCH/DELETE — CRUD user
│   │       │   ├── payments/route.ts        # GET — payment history (status filter)
│   │       │   ├── globes/route.ts          # GET — all globes list
│   │       │   ├── landing/route.ts         # GET/PUT — landing page defaults
│   │       │   ├── landing/upload/route.ts  # POST — upload landing photo
│   │       │   ├── globe-upload/route.ts    # POST — upload photo ke user's globe
│   │       │   └── sync/route.ts            # POST — sync Clerk users → DB
│   │       ├── globe/
│   │       │   ├── publish/route.ts         # POST — publish/update globe (FormData)
│   │       │   ├── settings/route.ts        # GET/PUT — user globe config
│   │       │   └── photo/[id]/route.ts      # DELETE — hapus foto
│   │       ├── payment/
│   │       │   ├── qris/route.ts            # POST — create Midtrans Snap transaction
│   │       │   ├── create/route.ts          # POST — legacy Snap creation
│   │       │   ├── status/[orderId]/route.ts# GET — check payment DB status
│   │       │   ├── webhook/route.ts         # POST — Midtrans webhook handler
│   │       │   ├── simulate/route.ts        # POST — sandbox payment simulation
│   │       │   └── bypass/route.ts          # POST — bypass payment (dev)
│   │       ├── r2/[...path]/route.ts        # GET — proxy image dari Cloudflare R2
│   │       ├── user/subscription/route.ts   # GET — user package/limit info
│   │       ├── users/[slug]/route.ts        # GET — public globe data + photos
│   │       └── webhooks/clerk/route.ts      # POST — Clerk webhook (user.created/updated/deleted)
│   ├── components/
│   │   ├── three/Scene3D.tsx               # 🎯 Core 3D scene: galaxy particles, sphere, photo ring,
│   │   │                                     # meteor shower, bloom, heart GLB, GSAP animation, OrbitControls
│   │   └── ui/AuthBar.tsx                  # Navigation bar: sign-in/up, UserButton, contextual links
│   └── lib/
│       ├── prisma.ts                        # PrismaClient singleton
│       ├── r2.ts                            # S3 client: uploadToR2(), deleteFromR2(), generateUploadUrl()
│       └── midtrans.ts                      # Midtrans Snap: createSnapTransaction(), checkTransactionStatus()
├── styles.css                               # Legacy CSS (not imported, reference only)
├── workflow.md                              # Business architecture document
├── .env.example                             # Template environment variables
├── .node-version                            # Node.js 20.19.5
├── next.config.ts                           # Turbopack config
├── postcss.config.mjs                       # TailwindCSS v4 PostCSS
├── tsconfig.json                            # Path alias @/ → ./src/*
├── eslint.config.mjs                        # ESLint flat config
├── skills-lock.json                         # VS Code Copilot skills lock
└── package.json
```

---

## 🧱 Database Schema (PostgreSQL + Prisma)

### Model: `User` (table: `users`)

| Field | Type | Default | Keterangan |
|---|---|---|---|
| `id` | UUID | auto | Primary key |
| `clerkId` | String? | — | Clerk user ID (unique) |
| `email` | String | — | Email (unique) |
| `name` | String | — | Display name |
| `slug` | String | — | URL slug (unique, misal `pasutri-ayang`) |
| `package` | String | `"free"` | Paket: free / basic / premium |
| `maxPhotos` | Int | `5` | Maksimal foto |
| `config` | Json | `{}` | Globe config (theme, teks, kecepatan, dll) |
| `createdAt` | DateTime | now | |
| `updatedAt` | DateTime | auto | |

Relations: `Payment[]`, `Photo[]`

### Model: `Payment` (table: `payments`)

| Field | Type | Default | Keterangan |
|---|---|---|---|
| `id` | UUID | auto | Primary key |
| `orderId` | String | — | Order ID Midtrans (unique) |
| `userId` | UUID? | — | Foreign key → User |
| `package` | String | — | Paket yang dibayar |
| `amount` | Int | — | Harga dalam Rupiah |
| `status` | String | `"PENDING"` | PENDING / PAID |
| `paidAt` | DateTime? | — | Waktu bayar |
| `createdAt` | DateTime | now | |
| `updatedAt` | DateTime | auto | |

Relation: `User?`

### Model: `Photo` (table: `photos`)

| Field | Type | Default | Keterangan |
|---|---|---|---|
| `id` | UUID | auto | Primary key |
| `userId` | UUID | — | Foreign key → User |
| `imageUrl` | Text | — | URL foto (R2 atau lokal) |
| `title` | String? | — | Judul foto |
| `description` | String? | — | Deskripsi foto |
| `positionX/Y/Z` | Float? | — | Posisi 3D (future use) |
| `createdAt` | DateTime | now | |

Relation: `User`

---

## 🖥️ Persyaratan Sistem

- **Node.js** ≥ 20.9.0 (lihat `.node-version`)
- **PostgreSQL** database (via Supabase, Neon, Railway, atau lokal)
- **Akun Clerk** (gratis di https://clerk.com) — untuk autentikasi
- **Cloudflare R2** bucket (opsional, ada fallback `public/uploads/`)
- **Akun Midtrans** (opsional, ada mock mode & sandbox)

---

## 🚀 Instalasi & Setup

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd my-universe
npm install
```

> `postinstall` script otomatis menjalankan `prisma generate`.

### 2. Setup Database

```bash
# Push schema ke PostgreSQL
npx prisma db push

# (Opsional) Generate Prisma Client lagi
npx prisma generate
```

### 3. Environment Variables

```bash
cp .env.example .env
```

Isi file `.env` dengan credentials:

| Variable | Wajib? | Deskripsi |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk — Publishable Key |
| `CLERK_SECRET_KEY` | ✅ | Clerk — Secret Key |
| `R2_ENDPOINT` | ❌ | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | ❌ | R2 Access Key |
| `R2_SECRET_ACCESS_KEY` | ❌ | R2 Secret Key |
| `R2_BUCKET_NAME` | ❌ | Nama R2 bucket |
| `R2_PUBLIC_URL` | ❌ | `https://pub-<hash>.r2.dev` |
| `MIDTRANS_SERVER_KEY` | ❌ | Midtrans Server Key (mock fallback) |
| `MIDTRANS_CLIENT_KEY` | ❌ | Midtrans Client Key |
| `MIDTRANS_IS_PRODUCTION` | ❌ | `false` = sandbox, `true` = production |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | ❌ | Sama dengan client key (exposed ke client) |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | ❌ | `false` = sandbox snap.js, `true` = production |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | ❌ | Default: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | ❌ | Default: `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | ❌ | Default: `/` |

> 💡 **Tanpa R2**: Foto akan disimpan di `public/uploads/` (fallback lokal).
> 💡 **Tanpa Midtrans**: Sistem otomatis mock mode — payment selalu return token palsu.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### 5. Build untuk Production

```bash
npm run build
# atau untuk Vercel:
npm run vercel-build
```

---

## 📄 Halaman & Routing

| Route | Deskripsi | Akses |
|---|---|---|
| `/` | **Landing page** — Loading overlay "Love Planet" (3s), 3D globe dengan sample photos, greeting + question, background music | 🌍 Publik |
| `/dashboard` | **User Dashboard** — Upload foto (max 10), pilih tema (9 preset), atur teks/kecepatan, publish globe + payment flow | 🔐 Login |
| `/u/[slug]` | **Public Globe** — 3D scene dengan foto user + config kustom, greeting interactive | 🌍 Publik |
| `/admin` | **Admin Panel** — 4 tabs: Statistik, Users & Globes, Payments, Landing editor | 🔐 Admin |
| `/sign-in` | Clerk Sign In | 🌍 Publik |
| `/sign-up` | Clerk Sign Up | 🌍 Publik |
| `/pricing` | **Pricing** — Basic (Rp29.999/10 foto) & Premium (Rp49.999/20 foto + musik + no watermark) | 🌍 Publik |
| `/payment/[orderId]` | **Payment Result** — Status sukses/gagal/pending dari query param | 🌍 Publik |

### 🔐 Middleware Protection (`src/proxy.ts`)

Clerk middleware melindungi semua route **kecuali**:

```
/  /pricing  /u(.*)  /sign-in(.*)  /sign-up(.*)
/api/webhooks(.*)  /api/payment/webhook(.*)
/api/users(.*)  /api/r2(.*)  /api/admin/landing(.*)
```

Static files (css, js, jpg, png, mp3, wav, dll) juga di-exclude dari middleware.

---

## 📡 API Routes (20+ Endpoints)

### 🛠️ Admin API (`/api/admin/*`)

| Method | Route | Auth | Deskripsi |
|---|---|---|---|
| **GET** | `/api/admin/stats` | Admin | Total users, clerk users, globe count, photos, payments, revenue |
| **GET** | `/api/admin/users` | Admin | List all DB users + Clerk data (avatar, ban status), excludes admin |
| **GET/PUT/PATCH/DELETE** | `/api/admin/users/[id]` | Admin | GET: user globe data / PUT: update config & slug / PATCH: ban/unban / DELETE: hapus user + photos + payments + Clerk |
| **GET** | `/api/admin/payments` | Admin | Payment history, optional `?status=PENDING\|PAID` filter |
| **GET** | `/api/admin/globes` | Admin | List all globes with photo count |
| **GET/PUT** | `/api/admin/landing` | Admin/Publik | GET: landing defaults (public). PUT: save defaults (admin) |
| **POST** | `/api/admin/landing/upload` | Admin | Upload photo to `/landing/` in R2 |
| **POST** | `/api/admin/globe-upload` | Admin | Upload photo to any user's globe |
| **POST** | `/api/admin/sync` | Admin | Sync all Clerk users → Prisma DB |

### 🌍 Globe API (`/api/globe/*`)

| Method | Route | Auth | Deskripsi |
|---|---|---|---|
| **POST** | `/api/globe/publish` | Login | Create/update user + upload photos (FormData, max 10 files), returns slug & URL |
| **GET/PUT** | `/api/globe/settings` | Login | GET: load config. PUT: save config (theme, text, effects) |
| **DELETE** | `/api/globe/photo/[id]` | Login | Delete photo from R2 + DB (ownership verified) |

### 💳 Payment API (`/api/payment/*`)

| Method | Route | Auth | Deskripsi |
|---|---|---|---|
| **POST** | `/api/payment/qris` | Login | Create Midtrans Snap transaction, save PENDING payment record |
| **POST** | `/api/payment/create` | Login | Legacy Snap creation (similar to qris) |
| **GET** | `/api/payment/status/[orderId]` | Publik | Check payment status from DB |
| **POST** | `/api/payment/webhook` | Publik | Midtrans notification handler — marks PAID on settlement/capture |
| **POST** | `/api/payment/simulate` | Sandbox | Simulate payment success (marks PAID) |
| **POST** | `/api/payment/bypass` | Publik | Bypass payment (dev mode) — creates user + PAID payment, redirects to dashboard |

### 📦 Other API

| Method | Route | Auth | Deskripsi |
|---|---|---|---|
| **GET** | `/api/r2/[...path]` | Publik | Proxy Cloudflare R2 files (Content-Type + cache headers) |
| **GET** | `/api/user/subscription` | Login | User's slug, photo count, maxPhotos |
| **GET** | `/api/users/[slug]` | Publik | Public globe data: name, slug, config, photos (R2 → proxy URL), banned status |
| **POST** | `/api/webhooks/clerk` | Publik | Clerk webhook: user.created → create DB user, user.updated → sync, user.deleted → delete |

---

## 🎮 Cara Penggunaan

### 👤 User Biasa

1. **Daftar/Login** → klik **Daftar** atau **Masuk** (via Clerk — email atau Google)
2. **Upload Foto** → Dashboard → klik area upload → pilih foto (max 10)
3. **Atur Tema** → Pilih dari 9 preset warna, atur kecepatan rotasi & partikel, teks greeting, teks question
4. **Terbitkan Globe** → klik **Terbitkan Globe ✨**
   - **Sandbox**: klik **Simulasi Bayar ✅**
   - **Production**: klik **💳 Bayar Sekarang** → bayar via Midtrans Snap (QRIS/GoPay/OVO/Bank Transfer)
5. **Bagikan** → Link globe muncul (`https://domain.com/u/[slug]`). QR code tersedia untuk download.
6. **Globe Saya** → Kembali kapan saja ke dashboard untuk edit foto, tema, atau pengaturan

### 👑 Admin

1. Buka **Clerk Dashboard** → Users → pilih user → **Public Metadata** → set `{"isAdmin":true}`
2. Buka `/admin`
3. **📊 Statistik** — Lihat total user, globe, foto, pemasukan
4. **👥 Users & Globes** — Ban/unban user, edit globe (foto, tema, slug), hapus user
5. **💳 Payments** — Filter riwayat, mark PAID manual untuk pembayaran tertentu
6. **🏠 Landing** — Atur teks greeting/question default landing page, upload foto default

---

## 🎨 9 Tema Warna

| Tema | Warna Globe | Warna Partikel | Suasana |
|---|---|---|---|
| **Purple Pink** | `#a855f7` | `#ec4899` | Romantis ungu |
| **Rose Teal** | `#ff6b6b` | `#4ecdc4` | Kontras hangat |
| **Ocean Mint** | `#00c3ff` | `#43cea2` | Laut segar |
| **Sunset** | `#ffd200` | `#ff6b6b` | Golden hour |
| **Emerald** | `#11998e` | `#38bdf8` | Alam hijau |
| **Midnight** | `#03045e` | `#00b4d8` | Malam biru |
| **Lava** | `#9b2226` | `#ee9b00` | Api menyala |
| **Magic Forest** | `#2d6a4f` | `#95d5b2` | Hutan ajaib |
| **Soft Pastel** | `#ffafcc` | `#a2d2ff` | Lembut manis |

---

## 🧪 Testing Mode

### Sandbox Midtrans

```env
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
```

- Tombol **Simulasi Bayar ✅** muncul untuk testing tanpa bayar sungguhan
- Snap.js dari `app.sandbox.midtrans.com`
- Gunakan kartu/test payment dari dashboard Midtrans

### Mock Mode (tanpa Midtrans Key)

Jika `MIDTRANS_SERVER_KEY` tidak diisi, sistem otomatis mock:
```ts
// Token palsu, redirect ke halaman payment lokal
token = `mock-token-${orderId}`
redirect_url = `/payment/${orderId}?mock=1`
```

### Bypass Payment

Akses `/pricing` → pilih paket → langsung redirect ke dashboard tanpa bayar.

---

## 🚢 Deployment ke Vercel

```bash
# 1. Push ke GitHub
git add .
git commit -m "ready deploy"
git push

# 2. Vercel akan detect Next.js & jalankan:
#    "vercel-build": "npx prisma generate && next build"
```

### Environment Variables di Vercel

Set semua env vars di **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Production PostgreSQL URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk — Publishable Key |
| `CLERK_SECRET_KEY` | Clerk — Secret Key |
| `R2_ENDPOINT` | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | R2 credentials |
| `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | R2 public URL |
| `MIDTRANS_SERVER_KEY` | Midtrans production key |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Sama dengan client key |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `true` untuk production |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

> ⚠️ Clerk Dashboard → **Sessions** → set **"Session duration"** sesuai kebutuhan.
> ⚠️ Clerk Dashboard → **Webhooks** → tambah endpoint `https://domain.com/api/webhooks/clerk` untuk sync user events.

---

## 🧩 Komponen Utama

### `Scene3D` (`src/components/three/Scene3D.tsx`)

Komponen 3D paling kompleks (±500+ baris). Fitur:

| Layer | Detail |
|---|---|
| **Background Stars** | 4,000 random points |
| **Galaxy Disk** | 6,000 (inner) + 100,000 (main) + 100,000 (outer) particles with custom shader |
| **Central Sphere** | 15,000 animated particles, GPU `onBeforeCompile`, gradient/warna configurable |
| **Photo Ring** | Up to 500 sprites from user photos, arranged in orbit |
| **Bloom** | `UnrealBloomPass` (strength 1.5, radius 0.25, threshold 0) — layer separation |
| **Meteor Shower** | Canvas 2D overlay — 200 trails, configurable color & speed |
| **GSAP Animation** | 3-stage: zoom in (3s) → pull back (2s) → orbit (5s) |
| **Heart Model** | GLB `heart_in_love.glb` loaded at center |
| **OrbitControls** | Damping, zoom limits, rotation limits |

Props:
```typescript
interface Scene3DProps {
  photos?: string[];           // Photo URLs
  autoRotate?: boolean;        // Auto-rotation toggle
  startAnimation?: number;     // Trigger GSAP animation (increment)
  onSceneReady?: (refs) => void;
  config?: {
    globeColor, particleColor, diskColor, innerDiskColor, outermostColor,
    isGradient, size, rotationSpeed, particleSpeed,
    meteorEnabled, meteorColor, meteorSpeed,
    centralHeartEnabled, text3dEnabled, nebulaEnabled
  };
}
```

### `AuthBar` (`src/components/ui/AuthBar.tsx`)

Navigation bar yang otomatis menyesuaikan status user:
- **Not signed in**: Tombol "Masuk" & "Daftar"
- **Signed in, admin**: Tombol "⚙️ Admin"
- **Signed in, punya globe, di dashboard**: Link "Globe Saya"
- **Signed in, punya globe, bukan di dashboard**: Link "Dashboard"
- **Signed in, belum punya globe**: Tombol animasi gradient "Buat Globe ✨"

Sembunyi otomatis di halaman `/u/[slug]`.

---

## 🔐 Keamanan

- **Route protection**: Clerk middleware — semua route privat otomatis proteksi
- **Admin detection**: via `clerkClient().users.getUser().publicMetadata.isAdmin`
- **Ownership verification**: DELETE photo hanya bisa oleh pemilik
- **Webhook signature**: Clerk webhook diverifikasi
- **No secrets in client**: Semua server key hanya di server
- **R2 proxy**: Image dari R2 diproxy via API, bukan direct URL

---

## 📝 Lisensi

Hak cipta © 2025 — **ELLL**. Dibuat dengan ❤️.

---

*"A little universe made just for you, filled with everything I feel."*
