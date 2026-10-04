/**
 * Vercel Serverless Function: Dynamic Open Graph / WhatsApp Preview Generator
 * Route: /api/share.js or /p?product=...&store=...
 */

const PRODUCTS = {
  'SR12-DEO-60': {
    name: 'SR12 Deodorant Spray Herbal (60ml)',
    het: 40000,
    summary: 'Deodorant herbal alami berbahan dasar tawas & air suling murni. Mencegah & menghilangkan bau badan hingga 24 jam nonstop tanpa noda kuning!',
    image: '/assets/deodorant-spray.jpg'
  },
  'SR12-LIP-01': {
    name: 'SR12 Lip Care Natural (Cherry Pink)',
    het: 25000,
    summary: 'Pelembab bibir alami dengan petroleum jelly murni, madu, dan VCO. Mengatasi bibir kering & mengembalikan rona merah muda alami.',
    image: '/assets/deodorant-spray.jpg'
  },
  'SR12-GOMILK-ORI': {
    name: 'SR12 GoMilku Susu Kambing Etawa Premium (200g)',
    het: 52500,
    summary: 'Susu kambing etawa murni dipadu daun kelor, ikan gabus, dan madu. Menyehatkan lambung & tulang tanpa bau prengus!',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-MJK-01': {
    name: 'SR12 Manjakani Kapsul Herbal (60 Kapsul)',
    het: 70000,
    summary: 'Ekstrak buah manjakani Persia kualitas premium grade A. Menjaga kesehatan organ kewanitaan, atasi keputihan & lancarkan haid.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-SLM-01': {
    name: 'SR12 Salimah Slim Pelangsing Herbal (60 Kapsul)',
    het: 60000,
    summary: 'Kombinasi rimpang kunyit dan daun jati belanda peluruh lemak jahat. Melangsingkan perut buncit secara alami & terdaftar BPOM.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-VCO-100': {
    name: 'SR12 Virgin Coconut Oil (VCO) Cold Pressed 100ml',
    het: 43000,
    summary: 'Minyak kelapa murni fermentasi dingin tanpa pemanasan kimiawi. Imunitas tubuh keluarga & pelembab alami serbaguna.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-KRASNY-DAY': {
    name: 'SR12 Krasny Day Cream Herbal Markisa (20g)',
    het: 60000,
    summary: 'Krim siang herbal ekstrak biji markisa & tabir surya alami. Mencerahkan wajah, melembutkan, dan melindungi dari sinar UV.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-ACNE-TOTOL': {
    name: 'SR12 Acne Totol Treatment (10g)',
    het: 58000,
    summary: 'Obat totol jerawat herbal tea tree oil & salicylic acid. Mengempiskan jerawat batu & bruntusan dalam 1-3 hari!',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-BLS-SOAP': {
    name: 'SR12 Sabun Bulus Herbal Facial & Body Soap',
    het: 25000,
    summary: 'Sabun herbal minyak bulus murni aroma melati. Mengencangkan & menghaluskan kulit wajah serta mengatasi jerawat punggung.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-RICE-SOAP': {
    name: 'SR12 Sabun Beras Herbal (Rice Soap)',
    het: 22000,
    summary: 'Sabun cuci muka ekstrak beras organik untuk kulit berminyak & jerawat. Mengontrol minyak berlebih & mengecilkan pori-pori.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-SUN-30': {
    name: 'SR12 Sunscreen Lightening SPF 30++',
    het: 68000,
    summary: 'Tabir surya ringan bebas minyak mencerahkan alami tanpa white cast. Perlindungan maksimal UV A & UV B seharian.',
    image: '/assets/hero-banner.jpg'
  },
  'SR12-SERUM-GOLD': {
    name: 'SR12 Serum Gold Lightening Herbal',
    het: 140000,
    summary: 'Serum anti-aging mewah dengan partikel emas murni, kolagen, & vitamin C. Samarkan garis halus dan flek hitam menahun.',
    image: '/assets/hero-banner.jpg'
  }
};

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = (req, res) => {
  const query = req.query || {};
  const productKey = (query.product || query.id || query.p || '').trim();
  const storeSlug = (query.store || query.s || 'sr12-central').trim();

  // Cari produk berdasarkan ID atau kecocokan slug nama
  let matchedProduct = null;
  if (productKey) {
    const keyUpper = productKey.toUpperCase();
    if (PRODUCTS[keyUpper]) {
      matchedProduct = PRODUCTS[keyUpper];
      matchedProduct.id = keyUpper;
    } else {
      const cleanKey = productKey.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [id, item] of Object.entries(PRODUCTS)) {
        const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleanId.includes(cleanKey) || cleanName.includes(cleanKey) || cleanKey.includes(cleanId)) {
          matchedProduct = { ...item, id };
          break;
        }
      }
    }
  }

  // Format Nama Toko
  let storeTitle = 'SR12 Official Store';
  if (storeSlug && storeSlug !== 'sr12-central') {
    storeTitle = storeSlug.charAt(0).toUpperCase() + storeSlug.slice(1);
    if (!storeTitle.toLowerCase().includes('toko') && !storeTitle.toLowerCase().includes('store')) {
      storeTitle = 'Toko ' + storeTitle;
    }
  }

  // Base URL
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'sr12-partner-store.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = `${proto}://${host}`;

  let title, desc, imageUrl, canonicalUrl, targetRedirect;

  if (matchedProduct) {
    title = `${matchedProduct.name} - ${formatRupiah(matchedProduct.het)}`;
    desc = `${matchedProduct.summary} | Belanja aman resmi BPOM di ${storeTitle}`;
    imageUrl = matchedProduct.image.startsWith('http') ? matchedProduct.image : `${baseUrl}${matchedProduct.image}`;
    targetRedirect = `${baseUrl}/?store=${encodeURIComponent(storeSlug)}&product=${encodeURIComponent(matchedProduct.id)}`;
    canonicalUrl = `${baseUrl}/p?product=${encodeURIComponent(matchedProduct.id)}&store=${encodeURIComponent(storeSlug)}`;
  } else {
    title = `SR12 Herbal Skin Care - ${storeTitle}`;
    desc = `Toko Resmi Kemitraan SR12 Herbal Skin Care terverifikasi BPOM. Dapatkan produk kecantikan alami dengan garansi 100% original.`;
    imageUrl = `${baseUrl}/assets/sr12-logo.png`;
    targetRedirect = `${baseUrl}/?store=${encodeURIComponent(storeSlug)}`;
    canonicalUrl = `${baseUrl}/?store=${encodeURIComponent(storeSlug)}`;
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | ${escapeHtml(storeTitle)}</title>
  
  <meta name="description" content="${escapeHtml(desc)}">
  
  <!-- Open Graph Meta Tags (Untuk WhatsApp, Facebook, Telegram, dll) -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${escapeHtml(storeTitle)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="600">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  
  <!-- Instant Redirect for Humans / Browser Visits -->
  <link rel="canonical" href="${escapeHtml(targetRedirect)}">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(targetRedirect)}">
  <script>
    window.location.replace(${JSON.stringify(targetRedirect)});
  </script>
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
      color: #ffffff;
      text-align: center;
    }
    .card {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 20px;
      padding: 32px 24px;
      max-width: 420px;
      margin: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    }
    .spinner {
      width: 44px;
      height: 44px;
      margin: 0 auto 18px;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: #34d399;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 { font-size: 1.25rem; margin: 0 0 8px 0; font-weight: 800; color: #fff; }
    p { font-size: 0.88rem; color: #d1fae5; line-height: 1.5; margin: 0 0 16px 0; }
    a.btn {
      display: inline-block;
      background: #34d399;
      color: #064e3b;
      font-weight: 700;
      padding: 10px 22px;
      border-radius: 9999px;
      text-decoration: none;
      font-size: 0.85rem;
      transition: transform 0.2s;
    }
    a.btn:hover { transform: scale(1.04); }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>🌿 Membuka Produk SR12...</h2>
    <p>Sedang mengalihkan Anda ke etalase resmi <b>${escapeHtml(matchedProduct ? matchedProduct.name : storeTitle)}</b>...</p>
    <a href="${escapeHtml(targetRedirect)}" class="btn">Klik Di Sini Jika Belum Terbuka</a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.status(200).send(html);
};
