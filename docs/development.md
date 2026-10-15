# BookSpot Development Documentation

Dokumen ini berisi catatan teknis mengenai setup dan alasan penggunaan teknologi pada BookSpot.

---

# 1. Repository Structure

BookSpot menggunakan struktur monorepo sederhana:

```text
bookspot/
├── backend/
├── frontend/
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md
```

Backend dan frontend dipisahkan karena keduanya merupakan application layer yang berbeda.

```text
React Frontend
      ↓ HTTP
Node.js Backend
      ↓
PostgreSQL
```

---

# 2. Git

Repository dibuat menggunakan Git:

```bash
git init
```

Git digunakan untuk:

* version control
* melihat perubahan
* membuat checkpoint melalui commit
* bekerja dengan branch
* mengintegrasikan project dengan GitHub

Commit sebaiknya dibuat berdasarkan perubahan yang memiliki tujuan jelas.

Contoh:

```text
feat: add venue API
feat: add authentication
fix: prevent duplicate booking
test: add booking concurrency test
```

---

# 3. Docker Compose

Docker Compose digunakan untuk menjalankan infrastructure service secara lokal.

Service saat ini:

```text
PostgreSQL
Redis
```

Konfigurasi berada pada:

```text
docker-compose.yml
```

Menjalankan service:

```bash
docker compose up -d
```

Melihat container:

```bash
docker ps
```

Menghentikan service:

```bash
docker compose down
```

## PostgreSQL

PostgreSQL digunakan sebagai relational database utama BookSpot.

Database:

```text
bookspot
```

User:

```text
bookspot
```

Port:

```text
5432
```

## Redis

Redis belum digunakan pada tahap awal.

Redis akan digunakan pada tahap berikutnya untuk kebutuhan seperti:

* caching
* rate limiting
* background job queue

Redis sengaja disiapkan sejak awal agar infrastructure development konsisten.

---

# 4. PostgreSQL Volume

PostgreSQL menggunakan Docker volume:

```text
pgdata
```

Volume digunakan agar data database tidak bergantung pada lifecycle container.

Konsep:

```text
PostgreSQL Container
        │
        ↓
     pgdata
        │
        ↓
Persistent Database Data
```

Container dapat dihentikan atau dibuat ulang tanpa otomatis menghapus database yang tersimpan pada volume.

---

# 5. Backend

Backend menggunakan:

```text
Node.js
Express
TypeScript
```

Project menggunakan ES Modules.

```json
{
  "type": "module"
}
```

Dengan demikian backend menggunakan:

```ts
import ...
export ...
```

bukan CommonJS:

```js
require(...)
module.exports
```

---

# 6. TypeScript

TypeScript digunakan untuk memberikan static type checking pada backend.

Contoh:

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

TypeScript membantu mendeteksi kesalahan tipe sebelum aplikasi dijalankan.

Project menggunakan strict mode:

```json
{
  "strict": true
}
```

Tujuannya adalah meningkatkan type safety dan mengurangi kemungkinan error akibat tipe data yang tidak sesuai.

---

# 7. Environment Configuration

Konfigurasi aplikasi disimpan dalam environment variables.

Contoh:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=...
CORS_ORIGIN=http://localhost:5173
```

Environment variable dimuat menggunakan:

```ts
import "dotenv/config";
```

Kemudian divalidasi menggunakan Zod.

Alurnya:

```text
.env
 ↓
process.env
 ↓
Zod schema
 ↓
validated env object
 ↓
application
```

Validasi dilakukan pada startup agar aplikasi gagal lebih awal apabila konfigurasi penting tidak valid.

---

# 8. Zod

Zod digunakan untuk runtime validation.

Contoh konfigurasi:

```ts
const schema = z.object({
  NODE_ENV: z.enum([
    "development",
    "test",
    "production"
  ]),
  PORT: z.coerce.number(),
  DATABASE_URL: z.string().min(1)
});
```

`z.coerce.number()` digunakan karena environment variable umumnya diterima sebagai string.

Contoh:

```text
"4000"
 ↓
z.coerce.number()
 ↓
4000
```

Dengan demikian aplikasi dapat menggunakan `PORT` sebagai number.

---

# 9. Prisma

Prisma digunakan sebagai ORM untuk PostgreSQL.

Konsep:

```text
TypeScript
    ↓
Prisma Client
    ↓
PostgreSQL
```

Prisma digunakan untuk:

* mendefinisikan model database
* membuat migration
* mengakses database melalui TypeScript
* menghasilkan Prisma Client

Schema database akan didefinisikan dalam:

```text
backend/prisma/schema.prisma
```

---

# 10. Prisma Client

Backend menggunakan satu instance Prisma Client:

```text
src/lib/prisma.ts
```

Instance tersebut digunakan oleh service dan repository yang membutuhkan akses database.

Contoh penggunaan nantinya:

```ts
const users = await prisma.user.findMany();
```

atau:

```ts
const booking = await prisma.booking.create({
  data: {
    // ...
  }
});
```

---

# 11. Express Application

Express application didefinisikan di:

```text
src/app.ts
```

Application memiliki beberapa middleware dasar:

```text
Helmet
CORS
JSON parser
```

Konsep:

```text
HTTP Request
     ↓
Helmet
     ↓
CORS
     ↓
JSON parser
     ↓
Route
     ↓
Controller
     ↓
Service
     ↓
Database
```

---

# 12. App vs Server

BookSpot memisahkan:

```text
app.ts
server.ts
```

`app.ts` bertanggung jawab mendefinisikan Express application.

`server.ts` bertanggung jawab menjalankan HTTP server.

Contoh:

```ts
// app.ts
export const app = express();
```

dan:

```ts
// server.ts
app.listen(env.PORT);
```

Pemisahan ini memudahkan testing menggunakan tools seperti Supertest karena `app` dapat diuji tanpa harus memulai HTTP listener secara manual.

---

# 13. Health Check

Endpoint:

```text
GET /api/health
```

digunakan untuk memastikan backend dan database dapat berkomunikasi.

Flow:

```text
Client
  ↓
GET /api/health
  ↓
Express
  ↓
Prisma
  ↓
SELECT 1
  ↓
PostgreSQL
  ↓
Response
```

Response normal:

```json
{
  "status": "ok"
}
```

Health check bukan business feature. Endpoint ini merupakan infrastructure/operational endpoint.

---

# 14. Development Commands

Start infrastructure:

```bash
docker compose up -d
```

Start backend development server:

```bash
npm run dev
```

Build backend:

```bash
npm run build
```

Start compiled backend:

```bash
npm start
```

Stop infrastructure:

```bash
docker compose down
```

---

# 15. Development Principle

Tidak semua command harus dihafalkan.

Yang perlu dipahami adalah fungsi setiap bagian:

```text
Docker
→ menjalankan infrastructure

PostgreSQL
→ menyimpan relational data

Redis
→ fast in-memory data store / queue support

Node.js
→ menjalankan backend

Express
→ HTTP server framework

TypeScript
→ static type checking

Zod
→ runtime validation

Prisma
→ ORM/database access
```

Syntax dan command dapat dirujuk kembali melalui dokumentasi.

Tujuan utama pembelajaran adalah memahami hubungan antar komponen dan alasan pemilihannya.
