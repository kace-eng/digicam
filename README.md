# Digicam Retro (PWA)

Kamera web retro untuk HP: filter hangat, date stamp oranye, ganti kamera depan/belakang,
simpan atau bagikan foto ke galeri, dan bisa dipasang seperti aplikasi (PWA).

## Struktur
- index.html           : tampilan utama
- style.css            : gaya
- app.js               : logika kamera, filter, ambil foto, simpan
- sw.js                : service worker (cache offline)
- manifest.webmanifest : metadata PWA
- icons/               : ikon aplikasi

## Menjalankan (wajib HTTPS, kecuali localhost)
Kamera hanya bisa diakses di HTTPS. Opsi gratis:

1. GitHub Pages
   - Buat repository, unggah SEMUA isi folder ini (bukan zip-nya) ke root repo.
   - Settings > Pages > Deploy from branch > main / root.
   - Buka link https://USERNAME.github.io/NAMA-REPO/ di Chrome HP.
2. Netlify Drop / Cloudflare Pages
   - Seret folder ini ke netlify.com/drop, link HTTPS langsung jadi.
3. Uji di komputer
   - `python3 -m http.server 8000` lalu buka http://localhost:8000

## Memasang ke HP
Buka link di Chrome Android, lalu tekan tombol "Pasang Aplikasi" atau menu titik tiga > "Tambahkan ke layar utama".

## Catatan
- Setelah mengubah file, naikkan versi CACHE di sw.js (mis. digicam-v2) agar pembaruan terbaca.
- Di iOS Safari, filter foto memakai fallback manual yang lebih sederhana.
