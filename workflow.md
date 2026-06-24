# Photo Globe SaaS - Refactor Plan (HTML → Next.js)

## Overview

Photo Globe adalah platform untuk membuat globe interaktif berisi foto-foto kenangan yang dapat dibagikan melalui link unik.

Contoh hasil:

```
https://photoglobe.id/u/lanang-satia
```

User dapat:

* Membayar sekali menggunakan QRIS
* Mendapatkan link unik pribadi
* Upload foto
* Mengatur globe
* Mengedit kapan saja
* Membagikan globe ke keluarga, pasangan, atau teman

---

# Monetization

## Package Basic

Harga: Rp29.999

Fitur:

* Maksimal 10 foto
* 1 Globe
* Share Link
* Mobile Friendly
* Hosting 1 Tahun

---

## Package Premium

Harga: Rp49.999

Fitur:

* Maksimal 20 foto
* 1 Globe
* Share Link
* Mobile Friendly
* Background Music
* Tanpa Watermark
* Hosting 1 Tahun

---

# User Flow

## Landing Page

```
Landing Page
    ↓
Preview Demo Globe
    ↓
Pilih Paket
```

---

## Payment Flow

```
Pilih Paket
      ↓
Generate QRIS
      ↓
User Bayar
      ↓
Webhook Payment Gateway
      ↓
Status = PAID
      ↓
Dashboard Aktif
```

---

## Globe Creation Flow

```
Dashboard
      ↓
Upload Foto
      ↓
Atur Judul
      ↓
Preview Globe
      ↓
Publish
      ↓
Generate Public URL
```

---

## Share Flow

```
User Publish
      ↓
Generate Link
      ↓
https://photoglobe.id/u/{slug}
      ↓
Share ke siapa saja
```

---

# Suggested Technology Stack

## Frontend

* Next.js App Router
* TypeScript
* Tailwind CSS
* React Three Fiber
* Drei

---

## Backend

* Next.js API Routes
* Prisma ORM

---

## Database

PostgreSQL

Pilihan:

* Supabase PostgreSQL

---

## Authentication

Pilihan:

* Clerk
* Auth.js

Rekomendasi MVP:

Clerk

---

## File Storage

Cloudflare R2

Alasan:

* Murah
* S3 Compatible
* Tidak ada egress fee

---

## Payment Gateway

Pilihan:

* Xendit
* Midtrans

Rekomendasi MVP:

Xendit QRIS

---

## Hosting

* Vercel
* Cloudflare

---

# Architecture

```
Frontend (Next.js)
        │
        ▼
API Routes
        │
        ├── PostgreSQL
        │
        ├── Cloudflare R2
        │
        └── Xendit
```

---

# Database Design

## users

```sql
id uuid
email varchar
name varchar
slug varchar
package varchar
max_photos integer
created_at timestamp
```

Contoh:

```json
{
  "slug": "lanang-satia"
}
```

---

## payments

```sql
id uuid
order_id varchar
user_id uuid
package varchar
amount integer
status varchar
paid_at timestamp
created_at timestamp
```

Status:

```
PENDING
PAID
EXPIRED
FAILED
```

---

## photos

```sql
id uuid
user_id uuid
image_url text
title varchar
description text
position_x numeric
position_y numeric
position_z numeric
created_at timestamp
```

---

# Storage Structure

Jangan simpan foto di database.

Gunakan Cloudflare R2.

Struktur:

```
users/
   user123/
      photo1.jpg
      photo2.jpg

users/
   user456/
      photo1.jpg
```

Database hanya menyimpan URL.

Contoh:

```json
{
  "image_url": "https://cdn.photoglobe.id/user123/photo1.jpg"
}
```

---

# Public URL Strategy

## Option A

```
photoglobe.id/u/lanang-satia
```

## Option B

```
photoglobe.id/globe/abc123
```

Rekomendasi:

Option A lebih mudah diingat dan lebih personal.

---

# Next.js Folder Structure

```
src/
│
├── app/
│   ├── page.tsx
│   ├── pricing/
│   ├── dashboard/
│   ├── editor/
│   ├── payment/
│   ├── u/[slug]/
│   └── api/
│
├── components/
│
├── hooks/
│
├── services/
│
├── lib/
│
├── prisma/
│
└── types/
```

---

# Refactor Strategy

## Existing Project

Saat ini:

```
HTML
CSS
JavaScript
```

Globe kemungkinan masih menggunakan:

```
photos[]
```

hardcoded.

---

## Refactor Phase 1

Pisahkan Globe menjadi reusable component.

Contoh:

```
components/
   Globe/
      Globe.tsx
      PhotoItem.tsx
      Controls.tsx
      Stars.tsx
```

Target:

```tsx
<PhotoGlobe photos={photos} />
```

---

## Refactor Phase 2

Hilangkan hardcoded photos.

Dari:

```js
const photos = [...]
```

Menjadi:

```ts
const photos = await getPhotos(userId)
```

---

## Refactor Phase 3

Buat halaman public.

Route:

```
/u/[slug]
```

Flow:

```
Get User
      ↓
Get Photos
      ↓
Render Globe
```

---

## Refactor Phase 4

Dashboard Editor

Fitur:

* Upload Foto
* Hapus Foto
* Edit Caption
* Atur Posisi
* Preview Globe
* Publish

---

# Payment Integration

## Create Payment

```
POST /api/payment/create
```

Membuat:

```
payment record
+
QRIS
```

---

## Webhook

```
POST /api/payment/webhook
```

Jika sukses:

```sql
status = PAID
```

Aktifkan akun.

---

# Premium Feature Ideas

## Background Music

Upload:

```
mp3
```

Diputar saat globe dibuka.

---

## Story Mode

Foto muncul satu-persatu.

Mirip:

* Memories
* Timeline Story

---

## Timeline

```
2019
2020
2021
2022
```

Foto muncul berdasarkan tahun.

---

## Export Video

Generate:

```
MP4
```

Dari animasi globe.

Bisa menjadi upsell tambahan.

---

# MVP Roadmap

## Week 1

* Setup Next.js
* Setup Prisma
* Setup PostgreSQL
* Setup Cloudflare R2

---

## Week 2

* Refactor Globe Component
* Upload Foto
* Dashboard
* Public Globe Page

---

## Week 3

* Integrasi QRIS
* Webhook
* Paket Basic & Premium

---

## Week 4

* Music
* Story Mode
* Sharing
* Production Deployment

---

# Success Criteria

User dapat:

1. Membuka website
2. Memilih paket
3. Membayar QRIS
4. Mendapat dashboard
5. Upload foto
6. Membuat globe
7. Mendapat link unik
8. Mengedit globe kapan saja
9. Membagikan globe ke orang lain

Tanpa perlu bantuan admin.
