# DES-Coach

Aplikasi Pengelolaan Coaching dan Konseling Karyawan Berbasis Web.

Proyek ini telah dikembangkan dengan arsitektur _Fullstack_:
- **Frontend**: React + Vite + TailwindCSS (terletak di folder `frontend/`)
- **Backend**: CodeIgniter 4 (terletak di folder `backend/`)
- **Database**: PostgreSQL (Supabase)

## Prasyarat
Sebelum menjalankan proyek, pastikan Anda telah menginstal:
- **PHP 8.1** atau lebih baru (Pastikan ekstensi `pgsql` dan `pdo_pgsql` aktif di `php.ini`).
- **Node.js** & **npm**.
- **Composer**.

---

## Cara Menjalankan Proyek secara Lokal

Karena arsitekturnya terpisah (_frontend_ dan _backend_), Anda harus menjalankan keduanya secara bersamaan. Silakan buka **2 Terminal / Command Prompt yang berbeda**.

### Terminal 1: Menjalankan API Backend (CodeIgniter 4)
1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. (Opsional) Jika Anda baru pertama kali menjalankan di komputer baru, instal _dependencies_ CodeIgniter:
   ```bash
   composer install
   ```
3. Jalankan _development server_ CodeIgniter:
   ```bash
   php spark serve
   ```
   _Server CodeIgniter Anda akan berjalan di `http://localhost:8080`_

### Terminal 2: Menjalankan Tampilan Frontend (React)
1. Buka terminal baru dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Instal seluruh paket Node.js:
   ```bash
   npm install
   ```
3. Jalankan _development server_ Vite:
   ```bash
   npm run dev
   ```
   _Aplikasi React Anda akan berjalan di alamat yang muncul di terminal (umumnya `http://localhost:5173` atau `http://localhost:3000`)._

> [!TIP]
> **Proxy Otomatis (Anti-CORS):**
> Saat menjalankan _frontend_ React, semua _request_ jaringan yang berawalan `/api` akan secara otomatis diteruskan (_proxied_) ke `http://localhost:8080` (CodeIgniter) tanpa masalah CORS!

---

## Kredensial Default (Testing)
Tabel *database* Anda telah saya isi dengan beberapa akun standar untuk pengetesan sistem _login_:
- **Admin**: `admin@desnet.id` | Password: `password123`
- **HOD**: `hod@desnet.id` | Password: `password123`
- **Supervisi**: `supervisi@desnet.id` | Password: `password123`
- **Karyawan**: `karyawan@desnet.id` | Password: `password123`
