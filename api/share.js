/**
 * Vercel Serverless Function: Dynamic Open Graph / WhatsApp Preview Generator
 * Route: /api/share.js or /p?product=...&store=...
 */

const ALL_PRODUCTS = [
  {
    "id": "sr12-acne-total-tube-10g",
    "sku": "SR12-ACN-001",
    "name": "Acne Total Tube 10 g",
    "het": 59000,
    "image": "makeCategoryIllustration(Acne Series ✨ Acne Total Tube 10 g)",
    "summary": "Totol jerawat ampuh mengeringkan jerawat matang dan meredakan peradangan kulit dalam hitungan hari tanpa iritasi."
  },
  {
    "id": "sr12-acne-cream-12-5g",
    "sku": "SR12-ACN-002",
    "name": "Acne Cream 125 g",
    "het": 85000,
    "image": "makeCategoryIllustration(Acne Series 🧴 Acne Cream 125 g)",
    "summary": "Krim perawatan wajah berjerawat untuk menekan pertumbuhan bakteri penyebab jerawat dan memudarkan bekas noda hitam."
  },
  {
    "id": "sr12-acne-toner-premium-60ml",
    "sku": "SR12-ACN-003",
    "name": "Acne Toner Premium 60 ml",
    "het": 100000,
    "image": "makeCategoryIllustration(Acne Series 💧 Acne Toner Premium 60 ml)",
    "summary": "Toner penyegar khusus kulit berjerawat dan berminyak mengontrol sebum berlebih dan mengecilkan pori-pori."
  },
  {
    "id": "sr12-coffee-mask-tube-20g",
    "sku": "SR12-MSK-001",
    "name": "Coffee Mask Tube 20 g",
    "het": 82000,
    "image": "makeCategoryIllustration(Face Mask ☕ Coffee Mask Tube 20 g)",
    "summary": "Masker kopi alami untuk eksfoliasi kulit mati mengangkat komedo membandel dan menghaluskan tekstur kulit wajah."
  },
  {
    "id": "sr12-kefir-peeling-mask-powder-50g",
    "sku": "SR12-MSK-002",
    "name": "Kefir Peeling Mask Powder 50 g",
    "het": 42000,
    "image": "makeCategoryIllustration(Face Mask 🥣 Kefir Peeling Mask 50 g)",
    "summary": "Masker kefir fermentasi bubuk untuk detoksifikasi racun kosmetik kimiawi dan meremajakan sel kulit wajah."
  },
  {
    "id": "sr12-sheet-mask-acne",
    "sku": "SR12-MSK-003",
    "name": "Sheet Mask Acne",
    "het": 63000,
    "image": "makeCategoryIllustration(Face Mask 🎭 Sheet Mask Acne 1 Pcs)",
    "summary": "Sheet mask dengan essence antibakteri intensif untuk menenangkan kulit berjerawat dan kemerahan secara instan."
  },
  {
    "id": "sr12-sheet-mask-brightening",
    "sku": "SR12-MSK-004",
    "name": "Sheet Mask Brightening",
    "het": 63000,
    "image": "makeCategoryIllustration(Face Mask ✨ Sheet Mask Brightening 1 Pcs)",
    "summary": "Sheet mask pencerah ekstra dengan nutrisi serum untuk membuat kulit tampak glowing lembap dan segar berseri."
  },
  {
    "id": "sr12-mugwort-clay-mask-60g",
    "sku": "SR12-MSK-005",
    "name": "Mugwort Clay Mask 60 g",
    "het": 73500,
    "image": "makeCategoryIllustration(Face Mask 🌿 Mugwort Clay Mask 60 g)",
    "summary": "Clay mask ekstrak Mugwort premium untuk membersihkan pori secara mendalam menenangkan jerawat dan meredakan iritasi."
  },
  {
    "id": "sr12-bulus-soap-60g",
    "sku": "SR12-FWS-001",
    "name": "Bulus Soap 60 g",
    "het": 28000,
    "image": "makeCategoryIllustration(Face Wash 🐢 Bulus Soap 60 g)",
    "summary": "Sabun batang minyak bulus legendaris untuk merawat elastisitas kulit mengencangkan pori dan menyamarkan noda flek."
  },
  {
    "id": "sr12-coffee-soap-60g",
    "sku": "SR12-FWS-002",
    "name": "Coffee Soap 60 g",
    "het": 23000,
    "image": "makeCategoryIllustration(Face Wash ☕ Coffee Soap 60 g)",
    "summary": "Sabun batang kopi robusta alami untuk eksfoliasi kulit wajah menyamarkan flek hitam dan mengontrol minyak."
  },
  {
    "id": "sr12-honey-soap-60g",
    "sku": "SR12-FWS-003",
    "name": "Honey Soap 60 g",
    "het": 25000,
    "image": "makeCategoryIllustration(Face Wash 🍯 Honey Soap 60 g)",
    "summary": "Sabun batang madu murni untuk melembapkan kulit kering dan sensitif menjadikan kulit lembut dan kenyal."
  },
  {
    "id": "sr12-rice-soap-60g",
    "sku": "SR12-FWS-004",
    "name": "Rice Soap 60 g",
    "het": 25000,
    "image": "makeCategoryIllustration(Face Wash 🌾 Rice Soap 60 g)",
    "summary": "Sabun beras alami untuk mencerahkan kulit kusam menyerap kelebihan minyak dan membuat kulit segar bercahaya."
  },
  {
    "id": "sr12-dna-salmon-soap-bar-60g",
    "sku": "SR12-FWS-005",
    "name": "DNA Salmon Soap Bar 60 g",
    "het": 44000,
    "image": "makeCategoryIllustration(Face Wash 🐟 DNA Salmon Soap Bar 60 g)",
    "summary": "Sabun batang mewah dengan kandungan DNA Salmon murni untuk regenerasi sel kulit anti-aging dan skin barrier kuat."
  },
  {
    "id": "sr12-facial-wash-bulus-100ml",
    "sku": "SR12-FWS-006",
    "name": "Facial Wash Bulus 100 ml",
    "het": 58000,
    "image": "makeCategoryIllustration(Face Wash 🧴 Facial Wash Bulus 100 ml)",
    "summary": "Pembersih wajah cair dengan minyak bulus membersihkan sisa debu dan kotoran tanpa membuat kulit kering tertarik."
  },
  {
    "id": "sr12-facial-wash-coffee-100ml",
    "sku": "SR12-FWS-007",
    "name": "Facial Wash Coffee 100 ml",
    "het": 77500,
    "image": "makeCategoryIllustration(Face Wash ☕ Facial Wash Coffee 100 ml)",
    "summary": "Facial wash kopi cair yang kaya antioksidan untuk mencerahkan wajah dan mengontrol kadar minyak berlebih."
  },
  {
    "id": "sr12-facial-wash-green-tea-100ml",
    "sku": "SR12-FWS-008",
    "name": "Facial Wash Green Tea 100 ml",
    "het": 72500,
    "image": "makeCategoryIllustration(Face Wash 🍵 Facial Wash Green Tea 100 ml)",
    "summary": "Facial wash teh hijau premium untuk kulit berminyak dan berjerawat menenangkan kulit radang dan mencegah jerawat baru."
  },
  {
    "id": "sr12-facial-wash-with-green-tea-100ml",
    "sku": "SR12-FWS-009",
    "name": "Facial Wash with Green Tea 100 ml",
    "het": 47500,
    "image": "makeCategoryIllustration(Face Wash 🍃 FW with Green Tea 100 ml)",
    "summary": "Varian pembersih wajah ekstrak daun teh hijau lembut untuk pemakaian harian segala jenis kulit."
  },
  {
    "id": "sr12-facial-wash-with-green-tea-250ml",
    "sku": "SR12-FWS-010",
    "name": "Facial Wash with Green Tea 250 ml",
    "het": 84000,
    "image": "makeCategoryIllustration(Face Wash 🍃 FW Green Tea Jumbo 250 ml)",
    "summary": "Ukuran jumbo ekonomis 250ml facial wash green tea lebih hemat untuk perawatan keluarga jangka panjang."
  },
  {
    "id": "sr12-facial-wash-honey-100ml",
    "sku": "SR12-FWS-011",
    "name": "Facial Wash Honey 100ml",
    "het": 75500,
    "image": "makeCategoryIllustration(Face Wash 🍯 Facial Wash Honey 100 ml)",
    "summary": "Pembersih wajah ekstrak madu alami yang sangat lembut menjaga kelembapan alami kulit kering tanpa rasa kesat."
  },
  {
    "id": "sr12-facial-foam-glutation-with-collagen",
    "sku": "SR12-FWS-012",
    "name": "Facial Foam Glutation with Collagen",
    "het": 92000,
    "image": "makeCategoryIllustration(Face Wash 🫧 Foam Glutation Collagen 100 ml)",
    "summary": "Busa pembersih wajah melimpah dengan Glutathione dan Collagen untuk kulit cerah berkilau dan kenyal awet muda."
  },
  {
    "id": "sr12-bundling-package-coffee-soap",
    "sku": "SR12-FWS-013",
    "name": "Bundling Package Coffee Soap",
    "het": 460000,
    "image": "makeCategoryIllustration(Face Wash 📦 Bundling Coffee Soap Paket)",
    "summary": "Paket hemat bundling grosir Coffee Soap isi 20 pcs untuk reseller dan pelanggan setia."
  },
  {
    "id": "sr12-srkiddos-baby-care-package",
    "sku": "SR12-KID-001",
    "name": "SRKiddos Baby Care Package",
    "het": 173500,
    "image": "makeCategoryIllustration(SR Kiddos 👶 Baby Care Package Set)",
    "summary": "Paket lengkap perawatan bayi dan balita berbahan herbal bidara aman dan lembut untuk kulit sensitif si kecil."
  },
  {
    "id": "sr12-bubble-bath-daun-bidara-100ml",
    "sku": "SR12-KID-002",
    "name": "Bubble Bath Daun Bidara 100ml",
    "het": 35000,
    "image": "makeCategoryIllustration(SR Kiddos 🛁 Bubble Bath Bidara 100 ml)",
    "summary": "Sabun mandi busa lembut ekstrak daun bidara menjaga kulit anak tetap wangi bersih dan terlindung dari kuman."
  },
  {
    "id": "sr12-bubble-bath-daun-bidara-300ml-pump",
    "sku": "SR12-KID-003",
    "name": "Bubble Bath Daun Bidara 300ml (Pump)",
    "het": 58000,
    "image": "makeCategoryIllustration(SR Kiddos 🧴 Bubble Bath Pump 300 ml)",
    "summary": "Kemasan pump praktis 300ml sabun mandi anak daun bidara untuk kenyamanan mandi harian keluarga."
  },
  {
    "id": "sr12-shampoo-conditioner-daun-bidara-100ml",
    "sku": "SR12-KID-004",
    "name": "Shampoo & Conditioner Daun Bidara 100ml",
    "het": 52000,
    "image": "makeCategoryIllustration(SR Kiddos 🚿 Shampoo Bidara Anak 100 ml)",
    "summary": "Shampo 2in1 dengan conditioner lembut khusus rambut anak tidak pedih di mata dan membuat rambut halus berkilau."
  },
  {
    "id": "sr12-shampoo-conditioner-daun-bidara-300ml-pump",
    "sku": "SR12-KID-005",
    "name": "Shampoo & Conditioner Daun Bidara 300ml (Pump)",
    "het": 115500,
    "image": "makeCategoryIllustration(SR Kiddos 🧴 Shampoo Bidara Pump 300 ml)",
    "summary": "Shampoo & conditioner anak kemasan pump besar 300ml dengan wangi segar tahan lama dan busa ramah mata."
  },
  {
    "id": "sr12-lotion-telon-bidara-100g",
    "sku": "SR12-KID-006",
    "name": "Lotion Telon Bidara 100 g",
    "het": 40000,
    "image": "makeCategoryIllustration(SR Kiddos 🌿 Lotion Telon Bidara 100 g)",
    "summary": "Lotion minyak telon hangat dengan daun bidara dan minyak kayu putih menghangatkan tubuh bayi dan mencegah gigitan nyamuk."
  },
  {
    "id": "sr12-pasta-gigi-charcoal-100g",
    "sku": "SR12-TP-001",
    "name": "Pasta Gigi Charcoal 100 g",
    "het": 48000,
    "image": "makeCategoryIllustration(Toothpaste 🪥 Pasta Gigi Charcoal 100 g)",
    "summary": "Pasta gigi arang aktif alami untuk memutihkan gigi kuning akibat kopi/teh menghilangkan karang gigi dan nafas segar."
  },
  {
    "id": "sr12-pasta-gigi-charcoal-170g",
    "sku": "SR12-TP-002",
    "name": "Pasta Gigi Charcoal 170 g",
    "het": 60000,
    "image": "makeCategoryIllustration(Toothpaste 🪥 Charcoal Jumbo 170 g)",
    "summary": "Kemasan jumbo 170g pasta gigi charcoal aktif untuk keluarga membersihkan plak dan menjaga kesehatan gusi."
  },
  {
    "id": "sr12-pasta-gigi-siwak-sirih-100g",
    "sku": "SR12-TP-003",
    "name": "Pasta Gigi Siwak & Sirih 100 g",
    "het": 67000,
    "image": "makeCategoryIllustration(Toothpaste 🌿 Siwak & Sirih 100 g)",
    "summary": "Pasta gigi sunnah dengan ekstrak kayu siwak asli dan daun sirih antibakteri alami mencegah bau mulut sepanjang hari."
  },
  {
    "id": "sr12-pasta-gigi-siwak-sirih-170g",
    "sku": "SR12-TP-004",
    "name": "Pasta Gigi Siwak & Sirih 170 g",
    "het": 82000,
    "image": "makeCategoryIllustration(Toothpaste 🌿 Siwak & Sirih Jumbo 170 g)",
    "summary": "Kemasan besar 170g herbal siwak & daun sirih menguatkan email gigi dan menjaga kesegaran rongga mulut keluarga."
  },
  {
    "id": "sr12-booperi-edp-misteriosa-30ml",
    "sku": "SR12-PRF-001",
    "name": "Booperi EDP Misteriosa 30 ml",
    "het": 61000,
    "image": "makeCategoryIllustration(Parfum 🌸 Booperi Misteriosa 30 ml)",
    "summary": "Eau de Parfum aroma mewah memikat dengan sentuhan floral & fruity misterius tahan lama hingga 12 jam."
  },
  {
    "id": "sr12-booperi-edp-fantasy-30ml",
    "sku": "SR12-PRF-002",
    "name": "Booperi EDP Fantasy 30 ml",
    "het": 61000,
    "image": "makeCategoryIllustration(Parfum ✨ Booperi Fantasy 30 ml)",
    "summary": "Parfum manis menyegarkan dengan sentuhan gourmand fantasy yang memancarkan pesona ceria dan percaya diri."
  },
  {
    "id": "sr12-booperi-edp-secret-amor-100ml",
    "sku": "SR12-PRF-003",
    "name": "Booperi EDP Secret Amor 100 ml",
    "het": 295000,
    "image": "makeCategoryIllustration(Parfum 💎 Secret Amor 100 ml)",
    "summary": "Parfum botol kristal premium 100ml dengan aroma romantis elegan khas parfum desainer kelas dunia."
  },
  {
    "id": "sr12-booperi-edp-vanilla-romance-100ml",
    "sku": "SR12-PRF-004",
    "name": "Booperi EDP Vanilla Romance 100 ml",
    "het": 295000,
    "image": "makeCategoryIllustration(Parfum 🍦 Vanilla Romance 100 ml)",
    "summary": "Kemewahan wangi vanilla madagascar berpadu amber hangat memberikan kesan sensual manis dan berkelas."
  },
  {
    "id": "sr12-booperi-edp-cherry-pop-20ml",
    "sku": "SR12-PRF-005",
    "name": "Booperi EDP Cherry Pop 20 ml",
    "het": 45000,
    "image": "makeCategoryIllustration(Parfum 🍒 Cherry Pop 20 ml)",
    "summary": "Parfum saku 20ml wangi buah ceri manis menyegarkan praktis dibawa di tas untuk semprotan kesegaran setiap saat."
  },
  {
    "id": "sr12-booperi-edp-tea-blush-20ml",
    "sku": "SR12-PRF-006",
    "name": "Booperi EDP Tea Blush 20 ml",
    "het": 45000,
    "image": "makeCategoryIllustration(Parfum 🍵 Tea Blush 20 ml)",
    "summary": "Aroma teh hijau lembut dipadu sentuhan powdery floral yang menenangkan dan membuat pikiran rileks."
  },
  {
    "id": "sr12-booperi-edp-velvet-oud-20ml",
    "sku": "SR12-PRF-007",
    "name": "Booperi EDP Velvet Oud 20 ml",
    "het": 45000,
    "image": "makeCategoryIllustration(Parfum 🪵 Velvet Oud 20 ml)",
    "summary": "Wangi kayu gaharu (oud) mewah khas timur tengah yang anggun berkarakter kuat dan tahan seharian."
  },
  {
    "id": "sr12-alorise-shampoo-100ml",
    "sku": "SR12-HC-001",
    "name": "Alorise Shampoo 100 ml",
    "het": 37000,
    "image": "makeCategoryIllustration(Hair Care 🌿 Alorise Shampoo 100 ml)",
    "summary": "Shampo ekstrak lidah buaya murni untuk merawat kesuburan rambut mengurangi ketombe dan gatal kulit kepala."
  },
  {
    "id": "sr12-alorise-shampoo-280ml-pump",
    "sku": "SR12-HC-002",
    "name": "Alorise Shampoo 280ml (Pump)",
    "het": 89500,
    "image": "makeCategoryIllustration(Hair Care 🧴 Alorise Pump 280 ml)",
    "summary": "Kemasan pump keluarga 280ml shampo lidah buaya alami untuk rambut lebat hitam berkilau dan kuat dari akar."
  },
  {
    "id": "sr12-coconut-shampoo-280ml-pump",
    "sku": "SR12-HC-003",
    "name": "Coconut Shampoo 280 ml (Pump)",
    "het": 69500,
    "image": "makeCategoryIllustration(Hair Care 🥥 Coconut Shampoo 280 ml)",
    "summary": "Shampo dengan virgin coconut oil untuk menutrisi batang rambut kering rusak dan bercabang akibat catok/pewarna."
  },
  {
    "id": "sr12-hair-conditioner-125ml",
    "sku": "SR12-HC-004",
    "name": "Hair Conditioner 125 ml",
    "het": 71500,
    "image": "makeCategoryIllustration(Hair Care ✨ Hair Conditioner 125 ml)",
    "summary": "Conditioner pelembut rambut untuk mengunci kelembapan batang rambut agar mudah disisir dan bebas kusut."
  },
  {
    "id": "sr12-hair-conditioner-125ml-non-parfume",
    "sku": "SR12-HC-005",
    "name": "Hair Conditioner 125 ml non parfume",
    "het": 71500,
    "image": "makeCategoryIllustration(Hair Care 💧 Conditioner Non Parfume 125 ml)",
    "summary": "Formula conditioner lembut tanpa parfum sintetis cocok untuk kulit kepala sangat sensitif dan pengguna hijab."
  },
  {
    "id": "sr12-hair-tonic-protection-spray",
    "sku": "SR12-HC-006",
    "name": "Hair Tonic Protection Spray",
    "het": 185000,
    "image": "makeCategoryIllustration(Hair Care 🌿 Hair Tonic Spray 100 ml)",
    "summary": "Hair tonic konsentrat tinggi untuk menghentikan kerontokan parah memperkuat akar rambut dan merangsang pertumbuhan rambut baru."
  },
  {
    "id": "sr12-hair-serum-jasmine-oil",
    "sku": "SR12-HC-007",
    "name": "Hair Serum Jasmine Oil",
    "het": 36000,
    "image": "makeCategoryIllustration(Hair Care 🌼 Serum Jasmine Oil 20 ml)",
    "summary": "Serum vitamin rambut wangi bunga melati melindungi dari panas catok serta memberikan kilau sutra yang indah."
  },
  {
    "id": "sr12-hair-serum-rose-oil",
    "sku": "SR12-HC-008",
    "name": "Hair Serum Rose Oil",
    "het": 36000,
    "image": "makeCategoryIllustration(Hair Care 🌹 Serum Rose Oil 20 ml)",
    "summary": "Serum rambut dengan keharuman mawar mewah melembutkan rambut kaku dan mengatasi rambut mengembang."
  },
  {
    "id": "sr12-body-wash-aloe-vera-100ml-tube",
    "sku": "SR12-BC-001",
    "name": "Body Wash Aloe Vera 100 ml (Tube)",
    "het": 31500,
    "image": "makeCategoryIllustration(Body Care 🧴 Body Wash Aloe 100 ml)",
    "summary": "Sabun mandi cair lidah buaya kemasan tube praktis melembapkan dan menyegarkan kulit tubuh saat bepergian."
  },
  {
    "id": "sr12-body-wash-aloe-vera-250ml-tube",
    "sku": "SR12-BC-002",
    "name": "Body Wash Aloe Vera 250 ml (Tube)",
    "het": 63000,
    "image": "makeCategoryIllustration(Body Care 🧴 Body Wash Aloe 250 ml)",
    "summary": "Ukuran medium 250ml body wash lidah buaya untuk kelembutan kulit tubuh sekeluarga setiap hari."
  },
  {
    "id": "sr12-body-wash-black-coffee-100ml-tube",
    "sku": "SR12-BC-003",
    "name": "Body Wash Black Coffee 100 ml (Tube)",
    "het": 31500,
    "image": "makeCategoryIllustration(Body Care ☕ BW Black Coffee 100 ml)",
    "summary": "Sabun mandi ekstrak kopi hitam murni untuk mengangkat daki menghaluskan kulit kasar dan memberi aroma rileks."
  },
  {
    "id": "sr12-body-wash-black-coffee-250ml-tube",
    "sku": "SR12-BC-004",
    "name": "Body Wash Black Coffee 250 ml (Tube)",
    "het": 63000,
    "image": "makeCategoryIllustration(Body Care ☕ BW Black Coffee 250 ml)",
    "summary": "Ukuran 250ml body wash black coffee membersihkan pori tubuh dari polusi dan keringat."
  },
  {
    "id": "sr12-deodorant-spray-60ml",
    "sku": "SR12-DEO-001",
    "name": "Deodorant Spray 60 ml",
    "het": 42000,
    "image": "/assets/deodorant-spray.jpg",
    "summary": "Deodorant tawas herbal nomor satu di Indonesia! Bebas bau ketiak 24 jam nonstop tidak berbekas kuning dan mencerahkan ketiak."
  },
  {
    "id": "sr12-deodorant-spray-premium-60ml",
    "sku": "SR12-DEO-002",
    "name": "Deodorant Spray Premium 60 ml",
    "het": 63000,
    "image": "/assets/deodorant-spray.jpg",
    "summary": "Versi premium deodorant spray dengan partikel nano tawas lebih halus dan ekstrak jeruk nipis murni untuk perlindungan ekstra kering."
  },
  {
    "id": "sr12-bundling-deodorant-spray-20pcs",
    "sku": "SR12-DEO-003",
    "name": "Bundling Deodorant Spray (isi 20 pcs)",
    "het": 840000,
    "image": "/assets/deodorant-spray.jpg",
    "summary": "Paket grosir isi 20 botol Deodorant Spray reguler untuk reseller dan agen resmi dengan margin keuntungan maksimal."
  },
  {
    "id": "sr12-bundling-deodorant-spray-premium-20pcs",
    "sku": "SR12-DEO-004",
    "name": "Bundling Deodorant Spray Premium (isi 20 pcs)",
    "het": 1260000,
    "image": "/assets/deodorant-spray.jpg",
    "summary": "Paket grosir isi 20 botol Deodorant Spray Premium untuk mitra resmi SR12."
  },
  {
    "id": "sr12-massage-oil-bulus-20ml",
    "sku": "SR12-BC-005",
    "name": "Massage Oil Bulus 20 ml",
    "het": 130000,
    "image": "makeCategoryIllustration(Body Care 🐢 Minyak Bulus Murni 20 ml)",
    "summary": "Minyak bulus murni kualitas super tanpa bau amis menyengat. Berkhasiat mengencangkan payudara menghilangkan selulit dan merapatkan pori."
  },
  {
    "id": "sr12-lightening-body-lotion-100ml-tube",
    "sku": "SR12-BC-006",
    "name": "Lightening Body Lotion 100 ml (Tube)",
    "het": 80500,
    "image": "makeCategoryIllustration(Body Care 🧴 Lightening Lotion 100 ml)",
    "summary": "Lotion pencerah kulit tubuh dengan tabir surya SPF untuk melindungi kulit tangan dan kaki dari sengatan sinar UV."
  },
  {
    "id": "sr12-lightening-body-lotion-50ml-tube",
    "sku": "SR12-BC-007",
    "name": "Lightening Body Lotion 50 ml (Tube)",
    "het": 37000,
    "image": "makeCategoryIllustration(Body Care 🧴 Lightening Lotion 50 ml)",
    "summary": "Kemasan saku 50ml lotion pencerah tubuh nyaman dibawa di pouch saat liburan atau bekerja di luar ruangan."
  },
  {
    "id": "sr12-whitening-night-body-lotion-100ml",
    "sku": "SR12-BC-008",
    "name": "Whitening Night Body Lotion 100 ml",
    "het": 84000,
    "image": "makeCategoryIllustration(Body Care 🌙 Night Body Lotion 100 ml)",
    "summary": "Lotion malam intensif yang menutrisi kulit saat tidur meregenerasi sel kulit kusam dan memudarkan belang dengan cepat."
  },
  {
    "id": "sr12-whitening-moisturizing-cream-100ml",
    "sku": "SR12-BC-009",
    "name": "Whitening moisturizing Cream 100 ml",
    "het": 94500,
    "image": "makeCategoryIllustration(Body Care ✨ Whitening Moist Cream 100 ml)",
    "summary": "Krim pelembap badan dengan formula ultra-hydrating untuk mengatasi kulit tubuh yang sangat bersisik dan kering keriput."
  },
  {
    "id": "sr12-miss-manja-wash-spray",
    "sku": "SR12-BC-010",
    "name": "Miss Manja Wash & Spray",
    "het": 100000,
    "image": "makeCategoryIllustration(Body Care 🌸 Miss Manja Paket Set)",
    "summary": "Paket lengkap pembersih kewanitaan herbal ekstrak manjakani dan sirih merapatkan menghilangkan bau tak sedap dan keputihan."
  },
  {
    "id": "sr12-miss-manja-wash",
    "sku": "SR12-BC-011",
    "name": "Miss Manja Wash",
    "het": 57000,
    "image": "makeCategoryIllustration(Body Care 🧴 Miss Manja Wash 100 ml)",
    "summary": "Sabun cair kewanitaan pH seimbang dengan ekstrak manjakani untuk membersihkan area intim dengan nyaman dan higienis."
  },
  {
    "id": "sr12-miss-manja-spray",
    "sku": "SR12-BC-012",
    "name": "Miss Manja Spray",
    "het": 57000,
    "image": "makeCategoryIllustration(Body Care ✨ Miss Manja Spray 60 ml)",
    "summary": "Semprotan penyegar organ intim kewanitaan praktis tanpa bilas memberikan kesegaran harum seketika sepanjang hari."
  },
  {
    "id": "sr12-daily-cover-natural-10g",
    "sku": "SR12-PC-001",
    "name": "Daily Cover Natural 10 g",
    "het": 110000,
    "image": "makeCategoryIllustration(Personal Care 💄 Daily Cover Natural 10 g)",
    "summary": "Bedak padat foundation shade Natural dengan coverage tinggi menyamarkan pori dan bekas jerawat tahan hingga 8 jam."
  },
  {
    "id": "sr12-daily-cover-beige-10g",
    "sku": "SR12-PC-002",
    "name": "Daily Cover Beige 10 g",
    "het": 110000,
    "image": "makeCategoryIllustration(Personal Care 💄 Daily Cover Beige 10 g)",
    "summary": "Bedak padat shade Beige untuk warna kulit sawo matang khas Indonesia tampak natural dan tidak abu-abu."
  },
  {
    "id": "sr12-daily-cover-sheer-pink-10g",
    "sku": "SR12-PC-003",
    "name": "Daily Cover Sheer Pink 10 g",
    "het": 110000,
    "image": "makeCategoryIllustration(Personal Care 💄 Daily Cover Pink 10 g)",
    "summary": "Bedak padat shade Sheer Pink untuk memberikan efek rona wajah cerah berseri dan merona alami."
  },
  {
    "id": "sr12-perfect-eye-brow-0-35g",
    "sku": "SR12-PC-004",
    "name": "Perfect Eye Brow 035 g",
    "het": 68500,
    "image": "makeCategoryIllustration(Personal Care ✏️ Perfect Eye Brow 035 g)",
    "summary": "Pensil alis mekanik presisi dengan ujung ramping untuk menggambar serat alis tampak tebal natural."
  },
  {
    "id": "sr12-perfect-2-in-1-eyebrow-eyeliner",
    "sku": "SR12-PC-005",
    "name": "Perfect 2 in 1 035 g & 06 g",
    "het": 121000,
    "image": "makeCategoryIllustration(Personal Care ✒️ Perfect 2 in 1 Duo)",
    "summary": "Kombinasi eyebrow pensil dan eyeliner waterproof dalam satu kemasan ringkas elegan untuk riasan mata memukau."
  },
  {
    "id": "sr12-matte-cover-natural-loose-powder-15g",
    "sku": "SR12-PC-006",
    "name": "Matte Cover Natural Loose Powder 15 g",
    "het": 92000,
    "image": "makeCategoryIllustration(Personal Care ✨ Matte Loose Powder 15 g)",
    "summary": "Bedak tabur partikel mikro super halus untuk mengunci minyak di area T-zone wajah dengan hasil akhir matte velvet."
  },
  {
    "id": "sr12-perfect-cushion-natural-15g",
    "sku": "SR12-PC-007",
    "name": "Perfect Cushion Natural 15 g",
    "het": 203500,
    "image": "makeCategoryIllustration(Personal Care 🪞 Cushion Natural 15 g)",
    "summary": "Cushion premium shade Natural dengan puff antibakteri memberikan efek glowing dewy finish tahan seharian."
  },
  {
    "id": "sr12-perfect-cushion-ivory-15g",
    "sku": "SR12-PC-008",
    "name": "Perfect Cushion Ivory 15 g",
    "het": 195000,
    "image": "makeCategoryIllustration(Personal Care 🪞 Cushion Ivory 15 g)",
    "summary": "Cushion shade Ivory untuk kulit cerah / kuning langsat menutup ketidaksempurnaan wajah dengan sempurna."
  },
  {
    "id": "sr12-refill-perfect-cushion-natural-15g",
    "sku": "SR12-PC-009",
    "name": "Refill Perfect Cushion Natural 15 g",
    "het": 126000,
    "image": "makeCategoryIllustration(Personal Care 📦 Refill Cushion Natural 15 g)",
    "summary": "Isi ulang (refill) ekonomis Perfect Cushion Natural 15g lengkap dengan spons baru."
  },
  {
    "id": "sr12-refill-perfect-cushion-ivory-15g",
    "sku": "SR12-PC-010",
    "name": "Refill Perfect Cushion Ivory 15 g",
    "het": 126000,
    "image": "makeCategoryIllustration(Personal Care 📦 Refill Cushion Ivory 15 g)",
    "summary": "Isi ulang (refill) ekonomis Perfect Cushion Ivory 15g lengkap dengan spons baru."
  },
  {
    "id": "sr12-nail-polish-peel-off-6ml",
    "sku": "SR12-PC-011",
    "name": "Nail Polish Peel Off 6 ml",
    "het": 52500,
    "image": "makeCategoryIllustration(Personal Care 💅 Nail Polish Peel Off 6 ml)",
    "summary": "Kutek peel-off muslimah water-based mudah dikelupas tanpa aseton saat hendak berwudhu."
  },
  {
    "id": "sr12-lip-care-cherry-5g",
    "sku": "SR12-PC-012",
    "name": "Lip Care Cherry 5 g",
    "het": 37000,
    "image": "makeCategoryIllustration(Personal Care 🍒 Lip Care Cherry 5 g)",
    "summary": "Pelembap bibir herbal dengan rona merah ceri alami mengatasi bibir hitam pecah-pecah dan kering."
  },
  {
    "id": "sr12-lip-care-natural-5g",
    "sku": "SR12-PC-013",
    "name": "Lip Care Natural 5 g",
    "het": 36500,
    "image": "makeCategoryIllustration(Personal Care 🌿 Lip Care Natural 5 g)",
    "summary": "Pelembap bibir tanpa warna dengan petroleum jelly murni dan VCO cocok untuk pria dan wanita sebelum tidur."
  },
  {
    "id": "sr12-lip-cream-sr01-4g",
    "sku": "SR12-PC-014",
    "name": "Lip Cream SR01 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 💄 Lip Cream SR01 4 g)",
    "summary": "Lip cream matte intens shade SR01 dengan formula ringan tidak membuat bibir kering atau pecah-pecah."
  },
  {
    "id": "sr12-lip-cream-sr01-2g",
    "sku": "SR12-PC-015",
    "name": "Lip Cream SR01 2 g",
    "het": 55000,
    "image": "makeCategoryIllustration(Personal Care 💄 Lip Cream Mini SR01 2 g)",
    "summary": "Versi mini travel 2g lip cream shade SR01 yang praktis disimpan di dompet."
  },
  {
    "id": "sr12-lip-cream-sr04-4g",
    "sku": "SR12-PC-016",
    "name": "Lip Cream SR04 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 💄 Lip Cream SR04 4 g)",
    "summary": "Lip cream matte shade SR04 nude peach favorit para hijabers untuk tampilan wajah manis segar."
  },
  {
    "id": "sr12-lip-cream-sr04-2g",
    "sku": "SR12-PC-017",
    "name": "Lip Cream SR04 2 g",
    "het": 58000,
    "image": "makeCategoryIllustration(Personal Care 💄 Lip Cream Mini SR04 2 g)",
    "summary": "Versi travel size 2g shade SR04 untuk sentuhan warna bibir menawan saat jalan-jalan."
  },
  {
    "id": "sr12-lip-cream-sr13-4g",
    "sku": "SR12-PC-018",
    "name": "Lip Cream SR13 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 💄 Lip Cream SR13 4 g)",
    "summary": "Lip cream shade SR13 merah bata elegan memberikan kesan tegas dan berani di berbagai acara formal."
  },
  {
    "id": "sr12-lip-cream-sr13-2g",
    "sku": "SR12-PC-019",
    "name": "Lip Cream SR13 2 g",
    "het": 58000,
    "image": "makeCategoryIllustration(Personal Care 💄 Lip Cream Mini SR13 2 g)",
    "summary": "Versi mini 2g lip cream SR13 shade merah bata."
  },
  {
    "id": "sr12-lip-matte-cream-cherish-me-4g",
    "sku": "SR12-PC-020",
    "name": "Lip Matte Cream Cherish Me 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 💋 Cherish Me 4 g)",
    "summary": "Lip matte cream formula transferproof shade Cherish Me tahan seharian meski dipakai makan dan minum."
  },
  {
    "id": "sr12-lip-matte-cream-cherish-me-2g",
    "sku": "SR12-PC-021",
    "name": "Lip Matte Cream Cherish Me 2 g",
    "het": 55000,
    "image": "makeCategoryIllustration(Personal Care 💋 Cherish Me Mini 2 g)",
    "summary": "Kemasan hemat 2g shade Cherish Me transferproof."
  },
  {
    "id": "sr12-lip-matte-cream-nude-berry-4g",
    "sku": "SR12-PC-022",
    "name": "Lip Matte Cream Nude Berry 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 🍓 Nude Berry 4 g)",
    "summary": "Lip matte shade Nude Berry favorit untuk riasan bibir ombre ala Korea yang elegan."
  },
  {
    "id": "sr12-lip-matte-cream-nude-berry-2g",
    "sku": "SR12-PC-023",
    "name": "Lip Matte Cream Nude Berry 2 g",
    "het": 65000,
    "image": "makeCategoryIllustration(Personal Care 🍓 Nude Berry Mini 2 g)",
    "summary": "Versi mini 2g Nude Berry untuk pouch makeup harian."
  },
  {
    "id": "sr12-lip-matte-cream-sweet-pink-4g",
    "sku": "SR12-PC-024",
    "name": "Lip Matte Cream Sweet Pink 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 🌸 Sweet Pink 4 g)",
    "summary": "Warna pink manis feminin yang cocok untuk mencerahkan wajah remaja dan wanita muda."
  },
  {
    "id": "sr12-lip-matte-cream-sweet-pink-2g",
    "sku": "SR12-PC-025",
    "name": "Lip Matte Cream Sweet Pink 2 g",
    "het": 65000,
    "image": "makeCategoryIllustration(Personal Care 🌸 Sweet Pink Mini 2 g)",
    "summary": "Versi 2g shade Sweet Pink lembut."
  },
  {
    "id": "sr12-lip-matte-cream-honey-berry-4g",
    "sku": "SR12-PC-026",
    "name": "Lip Matte Cream Honey Berry 4 g",
    "het": 105000,
    "image": "makeCategoryIllustration(Personal Care 🍯 Honey Berry 4 g)",
    "summary": "Perpaduan warna madu dan berry hangat yang memberikan kesan bibir sehat penuh volume."
  },
  {
    "id": "sr12-lip-matte-cream-honey-berry-2g",
    "sku": "SR12-PC-027",
    "name": "Lip Matte Cream Honey Berry 2 g",
    "het": 65000,
    "image": "makeCategoryIllustration(Personal Care 🍯 Honey Berry Mini 2 g)",
    "summary": "Versi mini 2g warna Honey Berry eksotis."
  },
  {
    "id": "sr12-lip-scrub-exfoliator-moisturizer",
    "sku": "SR12-PC-028",
    "name": "Lip Scrub Exfoliator & Moisturizer",
    "het": 39000,
    "image": "makeCategoryIllustration(Personal Care ✨ Lip Scrub Exfoliator Pot)",
    "summary": "Scrub butiran gula alami halus untuk mengangkat sel kulit mati pada bibir agar halus lembut dan merona."
  },
  {
    "id": "sr12-lip-glow-serum",
    "sku": "SR12-PC-029",
    "name": "Lip Glow Serum",
    "het": 52500,
    "image": "makeCategoryIllustration(Personal Care ✨ Lip Glow Serum 5 ml)",
    "summary": "Serum bibir dengan magic color booster berubah warna mengikuti suhu tubuh dan memberi kilau sehat."
  },
  {
    "id": "sr12-lip-mousse-cream-2g",
    "sku": "SR12-PC-030",
    "name": "Lip Mousse Cream 2 g",
    "het": 66000,
    "image": "makeCategoryIllustration(Personal Care 🧁 Lip Mousse Cream 2 g)",
    "summary": "Tekstur mousse seringan awan menyamarkan garis bibir dan terasa nyaman seperti tidak memakai pewarna bibir."
  },
  {
    "id": "sr12-lip-mousse-rose-pink-2g",
    "sku": "SR12-PC-031",
    "name": "Lip Mousse Rose Pink 2 g",
    "het": 68000,
    "image": "makeCategoryIllustration(Personal Care 🌹 Mousse Rose Pink 2 g)",
    "summary": "Lip mousse shade Rose Pink dengan keharuman mawar dan warna feminin anggun."
  },
  {
    "id": "sr12-lip-mousse-sweet-brown-2g",
    "sku": "SR12-PC-032",
    "name": "Lip Mousse Sweet Brown 2 g",
    "het": 67000,
    "image": "makeCategoryIllustration(Personal Care 🍫 Mousse Sweet Brown 2 g)",
    "summary": "Shade Sweet Brown bernuansa cokelat hangat cocok untuk tampilan makeup elegan bernuansa vintage."
  },
  {
    "id": "sr12-lip-tint-gel-sweet-orange-2g",
    "sku": "SR12-PC-033",
    "name": "Lip Tint Gel Sweet Orange 2 g",
    "het": 52500,
    "image": "makeCategoryIllustration(Personal Care 🍊 Tint Sweet Orange 2 g)",
    "summary": "Liptint berbahan gel menyegarkan dengan warna jeruk ceria yang meresap alami ke bibir seharian."
  },
  {
    "id": "sr12-lip-potion-cold-fire-8g",
    "sku": "SR12-PC-034",
    "name": "Lip Potion Cold Fire 8 g",
    "het": 50000,
    "image": "makeCategoryIllustration(Personal Care 🔥 Lip Potion Cold Fire 8 g)",
    "summary": "Formula lip potion inovatif dengan sensasi dingin segar yang memberikan warna cerah menawan."
  },
  {
    "id": "sr12-perfect-cover-bb-cream-natural-beige",
    "sku": "SR12-PC-035",
    "name": "Perfect Cover BB Cream Natural Beige",
    "het": 90000,
    "image": "makeCategoryIllustration(Personal Care 🧴 BB Cream Natural Beige 30 ml)",
    "summary": "BB cream all-in-one pencerah pelembap dan penyamar noda dengan tabir surya SPF untuk riasan harian ringan."
  },
  {
    "id": "sr12-perfect-cream-blush-peach-3g",
    "sku": "SR12-PC-036",
    "name": "Perfect Cream Blush Peach 3g",
    "het": 40000,
    "image": "makeCategoryIllustration(Personal Care 🍑 Cream Blush Peach 3 g)",
    "summary": "Blush on krim shade Peach menyatu sempurna di pipi tanpa merusak bedak memberikan rona pipi segar merona."
  },
  {
    "id": "sr12-perfect-cream-blush-pink-3g",
    "sku": "SR12-PC-037",
    "name": "Perfect Cream Blush Pink 3g",
    "het": 40000,
    "image": "makeCategoryIllustration(Personal Care 🌸 Cream Blush Pink 3 g)",
    "summary": "Blush on krim shade Pink untuk rona pipi segar berseri sepanjang hari."
  },
  {
    "id": "sr12-lip-treatment-package",
    "sku": "SR12-PC-038",
    "name": "Lip Treatment Package",
    "het": 115000,
    "image": "makeCategoryIllustration(Personal Care 🎁 Lip Treatment Set Paket)",
    "summary": "Paket spa bibir lengkap (Lip Scrub + Lip Care + Lip Glow Serum) untuk mengembalikan warna bibir merah merona."
  },
  {
    "id": "sr12-cherry-lip-balm-moisturizer-lip-colour",
    "sku": "SR12-PC-039",
    "name": "Cherry Lip Balm Moisturizer & Lip Colour",
    "het": 42000,
    "image": "makeCategoryIllustration(Personal Care 🍒 Cherry Lip Balm Pot)",
    "summary": "Lip balm aroma ceri manis yang melembapkan bibir pecah-pecah sekaligus memberikan rona merah natural."
  },
  {
    "id": "sr12-sactea-face-body-barsoap",
    "sku": "SR12-SKS-001",
    "name": "Sactea Face & Body Barsoap",
    "het": 27500,
    "image": "makeCategoryIllustration(Skinsane 🧼 Sactea Barsoap 80 g)",
    "summary": "Sabun batang Skinsane varian Sactea dengan Salicylic Acid & Tea Tree ampuh basmi jerawat punggung dan wajah."
  },
  {
    "id": "sr12-majie-face-body-barsoap",
    "sku": "SR12-SKS-002",
    "name": "Majie Face & Body Barsoap",
    "het": 27500,
    "image": "makeCategoryIllustration(Skinsane 🧼 Majie Barsoap 80 g)",
    "summary": "Sabun batang Skinsane varian Majie dengan Kojic Dipalmitate murni untuk mencerahkan lipatan kulit gelap."
  },
  {
    "id": "sr12-sicad-face-body-barsoap",
    "sku": "SR12-SKS-003",
    "name": "Sicad Face & Body Barsoap",
    "het": 27500,
    "image": "makeCategoryIllustration(Skinsane 🧼 Sicad Barsoap 80 g)",
    "summary": "Sabun batang Skinsane varian Sicad dengan Centella Asiatica & Niacinamide untuk menenangkan skin barrier meradang."
  },
  {
    "id": "sr12-i-need-me-time-body-serum",
    "sku": "SR12-SKS-004",
    "name": "I Need Me Time Body Serum",
    "het": 72000,
    "image": "makeCategoryIllustration(Skinsane ✨ I Need Me Time Serum 150 ml)",
    "summary": "Body serum Skinsane aroma mewah menenangkan mencerahkan kulit tubuh 3x lebih cepat tanpa rasa lengket."
  },
  {
    "id": "sr12-playing-at-the-garden-body-serum",
    "sku": "SR12-SKS-005",
    "name": "Playing At The Garden Body Serum",
    "het": 69000,
    "image": "makeCategoryIllustration(Skinsane 💐 Garden Body Serum 150 ml)",
    "summary": "Body serum dengan kesegaran taman bunga musim semi melembapkan kulit kering dan membuat kulit wangi tahan lama."
  },
  {
    "id": "sr12-sweet-berry-crush-body-serum",
    "sku": "SR12-SKS-006",
    "name": "Sweet Berry Crush Body Serum",
    "het": 69000,
    "image": "makeCategoryIllustration(Skinsane 🍓 Sweet Berry Serum 150 ml)",
    "summary": "Body serum kaya antioksidan buah beri manis untuk memudarkan flek belang dan menjaga kekenyalan kulit."
  },
  {
    "id": "sr12-i-need-me-time-body-scrub",
    "sku": "SR12-SKS-007",
    "name": "I Need Me Time Body Scrub",
    "het": 91000,
    "image": "makeCategoryIllustration(Skinsane 🥣 Me Time Body Scrub 250 g)",
    "summary": "Lulur scrub butiran lembut untuk merontokkan daki membandel dan sel kulit mati tanpa bikin kulit perih."
  },
  {
    "id": "sr12-playing-at-the-garden-body-scrub",
    "sku": "SR12-SKS-008",
    "name": "Playing At The Garden Body Scrub",
    "het": 72500,
    "image": "makeCategoryIllustration(Skinsane 💐 Garden Body Scrub 250 g)",
    "summary": "Body scrub aroma bunga taman untuk spa mandiri di rumah menjadikan kulit halus mulus seperti sutra."
  },
  {
    "id": "sr12-sweet-berry-crush-body-scrub",
    "sku": "SR12-SKS-009",
    "name": "Sweet Berry Crush Body Scrub",
    "het": 77000,
    "image": "makeCategoryIllustration(Skinsane 🍓 Berry Body Scrub 250 g)",
    "summary": "Scrub buah beri manis untuk mengangkat kotoran pori-pori kulit tubuh secara optimal."
  },
  {
    "id": "sr12-brightening-day-cream-10g",
    "sku": "SR12-FC-001",
    "name": "Brightening Day Cream 10 g",
    "het": 121000,
    "image": "makeCategoryIllustration(Face Care ☀️ Brightening Day Cream 10 g)",
    "summary": "Krim siang pencerah wajah dengan UV filter untuk melindungi kulit dari flek hitam dan sengatan sinar matahari."
  },
  {
    "id": "sr12-brightening-night-cream-10g",
    "sku": "SR12-FC-002",
    "name": "Brightening Night Cream 10 g",
    "het": 121000,
    "image": "makeCategoryIllustration(Face Care 🌙 Brightening Night Cream 10 g)",
    "summary": "Krim malam pencerah dengan bahan aktif herbal untuk merevitalisasi sel kulit dan membuat wajah glowing di pagi hari."
  },
  {
    "id": "sr12-milk-cleanser-tuba-100ml",
    "sku": "SR12-FC-003",
    "name": "Milk Cleanser Tuba 100 ml",
    "het": 70500,
    "image": "makeCategoryIllustration(Face Care 🥛 Milk Cleanser 100 ml)",
    "summary": "Pembersih susu lembut untuk mengangkat sisa makeup waterproof debu jalanan dan minyak berlebih tanpa iritasi."
  },
  {
    "id": "sr12-ggs-series",
    "sku": "SR12-FC-004",
    "name": "GGS Series",
    "het": 278500,
    "image": "makeCategoryIllustration(Face Care ✨ GGS Series Lengkap Paket)",
    "summary": "Paket Glowing Glass Skin legendaris SR12 untuk kulit bening berkilau tanpa pori-pori terlihat layaknya kaca."
  },
  {
    "id": "sr12-glow-glass-skin-gel",
    "sku": "SR12-FC-005",
    "name": "Glow Glass Skin Gel",
    "het": 194500,
    "image": "makeCategoryIllustration(Face Care 💎 Glow Glass Skin Gel Pot)",
    "summary": "Gel pelembap kristal dengan ekstrak alami untuk memberikan hidrasi maksimal dan kilau glass skin seketika."
  },
  {
    "id": "sr12-micellar-water-100ml",
    "sku": "SR12-FC-006",
    "name": "Micellar Water 100 ml",
    "het": 47500,
    "image": "makeCategoryIllustration(Face Care 💧 Micellar Water 100 ml)",
    "summary": "Pembersih wajah berbasis air misel lembut tanpa alkohol aman untuk mata dan bibir sensitif."
  },
  {
    "id": "sr12-nature-rose-water-60ml",
    "sku": "SR12-FC-007",
    "name": "Nature Rose Water 60 ml",
    "het": 38000,
    "image": "makeCategoryIllustration(Face Care 🌹 Rose Water 60 ml)",
    "summary": "Air mawar murni penyegar kulit mengunci kelembapan meredakan kemerahan dan sebagai setting spray alami."
  },
  {
    "id": "sr12-nature-rose-water-100ml",
    "sku": "SR12-FC-008",
    "name": "Nature Rose Water 100 ml",
    "het": 52500,
    "image": "makeCategoryIllustration(Face Care 🌹 Rose Water 100 ml)",
    "summary": "Air mawar ukuran 100ml untuk kesegaran wajah harian dan campuran masker bubuk."
  },
  {
    "id": "sr12-nature-secret-water-60ml",
    "sku": "SR12-FC-009",
    "name": "Nature Secret Water 60 ml",
    "het": 38000,
    "image": "makeCategoryIllustration(Face Care ✨ Secret Water 60 ml)",
    "summary": "Face mist spray rahasia kecantikan dengan formula anti-aging untuk mengencangkan dan menyegarkan kulit lelah."
  },
  {
    "id": "sr12-nature-secret-water-100ml",
    "sku": "SR12-FC-010",
    "name": "Nature Secret Water 100 ml",
    "het": 52500,
    "image": "makeCategoryIllustration(Face Care ✨ Secret Water 100 ml)",
    "summary": "Ukuran 100ml spray pencerah serbaguna untuk menyeimbangkan pH kulit setelah mencuci muka."
  },
  {
    "id": "sr12-revitalizing-serum-by-sr12-20ml",
    "sku": "SR12-FC-011",
    "name": "Revitalizing Serum by SR12 20 ml",
    "het": 91500,
    "image": "makeCategoryIllustration(Face Care 💧 Revitalizing Serum 20 ml)",
    "summary": "Serum revitalisasi kulit dengan konsentrasi tinggi untuk memudarkan mata panda kantung mata dan garis halus."
  },
  {
    "id": "sr12-serum-retinol-20ml",
    "sku": "SR12-FC-012",
    "name": "Serum Retinol 20 ml",
    "het": 147000,
    "image": "makeCategoryIllustration(Face Care 🔬 Serum Retinol 20 ml)",
    "summary": "Serum retinol terenkapsulasi yang stabil dan minim iritasi mempercepat pergantian sel mengencangkan dan anti-penuaan."
  },
  {
    "id": "sr12-spot-essense-day-cream-10g",
    "sku": "SR12-FC-013",
    "name": "Spot Essense Day Cream 10 g",
    "het": 136500,
    "image": "makeCategoryIllustration(Face Care ☀️ Spot Essence Day 10 g)",
    "summary": "Krim siang spesialis penghilang flek hitam menahun dan hiperpigmentasi dengan perlindungan tabir surya."
  },
  {
    "id": "sr12-spot-essence-night-cream-10g",
    "sku": "SR12-FC-014",
    "name": "Spot Essence Night Cream 10 g",
    "het": 136500,
    "image": "makeCategoryIllustration(Face Care 🌙 Spot Essence Night 10 g)",
    "summary": "Krim malam intensif pemudaran flek hitam melasma dan bekas jerawat gelap secara bertahap dan aman."
  },
  {
    "id": "sr12-suncare-lotion-15g",
    "sku": "SR12-FC-015",
    "name": "Suncare Lotion 15 g",
    "het": 55500,
    "image": "makeCategoryIllustration(Face Care ☀️ Suncare Lotion 15 g)",
    "summary": "Tabir surya harian SPF 25++ ringan dan tidak menyumbat pori melindungi kulit dari penuaan dini akibat sinar UV."
  },
  {
    "id": "sr12-sunblock-15g",
    "sku": "SR12-FC-016",
    "name": "Sunblock 15 g",
    "het": 58000,
    "image": "makeCategoryIllustration(Face Care 🏖️ Sunblock SPF 15 g)",
    "summary": "Perlindungan fisik terhadap sinar matahari untuk aktivitas luar ruangan ekstrem seperti berenang dan pantai."
  },
  {
    "id": "sr12-toner-chamomile-60ml",
    "sku": "SR12-FC-017",
    "name": "Toner Chamomile 60 ml",
    "het": 63000,
    "image": "makeCategoryIllustration(Face Care 🌼 Toner Chamomile 60 ml)",
    "summary": "Toner bunga chamomile untuk menenangkan kulit sensitif kemerahan atau mudah iritasi terhadap debu."
  },
  {
    "id": "sr12-toner-aha-60ml",
    "sku": "SR12-FC-018",
    "name": "Toner AHA 60 ml",
    "het": 73500,
    "image": "makeCategoryIllustration(Face Care 🧪 Toner AHA 60 ml)",
    "summary": "Exfoliating toner dengan AHA herbal untuk mengangkat penumpukan sel kulit mati dan mencerahkan kulit kasar."
  },
  {
    "id": "sr12-toner-bha-60ml",
    "sku": "SR12-FC-019",
    "name": "Toner BHA 60 ml",
    "het": 88000,
    "image": "makeCategoryIllustration(Face Care 🧪 Toner BHA 60 ml)",
    "summary": "Toner BHA penetrasi mendalam untuk membersihkan sebum dari dalam pori-pori dan melenyapkan komedo hitam/putih."
  },
  {
    "id": "sr12-ceramide-skin-barrier-care-18g",
    "sku": "SR12-FC-020",
    "name": "Ceramide Skin Barrier Care 18 g",
    "het": 93500,
    "image": "makeCategoryIllustration(Face Care 🛡️ Ceramide Barrier Care 18 g)",
    "summary": "Moisturizer ceramide pelindung skin barrier nomor 1! Memperbaiki kulit rusak akibat breakout kering mengelupas dan kemerahan."
  },
  {
    "id": "sr12-paket-dna-salmon",
    "sku": "SR12-FC-021",
    "name": "Paket DNA Salmon",
    "het": 253000,
    "image": "makeCategoryIllustration(Face Care 🐟 Paket DNA Salmon Set)",
    "summary": "Perawatan mewah DNA Salmon lengkap (Sabun + Toner + Day Cream + Night Cream) untuk kulit awet muda kencang dan glowing."
  },
  {
    "id": "sr12-dna-salmon-toner-70ml",
    "sku": "SR12-FC-022",
    "name": "DNA Salmon Toner 70 ml",
    "het": 40000,
    "image": "makeCategoryIllustration(Face Care 💧 DNA Salmon Toner 70 ml)",
    "summary": "Toner peremajaan kulit kaya nutrisi DNA Salmon untuk hidrasi optimal dan penyerapan serum lebih maksimal."
  },
  {
    "id": "sr12-dna-salmon-day-cream-12g",
    "sku": "SR12-FC-023",
    "name": "DNA Salmon Day Cream 12 g",
    "het": 112500,
    "image": "makeCategoryIllustration(Face Care ☀️ DNA Salmon Day Cream 12 g)",
    "summary": "Krim siang mewah DNA Salmon dengan UV filter untuk melembutkan tekstur kulit dan menyamarkan kerutan."
  },
  {
    "id": "sr12-dna-salmon-night-cream-12g",
    "sku": "SR12-FC-024",
    "name": "DNA Salmon Night Cream 12 g",
    "het": 112500,
    "image": "makeCategoryIllustration(Face Care 🌙 DNA Salmon Night 12 g)",
    "summary": "Krim malam regenerasi DNA Salmon mengencangkan kulit wajah dan memberikan kelembapan ekstra saat terlelap."
  },
  {
    "id": "sr12-face-oil-natural-serum",
    "sku": "SR12-FC-025",
    "name": "Face Oil Natural Serum",
    "het": 125000,
    "image": "makeCategoryIllustration(Face Care 🌿 Face Oil Natural 20 ml)",
    "summary": "Campuran minyak nabati murni untuk mengunci kelembapan kulit kering parah dan sebagai base makeup agar menempel sempurna."
  },
  {
    "id": "sr12-sunscreen-gel-spf-50",
    "sku": "SR12-FC-026",
    "name": "Sunscreen Gel SPF 50",
    "het": 115000,
    "image": "makeCategoryIllustration(Face Care ☀️ Sunscreen Gel SPF 50 Tube)",
    "summary": "Tabir surya gel transparan SPF 50 PA++++ tanpa whitecast cepat meresap dan tidak membuat riasan geser."
  },
  {
    "id": "sr12-2-copper-peptide-12x-multipeptide",
    "sku": "SR12-FC-027",
    "name": "2% Copper Peptideo + 12x Multipeptide",
    "het": 185000,
    "image": "makeCategoryIllustration(Face Care 🧬 Copper Peptide 12x 20 ml)",
    "summary": "Serum mutakhir 2% Copper Peptide dan 12 jenis peptida untuk memudarkan bopeng menyamarkan kerutan dan meremajakan sel kulit."
  },
  {
    "id": "sr12-beauty-feeling-12-peeling-serum",
    "sku": "SR12-FC-028",
    "name": "Beauty Feeling 12% Peeling Serum",
    "het": 57000,
    "image": "makeCategoryIllustration(Face Care 🧪 12% Peeling Serum 20 ml)",
    "summary": "Serum peeling eksfoliasi lembut 12% untuk meratakan warna kulit dan membersihkan sel kulit mati dalam 10 menit bilas."
  },
  {
    "id": "sr12-gomilku-original-200g",
    "sku": "SR12-GMK-001",
    "name": "GoMilku Original 200 g",
    "het": 52500,
    "image": "makeCategoryIllustration(Herbal 🥛 GoMilku Original 200 g)",
    "summary": "Susu kambing etawa murni diperkaya daun kelor madu dan ikan gabus. Sangat baik untuk asam lambung paru-paru dan imunitas."
  },
  {
    "id": "sr12-gomilku-original-600g",
    "sku": "SR12-GMK-002",
    "name": "GoMilku Original 600 g",
    "het": 131500,
    "image": "makeCategoryIllustration(Herbal 🥛 GoMilku Original Jumbo 600 g)",
    "summary": "Kemasan jumbo 600g GoMilku Original rasa gurih nikmat tanpa bau amis prengus hemat untuk konsumsi harian keluarga."
  },
  {
    "id": "sr12-gomilku-original-pouch-40-sachet",
    "sku": "SR12-GMK-003",
    "name": "GoMilku Original Pouch (Isi 40 Sachet)",
    "het": 215000,
    "image": "makeCategoryIllustration(Herbal 📦 GoMilku Original Pouch 40 Sachet)",
    "summary": "Pouch higienis isi 40 sachet GoMilku Original sangat praktis diseduh di kantor maupun saat bepergian."
  },
  {
    "id": "sr12-gomilku-cokelat-200g",
    "sku": "SR12-GMK-004",
    "name": "GoMilku Cokelat 200 g",
    "het": 52500,
    "image": "makeCategoryIllustration(Herbal 🍫 GoMilku Cokelat 200 g)",
    "summary": "Susu kambing etawa rasa cokelat lezat disukai anak-anak dan dewasa membantu penambahan berat badan sehat."
  },
  {
    "id": "sr12-gomilku-cokelat-600g",
    "sku": "SR12-GMK-005",
    "name": "GoMilku Cokelat 600 g",
    "het": 131500,
    "image": "makeCategoryIllustration(Herbal 🍫 GoMilku Cokelat Jumbo 600 g)",
    "summary": "Kemasan jumbo 600g GoMilku rasa cokelat premium lezat menyehatkan."
  },
  {
    "id": "sr12-gomilku-cokelat-pouch-40-sachet",
    "sku": "SR12-GMK-006",
    "name": "GoMilku Cokelat Pouch (Isi 40 Sachet)",
    "het": 215000,
    "image": "makeCategoryIllustration(Herbal 📦 GoMilku Cokelat Pouch 40 Sachet)",
    "summary": "Pouch isi 40 sachet GoMilku Cokelat siap seduh praktis."
  },
  {
    "id": "sr12-gomilku-stroberi-200g",
    "sku": "SR12-GMK-007",
    "name": "GoMilku Stroberi 200 g",
    "het": 52500,
    "image": "makeCategoryIllustration(Herbal 🍓 GoMilku Stroberi 200 g)",
    "summary": "Susu kambing etawa rasa stroberi segar dan nikmat penambah nafsu makan si kecil dan sumber kalsium alami."
  },
  {
    "id": "sr12-gomilku-stroberi-600g",
    "sku": "SR12-GMK-008",
    "name": "GoMilku Stroberi 600 g",
    "het": 131500,
    "image": "makeCategoryIllustration(Herbal 🍓 GoMilku Stroberi Jumbo 600 g)",
    "summary": "Kemasan jumbo 600g rasa stroberi segar bergizi tinggi."
  },
  {
    "id": "sr12-gomilku-stroberi-pouch-40-sachet",
    "sku": "SR12-GMK-009",
    "name": "GoMilku Stroberi Pouch (Isi 40 Sachet)",
    "het": 215000,
    "image": "makeCategoryIllustration(Herbal 📦 GoMilku Stroberi Pouch 40 Sachet)",
    "summary": "Kemasan pouch sachet isi 40 rasa stroberi."
  },
  {
    "id": "sr12-gomilku-gold-200g",
    "sku": "SR12-GMK-010",
    "name": "GoMilku Gold 200 g",
    "het": 55000,
    "image": "makeCategoryIllustration(Herbal ✨ GoMilku Gold 200 g)",
    "summary": "Formula susu kambing etawa Gold plus temulawak & jahe merah sangat berkhasiat untuk persendian lansia & kepadatan tulang."
  },
  {
    "id": "sr12-gomilku-gold-600g",
    "sku": "SR12-GMK-011",
    "name": "GoMilku Gold 600 g",
    "het": 136000,
    "image": "makeCategoryIllustration(Herbal ✨ GoMilku Gold Jumbo 600 g)",
    "summary": "Ukuran jumbo 600g GoMilku Gold untuk kesehatan tulang sendi dan daya tahan tubuh orang tua."
  },
  {
    "id": "sr12-gomilku-gold-pouch-40-sachet",
    "sku": "SR12-GMK-012",
    "name": "GoMilku Gold Pouch (Isi 40 Sachet)",
    "het": 220000,
    "image": "makeCategoryIllustration(Herbal 📦 GoMilku Gold Pouch 40 Sachet)",
    "summary": "Pouch isi 40 sachet GoMilku Gold praktis untuk suplemen persendian harian."
  },
  {
    "id": "sr12-lemonkuh-250ml",
    "sku": "SR12-HBL-001",
    "name": "LemonKuh 250 ml",
    "het": 81000,
    "image": "makeCategoryIllustration(Herbal 🍋 LemonKuh Murni 250 ml)",
    "summary": "100% perasan sari lemon California asli tanpa pemanis tanpa pengawet. Pembakar lemak alami dan sumber vitamin C tinggi."
  },
  {
    "id": "sr12-lemonkuh-500ml",
    "sku": "SR12-HBL-002",
    "name": "LemonKuh 500 ml",
    "het": 114000,
    "image": "makeCategoryIllustration(Herbal 🍋 LemonKuh Jumbo 500 ml)",
    "summary": "Botol besar 500ml perasan sari lemon murni untuk detoks pencernaan dan program diet sehat keluarga."
  },
  {
    "id": "sr12-manjakani-sr12-kapsul-60-kapsul",
    "sku": "SR12-MJK-001",
    "name": "Manjakani SR12 Kapsul 60 kapsul",
    "het": 85000,
    "image": "makeCategoryIllustration(Herbal 💊 Manjakani Kapsul 60 Kapsul)",
    "summary": "Ekstrak buah manjakani murni dalam cangkang kapsul halal. Sangat manjur mengatasi keputihan bau tak sedap dan promil."
  },
  {
    "id": "sr12-manjakani-sr12-pil-60-pil",
    "sku": "SR12-MJK-002",
    "name": "Manjakani SR12 Pil 60 Pil",
    "het": 73500,
    "image": "makeCategoryIllustration(Herbal 🟤 Manjakani Pil Butir 60 Pil)",
    "summary": "Varian butir pil tradisional manjakani herbal untuk perawatan kewanitaan luar dan dalam."
  },
  {
    "id": "sr12-madu-hutan-baduy-300g",
    "sku": "SR12-HBL-003",
    "name": "Madu Hutan Baduy 300 g",
    "het": 110000,
    "image": "makeCategoryIllustration(Herbal 🍯 Madu Baduy Murni 300 g)",
    "summary": "Madu liar asli dari pedalaman hutan suku Baduy tanpa campuran apapun. Khasiat multivitamin alami penjaga stamina prima."
  },
  {
    "id": "sr12-madu-hutan-baduy-140g",
    "sku": "SR12-HBL-004",
    "name": "Madu Hutan Baduy 140 g",
    "het": 60000,
    "image": "makeCategoryIllustration(Herbal 🍯 Madu Baduy 140g 140 g)",
    "summary": "Kemasan toples 140g madu murni hutan Baduy praktis untuk suplemen harian."
  },
  {
    "id": "sr12-maxi-propolis-10ml",
    "sku": "SR12-HBL-005",
    "name": "Maxi Propolis 10ml",
    "het": 138000,
    "image": "makeCategoryIllustration(Herbal 💧 Maxi Propolis 10 ml)",
    "summary": "Propolis tetes nano teknologi murni tanpa lilin lebah cepat diserap tubuh untuk mengobati radang tenggorokan batuk dan flu."
  },
  {
    "id": "sr12-salimah-slim-60-kapsul",
    "sku": "SR12-SLM-001",
    "name": "Salimah Slim 60 kapsul",
    "het": 70000,
    "image": "makeCategoryIllustration(Herbal 🍃 Salimah Slim 60 Kapsul)",
    "summary": "Herbal pelangsing alami perpaduan jati belanda dan rimpang kunyit. Melancarkan BAB melunturkan lemak membandel tanpa mules melilit."
  },
  {
    "id": "sr12-sari-kurma-350g",
    "sku": "SR12-HBL-006",
    "name": "Sari Kurma 350 g",
    "het": 79000,
    "image": "makeCategoryIllustration(Herbal 🌴 Sari Kurma Murni 350 g)",
    "summary": "Sari kurma pilihan kental dan manis alami penambah trombosit bagi penderita DBD dan pemulihan stamina ibu hamil/menyusui."
  },
  {
    "id": "sr12-v-co-oil-sr12-60ml",
    "sku": "SR12-VCO-001",
    "name": "V-Co Oil SR12 60 ml",
    "het": 48000,
    "image": "makeCategoryIllustration(Herbal 🥥 V-Co Oil 60ml 60 ml)",
    "summary": "Virgin Coconut Oil (VCO) proses perasan dingin murni sumber asam laurat penjaga imunitas tubuh."
  },
  {
    "id": "sr12-v-co-oil-sr12-100ml",
    "sku": "SR12-VCO-002",
    "name": "V-Co Oil SR12 100 ml",
    "het": 62000,
    "image": "makeCategoryIllustration(Herbal 🥥 V-Co Oil 100ml 100 ml)",
    "summary": "VCO cair 100ml pendamping diet bersama Salimah Slim perawatan rambut rontok dan minyak pijat sehat."
  },
  {
    "id": "sr12-v-co-oil-sr12-250ml",
    "sku": "SR12-VCO-003",
    "name": "V-Co Oil SR12 250 ml",
    "het": 113500,
    "image": "makeCategoryIllustration(Herbal 🥥 V-Co Oil 250ml 250 ml)",
    "summary": "Kemasan botol 250ml VCO murni kualitas super hemat untuk konsumsi rutin keluarga."
  },
  {
    "id": "sr12-v-co-kapsul-sr12-100-kapsul",
    "sku": "SR12-VCO-004",
    "name": "V-Co Kapsul SR12 100 kapsul",
    "het": 68000,
    "image": "makeCategoryIllustration(Herbal 💊 V-Co Kapsul 100 Kapsul)",
    "summary": "VCO murni dalam bentuk soft capsule praktis ditelan tanpa rasa eneg di tenggorokan."
  },
  {
    "id": "sr12-habbatussauda-oil-capsule",
    "sku": "SR12-HBL-007",
    "name": "Habbatussauda Oil Capsule",
    "het": 140000,
    "image": "makeCategoryIllustration(Herbal 🖤 Habbatussauda Oil Kapsul)",
    "summary": "Minyak jintan hitam habbatussauda habbasyi murni obat segala penyakit sesuai sunnah nabawiyah."
  },
  {
    "id": "sr12-stevia12-5ml",
    "sku": "SR12-HBL-008",
    "name": "Stevia12 5 ml",
    "het": 45000,
    "image": "makeCategoryIllustration(Herbal 🌱 Stevia12 Tetes 5 ml)",
    "summary": "Pemanis alami 0 kalori dari daun stevia organik aman bagi penderita diabetes dan pelaku diet keto."
  },
  {
    "id": "sr12-stevia12-15ml",
    "sku": "SR12-HBL-009",
    "name": "Stevia12 15 ml",
    "het": 75000,
    "image": "makeCategoryIllustration(Herbal 🌱 Stevia12 Tetes 15 ml)",
    "summary": "Kemasan tetes 15ml pemanis stevia 0 kalori cukup 1 tetes untuk secangkir kopi atau teh manis sehat."
  },
  {
    "id": "sr12-shiyou-collagen-drink-200g",
    "sku": "SR12-BD-001",
    "name": "Shiyou Collagen Drink 200 g",
    "het": 157500,
    "image": "makeCategoryIllustration(Beauty Drink 🍓 Shiyou Collagen 200 g)",
    "summary": "Minuman serbuk kolagen ikan salmon dengan Glutathione dan Vitamin C mencerahkan seluruh kulit tubuh dan mengencangkan kerutan."
  },
  {
    "id": "sr12-shiyou-collagen-drink-100g",
    "sku": "SR12-BD-002",
    "name": "Shiyou Collagen Drink 100 g",
    "het": 89500,
    "image": "makeCategoryIllustration(Beauty Drink 🍓 Shiyou Collagen 100 g)",
    "summary": "Kemasan kaleng 100g Shiyou Collagen drink rasa berry lezat."
  },
  {
    "id": "sr12-shiyou-collagen-sachet",
    "sku": "SR12-BD-003",
    "name": "Shiyou Collagen Sachet",
    "het": 195000,
    "image": "makeCategoryIllustration(Beauty Drink 📦 Shiyou Collagen Sachet Paket)",
    "summary": "Kemasan praktis sachet harian Shiyou Collagen siap bawa untuk menjaga kulit tetap awet muda di mana saja."
  },
  {
    "id": "sr12-sr12-glowmill-200g",
    "sku": "SR12-BD-004",
    "name": "SR12 GlowMill 200 g",
    "het": 147000,
    "image": "makeCategoryIllustration(Beauty Drink 🥛 SR12 GlowMill 200 g)",
    "summary": "Susu kecantikan berprotein tinggi dengan peptide pencerah alami menutrisi rambut kuku dan mencerahkan kulit."
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://roezaobiexlmhxpuvfds.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZXphb2JpZXhsbWh4cHV2ZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjM4MjAsImV4cCI6MjEwNzIzOTgyMH0.o-H8qNxBT4D88VTxcJNPTVr1xN7ajL-VE_jwtyggRNc';

async function fetchCustomProductImage(storeSlug, productKey) {
  try {
    const slug = (storeSlug || 'sr12-central').toLowerCase();
    const cleanKey = productKey.toLowerCase().trim();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products?store_slug=eq.${encodeURIComponent(slug)}&select=image_url,description,name,het_price&order=created_at.desc&limit=30`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return null;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return null;

    for (const item of items) {
      let localId = '';
      let sku = '';
      if (item.description) {
        try {
          const parsed = JSON.parse(item.description);
          localId = (parsed.localId || '').toLowerCase();
          sku = (parsed.sku || '').toLowerCase();
        } catch(e){}
      }
      const itemName = (item.name || '').toLowerCase();
      if (
        (localId && (localId === cleanKey || localId.replace(/[^a-z0-9]/g, '') === cleanKey.replace(/[^a-z0-9]/g, ''))) ||
        (sku && sku === cleanKey) ||
        itemName.includes(cleanKey.replace(/^sr12-?/i, '').replace(/-/g, ' '))
      ) {
        if (item.image_url && item.image_url.startsWith('http')) {
          return {
            imageUrl: item.image_url,
            name: item.name,
            price: item.het_price
          };
        }
      }
    }
  } catch (err) {
    // Silent fallback
  }
  return null;
}

export default async function handler(req, res) {
  const query = req.query || {};
  const productKey = (query.product || query.id || query.p || query.prod || '').trim();
  const storeSlug = (query.store || query.s || 'sr12-central').trim();
  const requestedTier = (query.tier || '').toLowerCase().trim();
  const customImg = (query.img || query.image || '').trim();
  const customName = (query.name || '').trim();
  const customPrice = Number(query.price || 0);

  // Helper diskon tier SR12
  const TIER_DISCOUNTS = {
    reseller: 20,
    sub_agen: 30,
    agen: 40,
    distributor: 45
  };

  const getTierPrice = (het, tier) => {
    const disc = TIER_DISCOUNTS[tier] || 0;
    if (disc > 0) {
      return Math.round(het * (1 - disc / 100));
    }
    return het;
  };

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

  // Cek apakah produk ini memiliki foto hasil edit/upload di database cloud Supabase
  let customCloudProduct = null;
  if (!customImg && (productKey || matchedProduct)) {
    customCloudProduct = await fetchCustomProductImage(storeSlug, productKey || matchedProduct.id);
  }

  const tierQueryParam = requestedTier ? ('&tier=' + encodeURIComponent(requestedTier)) : '';

  if (customImg && customImg.startsWith('http')) {
    // Prioritas 1: Gambar kustom hasil upload / edit toko via query
    const prodName = customName || (matchedProduct ? matchedProduct.name : 'Produk SR12');
    const baseHet = customPrice > 0 ? customPrice : (matchedProduct ? matchedProduct.het : 0);
    const finalPrice = baseHet > 0 ? getTierPrice(baseHet, requestedTier) : 0;
    const priceText = finalPrice > 0 ? (' - ' + formatRupiah(finalPrice)) : '';
    title = prodName + priceText;
    desc = (matchedProduct ? matchedProduct.summary : 'Dapatkan produk herbal & skin care resmi SR12 BPOM.') + ' | Belanja aman di ' + storeTitle;
    imageUrl = customImg;
    targetRedirect = baseUrl + '/?store=' + encodeURIComponent(storeSlug) + '&product=' + encodeURIComponent(productKey || (matchedProduct ? matchedProduct.id : '')) + tierQueryParam;
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(productKey || '') + '&store=' + encodeURIComponent(storeSlug) + tierQueryParam;
  } else if (customCloudProduct && customCloudProduct.imageUrl) {
    // Prioritas 2: Gambar hasil edit/upload yang tersimpan di Supabase database toko!
    // Kunci utama: link tetap singkat & rapi tanpa embel-embel &img= yang panjang!
    const prodName = customCloudProduct.name || (matchedProduct ? matchedProduct.name : 'Produk SR12');
    const baseHet = customCloudProduct.price || (matchedProduct ? matchedProduct.het : 0);
    const finalPrice = baseHet > 0 ? getTierPrice(baseHet, requestedTier) : 0;
    title = prodName + (finalPrice > 0 ? (' - ' + formatRupiah(finalPrice)) : '');
    desc = (matchedProduct ? matchedProduct.summary : 'Dapatkan produk herbal & skin care resmi SR12 BPOM.') + ' | Belanja aman di ' + storeTitle;
    imageUrl = customCloudProduct.imageUrl;
    targetRedirect = baseUrl + '/?store=' + encodeURIComponent(storeSlug) + '&product=' + encodeURIComponent(productKey || (matchedProduct ? matchedProduct.id : '')) + tierQueryParam;
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(productKey || (matchedProduct ? matchedProduct.id : '')) + '&store=' + encodeURIComponent(storeSlug) + tierQueryParam;
  } else if (matchedProduct) {
    const finalPrice = getTierPrice(matchedProduct.het, requestedTier);
    title = matchedProduct.name + ' - ' + formatRupiah(finalPrice);
    desc = (matchedProduct.summary || '') + ' | Belanja aman resmi BPOM di ' + storeTitle;
    
    // Pastikan URL gambar absolut HTTPS publik yang valid untuk crawler WhatsApp (< 300KB)
    if (matchedProduct.image && matchedProduct.image.startsWith('http')) {
      imageUrl = matchedProduct.image;
    } else if (matchedProduct.image && (matchedProduct.image.endsWith('.jpg') || matchedProduct.image.endsWith('.png') || matchedProduct.image.endsWith('.webp')) && !matchedProduct.image.startsWith('makeCategoryIllustration')) {
      const cleanPath = matchedProduct.image.startsWith('/') ? matchedProduct.image : ('/' + matchedProduct.image);
      imageUrl = baseUrl + cleanPath;
    } else {
      imageUrl = baseUrl + '/assets/deodorant-spray-square.jpg';
    }
    
    // PENTING: Arahkan langsung ke URL produk spesifik di toko mitra bersangkutan
    targetRedirect = baseUrl + '/?store=' + encodeURIComponent(storeSlug) + '&product=' + encodeURIComponent(matchedProduct.id) + tierQueryParam;
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(matchedProduct.id) + '&store=' + encodeURIComponent(storeSlug) + tierQueryParam;
  } else if (productKey) {
    // KUNCI UTAMA: WALAUPUN KEY BELUM PERSIS COCOK DI SERVERLESS:
    // JANGAN PERNAH HAPUS PARAMETER PRODUCT! Teruskan langsung ke frontend agar frontend mencocokkannya di DOM!
    const cleanProdTitle = customName || productKey.replace(/^sr12-?/i, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    title = 'SR12 ' + cleanProdTitle + ' - ' + storeTitle;
    desc = 'Beli produk resmi SR12 ' + cleanProdTitle + ' terverifikasi BPOM di ' + storeTitle + '.';
    imageUrl = baseUrl + '/assets/deodorant-spray-square.jpg';
    targetRedirect = baseUrl + '/?store=' + encodeURIComponent(storeSlug) + '&product=' + encodeURIComponent(productKey) + tierQueryParam;
    canonicalUrl = baseUrl + '/p?product=' + encodeURIComponent(productKey) + '&store=' + encodeURIComponent(storeSlug) + tierQueryParam;
  } else {
    title = 'SR12 Herbal Skin Care - ' + storeTitle;
    desc = 'Toko Resmi Kemitraan SR12 Herbal Skin Care terverifikasi BPOM. Dapatkan produk kecantikan alami dengan garansi 100% original.';
    imageUrl = baseUrl + '/assets/deodorant-spray-square.jpg';
    targetRedirect = baseUrl + '/?store=' + encodeURIComponent(storeSlug) + tierQueryParam;
    canonicalUrl = baseUrl + '/?store=' + encodeURIComponent(storeSlug) + tierQueryParam;
  }

  // Tentukan content type gambar untuk WhatsApp crawler (jpg/png/webp)
  let imageType = 'image/jpeg';
  if (imageUrl.endsWith('.png')) imageType = 'image/png';
  else if (imageUrl.endsWith('.webp')) imageType = 'image/webp';

  // Halaman HTML dengan Open Graph lengkap yang kompatibel untuk SEMUA platform (Shopee/Marketplace style)
  // Menghilangkan og:description agar WhatsApp tidak menampilkan teks kecil deskripsi di bawah gambar
  const html = '<!DOCTYPE html>\n' +
'<html lang="id">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'  <title>' + escapeHtml(title) + '</title>\n' +
'  <!-- Open Graph Meta Tags (Untuk WhatsApp, Facebook, Telegram, dll) -->\n' +
'  <meta property="og:type" content="product">\n' +
'  <meta property="og:site_name" content="' + escapeHtml(storeTitle) + '">\n' +
'  <meta property="og:title" content="' + escapeHtml(title) + '">\n' +
'  <meta property="og:image" content="' + escapeHtml(imageUrl) + '">\n' +
'  <meta property="og:image:secure_url" content="' + escapeHtml(imageUrl) + '">\n' +
'  <meta property="og:image:width" content="800">\n' +
'  <meta property="og:image:height" content="800">\n' +
'  <meta property="og:image:type" content="' + imageType + '">\n' +
'  <meta property="og:url" content="' + escapeHtml(canonicalUrl) + '">\n' +
'  <!-- Twitter Card -->\n' +
'  <meta name="twitter:card" content="summary_large_image">\n' +
'  <meta name="twitter:title" content="' + escapeHtml(title) + '">\n' +
'  <meta name="twitter:image" content="' + escapeHtml(imageUrl) + '">\n' +
'  <!-- Instant Redirect for Humans / Browser Visits -->\n' +
'  <link rel="canonical" href="' + escapeHtml(targetRedirect) + '">\n' +
'  <meta http-equiv="refresh" content="0; url=' + escapeHtml(targetRedirect) + '">\n' +
'  <script>\n' +
'    window.location.replace(' + JSON.stringify(targetRedirect) + ');\n' +
'  </script>\n' +
'  <style>\n' +
'    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #fff; text-align: center; }\n' +
'    .card { background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 32px 24px; max-width: 420px; margin: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25); }\n' +
'    .spinner { width: 44px; height: 44px; margin: 0 auto 18px; border: 4px solid rgba(255, 255, 255, 0.2); border-top-color: #34d399; border-radius: 50%; animation: spin 0.8s linear infinite; }\n' +
'    @keyframes spin { to { transform: rotate(360deg); } }\n' +
'    h2 { font-size: 1.25rem; margin: 0 0 8px 0; font-weight: 800; color: #fff; }\n' +
'    p { font-size: 0.88rem; color: #d1fae5; line-height: 1.5; margin: 0 0 16px 0; }\n' +
'    a.btn { display: inline-block; background: #34d399; color: #064e3b; font-weight: 700; padding: 10px 22px; border-radius: 9999px; text-decoration: none; font-size: 0.85rem; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div class="card">\n' +
'    <div class="spinner"></div>\n' +
'    <h2>🌿 Membuka Produk SR12...</h2>\n' +
'    <p>Sedang mengalihkan Anda ke etalase resmi <b>' + escapeHtml(matchedProduct ? matchedProduct.name : storeTitle) + '</b>...</p>\n' +
'    <a href="' + escapeHtml(targetRedirect) + '" class="btn">Klik Di Sini Jika Belum Terbuka</a>\n' +
'  </div>\n' +
'</body>\n' +
'</html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.status(200).send(html);
};
