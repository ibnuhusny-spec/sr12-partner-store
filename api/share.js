/**
 * Vercel Serverless Function: Dynamic Open Graph / WhatsApp Preview Generator
 * Route: /api/share.js or /p?product=...&store=...
 */

const ALL_PRODUCTS = [
  {
    "id": "sr12-lightening-body-lotion",
    "name": "Lightening Body Lotion Tube",
    "het": 80500,
    "summary": "Body lotion dengan kandungan ekstrak alami untuk mencerahkan dan merawat kelembapan kulit tubuh sepanjang hari.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-massage-oil-bulus",
    "name": "Massage Oil Bulus",
    "het": 130000,
    "summary": "Minyak bulus murni berkualitas tinggi untuk merawat kekencangan kulit, menyamarkan stretch mark, dan melembabkan.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-miss-manja-spray",
    "name": "Miss Manja Spray",
    "het": 57000,
    "summary": "Semprotan higienis khusus area kewanitaan dengan ekstrak manjakani untuk kesegaran dan kenyamanan seharian.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-miss-manja-wash",
    "name": "Miss Manja Wash",
    "het": 57000,
    "summary": "Pembersih kewanitaan dengan formula pH seimbang untuk menjaga kebersihan dan mencegah bakteri penyebab bau.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-paket-miss-manja",
    "name": "Paket Miss Manja Wash-Spray",
    "het": 100000,
    "summary": "Paket hemat kombo Miss Manja Wash dan Miss Manja Spray untuk perawatan kewanitaan maksimal.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-dna-salmon-day-cream",
    "name": "DNA Salmon Day Cream",
    "het": 112500,
    "summary": "Krim siang premium dengan DNA Salmon murni untuk meremajakan kulit, menyamarkan garis halus, dan melindungi dari sinar UV.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-dna-salmon-night-cream",
    "name": "DNA Salmon Night Cream",
    "het": 112500,
    "summary": "Krim malam kaya nutrisi DNA Salmon untuk meregenerasi sel kulit saat tidur sehingga tampak glowing di pagi hari.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-dna-salmon-soap-bar",
    "name": "DNA Salmon Soap Bar",
    "het": 44000,
    "summary": "Sabun pembersih wajah berbentuk bar dengan ekstrak DNA Salmon untuk membersihkan pori tanpa membuat kulit kering.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-paket-dna-salmon",
    "name": "Paket DNA Salmon",
    "het": 253000,
    "summary": "Rangkaian lengkap DNA Salmon (Day Cream, Night Cream, dan Soap Bar) untuk hasil kulit cerah kenyal awet muda.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-toner-bha",
    "name": "Toner BHA",
    "het": 88000,
    "summary": "Toner wajah dengan Salicylic Acid (BHA) untuk membersihkan pori-pori tersumbat, mengatasi komedo, dan mencegah jerawat.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-facial-foam-glutation-collagen",
    "name": "Facial Foam Glutation With Collagen",
    "het": 92000,
    "summary": "Busa pembersih wajah melimpah mengandung Glutathione dan Kolagen untuk mencerahkan dan menjaga elastisitas kulit.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-facial-wash-coffee-100",
    "name": "Facial Wash Coffee 100 ml",
    "het": 77500,
    "summary": "Pembersih wajah dengan ekstrak biji kopi pilihan untuk mengangkat sel kulit mati dan menyamarkan noda flek hitam.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-facial-wash-green-tea-100",
    "name": "Facial Wash Green Tea 100 ml (NP)",
    "het": 72500,
    "summary": "Pembersih wajah dengan ekstrak teh hijau untuk mengontrol minyak berlebih dan meredakan jerawat meradang.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-facial-wash-honey-100",
    "name": "Facial Wash Honey 100 ml",
    "het": 75500,
    "summary": "Sabun wajah ekstrak madu alami yang melembutkan, menutrisi, dan menjaga kelembapan kulit normal hingga kering.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-habbatussauda",
    "name": "Habbatussauda",
    "het": 140000,
    "summary": "Minyak Habbatussauda murni berkualitas tinggi dalam kapsul untuk meningkatkan daya tahan tubuh dan stamina.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lemonkuh-250",
    "name": "Lemonkuh SR12 250 ml",
    "het": 81000,
    "summary": "100% perasan sari lemon murni kaya vitamin C untuk detoksifikasi, menjaga imunitas, dan melangsingkan tubuh.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lemonkuh-500",
    "name": "Lemonkuh SR12 500 ml",
    "het": 114000,
    "summary": "Sari lemon murni kemasan besar 500 ml lebih hemat untuk konsumsi kesehatan seluruh keluarga.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-maxi-propolis",
    "name": "Maxi Propolis",
    "het": 138000,
    "summary": "Ekstrak propolis lebah dengan teknologi nano cepat serap untuk antibiotik alami, mengobati radang, dan mempercepat penyembuhan.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-sari-kurma",
    "name": "Sari Kurma SR12",
    "het": 79000,
    "summary": "Sari kurma murni kualitas istimewa untuk menaikkan trombosit, penambah energi alami, dan nutrisi ibu hamil/menyusui.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-herbal-manjakani",
    "name": "SR12 Herbal Manjakani",
    "het": 85000,
    "summary": "Formulasi herbal buah manjakani Persia asli untuk kesehatan organ intim wanita, mengatasi keputihan, dan merapatkan.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-stevia-5ml",
    "name": "Stevia SR12 (5ml)",
    "het": 45000,
    "summary": "Tetes pemanis alami daun stevia murni 0 kalori, aman untuk penderita diabetes dan program diet sehat.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-vco-oil-60ml",
    "name": "V-CO Oil SR12 60ml",
    "het": 48000,
    "summary": "Minyak kelapa murni (Virgin Coconut Oil) diproses dingin (cold pressed) tanpa pemanasan untuk kesehatan dan kecantikan.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-vco-oil-100ml",
    "name": "V-CO Oil SR12 100ml",
    "het": 62000,
    "summary": "Minyak kelapa murni serbaguna untuk diminum menjaga imunitas atau dioleskan pada kulit dan rambut.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-vco-oil-250ml",
    "name": "V-CO Oil SR12 250ml",
    "het": 113500,
    "summary": "Kemasan besar 250 ml lebih ekonomis untuk konsumsi rutin keluarga dan terapi kesehatan alami.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-vco-oil-kapsul",
    "name": "V-CO Oil SR12 Kapsul",
    "het": 68000,
    "summary": "Minyak kelapa murni dalam bentuk kapsul praktis ditelan tanpa rasa enek untuk daya tahan tubuh dan diet sehat.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-daily-cover-beige",
    "name": "Daily Cover Beige",
    "het": 110000,
    "summary": "Compact powder bedak padat shade Beige yang menyamarkan noda hitam dan pori-pori dengan hasil matte tahan lama.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-daily-cover-natural",
    "name": "Daily Cover Natural",
    "het": 110000,
    "summary": "Bedak padat shade Natural cocok untuk warna kulit wanita Indonesia dengan coverage sempurna dan halus di wajah.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-daily-cover-sheerpink",
    "name": "Daily Cover Sheerpink",
    "het": 110000,
    "summary": "Bedak padat shade Sheerpink memberikan rona wajah segar kemerahan cerah alami sepanjang hari.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-care-cherry",
    "name": "Lip Care Cherry",
    "het": 37000,
    "summary": "Pelembab bibir beraroma ceri segar yang merawat bibir kering pecah-pecah dan memberikan semburat warna merah alami.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-care-natural",
    "name": "Lip Care Natural SR12",
    "het": 36500,
    "summary": "Pelembab bibir alami tanpa pewarna dengan VCO dan petroleum jelly murni untuk bibir lembab sehat natural.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-cream-matte-cherish-me",
    "name": "Lip Cream Matte Cherish Me",
    "het": 65000,
    "summary": "Lip cream matte warna Cherish Me bertekstur lembut ringan di bibir, tahan lama tanpa membuat bibir kering.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-cream-matte-honey-berry",
    "name": "Lip Cream Matte Honey Berry",
    "het": 65000,
    "summary": "Lip cream matte dengan shade Honey Berry yang elegan untuk tampilan kasual maupun pesta.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-cream-matte-nude-berry",
    "name": "Lip Cream Matte Nude Berry",
    "het": 65000,
    "summary": "Lip cream matte shade Nude Berry favorit wanita untuk riasan bibir natural sehari-hari.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-cream-matte-sweet-pink",
    "name": "Lip Cream Matte Sweet Pink",
    "het": 65000,
    "summary": "Lip cream matte shade Sweet Pink memberikan sentuhan feminin yang ceria dan segar.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-cream-matte-sr01",
    "name": "Lip Cream Matte SR01",
    "het": 65000,
    "summary": "Lip cream matte shade SR01 dengan warna merah klasik yang tegas dan mempesona.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-mousse-cream",
    "name": "Lip Mousse Cream",
    "het": 66000,
    "summary": "Pewarna bibir bertekstur mousse selembut beludru, tidak lengket dan memberikan efek bibir halus bervolume.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-mousse-rose-pink",
    "name": "Lip Mousse Rose Pink",
    "het": 68000,
    "summary": "Lip mousse dengan rona mawar merah muda lembut yang mempercantik tampilan senyum Anda.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-lip-mousse-sweet-brown",
    "name": "Lip Mousse Sweet Brown",
    "het": 67000,
    "summary": "Lip mousse bernuansa cokelat manis elegan yang cocok untuk tema makeup hangat / warm tone.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-matte-cover-natural-powder",
    "name": "Matte Cover Natural Loose Powder",
    "het": 92000,
    "summary": "Bedak tabur partikel halus untuk mengunci makeup, menyerap sebum berlebih, dan memberikan efek soft blur pada wajah.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-perfect-cover-bb-cream-beige",
    "name": "Perfect Cover BB Cream Natural Beige",
    "het": 90000,
    "summary": "BB Cream ringan dengan coverage prima untuk menyamarkan ketidaksempurnaan wajah tanpa terasa tebal atau dempul.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-perfect-cushion-ivory",
    "name": "Perfect Cushion Ivory",
    "het": 195000,
    "summary": "Cushion berformula mewah shade Ivory untuk kulit cerah dengan hasil akhir glowing natural tahan seharian.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-perfect-cushion-natural",
    "name": "Perfect Cushion Natural",
    "het": 203500,
    "summary": "Cushion shade Natural yang menyatu sempurna dengan warna kulit, menyamarkan noda hitam dan pori dengan perlindungan UV.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-pasta-gigi-siwak-sirih-100",
    "name": "Pasta Gigi Siwak & Sirih 100gr",
    "het": 67000,
    "summary": "Pasta gigi herbal ekstrak kayu siwak dan daun sirih untuk mencegah gigi berlubang, menyegarkan nafas, dan menjaga kesehatan gusi.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-pasta-gigi-siwak-sirih-170",
    "name": "Pasta Gigi Siwak & Sirih 170gr",
    "het": 82000,
    "summary": "Pasta gigi siwak & sirih kemasan keluarga 170 gr lebih hemat untuk perlindungan mulut dan gigi seluruh anggota keluarga.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "SR12-DEO-60",
    "name": "SR12 Deodorant Spray Herbal (60ml)",
    "het": 40000,
    "summary": "Deodorant herbal alami berbahan dasar tawas & air suling murni. Mencegah & menghilangkan bau badan hingga 24 jam nonstop tanpa noda kuning!",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "sr12-deodorant-spray-60ml",
    "name": "SR12 Deodorant Spray Herbal (60ml)",
    "het": 40000,
    "summary": "Deodorant herbal alami berbahan dasar tawas & air suling murni. Mencegah & menghilangkan bau badan hingga 24 jam nonstop tanpa noda kuning!",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "SR12-LIP-01",
    "name": "SR12 Lip Care Natural (Cherry Pink)",
    "het": 25000,
    "summary": "Pelembab bibir alami dengan petroleum jelly murni, madu, dan VCO. Mengatasi bibir kering & mengembalikan rona merah muda alami.",
    "image": "/assets/deodorant-spray.jpg"
  },
  {
    "id": "SR12-GOMILK-ORI",
    "name": "SR12 GoMilku Susu Kambing Etawa Premium (200g)",
    "het": 52500,
    "summary": "Susu kambing etawa murni dipadu daun kelor, ikan gabus, dan madu. Menyehatkan lambung & tulang tanpa bau prengus!",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-MJK-01",
    "name": "SR12 Manjakani Kapsul Herbal (60 Kapsul)",
    "het": 70000,
    "summary": "Ekstrak buah manjakani Persia kualitas premium grade A. Menjaga kesehatan organ kewanitaan, atasi keputihan & lancarkan haid.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-SLM-01",
    "name": "SR12 Salimah Slim Pelangsing Herbal (60 Kapsul)",
    "het": 60000,
    "summary": "Kombinasi rimpang kunyit dan daun jati belanda peluruh lemak jahat. Melangsingkan perut buncit secara alami & terdaftar BPOM.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-VCO-100",
    "name": "SR12 Virgin Coconut Oil (VCO) Cold Pressed 100ml",
    "het": 43000,
    "summary": "Minyak kelapa murni fermentasi dingin tanpa pemanasan kimiawi. Imunitas tubuh keluarga & pelembab alami serbaguna.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-KRASNY-DAY",
    "name": "SR12 Krasny Day Cream Herbal Markisa (20g)",
    "het": 60000,
    "summary": "Krim siang herbal ekstrak biji markisa & tabir surya alami. Mencerahkan wajah, melembutkan, dan melindungi dari sinar UV.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-ACNE-TOTOL",
    "name": "SR12 Acne Totol Treatment (10g)",
    "het": 58000,
    "summary": "Obat totol jerawat herbal tea tree oil & salicylic acid. Mengempiskan jerawat batu & bruntusan dalam 1-3 hari!",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-BLS-SOAP",
    "name": "SR12 Sabun Bulus Herbal Facial & Body Soap",
    "het": 25000,
    "summary": "Sabun herbal minyak bulus murni aroma melati. Mengencangkan & menghaluskan kulit wajah serta mengatasi jerawat punggung.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-RICE-SOAP",
    "name": "SR12 Sabun Beras Herbal (Rice Soap)",
    "het": 22000,
    "summary": "Sabun cuci muka ekstrak beras organik untuk kulit berminyak & jerawat. Mengontrol minyak berlebih & mengecilkan pori-pori.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-SUN-30",
    "name": "SR12 Sunscreen Lightening SPF 30++",
    "het": 68000,
    "summary": "Tabir surya ringan bebas minyak mencerahkan alami tanpa white cast. Perlindungan maksimal UV A & UV B seharian.",
    "image": "/assets/hero-banner.jpg"
  },
  {
    "id": "SR12-SERUM-GOLD",
    "name": "SR12 Serum Gold Lightening Herbal",
    "het": 140000,
    "summary": "Serum anti-aging mewah dengan partikel emas murni, kolagen, & vitamin C. Samarkan garis halus dan flek hitam menahun.",
    "image": "/assets/hero-banner.jpg"
  }
];

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

export default function handler(req, res) {
  const query = req.query || {};
  const productKey = (query.product || query.id || query.p || query.prod || '').trim();
  const storeSlug = (query.store || query.s || 'sr12-central').trim();
  const customImg = (query.img || query.image || '').trim();
  const customName = (query.name || '').trim();
  const customPrice = Number(query.price || 0);

  // Cari produk berdasarkan ID atau kecocokan slug nama
  let matchedProduct = null;
  if (productKey) {
    const keyLower = productKey.toLowerCase().trim();
    const cleanKey = keyLower.replace(/[^a-z0-9]/g, '');

    matchedProduct = ALL_PRODUCTS.find(p => {
      const pCleanId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      const pCleanName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return p.id.toLowerCase() === keyLower ||
        (p.sku && p.sku.toLowerCase() === keyLower) ||
        pCleanId === cleanKey ||
        pCleanName === cleanKey ||
        pCleanId.includes(cleanKey) ||
        cleanKey.includes(pCleanId) ||
        pCleanName.includes(cleanKey) ||
        cleanKey.includes(pCleanName);
    });
  }

  // Format Nama Toko
  let storeTitle = 'SR12 Official Store';
  if (storeSlug && storeSlug !== 'sr12-central') {
    storeTitle = storeSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (!storeTitle.toLowerCase().includes('toko') && !storeTitle.toLowerCase().includes('agency') && !storeTitle.toLowerCase().includes('store')) {
      storeTitle = 'Toko ' + storeTitle;
    }
  }

  // Base URL
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'sr12-partner-store.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const baseUrl = proto + '://' + host;

  let title, desc, imageUrl, canonicalUrl, targetRedirect;

  if (customImg && customImg.startsWith('http')) {
    // Prioritas 1: Gambar kustom hasil upload toko ke cloud
    const prodName = customName || (matchedProduct ? matchedProduct.name : 'Produk SR12');
    const priceText = customPrice > 0 ? (' - ' + formatRupiah(customPrice)) : (matchedProduct ? (' - ' + formatRupiah(matchedProduct.het)) : '');
    title = prodName + priceText;
    desc = (matchedProduct ? matchedProduct.summary : 'Dapatkan produk herbal & skin care resmi SR12 BPOM.') + ' | Belanja aman di ' + storeTitle;
    imageUrl = customImg;
    targetRedirect = baseUrl + '/?product=' + encodeURIComponent(productKey || (matchedProduct ? matchedProduct.id : ''));
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(productKey || '') + '&img=' + encodeURIComponent(customImg);
  } else if (matchedProduct) {
    title = matchedProduct.name + ' - ' + formatRupiah(matchedProduct.het);
    desc = (matchedProduct.summary || '') + ' | Belanja aman resmi BPOM di ' + storeTitle;
    
    // Pastikan URL gambar absolut HTTPS publik yang valid untuk crawler WhatsApp
    if (matchedProduct.image && matchedProduct.image.startsWith('http')) {
      imageUrl = matchedProduct.image;
    } else {
      const cleanPath = (matchedProduct.image || '/assets/deodorant-spray.jpg').startsWith('/') 
        ? matchedProduct.image 
        : ('/' + matchedProduct.image);
      imageUrl = baseUrl + cleanPath;
    }
    
    // PENTING: Arahkan langsung ke URL produk spesifik di toko mitra bersangkutan
    targetRedirect = baseUrl + '/?product=' + encodeURIComponent(matchedProduct.id);
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(matchedProduct.id);
  } else if (productKey) {
    // KUNCI UTAMA: WALAUPUN KEY BELUM PERSIS COCOK DI SERVERLESS:
    // JANGAN PERNAH HAPUS PARAMETER PRODUCT! Teruskan langsung ke frontend agar frontend mencocokkannya di DOM!
    const cleanProdTitle = customName || productKey.replace(/^sr12-?/i, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = 'SR12 ' + cleanProdTitle + ' - ' + storeTitle;
    desc = 'Beli produk resmi SR12 ' + cleanProdTitle + ' terverifikasi BPOM di ' + storeTitle + '.';
    imageUrl = baseUrl + '/assets/deodorant-spray.jpg';
    targetRedirect = baseUrl + '/?product=' + encodeURIComponent(productKey);
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(productKey);
  } else {
    title = 'SR12 Herbal Skin Care - ' + storeTitle;
    desc = 'Toko Resmi Kemitraan SR12 Herbal Skin Care terverifikasi BPOM. Dapatkan produk kecantikan alami dengan garansi 100% original.';
    imageUrl = baseUrl + '/assets/deodorant-spray.jpg';
    targetRedirect = baseUrl + '/?store=' + encodeURIComponent(storeSlug);
    canonicalUrl = baseUrl + '/?store=' + encodeURIComponent(storeSlug);
  }

  // Tentukan content type gambar untuk WhatsApp crawler (jpg/png/webp)
  let imageType = 'image/jpeg';
  if (imageUrl.endsWith('.png')) imageType = 'image/png';
  else if (imageUrl.endsWith('.webp')) imageType = 'image/webp';

  // Deteksi apakah request berasal dari Robot / Crawler WhatsApp, Facebook, Telegram, Twitter
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isBot = userAgent.includes('whatsapp') || 
                userAgent.includes('facebookexternalhit') || 
                userAgent.includes('facebot') || 
                userAgent.includes('twitterbot') || 
                userAgent.includes('telegrambot') || 
                userAgent.includes('slackbot') || 
                userAgent.includes('discordbot') || 
                userAgent.includes('linkedinbot') ||
                userAgent.includes('bot') || 
                userAgent.includes('crawl');

  // JIKA BUKAN BOT (MANUSIA/PENGUNJUNG MENGKLIK LINK), LANGSUNG REDIRECT 302 KE ETALASE!
  if (!isBot) {
    res.setHeader('Location', targetRedirect);
    return res.status(302).end();
  }

  // JIKA ROBOT WHATSAPP / CRAWLER, SAJIKAN HTML DENGAN META TAG LENGKAP TANPA JAVASCRIPT REDIRECT
  const html = '<!DOCTYPE html>\n' +
'<html lang="id">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <title>' + escapeHtml(title) + '</title>\n' +
'  <meta name="description" content="' + escapeHtml(desc) + '">\n' +
'  <!-- Open Graph / WhatsApp Meta Tags -->\n' +
'  <meta property="og:site_name" content="' + escapeHtml(storeTitle) + '">\n' +
'  <meta property="og:type" content="website">\n' +
'  <meta property="og:title" content="' + escapeHtml(title) + '">\n' +
'  <meta property="og:description" content="' + escapeHtml(desc) + '">\n' +
'  <meta property="og:image" content="' + escapeHtml(imageUrl) + '">\n' +
'  <meta property="og:image:secure_url" content="' + escapeHtml(imageUrl) + '">\n' +
'  <meta property="og:image:type" content="' + imageType + '">\n' +
'  <meta property="og:image:width" content="600">\n' +
'  <meta property="og:image:height" content="600">\n' +
'  <meta property="og:url" content="' + escapeHtml(canonicalUrl) + '">\n' +
'  <!-- Twitter Card -->\n' +
'  <meta name="twitter:card" content="summary_large_image">\n' +
'  <meta name="twitter:title" content="' + escapeHtml(title) + '">\n' +
'  <meta name="twitter:description" content="' + escapeHtml(desc) + '">\n' +
'  <meta name="twitter:image" content="' + escapeHtml(imageUrl) + '">\n' +
'</head>\n' +
'<body>\n' +
'  <h1>' + escapeHtml(title) + '</h1>\n' +
'  <img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(title) + '">\n' +
'  <p>' + escapeHtml(desc) + '</p>\n' +
'</body>\n' +
'</html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.status(200).send(html);
};
