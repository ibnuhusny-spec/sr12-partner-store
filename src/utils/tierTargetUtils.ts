import { PartnerTier, MitraDownline } from '../types';

export interface TierTargetConfig {
  tier: PartnerTier;
  name: string;
  discountPct: number;
  minMonthlyTarget: number;    // Ambang batas agar tidak turun level
  idealMonthlyTarget: number;  // Target standar bulanan
  promoMonthlyTarget: number;  // Omset untuk layak dipromosikan ke jenjang di atasnya
  nextTier: PartnerTier | null;
  prevTier: PartnerTier | null;
}

export const SR12_TIER_TARGETS: Record<PartnerTier, TierTargetConfig> = {
  konsumen: {
    tier: 'konsumen',
    name: 'Konsumen Retail',
    discountPct: 0,
    minMonthlyTarget: 0,
    idealMonthlyTarget: 200000,
    promoMonthlyTarget: 300000,
    nextTier: 'marketer',
    prevTier: null
  },
  marketer: {
    tier: 'marketer',
    name: 'Marketer',
    discountPct: 15,
    minMonthlyTarget: 300000,
    idealMonthlyTarget: 500000,
    promoMonthlyTarget: 1000000, // Jika tembus 1jt -> Promosi ke Reseller!
    nextTier: 'reseller',
    prevTier: null
  },
  reseller: {
    tier: 'reseller',
    name: 'Reseller',
    discountPct: 20,
    minMonthlyTarget: 500000,    // Minimal 500rb/bulan (agar tidak turun ke Marketer)
    idealMonthlyTarget: 1000000,
    promoMonthlyTarget: 3000000, // Jika tembus 3jt/bulan -> Promosi ke Sub Agen!
    nextTier: 'sub_agen',
    prevTier: 'marketer'
  },
  sub_agen: {
    tier: 'sub_agen',
    name: 'Sub Agen',
    discountPct: 30,
    minMonthlyTarget: 3000000,    // Minimal 3jt/bulan (agar tidak turun ke Reseller)
    idealMonthlyTarget: 5000000,
    promoMonthlyTarget: 10000000, // Jika tembus 10jt/bulan -> Promosi ke Agen!
    nextTier: 'agen',
    prevTier: 'reseller'
  },
  agen: {
    tier: 'agen',
    name: 'Agen',
    discountPct: 40,
    minMonthlyTarget: 10000000,   // Minimal 10jt/bulan (agar tidak turun ke Sub Agen)
    idealMonthlyTarget: 15000000,
    promoMonthlyTarget: 30000000, // Jika tembus 30jt/bulan -> Promosi ke Distributor!
    nextTier: 'distributor',
    prevTier: 'sub_agen'
  },
  distributor: {
    tier: 'distributor',
    name: 'Distributor',
    discountPct: 50,
    minMonthlyTarget: 30000000,
    idealMonthlyTarget: 50000000,
    promoMonthlyTarget: 0,
    nextTier: null,
    prevTier: 'agen'
  }
};

export interface MitraRankEvaluation {
  status: 'promotable' | 'safe' | 'warning';
  progressIdealPct: number;
  progressPromoPct: number;
  badgeLabel: string;
  badgeColor: string;
  badgeBg: string;
  shortMessage: string;
  remainingToMin: number;
  remainingToPromo: number;
  currentTierConfig: TierTargetConfig;
  nextTierConfig: TierTargetConfig | null;
  prevTierConfig: TierTargetConfig | null;
}

/**
 * Mengevaluasi capaian belanja mitra terhadap target SR12
 */
export function evaluateMitraRank(tier: PartnerTier, spentAmount: number): MitraRankEvaluation {
  const cfg = SR12_TIER_TARGETS[tier] || SR12_TIER_TARGETS.reseller;
  const nextCfg = cfg.nextTier ? SR12_TIER_TARGETS[cfg.nextTier] : null;
  const prevCfg = cfg.prevTier ? SR12_TIER_TARGETS[cfg.prevTier] : null;

  const remainingToMin = Math.max(0, cfg.minMonthlyTarget - spentAmount);
  const remainingToPromo = cfg.promoMonthlyTarget > 0 ? Math.max(0, cfg.promoMonthlyTarget - spentAmount) : 0;

  const progressIdealPct = cfg.idealMonthlyTarget > 0 
    ? Math.min(100, Math.round((spentAmount / cfg.idealMonthlyTarget) * 100)) 
    : 100;

  const progressPromoPct = cfg.promoMonthlyTarget > 0 
    ? Math.min(100, Math.round((spentAmount / cfg.promoMonthlyTarget) * 100)) 
    : 0;

  // 1. Promosi ke level atasnya
  if (cfg.promoMonthlyTarget > 0 && spentAmount >= cfg.promoMonthlyTarget) {
    return {
      status: 'promotable',
      progressIdealPct: 100,
      progressPromoPct: 100,
      badgeLabel: `🚀 Layak Naik ke ${nextCfg?.name || 'Tingkat Atas'}`,
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.18)',
      shortMessage: `Omset Rp ${spentAmount.toLocaleString('id-ID')} melampaui syarat promosi (${nextCfg?.name})!`,
      remainingToMin: 0,
      remainingToPromo: 0,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 2. Warning turun level
  if (spentAmount < cfg.minMonthlyTarget) {
    return {
      status: 'warning',
      progressIdealPct,
      progressPromoPct,
      badgeLabel: `⚠️ Peringatan Turun ke ${prevCfg?.name || 'Level Bawah'}`,
      badgeColor: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.18)',
      shortMessage: `Kurang Rp ${remainingToMin.toLocaleString('id-ID')} lagi untuk mempertahankan level ${cfg.name}.`,
      remainingToMin,
      remainingToPromo,
      currentTierConfig: cfg,
      nextTierConfig: nextCfg,
      prevTierConfig: prevCfg
    };
  }

  // 3. Status aman (memenuhi target minimum)
  return {
    status: 'safe',
    progressIdealPct,
    progressPromoPct,
    badgeLabel: `🟢 Target Aman (${progressIdealPct}%)`,
    badgeColor: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.18)',
    shortMessage: cfg.promoMonthlyTarget > 0 
      ? `Kurang Rp ${remainingToPromo.toLocaleString('id-ID')} untuk syarat naik ke ${nextCfg?.name}.`
      : `Target bulanan tercapai dengan baik.`,
    remainingToMin: 0,
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

  if (evaluation.status === 'promotable') {
    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode})! 🎉🌿\n\n` +
      `Kabar gembira dari *${storeName}*!\n` +
      `Total pembelanjaan Kakak bulan ini tercatat sebesar *${spentFormatted}* dan telah *MEMENUHI SYARAT PROMOSI NAIK LEVEL KE ${evaluation.nextTierConfig?.name.toUpperCase()}*! 🚀\n\n` +
      `Dengan naik level, Kakak berhak mendapatkan:\n` +
      `✅ Diskon kemitraan lebih besar (${evaluation.nextTierConfig?.discountPct}%)\n` +
      `✅ Margin keuntungan lebih maksimal\n` +
      `✅ Prioritas alokasi stok produk herbal SR12\n\n` +
      `Mohon konfirmasi kesiapan Kakak agar dapat segera kami proses kenaikan levelnya ya. Selamat atas pencapaian luar biasanya! 🙏✨`;
  } else if (evaluation.status === 'warning') {
    const sisa = `Rp ${evaluation.remainingToMin.toLocaleString('id-ID')}`;
    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode} - ${tierName}) 🌿\n\n` +
      `Salam hangat dari tim *${storeName}*.\n` +
      `Kami ingin menginformasikan akumulasi belanja Kakak bulan ini tercatat *${spentFormatted}*.\n\n` +
      `⚠️ Sesuai standar kemitraan SR12, target belanja minimal untuk mempertahankan status *${tierName}* (diskon ${evaluation.currentTierConfig.discountPct}%) adalah Rp ${evaluation.currentTierConfig.minMonthlyTarget.toLocaleString('id-ID')}.\n\n` +
      `Kakak hanya membutuhkan pembelanjaan sebesar *${sisa}* lagi sebelum tutup buku akhir bulan agar level Kakak tetap aman dan tidak mengalami penyesuaian/turun level ke ${evaluation.prevTierConfig?.name || 'bawah'}.\n\n` +
      `Yuk segera restock produk best-seller seperti Deodorant Spray, Manjakani, Salimah Slim, atau paket skincare Glowing! Ada promo stok siap kirim hari ini. Hubungi kami untuk bantu rekap order ya Kak. Semangat terus! 💪🔥`;
  } else {
    // Safe
    const sisaPromo = evaluation.remainingToPromo > 0 
      ? `Tinggal *Rp ${evaluation.remainingToPromo.toLocaleString('id-ID')}* lagi untuk promosi ke *${evaluation.nextTierConfig?.name}*!` 
      : 'Pertahankan prestasi hebat ini!';

    message = `Halo Kak *${mitra.name}* (Mitra SR12 ${mitra.partnerCode}) 🌿\n\n` +
      `Terima kasih atas kemitraan aktif bersama *${storeName}*.\n` +
      `Pencapaian belanja Kakak bulan ini sangat baik, tercatat *${spentFormatted}* (Status: Target Aman 🟢).\n\n` +
      `${sisaPromo}\n\n` +
      `Jika butuh tambahan materi promosi atau stok cepat, silakan kabari kami ya. Sukses selalu untuk bisnis Kakak! 🙏✨`;
  }

  return `https://wa.me/${phoneTarget}?text=${encodeURIComponent(message)}`;
}
