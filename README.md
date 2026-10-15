# BookSpot

BookSpot adalah aplikasi **multi-venue booking platform** yang dikembangkan sebagai personal project untuk mensimulasikan sistem booking yang mendekati kebutuhan aplikasi production.

Platform ini memungkinkan pengguna mencari venue, melihat ketersediaan resource seperti lapangan atau ruangan, melakukan booking, dan melakukan pembayaran.

Project ini tidak dibuat hanya sebagai aplikasi CRUD, tetapi berfokus pada beberapa masalah software engineering seperti:

* concurrency dan pencegahan double booking
* database transaction
* payment dan payment webhook
* idempotency
* booking expiration
* background jobs
* Redis
* rate limiting
* automated testing
* load testing
* observability
* CI/CD

> **Status:** Development — tahap awal backend setup.

---

## 1. Project Goals

Tujuan utama BookSpot adalah membangun aplikasi full-stack yang dapat digunakan sebagai portfolio untuk menunjukkan kemampuan:

* Full-stack development
* REST API development
* TypeScript
* Database design
* Authentication dan authorization
* Transaction handling
* Concurrency handling
* Payment integration
* Background processing
* Testing
* Deployment
* Performance testing

Fokus utama project adalah **engineering problem**, bukan sekadar jumlah fitur.

---

## 2. Planned Features

### Customer

* Register dan login
* Melihat venue
* Melihat detail venue
* Melihat resource/lapangan/ruangan
* Melihat availability
* Membuat booking
* Melakukan pembayaran
* Melihat riwayat booking
* Membatalkan booking sesuai aturan

### Venue Owner

* Membuat venue
* Mengelola resource
* Mengatur harga
* Mengatur jam operasional
* Melihat booking
* Mengelola unavailable time

### Admin

* Mengelola user
* Mengelola venue
* Melihat transaksi
* Monitoring platform

---

## 3. Engineering Features

BookSpot dirancang untuk memiliki beberapa fitur teknis yang umum ditemukan pada production application.

### Concurrency

Mencegah dua user melakukan booking terhadap resource dan waktu yang sama.

Contoh:

```text
User A ─────┐
            ├── Court A — 20:00–21:00
User B ─────┘
```

Hanya satu request yang boleh berhasil melakukan reservasi.

### Transactions

Memastikan operasi database yang saling berkaitan tetap konsisten.

### Idempotency

Memastikan request yang sama dapat diproses ulang tanpa menyebabkan efek samping ganda.

Contohnya payment webhook yang dikirim lebih dari satu kali.

### Payment

Payment akan menggunakan payment gateway dalam mode sandbox.

### Booking Expiration

Booking yang belum dibayar dalam batas waktu tertentu akan otomatis menjadi `EXPIRED`.

### Background Jobs

Job terjadwal akan digunakan untuk proses seperti:

* booking expiration
* email notification
* payment-related processing

### Redis

Redis direncanakan digunakan untuk:

* caching
* rate limiting
* background job queue

### Testing

Project akan memiliki:

* Unit tests
* Integration tests
* API tests
* Concurrency tests
* Load tests

---

## 4. Technology Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Node.js
* Express
* TypeScript

### Database

* PostgreSQL
* Prisma ORM

### Infrastructure

* Docker
* Docker Compose
* Redis

### Testing

* Supertest
* Testing framework sesuai kebutuhan project
* Load testing tool sesuai kebutuhan

### Version Control

* Git
* GitHub

---

## 5. Project Structure

Struktur project direncanakan sebagai berikut:

```text
bookspot/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── env.ts
│   │   │
│   │   ├── lib/
│   │   │   └── prisma.ts
│   │   │
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│
├── docs/
│   └── development.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

Struktur akan berkembang mengikuti kebutuhan aplikasi.

---

## 6. Development Environment

BookSpot menggunakan Docker Compose untuk menjalankan infrastructure service secara lokal.

Service yang digunakan saat ini:

```text
PostgreSQL
Redis
```

Jalankan infrastructure dengan:

```bash
docker compose up -d
```

Untuk melihat container:

```bash
docker ps
```

Untuk menghentikan service:

```bash
docker compose down
```

---

## 7. Backend Setup

Masuk ke backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Jalankan development server:

```bash
npm run dev
```

Backend menggunakan:

```text
http://localhost:4000
```

Health check:

```text
GET /api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Endpoint tersebut juga melakukan query sederhana ke PostgreSQL untuk memastikan database dapat diakses.

---

## 8. Environment Variables

Backend menggunakan file `.env`.

Contoh:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://bookspot:bookspot@localhost:5432/bookspot?schema=public"
CORS_ORIGIN=http://localhost:5173
```

File `.env` tidak boleh di-commit ke repository karena dapat berisi informasi sensitif.

Environment variable divalidasi menggunakan Zod ketika aplikasi dijalankan.

---

## 9. Backend Architecture

Backend memisahkan konfigurasi aplikasi, database client, Express application, dan server startup.

```text
.env
 ↓
env.ts
 ↓
validated configuration
 ↓
app.ts
 ↓
Express application
 ↓
server.ts
 ↓
HTTP server
```

Database:

```text
Express
   ↓
Prisma
   ↓
PostgreSQL
```

Pemisahan `app.ts` dan `server.ts` dilakukan agar Express application dapat digunakan secara independen ketika menjalankan automated tests.

---

## 10. Current Development Status

### Completed

* [x] Git repository
* [x] Docker Compose
* [x] PostgreSQL container
* [x] Redis container
* [x] Backend Node.js project
* [x] TypeScript configuration
* [x] Environment configuration
* [x] Zod environment validation
* [x] Prisma initialization
* [x] PostgreSQL adapter
* [x] Express application
* [x] CORS
* [x] Helmet
* [x] JSON request parsing
* [x] Health check endpoint

### Next

* [ ] Design database schema
* [ ] Create Prisma migration
* [ ] User model
* [ ] Venue model
* [ ] Resource model
* [ ] Booking model
* [ ] Authentication
* [ ] Authorization / roles
* [ ] Venue API
* [ ] Availability API
* [ ] Booking API
* [ ] Concurrency protection
* [ ] Payment integration
* [ ] Payment webhook
* [ ] Idempotency
* [ ] Booking expiration
* [ ] Background jobs
* [ ] Redis integration
* [ ] Testing
* [ ] Load testing
* [ ] CI/CD
* [ ] Production deployment

---

## 11. Development Philosophy

BookSpot dikembangkan secara bertahap.

Setiap fitur harus dipahami sebelum melanjutkan ke fitur berikutnya.

AI tools dapat digunakan sebagai development assistant untuk:

* mencari alternatif implementasi
* menjelaskan konsep
* membantu debugging
* membantu membaca error
* membantu dokumentasi

Namun setiap bagian penting dari aplikasi harus dapat dijelaskan dan dipertanggungjawabkan oleh developer.

Fokus pembelajaran adalah memahami:

```text
Problem
   ↓
Design
   ↓
Implementation
   ↓
Testing
   ↓
Debugging
   ↓
Optimization
```

bukan sekadar menghasilkan kode yang dapat berjalan.
