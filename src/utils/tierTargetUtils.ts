import { PartnerTier, MitraDownline } from '../types';

export interface TierTargetConfig {
  tier: PartnerTier;
  name: string;
  discountPct: number;
  firstOrderHet: number;         // Nominal order pertama bruto (HET)
  firstOrderNet: number;         // Nominal order pertama netto setelah diskon
  minMonthlyTarget: number;      // Omset minimal per bulan (HET)
  accum3MonthsTarget: number;    // Akumulasi minimal selama 3 bulan (HET)
  careerTrackMin: number;        // Jalur omset minimal untuk naik ke tingkat ini
  careerTrackPersonal: number;   // Omset pribadi minimal berturut-turut selama 3 bulan
  nextTier: PartnerTier | null;
  prevTier: PartnerTier | null;
  rulesNotes: string[];
}

/**
 * 2026 Rules Kemitraan Resmi SR12 Skin Care / CK SWORD
 */
export const SR12_TIER_TARGETS: Record<PartnerTier, TierTargetConfig> = {
  konsumen: {
    tier: 'konsumen',
    name: 'Konsumen Retail',
    discountPct: 0,
    firstOrderHet: 0,
    firstOrderNet: 0,
    minMonthlyTarget: 0,
    accum3MonthsTarget: 0,
    careerTrackMin: 0,
    careerTrackPersonal: 0,
    nextTier: 'marketer',
    prevTier: null,
    rulesNotes: ['Pembelian eceran normal tanpa syarat omset.']
  },
  marketer: {
    tier: 'marketer',
    name: 'Marketer',
    discountPct: 15,
    firstOrderHet: 0,
    firstOrderNet: 0,
    minMonthlyTarget: 0, // Marketer tidak memiliki target minimal bulanan (status mitra permanen aman)
    accum3MonthsTarget: 0, // Tidak ada ancaman turun tingkat atau keluar dari kemitraan SR12
    careerTrackMin: 800000, // Jalur omset minimal akumulasi untuk naik ke tingkat Reseller
    careerTrackPersonal: 300000,
    nextTier: 'reseller',
    prevTier: null,
    rulesNotes: [
      'Komisi penjualan 15% dari omset HET.',
      'Kesempatan menjadi Reseller melalui First Order Rp 500.000,- HET ATAU jalur omset akumulasi Rp 800.000,- (omset pribadi min Rp 300.000,- berturut-turut 3 bulan).',
      'Jika target belum tercapai, Marketer TETAP MENJADI MITRA AKTIF (tidak pernah turun level dan tidak pernah keluar dari kemitraan SR12).'
    ]
  },
  reseller: {
    tier: 'reseller',
    name: 'Reseller',
    discountPct: 20,
    firstOrderHet: 500000,
    firstOrderNet: 400000,
    minMonthlyTarget: 500000,
    accum3MonthsTarget: 1500000,
    careerTrackMin: 4000000,
    careerTrackPersonal: 3000000,
    nextTier: 'sub_agen',
    prevTier: 'marketer',
    rulesNotes: [
      'First Order senilai minimal Rp 500.000,- (Rp 400.000,- setelah diskon 20%).',
      'Kesempatan menjadi Reseller melalui jalur omset minimal Rp 800.000,- dengan omset pribadi minimal Rp 300.000,- berturut-turut selama 3 bulan.',
      'Omset minimal Rp 500.000,- per bulan ATAU akumulasi minimal Rp 1.500.000,- selama 3 bulan.',
      'Reseller yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka memasuki bulan ke-4 status Mitra diturunkan ke tingkatan Mitra di bawahnya (Marketer).'
    ]
  },
  sub_agen: {
    tier: 'sub_agen',
    name: 'Sub Agen',
    discountPct: 30,
    firstOrderHet: 5000000,
    firstOrderNet: 3500000,
    minMonthlyTarget: 4000000,
    accum3MonthsTarget: 12000000,
    careerTrackMin: 15000000,
    careerTrackPersonal: 10000000,
    nextTier: 'agen',
    prevTier: 'reseller',
    rulesNotes: [
      'First Order senilai minimal Rp 5.000.000,- (Rp 3.500.000,- setelah diskon 30%).',
      'Kesempatan menjadi Sub Agent melalui jalur omset minimal Rp 4.000.000,- dengan omset pribadi minimal Rp 3.000.000,- berturut-turut selama 3 bulan.',
      'Omset minimal Rp 4.000.000,- per bulan ATAU akumulasi omset minimal Rp 12.000.000,- selama 3 bulan.',
      'Sub Agent yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka memasuki bulan ke-4 status Mitra diturunkan ke tingkatan Mitra di bawahnya (Reseller).'
    ]
  },
  agen: {
    tier: 'agen',
    name: 'Agen',
    discountPct: 40,
    firstOrderHet: 25000000,
    firstOrderNet: 15000000,
    minMonthlyTarget: 15000000,
    accum3MonthsTarget: 45000000,
    careerTrackMin: 30000000,
    careerTrackPersonal: 20000000,
    nextTier: 'distributor',
    prevTier: 'sub_agen',
    rulesNotes: [
      'First Order kepada Distributor/Agent senilai minimal Rp 25.000.000,- (Rp 15.000.000,- setelah diskon 40%).',
      'Kesempatan menjadi Agent melalui jalur omset minimal Rp 15.000.000,- dengan omset pribadi minimal Rp 10.000.000,- berturut-turut selama 3 bulan.',
      'Omset minimal Agent sebesar Rp 15.000.000,- per bulan ATAU akumulasi omset minimal Rp 45.000.000,- selama 3 bulan.',
      'Agent yang tidak bisa mencapai minimal akumulasi omset selama 3 bulan, maka memasuki bulan ke-4 status Mitra diturunkan ke tingkatan Mitra di bawahnya (Sub Agen).'
    ]
  },
  distributor: {
    tier: 'distributor',
    name: 'Distributor',
    discountPct: 50,
    firstOrderHet: 50000000,
    firstOrderNet: 25000000,
    minMonthlyTarget: 30000000,
    accum3MonthsTarget: 90000000,
    careerTrackMin: 0,
    careerTrackPersonal: 0,
    nextTier: null,
    prevTier: 'agen',
    rulesNotes: [
      'Tingkat kemitraan tertinggi dengan hak pasokan wilayah dan diskon 50%.',
      'Omset minimal Rp 30.000.000,- per bulan atau Rp 90.000.000,- akumulasi 3 bulan.'
    ]
  }
};

export interface MitraRankEvaluation {
  status: 'promotable' | 'safe' | 'warning';
  progressMonthlyPct: number;
  progress3MonthsPct: number;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  shortMessage: string;
  remainingMonthlyMin: number;
  remaining3MonthsMin: number;
  remainingToPromo: number;
  currentTierConfig: TierTargetConfig;
  nextTierConfig: TierTargetConfig | null;
  prevTierConfig: TierTargetConfig | null;
}

/**
 * Mengevaluasi capaian belanja mitra berdasarkan 2026 Rules Kemitraan SR12
 * @param tier Tingkat kemitraan saat ini
 * @param spentAmount Akumulasi belanja (misal 90 hari / 3 bulan berjalan)
 */
export function evaluateMitraRank(tier: PartnerTier, spentAmount: number): MitraRankEvaluation {
  const cfg = SR12_TIER_TARGETS[tier] || SR12_TIER_TARGETS.reseller;
  const nextCfg = cfg.nextTier ? SR12_TIER_TARGETS[cfg.nextTier] : null;
  const prevCfg = cfg.prevTier ? SR12_TIER_TARGETS[cfg.prevTier] : null;

  // Aturan Khusus Non Mitra (Pelanggan Langganan Tetap / Customer):
  if (tier === 'konsumen') {
    const minOfferTarget = 500000;
    const isPromotable = spentAmount >= minOfferTarget;
    const progressPct = Math.min(100, Math.round((spentAmount / minOfferTarget) * 100));
    return {
      status: isPromotable ? 'promotable' : 'safe',
      progressMonthlyPct: progressPct,
      progress3MonthsPct: progressPct,
      badgeLabel: isPromotable ? '🎁 Layak Ditawari Mitra' : '🛍️ Pelanggan Tetap (Non-Mitra)',
      badgeColor: isPromotable ? '#10b981' : '#a855f7',
      badgeBg: isPromotable ? 'rgba(16, 185, 129, 0.18)' : 'rgba(168, 85, 247, 0.18)',
      shortMessage: isPromotable
        ? `Total belanja Rp ${spentAmount.toLocaleString('id-ID')} melampaui Rp 500rb. Sangat potensial ditawari gabung Reseller (Diskon 20%) atau Marketer (Komisi 15%)!`
        : `Customer aktif tanpa beban target omset. Hubungi secara berkala untuk kirim promo produk terbaru via WhatsApp.`,
      remainingMonthlyMin: 0,
      remaining3MonthsMin: 0,
      remainingToPromo: Math.max(0, minOfferTarget - spentAmount),
      currentTierConfig: {
        ...cfg,
        name: 'Non Mitra (Langganan)',
        discountPct: 0
      },
      nextTierConfig: SR12_TIER_TARGETS.reseller,
      prevTierConfig: null
    };
  }

  // Aturan Khusus Marketer: Bisa naik ke Reseller (500rb FO / 800rb omset), tapi TIDAK PERNAH turun level / keluar mitra!
  if (tier === 'marketer') {
    const resellerTargetHet = 500000;
    if (spentAmount >= resellerTargetHet) {
      return {
        status: 'promotable',
        progressMonthlyPct: 100,
        progress3MonthsPct: 100,
        badgeLabel: '🚀 Layak Naik ke Reseller',
        badgeColor: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.18)',
        shortMessage: `Omset Rp ${spentAmount.toLocaleString('id-ID')} melampaui syarat First Order Reseller (Rp 500.000 HET). Berhak promosi naik ke Reseller (Diskon 20%)!`,
        remainingMonthlyMin: 0,
        remaining3MonthsMin: 0,
        remainingToPromo: 0,
        currentTierConfig: cfg,
        nextTierConfig: nextCfg,
        prevTierConfig: null
      };
    }

    // Jika target belum tercapai: TETAP AMAN SEBAGAI MARKETER (Tidak ada warning / ancaman turun)
    const remainingToPromo = Math.max(0, resellerTargetHet - spentAmount);
    const progressPct = Math.min(100, Math.round((spentAmount / resellerTargetHet) * 100));
    return {
      status: 'safe',
      progressMonthlyPct: progressPct,
      progress3MonthsPct: progressPct,
      badgeLabel: '⭐ Tetap Marketer Aktif (Komisi 15%)',
      badgeColor: '#0ea5e9',
      badgeBg: 'rgba(14, 165, 233, 0.18)',
      shortMessage: `Target Reseller belum tercapai (kurang Rp ${remainingToPromo.toLocaleString('id-ID')}). Status TETAP AMAN sebagai Marketer resmi (komisi 15%, tidak turun level/keluar).`,
      remainingMonthlyMin: 0,
      remaining3MonthsMin: 0,
      remainingToPromo,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: null
    };
  }

  // Ambang promosi naik level:
  // Mitra bisa promosi jika omset mencapai syarat jalur karir next tier ATAU First Order next tier
  const promoTarget = nextCfg ? (nextCfg.firstOrderHet || nextCfg.minMonthlyTarget) : 0;

  const remainingMonthlyMin = Math.max(0, cfg.minMonthlyTarget - spentAmount);
  const remaining3MonthsMin = Math.max(0, cfg.accum3MonthsTarget - spentAmount);
  const remainingToPromo = promoTarget > 0 ? Math.max(0, promoTarget - spentAmount) : 0;

  const progressMonthlyPct = cfg.minMonthlyTarget > 0 
    ? Math.min(100, Math.round((spentAmount / cfg.minMonthlyTarget) * 100)) 
    : 100;

  const progress3MonthsPct = cfg.accum3MonthsTarget > 0
    ? Math.min(100, Math.round((spentAmount / cfg.accum3MonthsTarget) * 100))
    : 100;

  // Mitra Baru Terdaftar (0 omset / masa awal kemitraan):
  if (spentAmount === 0) {
    return {
      status: 'safe',
      progressMonthlyPct: 0,
      progress3MonthsPct: 0,
      badgeLabel: `🟢 Mitra Baru (${cfg.name})`,
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.18)',
      shortMessage: `Mitra aktif terdaftar resmi sebagai ${cfg.name} (Diskon ${cfg.discountPct}%). Masa evaluasi 90 hari berjalan.`,
      remainingMonthlyMin: cfg.minMonthlyTarget,
      remaining3MonthsMin: cfg.accum3MonthsTarget,
      remainingToPromo: promoTarget,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 1. PROMOTABLE: Capaian belanja memenuhi syarat promosi naik tingkat
  if (promoTarget > 0 && spentAmount >= promoTarget) {
    return {
      status: 'promotable',
      progressMonthlyPct: 100,
      progress3MonthsPct: 100,
      badgeLabel: `🚀 Layak Naik ke ${nextCfg?.name}`,
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.18)',
      shortMessage: `Omset Rp ${spentAmount.toLocaleString('id-ID')} melampaui syarat First Order ${nextCfg?.name}!`,
      remainingMonthlyMin: 0,
      remaining3MonthsMin: 0,
      remainingToPromo: 0,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 2. WARNING: Belanja di bawah target minimal akumulasi 3 bulan (Bulan ke-4 akan diturunkan)
  if (cfg.minMonthlyTarget > 0 && (spentAmount < cfg.minMonthlyTarget || (spentAmount < cfg.accum3MonthsTarget && spentAmount < cfg.minMonthlyTarget * 2))) {
    return {
      status: 'warning',
      progressMonthlyPct,
      progress3MonthsPct,
      badgeLabel: `⚠️ Peringatan Turun ke ${prevCfg?.name || 'Bawah'}`,
      badgeColor: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.18)',
      shortMessage: `Kurang Rp ${remainingMonthlyMin.toLocaleString('id-ID')} (target min Rp ${cfg.minMonthlyTarget.toLocaleString('id-ID')}/bln). Terancam turun level di bln ke-4!`,
      remainingMonthlyMin,
      remaining3MonthsMin,
      remainingToPromo,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 3. SAFE: Target tercapai aman
  return {
    status: 'safe',
    progressMonthlyPct: 100,
    progress3MonthsPct,
    badgeLabel: `🟢 Target Aman (${progress3MonthsPct}% 3 Bln)`,
    badgeColor: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.18)',
    shortMessage: promoTarget > 0 
      ? `Kurang Rp ${remainingToPromo.toLocaleString('id-ID')} lagi untuk naik ke ${nextCfg?.name}.`
      : `Target omset kemitraan tercapai dengan baik.`,
    remainingMonthlyMin: 0,
    remaining3MonthsMin: 0,
    remainingToPromo,
    currentTierConfig: cfg,
    nextTierConfig: nextCfg,
    prevTierConfig: prevCfg
  };
}

/**
 * Generate WhatsApp message URL for motivational reminder
 */
export function generateMitraWaReminderUrl(
  mitra: MitraDownline,
  storeName: string,
  evaluation: MitraRankEvaluation
): string {
  const cleanPhone = mitra.phone.replace(/[^0-9]/g, '');
  const phoneTarget = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  let message = '';
  const tierName = evaluation.currentTierConfig.name;
  const spentFormatted = `Rp ${mitra.accumulatedSpent90Days.toLocaleString('id-ID')}`;

  // Kasus Khusus: Non Mitra / Langganan Tetap (Kirim Promo & Tawaran Gabung)
  if (mitra.tier === 'konsumen') {
    if (evaluation.status === 'promotable') {
      message = `Halo Kak *${mitra.name}*! 🌿✨\n\n` +
        `Salam hangat dari *${storeName}* (Mitra Resmi SR12 Skin Care).\n` +
        `Terima kasih banyak sudah menjadi pelanggan setia kami (total belanja Kakak tercatat: *${spentFormatted}*)! 🎉\n\n` +
        `💡 *KABAR BAIK & PELUANG PENGHEMATAN:*\n` +
        `Karena Kakak sering berbelanja produk SR12, Kakak sudah sangat memenuhi syarat untuk bergabung menjadi *Mitra Resmi SR12* (Marketer / Reseller)!\n\n` +
        `Keuntungan jika Kakak bergabung:\n` +
        `✅ Beli produk untuk dipakai sendiri langsung dapat diskon hingga 20%\n` +
        `✅ Bisa jualan ke teman / keluarga dan dapat keuntungan bersih langsung\n` +
        `✅ Tanpa modal besar, langsung kami bimbing cara promosinya\n\n` +
        `Apakah Kakak berminat kami daftarkan gratis hari ini? Silakan balas pesan ini ya Kak. Terima kasih! 🙏✨`;
    } else {
      message = `Halo Kak *${mitra.name}*! 🌿✨\n\n` +
        `Salam hangat dari *${storeName}* (Mitra Resmi SR12 Skin Care).\n` +
        `Terima kasih telah berbelanja di toko kami (total belanja: *${spentFormatted}*).\n\n` +
        `🎁 *PROMO KHUSUS PELANGGAN SETIA HARI INI:*\n` +
        `Kami sedang ada promo menarik & bonus untuk produk perawatan kecantikan dan herbal best seller SR12 (Deodorant Spray, Facial Wash, Manjakani, Sunscreen, Salimah Slim, & Paket Glowing)!\n\n` +
        `Apakah stok produk perawatan Kakak di rumah sudah ada yang mulai habis dan ingin di-restock hari ini? Kami siap melayani dan kirimkan cepat untuk Kakak ya! 😊🙏`;
    }
    return `https://wa.me/${phoneTarget}?text=${encodeURIComponent(message)}`;
  }

  // Kasus Khusus: Marketer
  if (mitra.tier === 'marketer') {
    if (evaluation.status === 'promotable') {
      message = `Halo Kak *${mitra.name}* (Mitra Marketer SR12 ${mitra.partnerCode})! 🎉🌿\n\n` +
        `Kabar gembira dari *${storeName}*!\n` +
        `Akumulasi penjualan Kakak tercatat sebesar *${spentFormatted}* dan telah *MEMENUHI SYARAT NAIK LEVEL MENJADI RESELLER RESMI*! 🚀\n\n` +
        `Keuntungan naik menjadi Reseller:\n` +
        `✅ Langsung dapat DISKON 20% di muka (bukan komisi bulanan lagi)\n` +
        `✅ Margin keuntungan bersih per produk jauh lebih besar\n` +
        `✅ Berhak membina tim marketer sendiri\n\n` +
        `Silakan konfirmasi ke kami untuk pengesahan posisi Reseller Kakak ya. Selamat atas kerja kerasnya! 🙏✨`;
    } else {
      message = `Halo Kak *${mitra.name}* (Mitra Marketer SR12 ${mitra.partnerCode})! 🌿\n\n` +
        `Semangat terus berbisnis bersama *${storeName}*.\n` +
        `Akumulasi penjualan Kakak saat ini tercatat *${spentFormatted}*.\n\n` +
        `💡 *PELUANG NAIK LEVEL MENJADI RESELLER:*\n` +
        `Sebagai Marketer, Kakak punya kesempatan emas untuk naik tingkat menjadi *RESELLER RESMI SR12*:\n` +
        `• Cukup capai omset Rp 500.000,- HET (atau jalur prestasi Rp 800.000,-).\n` +
        `• Dengan menjadi Reseller, Kakak langsung mendapatkan DISKON 20% di muka!\n\n` +
        `Kurang *Rp ${evaluation.remainingToPromo.toLocaleString('id-ID')}* lagi untuk meraih posisi Reseller. Jangan khawatir, jika belum tercapai Kakak tetap aman sebagai Marketer resmi SR12 tanpa ada risiko turun level atau keluar.\n\n` +
        `Yuk bagikan katalog & promo produk SR12 hari ini! Hubungi kami jika butuh bantuan stok atau info produk ya. Semangat terus! 🔥`;
    }
    return `https://wa.me/${phoneTarget}?text=${encodeURIComponent(message)}`;
  }

  if (evaluation.status === 'promotable') {
    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode})! 🎉🌿\n\n` +
      `Kabar gembira dari *${storeName}*!\n` +
      `Akumulasi pembelanjaan Kakak bulan ini tercatat sebesar *${spentFormatted}* dan telah *MEMENUHI SYARAT 2026 PROMOSI NAIK LEVEL KE ${evaluation.nextTierConfig?.name.toUpperCase()}*! 🚀\n\n` +
      `Dengan naik level menjadi *${evaluation.nextTierConfig?.name}*:\n` +
      `✅ Diskon kemitraan meningkat jadi *${evaluation.nextTierConfig?.discountPct}%*\n` +
      `✅ Margin keuntungan per produk lebih tinggi\n` +
      `✅ Berhak membina tim reseller & marketer sendiri\n\n` +
      `Silakan konfirmasi ke kami untuk pengesahan level baru Kakak ya. Selamat atas pencapaian luar biasanya! 🙏✨`;
  } else if (evaluation.status === 'warning') {
    const sisaBulan = `Rp ${evaluation.remainingMonthlyMin.toLocaleString('id-ID')}`;
    const target3Bulan = `Rp ${evaluation.currentTierConfig.accum3MonthsTarget.toLocaleString('id-ID')}`;
    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode} - ${tierName}) 🌿\n\n` +
      `Salam hangat dari tim *${storeName}*.\n` +
      `Kami ingin menginformasikan akumulasi belanja Kakak saat ini tercatat *${spentFormatted}*.\n\n` +
      `⚠️ *PENGINGAT ATURAN KEMITRAAN SR12 2026:*\n` +
      `Sesuai aturan resmi SR12 CK SWORD:\n` +
      `• Target omset minimal status *${tierName}* adalah Rp ${evaluation.currentTierConfig.minMonthlyTarget.toLocaleString('id-ID')}/bulan (atau akumulasi ${target3Bulan} selama 3 bulan).\n` +
      `• Mitra yang tidak mencapai akumulasi minimal 3 bulan, pada *bulan ke-4 status mitra akan diturunkan ke tingkatan di bawahnya (${evaluation.prevTierConfig?.name || 'Marketer'})*.\n\n` +
      `Kakak hanya memerlukan belanja *${sisaBulan}* lagi sebelum akhir bulan agar posisi Kakak tetap aman dan diskon *${evaluation.currentTierConfig.discountPct}%* tetap aktif! 💪\n\n` +
      `Yuk segera restock produk best seller (Deodorant, Manjakani, Salimah, Sunscreen, Paket Glowing) hari ini. Hubungi kami untuk bantu proses order ya Kak. Semangat terus! 🔥`;
  } else {
    // Safe
    const sisaPromo = evaluation.remainingToPromo > 0 
      ? `Tinggal *Rp ${evaluation.remainingToPromo.toLocaleString('id-ID')}* lagi untuk promosi ke *${evaluation.nextTierConfig?.name}* (Diskon ${evaluation.nextTierConfig?.discountPct}%)!` 
      : 'Pertahankan prestasi hebat ini!';

    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode}) 🌿\n\n` +
      `Terima kasih atas keaktifan berbelanja di *${storeName}*.\n` +
      `Akumulasi belanja Kakak saat ini sebesar *${spentFormatted}* (Status: Target Aman 🟢).\n\n` +
      `${sisaPromo}\n\n` +
      `Jika butuh tambahan materi promosi atau stok cepat, silakan kabari kami ya. Sukses selalu untuk bisnis Kakak! 🙏✨`;
  }

  return `https://wa.me/${phoneTarget}?text=${encodeURIComponent(message)}`;
}
