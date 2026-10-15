(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const video = $('video'), canvas = $('canvas'), dateStamp = $('dateStamp');
  const pesan = $('pesan'), flash = $('flash');
  const filterBtn = $('filterBtn'), shutterBtn = $('shutterBtn'), switchBtn = $('switchBtn');
  const thumbBtn = $('thumbBtn'), installBtn = $('installBtn');
  const preview = $('preview'), previewImg = $('previewImg');
  const simpanBtn = $('simpanBtn'), buangBtn = $('buangBtn');

  // Daftar filter: css dipakai untuk preview video dan untuk hasil foto (canvas)
  const FILTERS = [
    { nama: 'Retro Hangat', css: 'sepia(0.25) contrast(0.88) brightness(1.05) saturate(1.25) hue-rotate(-3deg)', stamp: '#ff7700' },
    { nama: 'Film Pudar',   css: 'sepia(0.35) contrast(0.8) brightness(1.1) saturate(0.85)', stamp: '#ffb347' },
    { nama: 'Hitam Putih',  css: 'grayscale(1) contrast(1.1)', stamp: '#e8e8e8' },
    { nama: 'Normal',       css: 'none', stamp: '#ff7700' },
  ];

  let filterIdx = 0;
  let facing = 'environment';
  let stream = null;
  let fotoBlob = null;
  let thumbUrl = null;
  let deferredInstall = null;

  // ---------- Date stamp ----------
  function teksTanggal() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())} ${p(d.getMonth() + 1)} '${String(d.getFullYear()).slice(2)}`;
  }
  function updateStamp() {
    dateStamp.textContent = teksTanggal();
    dateStamp.style.color = FILTERS[filterIdx].stamp;
  }

  // ---------- Filter ----------
  function terapkanFilter() {
    video.style.filter = FILTERS[filterIdx].css;
    filterBtn.textContent = FILTERS[filterIdx].nama;
    updateStamp();
  }
  filterBtn.addEventListener('click', () => {
    filterIdx = (filterIdx + 1) % FILTERS.length;
    terapkanFilter();
  });

  // ---------- Kamera ----------
  function tampilPesan(teks) { pesan.textContent = teks; pesan.hidden = false; }

  async function mulaiKamera() {
    pesan.hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      tampilPesan('Browser tidak mendukung kamera, atau halaman tidak dibuka lewat HTTPS.');
      return;
    }
    if (stream) stream.getTracks().forEach((t) => t.stop());
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1440 }, height: { ideal: 1080 } },
        audio: false,
      });
      video.srcObject = stream;
      video.classList.toggle('mirror', facing === 'user');
      await video.play().catch(() => {});
    } catch (err) {
      console.error(err);
      tampilPesan(err.name === 'NotAllowedError'
        ? 'Izin kamera ditolak. Aktifkan izin kamera untuk situs ini di pengaturan browser, lalu muat ulang.'
        : 'Kamera tidak dapat diakses: ' + err.message);
    }
  }
  switchBtn.addEventListener('click', () => {
    facing = facing === 'environment' ? 'user' : 'environment';
    mulaiKamera();
  });

  // ---------- Ambil foto ----------
  function gambarStamp(ctx, w, h) {
    const ukuran = Math.round(Math.min(w, h) * 0.045);
    ctx.font = `bold ${ukuran}px "Courier New", Courier, monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    const x = w - ukuran, y = h - ukuran;
    ctx.fillStyle = 'rgba(0,0,0,.8)';
    ctx.fillText(teksTanggal(), x + 2, y + 2);
    ctx.fillStyle = FILTERS[filterIdx].stamp;
    ctx.fillText(teksTanggal(), x, y);
  }

  // Fallback sederhana untuk browser tanpa ctx.filter (mis. iOS Safari)
  function filterManual(ctx, w, h) {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    const mode = FILTERS[filterIdx].nama;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      if (mode === 'Hitam Putih') { r = g = b = 0.3 * r + 0.59 * g + 0.11 * b; }
      else if (mode !== 'Normal') { r = r * 1.08 + 8; g = g * 1.0 + 2; b = b * 0.88; r = (r - 128) * 0.9 + 128; g = (g - 128) * 0.9 + 128; b = (b - 128) * 0.9 + 128; }
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
    ctx.putImageData(img, 0, 0);
  }

  function ambilFoto() {
    if (!video.videoWidth) return;
    const w = video.videoWidth, h = video.videoHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const dukungFilter = 'filter' in ctx;

    ctx.save();
    if (facing === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
    if (dukungFilter) ctx.filter = FILTERS[filterIdx].css;
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    if (!dukungFilter) filterManual(ctx, w, h);
    ctx.filter = 'none';
    gambarStamp(ctx, w, h);

    flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
    if (navigator.vibrate) navigator.vibrate(30);

    canvas.toBlob((blob) => {
      if (!blob) return;
      fotoBlob = blob;
      previewImg.src = URL.createObjectURL(blob);
      preview.hidden = false;
    }, 'image/jpeg', 0.92);
  }
  shutterBtn.addEventListener('click', ambilFoto);

  // ---------- Simpan / bagikan ----------
  function namaFile() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    return `digicam-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.jpg`;
  }

  async function simpanFoto() {
    if (!fotoBlob) return;
    const file = new File([fotoBlob], namaFile(), { type: 'image/jpeg' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Foto Digicam' });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(fotoBlob);
        a.download = file.name;
        document.body.appendChild(a); a.click(); a.remove();
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // pengguna membatalkan menu bagikan
      console.error(e);
    }
    jadikanThumb();
    tutupPreview();
  }

  function jadikanThumb() {
    if (thumbUrl) URL.revokeObjectURL(thumbUrl);
    thumbUrl = URL.createObjectURL(fotoBlob);
    thumbBtn.style.backgroundImage = `url(${thumbUrl})`;
    thumbBtn.hidden = false;
  }
  function tutupPreview() { preview.hidden = true; if (previewImg.src) URL.revokeObjectURL(previewImg.src); }

  simpanBtn.addEventListener('click', simpanFoto);
  buangBtn.addEventListener('click', () => { fotoBlob = null; tutupPreview(); });
  thumbBtn.addEventListener('click', () => { if (thumbUrl) { previewImg.src = thumbUrl; preview.hidden = false; } });

  // ---------- Pasang PWA ----------
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferredInstall = e; installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null; installBtn.hidden = true;
  });
  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });

  // ---------- Siklus hidup ----------
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') mulaiKamera();
    else if (stream) stream.getTracks().forEach((t) => t.stop());
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(console.error));
  }

  terapkanFilter();
  setInterval(updateStamp, 60000);
  mulaiKamera();
})();
