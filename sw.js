const CACHE_NAME = 'gema-pwa-v3'; // Versi cache, ubah jika ada update besar

// Aset lokal yang pasti ada di folder Anda
const localAssets = [
  './',
  './index.html',
  './db-v1.json',
  './manifest.json'
];

// Aset eksternal (CDN)
const externalAssets = [
  'https://cdn.tailwindcss.com',
  'https://code.jquery.com/jquery-3.7.1.min.js'
];

// 1. Fase Install: Simpan semua aset ke Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Menyimpan aset ke cache...');
      
      // Simpan aset lokal
      const localPromises = cache.addAll(localAssets);
      
      // Simpan aset eksternal dengan mode 'no-cors' agar tidak terblokir
      const externalPromises = externalAssets.map(url => {
        return fetch(url, { mode: 'no-cors' })
          .then(response => cache.put(url, response))
          .catch(err => console.error('Gagal cache CDN:', url, err));
      });

      return Promise.all([localPromises, ...externalPromises]);
    })
  );
  // Langsung aktifkan SW tanpa menunggu tab ditutup
  self.skipWaiting();
});

// 2. Fase Aktivasi: Hapus cache lama agar data selalu segar
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fase Fetch: Ambil dari cache dulu, jika tidak ada baru ambil dari internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Jika ada di cache, kembalikan. Jika tidak, ambil dari network.
      return response || fetch(event.request).catch(() => {
        // Jika offline dan aset tidak ada di cache (opsional: tampilkan halaman offline)
        console.log('Aset tidak ditemukan di cache & koneksi offline.');
      });
    })
  );
});